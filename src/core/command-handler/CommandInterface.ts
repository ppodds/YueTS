import { SlashCommandBuilder } from "@discordjs/builders";
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/rest/v9";
import { ApplicationCommandData, Client, CommandInteraction } from "discord.js";

export interface CommandInterface {
    data: Omit<SlashCommandBuilder, any>;
    init?(client: Client, name: string): Promise<ApplicationCommandData[]>;
    execute(interaction: CommandInteraction): Promise<void>;
}
