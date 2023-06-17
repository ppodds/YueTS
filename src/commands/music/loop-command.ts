import { CommandInteraction } from "discord.js";
import { MusicService } from "../../music/music-service";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/guild-only";
import { injectable } from "tsyringe";

@Discord()
@injectable()
class LoopCommand {
    constructor(private readonly _musicService: MusicService) {}

    @Slash({ name: "loop", description: "開關歌曲循環撥放" })
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
        musicPlayer.switchLooping();
        await interaction.reply(
            `${musicPlayer.isLooping() ? "開啟" : "關閉"}歌曲循環撥放`
        );
    }
}
