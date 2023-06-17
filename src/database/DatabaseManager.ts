import { Sequelize } from "sequelize";
import { Logger } from "../utils/Logger";
import * as user from "./models/user";
import * as grab from "./models/grab";
import * as image from "./models/image";
import * as reply from "./models/reply";
import * as donor from "./models/donor";
import { Bot } from "../bot";

export class DatabaseManager {
    private static _instance: DatabaseManager;
    private readonly _sequelize: Sequelize;

    private constructor() {
        const config = Bot.instance.config;
        this._sequelize = new Sequelize(
            config.db.database,
            config.db.user,
            config.db.password,
            {
                host: config.db.host,
                port: config.db.port,
                dialect: "mariadb",
                timezone: config.db.timezone,
                logging:
                    process.env.NODE_ENV === "production"
                        ? false
                        : (sql: string, _?: number) =>
                              Logger.instance.info(sql),
                pool: {
                    max: 50,
                    min: 10,
                    acquire: 144000000,
                    idle: 10000,
                },
            }
        );
    }

    private initModels() {
        user.init();
        grab.init();
        image.init();
        reply.init();
        donor.init();
    }

    public static get instance() {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager();
        }
        return DatabaseManager._instance;
    }

    public get sequelize() {
        return this._sequelize;
    }

    public static async init() {
        DatabaseManager.instance.initModels();
        await DatabaseManager.instance.sequelize.sync();
        Logger.instance.info("Database initialized!");
    }
}
