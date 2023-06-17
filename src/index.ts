import { ShardingManager } from "discord.js";
import { config } from "dotenv";

async function bootstrap() {
    config();
    const manager = new ShardingManager("dist/bot.js", {
        token: process.env.BOT__TOKEN,
    });
    manager.on("shardCreate", (shard) => {
        console.log(`Launched shard ${shard.id}`);
    });
    await manager.spawn();
}

bootstrap();
