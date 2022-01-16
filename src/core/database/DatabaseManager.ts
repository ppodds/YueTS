import { Sequelize } from "sequelize";
import configManager from "../../config/ConfigManager.js";
import { Logger } from "../utils/Logger.js";
import * as user from "./models/user.js";
import * as grab from "./models/grab.js";
import * as image from "./models/image.js";
import * as reply from "./models/reply.js";
import * as donor from "./models/donor.js";

export class DatabaseManager {
    public static sequelize: Sequelize;
    public static async init() {
        this.sequelize = new Sequelize(
            (await configManager.getDBConfig()).database,
            (await configManager.getDBConfig()).user,
            (await configManager.getDBConfig()).password,
            {
                host: (await configManager.getDBConfig()).host,
                dialect: "mariadb",
                timezone: "+08:00",
                logging:
                    (await configManager.getBotConfig()).env === "prod"
                        ? false
                        : (sql: string, timing?: number) => Logger.info(sql),
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
