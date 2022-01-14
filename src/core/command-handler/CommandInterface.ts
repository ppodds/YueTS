import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandData, Client, CommandInteraction } from "discord.js";

export interface CommandInterface {
    data: SlashCommandBuilder;
    init?(client: Client, name: string): Promise<ApplicationCommandData[]>;
    execute(interaction: CommandInteraction): Promise<void>;
}
