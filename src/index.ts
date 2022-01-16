import { ShardingManager } from "discord.js";
import configManager from "./config/ConfigManager.js";
import { Logger } from "./core/utils/Logger.js";

process.chdir(`${process.env.BASE_PATH}/dist`);

const manager = new ShardingManager("bot.js", {
    token: (await configManager.getBotConfig()).token,
});
manager.on("shardCreate", (shard) => Logger.info(`Launched shard ${shard.id}`));
manager.spawn();
