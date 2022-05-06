import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { Awaitable, Collection, CommandInteraction } from "discord.js";
import { readdirSync } from "fs";
import { Command } from "./Command";
import { CommandData } from "./CommandData";
import { CommandDataType } from "./CommandDataType";
import { Executer } from "./Executer";
import { Subcommand } from "./SubCommand";
import { SubcommandGroup } from "./SubcommandGroup";

export class CommandManager {
    private static _instance: CommandManager;
    private readonly _commandsData: Collection<
        string,
        Command | SubcommandGroup
    >;

    private constructor() {
        this._commandsData = new Collection<
            string,
            Command | SubcommandGroup
        >();
    }

    public static get instance(): CommandManager {
        if (!CommandManager._instance) {
            CommandManager._instance = new CommandManager();
            CommandManager._instance.loadCommands();
        }
        return CommandManager._instance;
    }

    public getCommandsData(): IterableIterator<CommandData> {
        return this._commandsData.values();
    }

    public getCommandData(name: string): CommandData | undefined {
        return this._commandsData.get(name);
    }

    private loadCommands() {
        const commandFolders = readdirSync(`${__dirname}/commands`);
        for (const folder of commandFolders) {
            const commandFiles = readdirSync(
                `${__dirname}/commands/${folder}`
            ).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
            for (const file of commandFiles) {
                require(`${__dirname}/commands/${folder}/${
                    file.split(".")[0]
                }`);
            }
        }
    }

    public registerCommand(command: Command) {
        this._commandsData.set(command.data.name, command);
    }

    public registerSubcommandGroup(
        data: RESTPostAPIApplicationCommandsJSONBody
    ) {
        // we have already created a place holder for this
        const tmp = this._commandsData.get(data.name);
        (tmp as SubcommandGroup).data = data;
        this._commandsData.set(data.name, tmp);
    }

    public registerSubCommand(root: string, subcommand: Subcommand) {
        // if root command is not exist, we need to create a place holder
        if (!this._commandsData.has(root)) {
            this._commandsData.set(root, {
                type: CommandDataType.SUBCOMMAND_GROUP,
                data: null,
                subCommands: new Collection<string, Subcommand>(),
            });
        }
        const tmp = this._commandsData.get(root);
        tmp.subCommands.set(subcommand.name, subcommand);
        this._commandsData.set(root, tmp);
    }

    public executeCommand(interaction: CommandInteraction): Awaitable<void> {
        const commandData = this._commandsData.get(interaction.commandName);
        if (!commandData) return;
        let executer: Executer;
        switch (commandData.type) {
            case CommandDataType.COMMAND:
                executer = commandData.executer;
                break;
            case CommandDataType.SUBCOMMAND_GROUP:
                executer = commandData.subCommands.get(
                    interaction.options.getSubcommand()
                )?.executer;
                break;
        }
        return executer.classRef[executer.methodName](interaction);
    }
}
