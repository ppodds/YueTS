import { GuildMember } from "discord.js";
import { VideoInfo } from "./video-info.js";

export interface Metadata {
    videoInfo: VideoInfo;
    requester: GuildMember;
}
