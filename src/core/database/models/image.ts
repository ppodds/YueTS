import { Model, DataTypes } from "sequelize";
import { ImageType } from "../../image/ImageType";
import { DatabaseManager } from "../DatabaseManager";

export class Image extends Model {
    id: number;
    type: number;
    uploader: string;
    ext: string;
    image: ArrayBuffer;
    /**
     * Add a image to db
     * @param {string} type pic, hpic, wtfpic
     * @param {string} uploader uploader user id
     * @param {string} ext image's extension
     * @param {ArrayBuffer} data image's binary data
     */
    static async add(
        type: ImageType,
        uploader: string,
        ext: string,
        data: ArrayBuffer
    ) {
        return await Image.create({
            type: type,
            uploader: uploader,
            ext: ext,
            image: data,
        });
    }
    /**
     * Get an Image by id
     * @param {Number} id Image's id
     * @returns {Promise<Image>} an Image object contains all infomation
     */
    static async get(id: number): Promise<Image> {
        return await Image.findOne({
            where: {
                id: id,
            },
        });
    }

    /**
     * Get an random image with according type
     * @param {string} type image type
     * @returns {Promise<Image>} a random image
     */
    static async random(type: string): Promise<Image> {
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
     * @param {string} type image type
     * @returns {Promise<Number>} image amount
     */
    static async amount(type: string): Promise<number> {
        return await Image.count({
            where: {
                type: type,
            },
        });
    }
}

export function init() {
    Image.init(
        {
            type: {
                type: DataTypes.TINYINT,
                allowNull: false,
            },
            uploader: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            ext: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            image: {
                type: DataTypes.BLOB("long"),
                allowNull: false,
            },
        },
        { sequelize: DatabaseManager.sequelize }
    );
}
