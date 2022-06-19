import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import PlayerManager from "../../../music/PlayerManager";
import { command } from "../../../decorator/command/command";

export class RandomCommand {
    @command(
        new SlashCommandBuilder()
            .setName("random")
            .setDescription("開關歌曲隨機撥放")
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        musicPlayer.switchRandom();
        await interaction.reply(
            `${musicPlayer.isLooping() ? "開啟" : "關閉"}歌曲隨機撥放`
        );
    }
}
