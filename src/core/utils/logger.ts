import { configure, getLogger } from "log4js";
import { name } from "../../config/bot-config.json";
import * as logConfig from "../../config/log-config.json";

configure(logConfig);
const logger = getLogger();

function formatText(text: string) {
    return text.replace("BOTNAME", name);
}

export class Logger {
    public static info(text: string) {
        logger.info(formatText(text));
    }

    public static warn(text: string, warn: string) {
        logger.warn(formatText(`${text}${warn ? "\n" + warn : ""}`));
    }

    public static error(text: string, err: Error) {
        logger.error(formatText(`${text}${err ? "\n" + err : ""}`));
    }
}
