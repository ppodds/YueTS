import { CommandInteraction } from "discord.js";
import PlayerManager from "../../music/PlayerManager";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/GuildOnly";

@Discord()
class PlayingCommand {
    @Slash({ name: "playing", description: "觀看正在撥放中的歌曲資訊" })
    @Guard(GuildOnly)
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;
        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (interaction.guild && !PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");
        const musicPlayer = PlayerManager.get(interaction);
        const playing = musicPlayer.getNowPlayingMessageContent();
        if (!playing) return await interaction.reply("嗯? 我沒有在唱歌喔~");
        await interaction.reply(playing);
    }
}
