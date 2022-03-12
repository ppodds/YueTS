import { Collection } from "discord.js";
import { Image } from "../database/models/image.js";
import AsyncLock from "async-lock";
import { Logger } from "../utils/Logger.js";
import { ImageType, toString } from "./ImageType.js";
import { StaticPool } from "node-worker-threads-pool";

export interface PhashData {
    id: number;
    data: string;
}

class ImageManager {
    public readonly imagePhashs = new Collection<ImageType, PhashData[]>();
    private readonly lock = new AsyncLock();
    private readonly staticPool = new StaticPool({
        size: 4,
        task: async (buf: Buffer) => {
            const sharp = (await import("sharp")).default;
            try {
                const regularImageBuffer = await sharp(buf)
                    .greyscale()
                    .resize(32, 32, { fit: "fill" })
                    .rotate()
                    .raw()
                    .toBuffer();
                // Reference: https://github.com/btd/sharp-phash

                const SAMPLE_SIZE = 32;

                // init sqrt
                const sqrt = new Array(SAMPLE_SIZE);
                for (let i = 1; i < SAMPLE_SIZE; i++) {
                    sqrt[i] = 1;
                }
                sqrt[0] = 1 / Math.sqrt(2.0);

                // init cosines
                const cosines = new Array(SAMPLE_SIZE);
                for (let k = 0; k < SAMPLE_SIZE; k++) {
                    cosines[k] = new Array(SAMPLE_SIZE);
                    for (let n = 0; n < SAMPLE_SIZE; n++) {
                        cosines[k][n] = Math.cos(
                            ((2 * k + 1) / (2.0 * SAMPLE_SIZE)) * n * Math.PI
                        );
                    }
                }

                const LOW_SIZE = 8;

                // copy signal
                const s = new Array(SAMPLE_SIZE);
                for (let x = 0; x < SAMPLE_SIZE; x++) {
                    s[x] = new Array(SAMPLE_SIZE);
                    for (let y = 0; y < SAMPLE_SIZE; y++) {
                        s[x][y] = regularImageBuffer[SAMPLE_SIZE * y + x];
                    }
                }

                // apply 2D DCT II
                const dct = new Array(SAMPLE_SIZE);
                for (let u = 0; u < SAMPLE_SIZE; u++) {
                    dct[u] = new Array(SAMPLE_SIZE);
                    for (let v = 0; v < SAMPLE_SIZE; v++) {
                        let sum = 0;
                        for (let i = 0; i < SAMPLE_SIZE; i++) {
                            for (let j = 0; j < SAMPLE_SIZE; j++) {
                                sum += cosines[i][u] * cosines[j][v] * s[i][j];
                            }
                        }
                        sum *= (sqrt[u] * sqrt[v]) / 4;
                        dct[u][v] = sum;
                    }
                }

                // get AVG on high frequencies
                let totalSum = 0;
                for (let x = 0; x < LOW_SIZE; x++) {
                    for (let y = 0; y < LOW_SIZE; y++) {
                        totalSum += dct[x + 1][y + 1];
                    }
                }

                const avg = totalSum / (LOW_SIZE * LOW_SIZE);

                // compute hash
                let fingerprint = "";

                for (let x = 0; x < LOW_SIZE; x++) {
                    for (let y = 0; y < LOW_SIZE; y++) {
                        fingerprint += dct[x + 1][y + 1] > avg ? "1" : "0";
                    }
                }
                return fingerprint;
            } catch (err) {
                return null;
            }
        },
    });

    /**
     * init ImageManager
     */
    public async init() {
        this.imagePhashs.set(ImageType.PIC, []);
        this.imagePhashs.set(ImageType.HPIC, []);
        this.imagePhashs.set(ImageType.WTFPIC, []);
        await this.loadAll();
    }
    /**
     * Add a phash data to memory cache.
     * @param {string} type image type
     * @param {Number} imageId image id
     * @param {string} phash phash string
     */
    public addPhash(type: ImageType, imageId: number, phash: string) {
        this.imagePhashs.get(type).push({ id: imageId, data: phash });
    }
    /**
     * load image id and phash form database, and save it into memory.
     * @param type image type
     */
    private async load(type: ImageType) {
        Logger.info(`Loading image phashs which type is ${toString(type)}...`);
        const LIMIT = 100;
        let offset = 0;
        let images: Image[];
        do {
            images = await Image.findAll({
                where: { type },
                attributes: ["id", "phash"],
                limit: LIMIT,
                offset: offset,
            });
            offset += LIMIT;
            for (const image of images)
                this.addPhash(type, image.id, image.phash);
        } while (images.length !== 0);
        Logger.info(`type ${toString(type)} load complete!`);
    }
    /**
     * load function's wrapper. Check all type of image.
     */
    private async loadAll() {
        Logger.info("Loading image data...");
        await this.lock.acquire("image", async () => {
            await this.load(ImageType.PIC);
            await this.load(ImageType.HPIC);
            await this.load(ImageType.WTFPIC);
        });
        Logger.info("Image data load complete!");
    }
    /**
     * Check if the picture is already in the database
     * @param type image type
     * @param phash image phash
     * @returns if the picture is already in the database
     */
    public async inDatabase(type: ImageType, phash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            for (const imagePhash of this.imagePhashs.get(type)) {
                if (ImageManager.isSimilar(imagePhash.data, phash))
                    resolve(true);
            }
            resolve(false);
        });
    }
    /**
     * Get phash from image binary (Buffer), if error occur, return null
     * @param image image binary
     * @returns phash string
     */
    public async makePhash(buffer: Buffer): Promise<string> {
        return await this.staticPool.exec(buffer);
    }
    /**
     * Get hamming distance
     * @param phash1 64 bits perceptual hash
     * @param phash2 64 bits perceptual hash
     * @returnsa a number between 0 and 1, where 0 means the two images are perceived to be identical
     */
    private static distance(phash1: string, phash2: string) {
        let count = 0;
        for (let i = 0; i < phash1.length; i++) {
            if (phash1[i] !== phash2[i]) {
                count++;
            }
        }
        return count / 64;
    }
    /**
     * Check if the two pictures are similar
     * @param phash1 image1's phash
     * @param phash2 image2's phash
     * @returns if the two pictures are similar
     */
    public static isSimilar(phash1: string, phash2: string): boolean {
        if (phash1 == null || phash2 == null) return false;
        const LEVEL = 0.2;
        return this.distance(phash1, phash2) < LEVEL;
    }
}

const imageManager = new ImageManager();

export default imageManager;
