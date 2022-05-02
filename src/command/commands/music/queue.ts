import { SlashCommandBuilder } from "@discordjs/builders";
import {
    paginationEmbed,
    info,
    paginationButton,
} from "../../../core/graphics/embeds";
import PlayerManager from "../../../core/music/PlayerManager";
import { Track } from "../../../core/music/Track";
import { Command } from "../../Command";

export = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("觀看接下來歌曲的順序")
        .toJSON(),
    async execute(interaction) {
        const user = interaction.member;

        if (!user)
            return await interaction.reply("似乎在私聊時不能做這些呢....");
        else if (!PlayerManager.exist(interaction.guild))
            return await interaction.reply("嗯? 我沒有在唱歌喔~");

        const musicPlayer = PlayerManager.get(interaction);
        const queue = musicPlayer.getQueue();

        function generateEmbed() {
            const embed = info(
                interaction.client,
                "「目前已經有這麼多人和Yue點歌了呢... Yue有點小高興...」"
            );

            embed.addFields(
                {
                    name: "撥放佇列狀態",
                    value: `目前撥放佇列中有 ${queue.length} 首歌曲`,
                    inline: false,
                },
                {
                    name: "格式範例",
                    value: "「待會Yue就用這種方式照著念喔~」",
                    inline: false,
                },
                {
                    name: "順序",
                    value: "歌曲名稱",
                    inline: false,
                }
            );
            return embed;
        }

        // don't need paginationEmbed
        if (queue.length <= 22) {
            const embed = generateEmbed();
            for (const i in queue) {
                embed.addField(
                    (parseInt(i) + 1).toString(),
                    queue[i].metadata.videoInfo.title
                );
            }
            await interaction.reply({ embeds: [embed] });
        } else {
            // generate pages
            let i = 0;
            const pagesData = [] as Track[][];
            while (i < queue.length) {
                pagesData.push(queue.slice(i, (i += 22)));
            }

            const pages = [];
            let count = 0;
            pagesData.forEach((pageData) => {
                const embed = generateEmbed();

                for (const track of pageData) {
                    embed.addField(
                        (count += 1).toString(),
                        track.metadata.videoInfo.title
                    );
                }

                pages.push(embed);
            });

            await paginationEmbed(interaction, pages, paginationButton());
        }
    },
} as Command;
