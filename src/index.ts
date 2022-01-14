import { ShardingManager } from "discord.js";
import { Logger } from "./core/utils/Logger";
import { token } from "./config/bot-config.json";

process.chdir("dist");

const manager = new ShardingManager("bot.js", {
    token: token,
});

manager.on("shardCreate", (shard) => Logger.info(`Launched shard ${shard.id}`));
manager.spawn();
