import { CommandInteraction, GuildMember } from "discord.js";
import playerManager from "../../music/PlayerManager";
import { Discord, Slash } from "discordx";

@Discord()
class JoinCommand {
    @Slash({ name: "join", description: "讓Yue加入你所在的頻道" })
    async execute(interaction: CommandInteraction) {
        const user = interaction.member as GuildMember;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!user.voice.channelId)
            return await interaction.reply("看起來你不在語音頻道裡呢...");
        else if (!playerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = playerManager.get(interaction);
        musicPlayer.changeChannel(user.voice.channel);
        await interaction.reply("我來了哦~");
    }
}
