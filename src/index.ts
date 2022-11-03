import { ShardingManager } from "discord.js";
import { exit } from "process";
import { CommandDeployer } from "./command/CommandDeployer";
import { ConfigManager } from "./config/ConfigManager";
import { Logger } from "./utils/Logger";

process.chdir(`${process.env.BASE_PATH}/dist`);

async function bootstrap() {
    if (process.env.NODE_ENV === "production") {
        const commandDeployer = new CommandDeployer();
        try {
            await commandDeployer.run();
        } catch (e) {
            Logger.instance.error(e);
            exit(1);
        }
    }
    const manager = new ShardingManager("bot.js", {
        token: ConfigManager.instance.botConfig.token,
    });
    manager.on("shardCreate", (shard) => {
        console.log(`Launched shard ${shard.id}`);
        Logger.instance.info(`Launched shard ${shard.id}`);
    });
    await manager.spawn();
}

bootstrap();
