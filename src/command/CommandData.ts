import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { Collection } from "discord.js";
import { CommandDataType } from "./CommandDataType";
import { Executer } from "./Executer";
import { Subcommand } from "./SubCommand";

export interface CommandData {
    type: CommandDataType;
    name?: string;
    data?: RESTPostAPIApplicationCommandsJSONBody;
    executer?: Executer;
    subCommands?: Collection<string, Subcommand>;
}
