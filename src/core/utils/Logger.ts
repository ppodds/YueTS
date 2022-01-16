import log4js from "log4js";
import configManager from "../../config/ConfigManager.js";

const { configure, getLogger } = log4js;

configure(await configManager.getLogConfig());
const logger = getLogger();
const BOTNAME = (await configManager.getBotConfig()).name;

function formatText(text: string) {
    return text.replace("BOTNAME", BOTNAME);
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
