import { SlashCommandBuilder } from "@discordjs/builders";
import PlayerManager from "../../../core/music/PlayerManager";
import { Command } from "../../Command";

export = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("讓Yue離開 並清空預計要唱的歌曲")
        .toJSON(),
    async execute(interaction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        PlayerManager.cleanup(interaction.guild);
        await interaction.reply("表演結束! 下次也請多多支持!");
    },
} as Command;
