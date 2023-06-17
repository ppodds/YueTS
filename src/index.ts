import { ShardingManager } from "discord.js";
import { Logger } from "./utils/Logger";
import { config } from "dotenv";

async function bootstrap() {
    config();
    const manager = new ShardingManager("dist/bot.js", {
        token: process.env.BOT__TOKEN,
    });
    manager.on("shardCreate", (shard) => {
        console.log(`Launched shard ${shard.id}`);
        Logger.instance.info(`Launched shard ${shard.id}`);
    });
    await manager.spawn();
}

bootstrap();
