import { Client, ExcludeEnum } from "discord.js";
import { ActivityTypes } from "discord.js/typings/enums";
import { readdirSync } from "fs";
import { CommandManager } from "../command/CommandManager";
import { Executer } from "../command/Executer";
import { ConfigManager } from "../config/ConfigManager";
import { Logger } from "../core/utils/Logger";
import { Event } from "./Event";

export class EventManager {
    private static _instance: EventManager;
    private _client: Client;
    private _events: Event[];

    private constructor() {
        this._events = [];
    }

    public static get instance(): EventManager {
        if (!EventManager._instance) {
            EventManager._instance = new EventManager();
        }
        return EventManager._instance;
    }

    public init(client: Client) {
        this._client = client;
        this.registerAll();
    }

    private registerAll() {
        this.registerSlashCommands();
        this.registerEvents();
        // Updates the bot status every minute
        setInterval(() => EventManager._instance.updateBotStatus(), 60000);

        // Some other somewhat important events that the bot should listen to
        this._client.on("error", (err) =>
            Logger.instance.error("The client threw an error", err)
        );
        this._client.on("shardError", (err) =>
            Logger.instance.error("A shard threw an error", err)
        );
        this._client.on("warn", (warn) =>
            Logger.instance.warn("The client received a warning", warn)
        );
    }

    private registerEvents() {
        const eventFiles = readdirSync(`${__dirname}/events`).filter(
            (file) => file.endsWith(".js") || file.endsWith(".ts")
        );
        for (const file of eventFiles) {
            require(`${__dirname}/events/${file.split(".")[0]}`);
        }
        for (const event of this._events) {
            const executer = event.executer;
            if (event.once) {
                this._client.once(
                    event.name,
                    async (...args) => await this.executeEvent(executer, args)
                );
            } else {
                this._client.on(
                    event.name,
                    async (...args) => await this.executeEvent(executer, args)
                );
            }
        }
    }

    public registerEvent(event: Event) {
        this._events.push(event);
    }

    private async executeEvent(executer: Executer, args: any[]) {
        try {
            await executer.classRef[executer.methodName](...args);
        } catch (error) {
            Logger.instance.error("Event threw an error", error);
        }
    }

    private registerSlashCommands() {
        this._client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;
            try {
                await CommandManager.instance.executeCommand(interaction);
            } catch (error) {
                console.log(error);
                Logger.instance.error("Command threw an error", error);
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
