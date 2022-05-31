import { Collection, MessageAttachment } from "discord.js";
import { Image } from "../database/models/image";
import AsyncLock from "async-lock";
import { Logger } from "../utils/Logger";
import { ImageType, toString } from "./ImageType";
import { StaticPool } from "node-worker-threads-pool";
import { PhashData } from "./PhashData";
import { FileTypeResult } from "file-type";
import { Donor } from "../database/models/donor";
import { User } from "../database/models/user";
import { User as DiscordUser } from "discord.js";
import axios from "axios";

export class ImageManager {
    private static _instance: ImageManager;
    public readonly imagePhashs = new Collection<ImageType, PhashData[]>();
    private readonly _lock = new AsyncLock();
    private readonly _staticPool = new StaticPool({
        size: 4,
        task: `${process.env.BASE_PATH}/src/image/phash.js`,
    });

    private constructor() {
        this.imagePhashs.set(ImageType.PIC, []);
        this.imagePhashs.set(ImageType.HPIC, []);
        this.imagePhashs.set(ImageType.WTFPIC, []);
    }

    public static get instance() {
        if (!ImageManager._instance) {
            ImageManager._instance = new ImageManager();
        }
        return ImageManager._instance;
    }

    /**
     * init ImageManager
     */
    public async init() {
        await this.loadAll();
    }

    public async close() {
        await this._staticPool.destroy();
    }

    /**
     * Add a phash data to memory cache.
     * @param type image type
     * @param imageID image id
     * @param phash phash string
     */
    public addPhash(type: ImageType, imageID: number, phash: string) {
        this.imagePhashs.get(type).push({ id: imageID, data: phash });
        Logger.instance.debug("Added phash data to memory cache");
    }

    /**
     * load image id and phash form database, and save it into memory.
     * @param type image type
     */
    private async load(type: ImageType) {
        Logger.instance.info(
            `Loading image phashs which type is ${toString(type)}...`
        );
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
        Logger.instance.info(`type ${toString(type)} load complete!`);
    }

    /**
     * load function's wrapper. Check all type of image.
     */
    private async loadAll() {
        Logger.instance.info("Loading image data...");
        await this._lock.acquire("image", async () => {
            await this.load(ImageType.PIC);
            await this.load(ImageType.HPIC);
            await this.load(ImageType.WTFPIC);
        });
        Logger.instance.info("Image data load complete!");
    }

    /**
     * Get phash from image binary (Buffer), if error occur, return null
     * @param buffer image binary
     * @returns phash string
     */
    public async makePhash(buffer: Buffer): Promise<string> {
        Logger.instance.debug("Making phash of the image");
        return await this._staticPool.exec(buffer);
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
            if (phash1[i] !== phash2[i]) count++;
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

    public static isSupportType(filetype: FileTypeResult): boolean {
        Logger.instance.debug("checking if image is valid");
        if (filetype.mime.startsWith("image/")) return true;
        Logger.instance.debug(`Image is not valid (${filetype.mime})`);
        return false;
    }

    public async isInDatabase(type: ImageType, phash: string) {
        Logger.instance.debug("Checking if image is already in database");
        const inDatabase = await new Promise<boolean>((resolve) => {
            for (const imagePhash of this.imagePhashs.get(type)) {
                if (ImageManager.isSimilar(imagePhash.data, phash))
                    resolve(true);
            }
            resolve(false);
        });

        if (inDatabase) {
            Logger.instance.debug("Image is already in database");
            return true;
        }
        return false;
    }

    /**
     * Save image to database.
     * @param type grab type
     * @param uploader uploader of event.
     * @param extention file extension
     * @param imageData Binary image data.
     * @returns saved image object
     */
    public static async save(
        type: ImageType,
        uploader: DiscordUser,
        extention: string,
        imageData: Buffer,
        imagePhash: string
    ): Promise<Image> {
        Logger.instance.debug("Saving image to database");
        const image = await Image.add(
            type,
            uploader.id,
            extention,
            imageData,
            imagePhash
        );
        Logger.instance.info(
            `Save ${image.id}.${image.ext} to ${toString(
                type
            )} database. author: ${uploader.username}`
        );
        ImageManager.instance.addPhash(type, image.id, imagePhash);
        return image;
    }

    public static async updateContribution(
        uploaderID: string,
        type: ImageType
    ) {
        Logger.instance.debug("Updating user's contribution");
        const user = await User.get(uploaderID);
        await user.increment("contribution", {
            by: Donor.contributionRatio(type),
        });
    }

    /**
     * Get image data from imgur url.
     * @param url imgur url
     * @returns image data, or null if url is not valid
     */
    public static async getImgurImage(url: string): Promise<Buffer> {
        // imgur match
        const imgurResult = url.match(/https:\/\/imgur\.com\/([0-9a-zA-Z]+)/);
        if (!imgurResult) return null;

        // get imgur website
        const resp = await axios.get(imgurResult[0], {
            responseType: "document",
        });
        const re = new RegExp(
            "https://i.imgur.com/" + imgurResult[1] + ".([0-9a-z]+)"
        );
        const imageResult = resp.data.match(re);
        // get image
        return (
            await axios.get(imageResult[0], {
                responseType: "arraybuffer",
            })
        ).data;
    }

    /**
     * Get image data from attachment.
     * @param attachment attachment object
     * @returns image data
     */
    public static async getAttachmentImage(
        attachment: MessageAttachment
    ): Promise<Buffer> {
        return (
            await axios.get(attachment.url, {
                responseType: "arraybuffer",
            })
        ).data;
    }
}
