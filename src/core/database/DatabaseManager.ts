import { Sequelize } from "sequelize";
import dbConfig from "../../config/db-config.json";
import { env } from "../../config/bot-config.json";
import { Logger } from "../utils/Logger";
import * as user from "./models/user";
// import grab from "./models/grab";
// import image from "./models/image";
import * as reply from "./models/reply";
// import donor from "./models/donor";

export class DatabaseManager {
    public static sequelize: Sequelize;
    public static async init() {
        this.sequelize = new Sequelize(
            dbConfig.database,
            dbConfig.user,
            dbConfig.password,
            {
                host: dbConfig.host,
                dialect: "mariadb",
                timezone: "+08:00",
                logging:
                    env === "prod"
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
        // grab.init();
        // image.init();
        reply.init();
        // donor.init();

        await this.sequelize.sync();
        Logger.info("Database initialized!");
    }
}
