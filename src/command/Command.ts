import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CommandData } from "./CommandData";
import { CommandDataType } from "./CommandDataType";
import { Executer } from "./Executer";

export interface Command extends CommandData {
    type: CommandDataType.COMMAND;
    data: RESTPostAPIApplicationCommandsJSONBody;
    executer: Executer;
}
