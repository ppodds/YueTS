import { Sequelize } from "sequelize";
import { ConfigManager } from "../../config/ConfigManager";
import { Logger } from "../utils/Logger";
import * as user from "./models/user";
import * as grab from "./models/grab";
import * as image from "./models/image";
import * as reply from "./models/reply";
import * as donor from "./models/donor";

export class DatabaseManager {
    public static sequelize: Sequelize;
    public static async init() {
        this.sequelize = new Sequelize(
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
        user.init();
        grab.init();
        image.init();
        reply.init();
        donor.init();

        await this.sequelize.sync();
        Logger.info("Database initialized!");
    }
}
