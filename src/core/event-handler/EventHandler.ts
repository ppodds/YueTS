import { Logger } from "../utils/Logger";
import { ConfigManager } from "../../config/ConfigManager";
import * as fs from "fs";
import { Client, ExcludeEnum } from "discord.js";
import { ActivityTypes } from "discord.js/typings/enums";
import { CommandManager } from "../../command/CommandManager";

export class EventHandler {
    private static client: Client;
    public static init(client: Client, args: { launchTimestamp: number }) {
        this.client = client;
        this.initEssentialEvents(args);
        this.initEvents();
    }
    private static initEssentialEvents(args: { launchTimestamp: number }) {
        (async () => {
            const updateBotStatus = async () => {
                this.client.user.setActivity(
                    ConfigManager.instance.botConfig.statusList[
                        Math.floor(
                            Math.random() *
                                ConfigManager.instance.botConfig.statusList
                                    .length
                        )
                    ],
                    {
                        type: <ExcludeEnum<typeof ActivityTypes, "CUSTOM">>(
                            ConfigManager.instance.botConfig.statusType
                        ),
                    }
                );
            };

            updateBotStatus();
            // Updates the bot status every minute
            setInterval(() => updateBotStatus(), 60000);

            // init command permission
            // const tasks: Promise<void>[] = [];
            // commands.forEach((command, name) => {
            //     if (command.init) {
            //         tasks.push(
            //             new Promise<void>((resolve) =>
            //                 command.init(this.client, name).then(resolve)
            //             )
            //         );
            //     }
            // });
            // await Promise.all(tasks);

            Logger.info(
                `Successfully launched in ${
                    (Date.now() - args.launchTimestamp) / 1000
                } seconds!`
            );
        })();

        // Slash commands
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;

            const command = CommandManager.instance.getCommand(
                interaction.commandName
            );

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                Logger.error("Command threw an error", error);
                if (ConfigManager.instance.botConfig.env === "dev") {
                    console.log(error);
                }
                const content = {
                    content:
                        ConfigManager.instance.botConfig.env === "dev"
                            ? error.message
                            : "指令在執行階段出錯了!",
                    ephemeral: true,
                };
                if (interaction.deferred) {
                    await interaction.editReply(content);
                } else if (interaction.replied) {
                    await interaction.followUp(content);
                } else {
                    await interaction.reply(content);
                }
            }
        });

        // Some other somewhat important events that the bot should listen to
        this.client.on("error", (err) =>
            Logger.error("The client threw an error", err)
        );

        this.client.on("shardError", (err) =>
            Logger.error("A shard threw an error", err)
        );

        this.client.on("warn", (warn) =>
            Logger.warn("The client received a warning", warn)
        );
    }
    private static async initEvents() {
        const eventFiles = fs
            .readdirSync("./core/event-handler/events")
            .filter((file) => file.endsWith(".js"));

        for (const file of eventFiles) {
            const event = (await import(`./events/${file}`)).default;
            if (event.once) {
                this.client.once(event.name, async (...args) => {
                    try {
                        await event.execute(...args);
                    } catch (error) {
                        Logger.error("Event threw an error", error);
                    }
                });
            } else {
                this.client.on(event.name, async (...args) => {
                    try {
                        await event.execute(...args);
                    } catch (error) {
                        Logger.error("Event threw an error", error);
                    }
                });
            }
        }
    }
}
