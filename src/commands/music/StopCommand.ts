import { CommandInteraction } from "discord.js";
import { MusicService } from "../../music/music-service";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/GuildOnly";
import { injectable } from "tsyringe";

@Discord()
@injectable()
class StopCommand {
    constructor(private readonly _musicService: MusicService) {}

    @Slash({ name: "stop", description: "讓Yue離開 並清空預計要唱的歌曲" })
    @Guard(GuildOnly)
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;
        if (!interaction.guild) return;
        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!this._musicService.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");
        this._musicService.cleanup(interaction.guild);
        await interaction.reply("表演結束! 下次也請多多支持!");
    }
}
