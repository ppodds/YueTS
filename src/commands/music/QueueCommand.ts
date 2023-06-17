import { CommandInteraction, EmbedBuilder } from "discord.js";
import { MusicService } from "../../music/music-service";
import { Track } from "../../music/track";
import { Discord, Guard, Slash } from "discordx";
import { GuildOnly } from "../../guards/GuildOnly";
import { injectable } from "tsyringe";
import { GraphicService } from "../../graphics/graphic-service";

@Discord()
@injectable()
class QueueCommand {
    constructor(
        private readonly _musicService: MusicService,
        private readonly _graphicService: GraphicService
    ) {}

    @Slash({ name: "queue", description: "觀看接下來歌曲的順序" })
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
        const queue = musicPlayer.getQueue();

        // don't need paginationEmbed
        if (queue.length <= 22) {
            const embed = this.generateEmbed(interaction, queue);
            for (const i in queue) {
                embed.addFields({
                    name: (parseInt(i) + 1).toString(),
                    value: queue[i].metadata.videoInfo.title ?? "無標題",
                });
            }
            await interaction.reply({ embeds: [embed] });
        } else {
            // generate pages
            let i = 0;
            const pagesData = [] as Track[][];
            while (i < queue.length) {
                pagesData.push(queue.slice(i, (i += 22)));
            }

            const pages: EmbedBuilder[] = [];
            let count = 0;
            pagesData.forEach((pageData) => {
                const embed = this.generateEmbed(interaction, queue);

                for (const track of pageData) {
                    embed.addFields({
                        name: (count += 1).toString(),
                        value: track.metadata.videoInfo.title ?? "無標題",
                    });
                }

                pages.push(embed);
            });

            await this._graphicService.paginationEmbed(interaction, pages);
        }
    }

    generateEmbed(interaction: CommandInteraction, queue: Track[]) {
        const embed = this._graphicService.info(
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
}
