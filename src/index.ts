import { ShardingManager } from "discord.js";
import { ConfigManager } from "./config/ConfigManager";
import { Logger } from "./utils/Logger";

process.chdir(`${process.env.BASE_PATH}/dist`);

const manager = new ShardingManager("bot.js", {
    token: ConfigManager.instance.botConfig.token,
});
manager.on("shardCreate", (shard) =>
    Logger.instance.info(`Launched shard ${shard.id}`)
);
manager.spawn();
