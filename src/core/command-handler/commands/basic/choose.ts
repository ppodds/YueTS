import { CommandInterface } from "../../CommandInterface";

import { SlashCommandBuilder } from "@discordjs/builders";

const command: CommandInterface = {
    data: new SlashCommandBuilder()
        .setName("choose")
        .setDescription("在各項內容中抽一個")
        .addStringOption((option) =>
            option
                .setName("options")
                .setDescription("要抽的項目(用半形逗號分開)")
                .setRequired(true)
        ),
    async execute(interaction) {
        const inputs = interaction.options.getString("options").split(",");
        await interaction.reply(
            inputs[Math.floor(Math.random() * inputs.length)]
        );
    },
};

export default command;
