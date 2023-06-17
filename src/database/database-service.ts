import { Sequelize } from "sequelize";
import { LoggerService } from "../utils/logger-service";
import * as user from "./models/user";
import * as grab from "./models/grab";
import * as image from "./models/image";
import * as reply from "./models/reply";
import * as donor from "./models/donor";
import { Service } from "../service";
import { singleton, injectable } from "tsyringe";
import { ConfigService } from "../config/config-service";

@singleton()
@injectable()
export class DatabaseService implements Service {
    private readonly _sequelize: Sequelize;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _loggerService: LoggerService
    ) {
        this._sequelize = new Sequelize(
            _configService.config.db.database,
            _configService.config.db.user,
            _configService.config.db.password,
            {
                host: _configService.config.db.host,
                port: _configService.config.db.port,
                dialect: "mariadb",
                timezone: _configService.config.db.timezone,
                logging:
                    process.env.NODE_ENV === "production"
                        ? false
                        : (sql: string, _?: number) =>
                              this._loggerService.info(sql),
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
        user.init(this._sequelize);
        grab.init(this._sequelize);
        image.init(this._sequelize);
        reply.init(this._sequelize);
        donor.init(this._sequelize);
    }

    public get sequelize() {
        return this._sequelize;
    }

    public async init() {
        this.initModels();
        await this.sequelize.sync();
        this._loggerService.info("Database initialized!");
    }
}
