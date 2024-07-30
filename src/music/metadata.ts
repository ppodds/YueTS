import { GuildMember } from "discord.js";
import { VideoInfo } from "./video-info";

export interface Metadata {
    videoInfo: VideoInfo;
    requester: GuildMember;
}
