import { SlashCommandBuilder } from "@discordjs/builders";
import PlayerManager from "../../../music/PlayerManager";
import { CommandInterface } from "../../CommandInterface";

const command: CommandInterface = {
    data: new SlashCommandBuilder()
        .setName("playing")
        .setDescription("觀看正在撥放中的歌曲資訊"),
    async execute(interaction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        await interaction.reply(musicPlayer.getNowPlayingMessageContent());
    },
};

export default command;
