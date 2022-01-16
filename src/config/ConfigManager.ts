import { ActivityTypes } from "discord.js/typings/enums";
import { promises as fs } from "fs";
import { Configuration } from "log4js";

const botConfigPath = `${process.env.BASE_PATH}/config/bot.json`;
const dbConfigPath = `${process.env.BASE_PATH}/config/db.json`;
const logConfigPath = `${process.env.BASE_PATH}/config/log.json`;

export interface BotConfig {
    name: string;
    statusList: string[];
    statusType: ActivityTypes;
    token: string;
    env: string;
    dev: {
        clientId: string;
        guildId: string;
    };
    author: {
        id: string;
        avatar: string;
    };
}
export interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

class ConfigManager {
    private botConfig: BotConfig;
    private dbConfig: DBConfig;
    private logConfig: Configuration;
    async getBotConfig(): Promise<BotConfig> {
        if (!this.botConfig)
            this.botConfig = JSON.parse(
                await fs.readFile(botConfigPath, "utf8")
            );
        return this.botConfig;
    }
    async getDBConfig(): Promise<DBConfig> {
        if (!this.dbConfig)
            this.dbConfig = JSON.parse(await fs.readFile(dbConfigPath, "utf8"));
        return this.dbConfig;
    }
    async getLogConfig(): Promise<Configuration> {
        if (!this.logConfig)
            this.logConfig = JSON.parse(
                await fs.readFile(logConfigPath, "utf8")
            );
        return this.logConfig;
    }
}
const configManager = new ConfigManager();
export default configManager;
