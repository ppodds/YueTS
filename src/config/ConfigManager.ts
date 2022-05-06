import { readFileSync } from "fs";
import { Configuration } from "log4js";
import { BotConfig } from "./BotConfig";
import { DBConfig } from "./DBConfig";

const botConfigPath = `${process.env.BASE_PATH}/config/bot.json`;
const dbConfigPath = `${process.env.BASE_PATH}/config/db.json`;
const logConfigPath = `${process.env.BASE_PATH}/config/log.json`;

export class ConfigManager {
    private static _instance: ConfigManager;

    private _botConfig: BotConfig;
    private _dbConfig: DBConfig;
    private _logConfig: Configuration;

    private constructor() {
        this.load();
    }

    public static get instance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    private load() {
        this._botConfig = JSON.parse(this.loadFile(botConfigPath));
        this._dbConfig = JSON.parse(this.loadFile(dbConfigPath));
        this._logConfig = JSON.parse(this.loadFile(logConfigPath));
    }

    private loadFile(path: string): string {
        return readFileSync(path, "utf8");
    }

    public get botConfig(): BotConfig {
        return this._botConfig;
    }

    public get dbConfig(): DBConfig {
        return this._dbConfig;
    }

    public get logConfig(): Configuration {
        return this._logConfig;
    }
}
