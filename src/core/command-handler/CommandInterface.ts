import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction } from "discord.js";

export interface CommandInterface {
    data: Omit<SlashCommandBuilder, any>;
    init?(client: Client, name: string): Promise<void>;
    execute(interaction: CommandInteraction): Promise<void>;
}
