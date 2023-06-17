import { MusicService } from "../../music/music-service";
import { AudioPlayerStatus } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/guild-only";
import { injectable } from "tsyringe";

@Discord()
@injectable()
class ResumeCommand {
    constructor(private readonly _musicService: MusicService) {}

    @Slash({ name: "resume", description: "讓Yue繼續唱歌" })
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
        if (musicPlayer.getPlayerStatus() !== AudioPlayerStatus.Paused)
            return await interaction.reply(
                "我現在已經在唱歌了啦 <:i_yoshino:583658336054935562>"
            );

        musicPlayer.resume();
        await interaction.reply("那我就繼續唱哦....");
    }
}
