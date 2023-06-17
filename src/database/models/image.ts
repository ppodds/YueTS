import sequelize from "sequelize";
import { ImageType } from "../../image/ImageType";

export class Image extends sequelize.Model {
    declare id: number;
    declare type: number;
    declare uploader: string;
    declare ext: string;
    declare image: Buffer;
    declare phash: string;
    declare createdAt: Date;
    declare updateAt: Date;
    /**
     * Add a image to db
     * @param type pic, hpic, wtfpic
     * @param uploader uploader user id
     * @param ext image's extension
     * @param data image's binary data
     * @param phash image's phash
     */
    static async add(
        type: ImageType,
        uploader: string,
        ext: string,
        data: ArrayBuffer,
        phash: string
    ) {
        return await Image.create({
            type: type,
            uploader: uploader,
            ext: ext,
            image: data,
            phash: phash,
        });
    }
    /**
     * Get an Image by id
     * @param {Number} id Image's id
     * @returns {Promise<Image>} an Image object contains all infomation
     */
    static async get(id: number): Promise<Image> {
        const img = await Image.findOne({
            where: {
                id: id,
            },
        });
        if (!img) throw new Error("Image not found");
        return img;
    }

    /**
     * Get an random image with according type
     * @param type image type
     * @returns a random image
     */
    static async random(type: ImageType): Promise<Image | null> {
        const dbImageIdList = await Image.findAll({
            where: {
                type: type,
            },
            attributes: ["id"],
        });
        const randId =
            dbImageIdList[Math.floor(Math.random() * dbImageIdList.length)];
        return randId ? await Image.get(randId.id) : null;
    }

    /**
     * Get image amount of according type
     * @param type image type
     * @returns image amount
     */
    static async amount(type: ImageType): Promise<number> {
        return await Image.count({
            where: {
                type: type,
            },
        });
    }
}

export function init(instance: sequelize.Sequelize) {
    Image.init(
        {
            type: {
                type: sequelize.DataTypes.TINYINT,
                allowNull: false,
            },
            uploader: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            ext: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            image: {
                type: sequelize.DataTypes.BLOB("long"),
                allowNull: false,
            },
            phash: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
        },
        { sequelize: instance }
    );
}
