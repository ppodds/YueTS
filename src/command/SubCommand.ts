import { CommandData } from "./CommandData";
import { CommandDataType } from "./CommandDataType";
import { Executer } from "./Executer";

export interface Subcommand extends CommandData {
    type: CommandDataType.SUBCOMMAND;
    name: string;
    executer: Executer;
}
