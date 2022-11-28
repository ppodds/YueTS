import { CommandInteraction } from "discord.js";
import PlayerManager from "../../music/PlayerManager";
import { Discord, Slash } from "discordx";

@Discord()
class LoopCommand {
    @Slash({ name: "loop", description: "開關歌曲循環撥放" })
    async execute(interaction: CommandInteraction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        musicPlayer.switchLooping();
        await interaction.reply(
            `${musicPlayer.isLooping() ? "開啟" : "關閉"}歌曲循環撥放`
        );
    }
}
