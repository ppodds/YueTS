import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
class ChooseCommand {
    @Slash({
        name: "choose",
        description: "在各項內容中抽一個",
    })
    async execute(
        @SlashOption({
            name: "options",
            description: "要抽的項目(用半形逗號分開)",
            required: true,
            type: ApplicationCommandOptionType.String,
        })
        inputs: string,
        interaction: CommandInteraction
    ) {
        await interaction.reply(
            inputs[Math.floor(Math.random() * inputs.length)]
        );
    }
}
