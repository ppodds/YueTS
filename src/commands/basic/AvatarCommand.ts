import {
    ApplicationCommandOptionType,
    CommandInteraction,
    User,
} from "discord.js";
import { info } from "../../graphics/embeds";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
class AvatarCommand {
    @Slash({
        name: "avatar",
        description: "取得目標的Discord頭像(無目標則獲得自己的頭像)",
    })
    async execute(
        @SlashOption({
            name: "target",
            description: "目標使用者",
            type: ApplicationCommandOptionType.User,
        })
        target: User | undefined,
        interaction: CommandInteraction
    ) {
        const embed = info(interaction.client, "「看來這就是你要的呢...」");
        if (target)
            embed.setImage(
                target.displayAvatarURL({ extension: "png", size: 1024 })
            );
        else
            embed.setImage(
                interaction.user.displayAvatarURL({
                    extension: "png",
                    size: 1024,
                })
            );
        await interaction.reply({ embeds: [embed] });
    }
}
