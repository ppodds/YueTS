import { CommandInteraction } from "discord.js";
import { Command } from "../../Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { info } from "../../../core/graphics/embeds";
import { Image } from "../../../core/database/models/image";
import { ImageType } from "../../../core/image/ImageType";

export = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("查看系統狀況")
        .toJSON(),
    async execute(interaction: CommandInteraction) {
        const embed = info(
            interaction.client,
            "「嗯.....差不多現在就是這樣子吧.....」"
        );
        embed.addFields(
            {
                name: "和你的距離",
                value: `${interaction.client.ws.ping}`,
                inline: false,
            },
            {
                name: "pic圖庫數量",
                value: (await Image.amount(ImageType.PIC)).toString(),
                inline: true,
            },
            {
                name: "wtfpic圖庫數量",
                value: (await Image.amount(ImageType.WTFPIC)).toString(),
                inline: true,
            },
            {
                name: "hpic圖庫數量",
                value: (await Image.amount(ImageType.HPIC)).toString(),
                inline: true,
            }
        );
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
