import { SlashCommandBuilder } from "@discordjs/builders";
import { command } from "../../../decorator/command/command";
import { CommandInteraction } from "discord.js";

export class ChooseCommand {
    @command(
        new SlashCommandBuilder()
            .setName("choose")
            .setDescription("在各項內容中抽一個")
            .addStringOption((option) =>
                option
                    .setName("options")
                    .setDescription("要抽的項目(用半形逗號分開)")
                    .setRequired(true)
            )
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const inputs = interaction.options.getString("options").split(",");
        await interaction.reply(
            inputs[Math.floor(Math.random() * inputs.length)]
        );
    }
}
