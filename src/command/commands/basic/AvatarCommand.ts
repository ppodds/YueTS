import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { info } from "../../../core/graphics/embeds";
import { command } from "../../../decorator/command/command";

export class AvatarCommand {
    @command(
        new SlashCommandBuilder()
            .setName("avatar")
            .setDescription("取得目標的Discord頭像(無目標則獲得自己的頭像)")
            .addUserOption((option) =>
                option.setName("target").setDescription("目標使用者")
            )
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const embed = info(interaction.client, "「看來這就是你要的呢...」");
        const target = interaction.options.getUser("target");
        if (target)
            embed.setImage(
                target.avatarURL({ dynamic: true, format: "png", size: 1024 })
            );
        else
            embed.setImage(
                interaction.user.avatarURL({
                    dynamic: true,
                    format: "png",
                    size: 1024,
                })
            );
        await interaction.reply({ embeds: [embed] });
    }
}
