import log4js from "log4js";
import { Service } from "../service";
import { singleton, injectable } from "tsyringe";
import { ConfigService } from "../config/config-service";
const { configure, getLogger } = log4js;

@singleton()
@injectable()
export class LoggerService implements Service {
    private _logger: log4js.Logger;

    constructor(configService: ConfigService) {
        configure(configService.config.log);
        this._logger = getLogger();
    }

    public init(): Promise<void> {
        return Promise.resolve();
    }

    public info(text: string) {
        this._logger.info(text);
    }

    public debug(text: string) {
        this._logger.debug(text);
    }

    public warn(text: string, warn: string | null = null) {
        this._logger.warn(`${text}${warn ? "\n" + warn : ""}`);
    }

    public error(text: string, err: unknown = null) {
        this._logger.error(
            `${text}
        ${err ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : ""}`
        );
    }
}
