import { ShardingManager } from "discord.js";
import { ConfigManager } from "./config/ConfigManager";
import { Logger } from "./utils/Logger";

async function bootstrap() {
    const manager = new ShardingManager("dist/bot.js", {
        token: ConfigManager.instance.botConfig.token,
    });
    manager.on("shardCreate", (shard) => {
        console.log(`Launched shard ${shard.id}`);
        Logger.instance.info(`Launched shard ${shard.id}`);
    });
    await manager.spawn();
}

bootstrap();
