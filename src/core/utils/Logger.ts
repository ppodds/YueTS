import log4js from "log4js";
import { ConfigManager } from "../../config/ConfigManager";

const { configure, getLogger } = log4js;

configure(ConfigManager.instance.logConfig);
const logger = getLogger();
const BOTNAME = ConfigManager.instance.botConfig.name;

function formatText(text: string) {
    return text.replace("BOTNAME", BOTNAME);
}

export class Logger {
    public static info(text: string) {
        logger.info(formatText(text));
    }

    public static debug(text: string) {
        logger.debug(formatText(text));
    }

    public static warn(text: string, warn: string = null) {
        logger.warn(formatText(`${text}${warn ? "\n" + warn : ""}`));
    }

    public static error(
        text: string,
        err: Record<string, unknown> | Error = null
    ) {
        logger.error(
            formatText(`${text}
        ${err ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : ""}`)
        );
    }
}
