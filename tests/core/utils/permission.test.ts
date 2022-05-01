import { isOwner } from "../../../src/core/utils/permission.js";
import { ConfigManager } from "../../../src/config/ConfigManager.js";
import { Client, Intents } from "discord.js";
import { DatabaseManager } from "../../../src/core/database/DatabaseManager.js";

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
    await DatabaseManager.init();
    try {
        await client.login(ConfigManager.instance.botConfig.token);
    } catch (err) {
        process.exit();
    }
}

beforeAll(() => preLaunch(client));

test("bot author should be owner of the bot", async () => {
    const author = ConfigManager.instance.botConfig.author;
    const authorUser = await client.users.fetch(author.id);
    expect(authorUser).toBeDefined();
    expect(await isOwner(client, authorUser)).toBe(true);
});
