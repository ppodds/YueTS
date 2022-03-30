import { SlashCommandBuilder } from "@discordjs/builders";
import PlayerManager from "../../../music/PlayerManager.js";
import ytpl from "ytpl";
import ytsr from "ytsr";
import { info, selectMenuEmbed } from "../../../graphics/embeds.js";
import { Reaction } from "../../../graphics/Reaction.js";
import { CommandInterface } from "../../CommandInterface.js";
import { GuildMember } from "discord.js";
import { Logger } from "../../../utils/Logger.js";

const command: CommandInterface = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("讓Yue唱Youtube有的歌曲")
        .addStringOption((option) =>
            option
                .setName("target")
                .setDescription("youtube連結或搜尋關鍵字")
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.member;
        const target = interaction.options.getString("target");

        if (!user) {
            await interaction.reply("似乎在私聊時不能做這些呢....");
            return;
        } else if (!(interaction.member as GuildMember).voice.channelId) {
            await interaction.reply("看起來你不在語音頻道裡呢...");
            return;
        }
        await interaction.deferReply();

        const musicPlayer = PlayerManager.get(interaction);

        const regex =
            /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        if (target.match(regex) ? true : false) {
            Logger.debug(`Creating resource from ${target}`);
            const resource = await musicPlayer.createResource(
                target,
                user as GuildMember
            );
            Logger.debug("Resource created");
            musicPlayer.add(resource);
            await interaction.editReply(
                `\`\`\`[已增加 ${resource.metadata.videoInfo.title} 到撥放序列中]\`\`\``
            );
        } else {
            try {
                // playlist
                const playlist = await ytpl(target, { limit: Infinity });
                const tasks = [];
                for (const item of playlist.items)
                    tasks.push(
                        musicPlayer.createResource(
                            item.shortUrl,
                            user as GuildMember
                        )
                    );
                const resources = await Promise.all(tasks);
                musicPlayer.addList(resources);
                await interaction.editReply(
                    `\`\`\`[已增加 ${playlist.title} 的所有歌曲到撥放序列中]\`\`\``
                );
            } catch (err) {
                // use key word search
                const searchResult = await ytsr(target, { limit: 5 });
                if (searchResult.items.length === 0) {
                    await interaction.editReply(
                        "我找不到有這個關鍵字的歌曲呢..."
                    );
                    return;
                }
                let description =
                    "「我找到了這些結果，在下面選一個吧!」(時限60秒)";
                for (let i = 0; i < searchResult.items.length; i++) {
                    description += `
${i + 1}. ${Reaction.item} [${(searchResult.items[i] as any).title}](${
                        (searchResult.items[i] as any).url
                    }) `;
                    if ((searchResult.items[i] as any).duration)
                        description += `(${
                            (searchResult.items[i] as any).duration
                        })`;
                    else if ((searchResult.items[i] as any).length)
                        description += `數量: ${
                            (searchResult.items[i] as any).length
                        }`;
                }

                const embed = info(interaction.client, description);
                await selectMenuEmbed(
                    interaction,
                    embed,
                    searchResult.items.length,
                    async (option: number) => {
                        Logger.debug(
                            `Creating resource from ${
                                (searchResult.items[option] as any).url
                            }`
                        );
                        const resource = await musicPlayer.createResource(
                            (searchResult.items[option] as any).url,
                            user as GuildMember
                        );
                        Logger.debug("Resource created");
                        musicPlayer.add(resource);
                        await interaction.followUp(
                            `\`\`\`[已增加 ${
                                (searchResult.items[option] as any).title
                            } 到撥放序列中]\`\`\``
                        );
                    }
                );
            }
        }
    },
};

export default command;
