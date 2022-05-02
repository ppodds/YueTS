import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CommandInteraction } from "discord.js";

export interface Command {
    data: RESTPostAPIApplicationCommandsJSONBody;
    execute(interaction: CommandInteraction): Promise<any>;
}
