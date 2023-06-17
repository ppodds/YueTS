import { GuildMember } from "discord.js";
import { YouTubeVideo } from "play-dl";

export interface Metadata {
    videoInfo: YouTubeVideo;
    requester: GuildMember;
}
