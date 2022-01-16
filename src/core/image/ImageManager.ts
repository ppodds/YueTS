import { Collection, DataResolver } from "discord.js";
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
            const sharp = require("sharp");
            try {
                const regularImageBuffer = await sharp(buf)
                    .greyscale()
                    .resize(32, 32, { fit: "fill" })
                    .rotate()
                    .raw()
                    .toBuffer();
                // Reference: https://github.com/btd/sharp-phash

                const SAMPLE_SIZE = 32;

                function initSQRT(N) {
                    const c = new Array(N);
                    for (let i = 1; i < N; i++) {
                        c[i] = 1;
                    }
                    c[0] = 1 / Math.sqrt(2.0);
                    return c;
                }

                const SQRT = initSQRT(SAMPLE_SIZE);

                function initCOS(N) {
                    const cosines = new Array(N);
                    for (let k = 0; k < N; k++) {
                        cosines[k] = new Array(N);
                        for (let n = 0; n < N; n++) {
                            cosines[k][n] = Math.cos(
                                ((2 * k + 1) / (2.0 * N)) * n * Math.PI
                            );
                        }
                    }
                    return cosines;
                }

                const COS = initCOS(SAMPLE_SIZE);

                function applyDCT(f, size) {
                    var N = size;

                    var F = new Array(N);
                    for (var u = 0; u < N; u++) {
                        F[u] = new Array(N);
                        for (var v = 0; v < N; v++) {
                            var sum = 0;
                            for (var i = 0; i < N; i++) {
                                for (var j = 0; j < N; j++) {
                                    sum += COS[i][u] * COS[j][v] * f[i][j];
                                }
                            }
                            sum *= (SQRT[u] * SQRT[v]) / 4;
                            F[u][v] = sum;
                        }
                    }
                    return F;
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
                const dct = applyDCT(s, SAMPLE_SIZE);

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
        while (true) {
            const images = await Image.findAll({
                where: { type },
                attributes: ["id", "phash"],
                limit: LIMIT,
                offset: offset,
            });
            offset += LIMIT;
            if (images.length === 0) break;
            for (const image of images)
                this.addPhash(type, image.id, image.phash);
        }
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
