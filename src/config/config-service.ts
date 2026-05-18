import { singleton } from "tsyringe";
import { Config } from "./config.js";
import { config } from "dotenv";
import { EnvParser } from "./env-parser.js";
import { Service } from "../service.js";

@singleton()
export class ConfigService implements Service {
    private readonly _config: Config;

    constructor() {
        config();
        this._config = new EnvParser().parse<Config>();
    }

    public init(): Promise<void> {
        return Promise.resolve();
    }

    public get config(): Config {
        return this._config;
    }
}
