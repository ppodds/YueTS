import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import PlayerManager from "../../../core/music/PlayerManager";
import { command } from "../../../decorator/command/command";

export class PlayingCommand {
    @command(
        new SlashCommandBuilder()
            .setName("playing")
            .setDescription("觀看正在撥放中的歌曲資訊")
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        await interaction.reply(musicPlayer.getNowPlayingMessageContent());
    }
}
