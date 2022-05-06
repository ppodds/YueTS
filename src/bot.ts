import { Client, Intents } from "discord.js";
import { ConfigManager } from "./config/ConfigManager";
import { DatabaseManager } from "./database/DatabaseManager";
import { EventManager } from "./event/EventManager";
import { ImageManager } from "./image/ImageManager";
import { Logger } from "./utils/Logger";

const launchTimestamp = Date.now();

// Create the Discord client with the appropriate options
const client = new Client({
    // IMPORTANT: you should set it or your bot can't get the information of Discord
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    ],
    // if you CHANNEL not enable, you can't get any event in dm channel
    partials: ["CHANNEL"],
});

async function preLaunch(client: Client) {
    // load config
    const configManager = ConfigManager.instance;
    await DatabaseManager.init();
    try {
        await client.login(configManager.botConfig.token);
        Logger.instance.info("Logged into Discord successfully");
    } catch (err) {
        Logger.instance.error("Error logging into Discord", err);
        process.exit();
    }
    client.user?.setActivity(
        "「現在剛起床還沒搞清楚狀況... 等一下再叫我吧...」",
        { type: "LISTENING" }
    );
    await ImageManager.instance.init();
    EventManager.instance.init(client);
    Logger.instance.info(`Launched in ${Date.now() - launchTimestamp}ms`);
}

preLaunch(client);
