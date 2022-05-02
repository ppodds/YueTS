import { Sequelize } from "sequelize";
import { ConfigManager } from "../../config/ConfigManager";
import { Logger } from "../utils/Logger";
import * as user from "./models/user";
import * as grab from "./models/grab";
import * as image from "./models/image";
import * as reply from "./models/reply";
import * as donor from "./models/donor";

export class DatabaseManager {
    private static _instance: DatabaseManager;
    private readonly _sequelize: Sequelize;

    private constructor() {
        this._sequelize = new Sequelize(
            ConfigManager.instance.dbConfig.database,
            ConfigManager.instance.dbConfig.user,
            ConfigManager.instance.dbConfig.password,
            {
                host: ConfigManager.instance.dbConfig.host,
                dialect: "mariadb",
                timezone: "+08:00",
                logging:
                    ConfigManager.instance.botConfig.env === "prod"
                        ? false
                        : (sql: string, _?: number) => Logger.info(sql),
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
        Logger.info("Database initialized!");
    }
}
