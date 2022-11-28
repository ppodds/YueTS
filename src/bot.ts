import { ActivityType, IntentsBitField, Partials } from "discord.js";
import { Client } from "discordx";
import { importx } from "@discordx/importer";
import { ConfigManager } from "./config/ConfigManager";
import { DatabaseManager } from "./database/DatabaseManager";
import { ImageManager } from "./image/ImageManager";
import { Logger } from "./utils/Logger";

const launchTimestamp = Date.now();

// Create the Discord client with the appropriate options
const client = new Client({
    // IMPORTANT: you should set it or your bot can't get the information of Discord
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
    ],
    // if you CHANNEL not enable, you can't get any event in dm channel
    partials: [Partials.Channel],
    botGuilds:
        process.env.NODE_ENV === "production"
            ? undefined
            : [ConfigManager.instance.botConfig.dev.guildId],
    silent: process.env.NODE_ENV === "production",
});

function updateBotStatus() {
    const statusType = ConfigManager.instance.botConfig.statusType;
    if (statusType === ActivityType.Custom)
        throw new Error("Invalid status type");
    client.user.setActivity(
        ConfigManager.instance.botConfig.statusList[
            Math.floor(
                Math.random() *
                    ConfigManager.instance.botConfig.statusList.length
            )
        ],
        {
            type: statusType,
        }
    );
}

async function bootstrap(client: Client) {
    // load config
    const configManager = ConfigManager.instance;
    await DatabaseManager.init();
    await importx(__dirname + "/{events,commands}/**/*.{ts,js}");
    try {
        await client.login(configManager.botConfig.token);
        console.log(`Logged in as ${client.user?.tag}!`);
        Logger.instance.info("Logged into Discord successfully");
    } catch (err) {
        Logger.instance.error("Error logging into Discord", err);
        process.exit();
    }
    client.user?.setActivity(
        "「現在剛起床還沒搞清楚狀況... 等一下再叫我吧...」",
        { type: ActivityType.Listening }
    );
    await ImageManager.instance.init();
    await client.clearApplicationCommands();
    await client.initApplicationCommands();
    // Updates the bot status every minute
    setInterval(updateBotStatus, 60000);

    // Some other somewhat important events that the bot should listen to
    client.on("error", (err) =>
        Logger.instance.error("The client threw an error", err)
    );
    client.on("shardError", (err) =>
        Logger.instance.error("A shard threw an error", err)
    );
    client.on("warn", (warn) =>
        Logger.instance.warn("The client received a warning", warn)
    );
    client.on("interactionCreate", async (interaction) => {
        try {
            await client.executeInteraction(interaction);
        } catch (error) {
            console.log(error);
            if (!interaction.isCommand()) {
                Logger.instance.error("Interaction threw an error", error);
                return;
            }
            Logger.instance.error("Command threw an error", error);
            const content = {
                content:
                    process.env.NODE_ENV === "production"
                        ? "指令在執行階段出錯了!"
                        : JSON.stringify(
                              error,
                              Object.getOwnPropertyNames(error),
                              2
                          ),
                ephemeral: true,
            };
            // send error message when command execute failed
            if (interaction.deferred) {
                await interaction.editReply(content);
            } else if (interaction.replied) {
                await interaction.followUp(content);
            } else {
                await interaction.reply(content);
            }
        }
    });
    Logger.instance.info(`Launched in ${Date.now() - launchTimestamp}ms`);
}
bootstrap(client);
