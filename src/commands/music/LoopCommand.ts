import { CommandInteraction } from "discord.js";
import PlayerManager from "../../music/PlayerManager";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/GuildOnly";

@Discord()
class LoopCommand {
    @Slash({ name: "loop", description: "開關歌曲循環撥放" })
    @Guard(GuildOnly)
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (interaction.guild && !PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        musicPlayer.switchLooping();
        await interaction.reply(
            `${musicPlayer.isLooping() ? "開啟" : "關閉"}歌曲循環撥放`
        );
    }
}
