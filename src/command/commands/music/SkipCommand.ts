import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import PlayerManager from "../../../core/music/PlayerManager";
import { command } from "../../../decorator/command/command";

export class SkipCommand {
    @command(
        new SlashCommandBuilder()
            .setName("skip")
            .setDescription("讓Yue跳過當前正在唱的歌")
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        musicPlayer.skip();
        await interaction.reply("欸? 不想聽這首嗎? 那好吧....");
    }
}
