import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { Collection } from "discord.js";
import { CommandData } from "./CommandData";
import { CommandDataType } from "./CommandDataType";
import { Subcommand } from "./SubCommand";

export interface SubcommandGroup extends CommandData {
    type: CommandDataType.SUBCOMMAND_GROUP;
    data: RESTPostAPIApplicationCommandsJSONBody;
    subCommands: Collection<string, Subcommand>;
}
