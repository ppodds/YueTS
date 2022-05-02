import { Client, ExcludeEnum } from "discord.js";
import { ActivityTypes } from "discord.js/typings/enums";
import { CommandManager } from "../command/CommandManager";
import { ConfigManager } from "../config/ConfigManager";
import { Logger } from "../core/utils/Logger";
import { Event } from "./Event";
import donate from "./events/donate";
import ehentai from "./events/ehentai";
import reply from "./events/reply";
import welcome from "./events/welcome";

export class EventManager {
    private static _instance: EventManager;
    private readonly _client: Client;

    private constructor(client: Client) {
        this._client = client;
    }

    public static get instance(): EventManager {
        return EventManager._instance;
    }

    public static init(client: Client) {
        EventManager._instance = new EventManager(client);
        EventManager._instance.registerAll();
    }

    private registerAll() {
        this.registerSlashCommands();
        this.registerEvents();
        // Updates the bot status every minute
        setInterval(EventManager._instance.updateBotStatus, 60000);

        // Some other somewhat important events that the bot should listen to
        this._client.on("error", (err) =>
            Logger.error("The client threw an error", err)
        );
        this._client.on("shardError", (err) =>
            Logger.error("A shard threw an error", err)
        );
        this._client.on("warn", (warn) =>
            Logger.warn("The client received a warning", warn)
        );
    }

    private registerEvent(event: Event) {
        if (event.once)
            this._client.once(
                event.name,
                async (...args) => await this.executeEvent(event, args)
            );
        else
            this._client.on(
                event.name,
                async (...args) => await this.executeEvent(event, args)
            );
    }

    private async executeEvent(event: any, args: any[]) {
        try {
            await event.execute(...args);
        } catch (error) {
            Logger.error("Event threw an error", error);
        }
    }

    private registerEvents() {
        const list = [donate, ehentai, reply, welcome];
        for (const event of list) this.registerEvent(event);
    }

    private registerSlashCommands() {
        this._client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;

            const command = CommandManager.instance.getCommand(
                interaction.commandName
            );

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                Logger.error("Command threw an error", error);
                const content = {
                    content:
                        ConfigManager.instance.botConfig.env === "dev"
                            ? JSON.stringify(
                                  error,
                                  Object.getOwnPropertyNames(error),
                                  2
                              )
                            : "指令在執行階段出錯了!",
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
    }

    private updateBotStatus() {
        this._client.user.setActivity(
            ConfigManager.instance.botConfig.statusList[
                Math.floor(
                    Math.random() *
                        ConfigManager.instance.botConfig.statusList.length
                )
            ],
            {
                type: <ExcludeEnum<typeof ActivityTypes, "CUSTOM">>(
                    ConfigManager.instance.botConfig.statusType
                ),
            }
        );
    }
}
