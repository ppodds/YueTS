import { SlashCommandBuilder } from "@discordjs/builders";
import PlayerManager from "../../../music/PlayerManager";
import { AudioPlayerStatus } from "@discordjs/voice";
import { command } from "../../../decorator/command/command";
import { CommandInteraction } from "discord.js";

export class PauseCommand {
    @command(
        new SlashCommandBuilder()
            .setName("pause")
            .setDescription("讓Yue暫停唱歌")
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        if (musicPlayer.getPlayerStatus() === AudioPlayerStatus.Paused)
            return await interaction.reply(
                "我現在已經停下來了啦 <:i_yoshino:583658336054935562>"
            );

        musicPlayer.pause();
        await interaction.reply("那我就先停下來哦....");
    }
}
