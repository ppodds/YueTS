import { MusicService } from "../../music/music-service";
import { Reaction } from "../../graphics/reaction";
import {
    ApplicationCommandOptionType,
    CommandInteraction,
    GuildMember,
} from "discord.js";
import { MusicPlayer } from "../../music/music-player";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { Track } from "../../music/track";
import { GuildOnly } from "../../guards/guild-only";
import { injectable } from "tsyringe";
import { LoggerService } from "../../utils/logger-service";
import { GraphicService } from "../../graphics/graphic-service";
import { extractInfoFromPlaylist, search } from "../../music/ytdlp";

@Discord()
@injectable()
class PlayCommand {
    constructor(
        private readonly _loggerService: LoggerService,
        private readonly _musicService: MusicService,
        private readonly _graphicService: GraphicService,
    ) {}

    @Slash({ name: "play", description: "讓Yue唱Youtube有的歌曲" })
    @Guard(GuildOnly)
    async execute(
        @SlashOption({
            name: "target",
            description: "youtube連結或搜尋關鍵字",
            required: true,
            type: ApplicationCommandOptionType.String,
        })
        target: string,
        interaction: CommandInteraction,
    ) {
        const user = interaction.member;

        if (!user) {
            await interaction.reply("似乎在私聊時不能做這些呢....");
            return;
        } else if (!(interaction.member as GuildMember).voice.channelId) {
            await interaction.reply("看起來你不在語音頻道裡呢...");
            return;
        }
        await interaction.deferReply();

        const musicPlayer = this._musicService.get(interaction);

        const youtubeUrlRegex =
            /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        const youtubePlaylistRegex =
            /^https:\/\/www\.youtube\.com\/playlist\?list=([A-Za-z0-9-_]+)$/;

        // create resource
        if (target.match(youtubeUrlRegex) !== null) {
            await this.createResourceFromUrl(
                interaction,
                musicPlayer,
                user as GuildMember,
                target,
            );
        } else if (target.match(youtubePlaylistRegex) !== null) {
            const playlist = await extractInfoFromPlaylist(target);
            const tasks: Promise<Track>[] = [];
            for (const item of playlist.items)
                tasks.push(
                    musicPlayer.createResource(
                        item.webpageUrl,
                        user as GuildMember,
                    ),
                );
            const resources = await Promise.all(tasks);
            this._loggerService.debug("Resources created");
            await interaction.editReply(
                `\`\`\`[已增加 ${playlist.title} 的所有歌曲到撥放序列中]\`\`\``,
            );
            musicPlayer.addList(resources);
        } else {
            // use key word search
            const searchResult = await search(target);
            if (searchResult.length === 0) {
                await interaction.editReply("我找不到有這個關鍵字的歌曲呢...");
                return;
            }
            let description = "「我找到了這些結果，在下面選一個吧!」(時限60秒)";
            for (let i = 0; i < searchResult.length; i++) {
                const item = searchResult[i];
                description += `
${i + 1}. ${Reaction.item} [${item.title}](${item.webpageUrl}) (${item.durationString})`;
            }

            const embed = this._graphicService.info(
                interaction.client,
                description,
            );
            await this._graphicService.selectMenuEmbed(
                interaction,
                embed,
                searchResult.length,
                async (option: number) =>
                    await this.createResourceFromUrl(
                        interaction,
                        musicPlayer,
                        user as GuildMember,
                        searchResult[option].webpageUrl,
                    ),
            );
        }
    }

    async createResourceFromUrl(
        interaction: CommandInteraction,
        musicPlayer: MusicPlayer,
        requester: GuildMember,
        url: string,
    ): Promise<void> {
        this._loggerService.debug(`Creating resource from ${url}`);
        const resource = await musicPlayer.createResource(url, requester);
        if (resource) {
            this._loggerService.debug("Resource created");
            await interaction.editReply(
                `\`\`\`[已增加 ${resource.metadata.videoInfo.title} 到撥放序列中]\`\`\``,
            );
            musicPlayer.add(resource);
        }
    }
}
