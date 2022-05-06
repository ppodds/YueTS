import log4js from "log4js";
import { ConfigManager } from "../config/ConfigManager";
const { configure, getLogger } = log4js;

export class Logger {
    private static _instance: Logger;
    private _logger: log4js.Logger;

    private constructor() {
        configure(ConfigManager.instance.logConfig);
        this._logger = getLogger();
    }

    public static get instance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    public info(text: string) {
        this._logger.info(text);
    }

    public debug(text: string) {
        this._logger.debug(text);
    }

    public warn(text: string, warn: string = null) {
        this._logger.warn(`${text}${warn ? "\n" + warn : ""}`);
    }

    public error(text: string, err: Record<string, unknown> | Error = null) {
        this._logger.error(
            `${text}
        ${err ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : ""}`
        );
    }
}
