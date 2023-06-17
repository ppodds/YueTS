import { CommandInteraction } from "discord.js";
import { MusicService } from "../../music/music-service";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/guild-only";
import { injectable } from "tsyringe";

@Discord()
@injectable()
class PlayingCommand {
    constructor(private readonly _musicService: MusicService) {}

    @Slash({ name: "playing", description: "觀看正在撥放中的歌曲資訊" })
    @Guard(GuildOnly)
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;
        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (
            interaction.guild &&
            !this._musicService.exist(interaction.guild)
        )
            return await interaction.reply("嗯? 我沒有在唱歌喔~");
        const musicPlayer = this._musicService.get(interaction);
        const playing = musicPlayer.getNowPlayingMessageContent();
        if (!playing) return await interaction.reply("嗯? 我沒有在唱歌喔~");
        await interaction.reply(playing);
    }
}
