import "reflect-metadata";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";

import { ActivityType, IntentsBitField, Partials } from "discord.js";
import { importx } from "@discordx/importer";
import { DatabaseService } from "./database/database-service";
import { ImageService } from "./image/image-service";
import { LoggerService } from "./utils/logger-service";
import { Service } from "./service";
import { ConfigService } from "./config/config-service";
import { injectable, container } from "tsyringe";

@injectable()
export class Bot {
    private readonly _client: Client;
    private readonly _services: Service[];

    constructor(
        private readonly _configService: ConfigService,
        private readonly _loggerService: LoggerService,
        private readonly _databaseService: DatabaseService,
        private readonly _imageService: ImageService
    ) {
        this._services = [
            this._configService,
            this._loggerService,
            this._databaseService,
            this._imageService,
        ];
        // Create the Discord client with the appropriate options
        this._client = new Client({
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
                    : [this._configService.config.bot.dev.guildId],
            silent: false,
        });
    }

    async bootstrap() {
        const launchTimestamp = Date.now();
        for (const service of this._services) {
            await service.init();
        }
        await importx(__dirname + "/{events,commands}/**/*.{ts,js}");
        try {
            await this._client.login(this._configService.config.bot.token);
            console.log(`Logged in as ${this._client.user?.tag}!`);
            this._loggerService.info("Logged into Discord successfully");
        } catch (err) {
            this._loggerService.error("Error logging into Discord", err);
            process.exit();
        }
        this._client.user?.setActivity(
            "「現在剛起床還沒搞清楚狀況... 等一下再叫我吧...」",
            { type: ActivityType.Listening }
        );
        this._loggerService.info("Clearing application commands");
        await this._client.clearApplicationCommands();
        this._loggerService.info("Initializing application commands");
        await this._client.initApplicationCommands();

        this._loggerService.info("Registering bot status updater");
        // Updates the bot status every minute
        setInterval(this.updateStatus.bind(this), 60000);

        this._loggerService.info("Registering error handler");
        // Some other somewhat important events that the bot should listen to
        this._client.on("error", (err) =>
            this._loggerService.error("The client threw an error", err)
        );
        this._loggerService.info("Registering shard error handler");
        this._client.on("shardError", (err) =>
            this._loggerService.error("A shard threw an error", err)
        );
        this._loggerService.info("Registering warn handler");
        this._client.on("warn", (warn) =>
            this._loggerService.warn("The client received a warning", warn)
        );
        this._loggerService.info("Registering interaction handler");
        this._client.on("interactionCreate", async (interaction) => {
            try {
                await this._client.executeInteraction(interaction);
            } catch (error) {
                console.log(error);
                if (!interaction.isCommand()) {
                    this._loggerService.error(
                        "Interaction threw an error",
                        error
                    );
                    return;
                }
                this._loggerService.error("Command threw an error", error);
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
        this._loggerService.info(
            `Launched in ${Date.now() - launchTimestamp}ms`
        );
    }

    private updateStatus() {
        const statusType: ActivityType | undefined =
            ActivityType[this._configService.config.bot.statusType];
        if (statusType === undefined || statusType === ActivityType.Custom) {
            throw new Error("Invalid status type");
        }
        this._client.user?.setActivity(
            this._configService.config.bot.statusList[
                Math.floor(
                    Math.random() *
                        this._configService.config.bot.statusList.length
                )
            ],
            {
                type: statusType,
            }
        );
    }

    public get client(): Client {
        return this._client;
    }
}

DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
const bot = container.resolve(Bot);
bot.bootstrap();
