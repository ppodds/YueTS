import { execFile } from "child_process";
import { promisify } from "util";
import { VideoInfo } from "./video-info";
import { PlaylistInfo } from "./playlist-info";

interface YTDLPVideoInfo {
    title: string;
    webpage_url: string;
    url: string;
    duration_string: string;
}

interface YTDLPPlaylistInfo extends YTDLPVideoInfo {
    playlist_title: string;
}

function toVideoInfo(ytdlpVideoInfo: YTDLPVideoInfo): VideoInfo {
    return {
        title: ytdlpVideoInfo.title,
        webpageUrl: ytdlpVideoInfo.webpage_url,
        audioUrl: ytdlpVideoInfo.url,
        durationString: ytdlpVideoInfo.duration_string,
    };
}

export async function extractInfo(url: string): Promise<VideoInfo> {
    const { stdout } = await promisify(execFile)("yt-dlp", [
        // https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#usage-and-options
        // run quiet
        "-q",
        "--no-warnings",
        // print JSON information
        "--print",
        "{title,url,webpage_url,duration_string}",
        // select format
        "-f",
        "bestaudio/best",
        url,
    ]);
    return toVideoInfo(JSON.parse(stdout));
}

export async function extractInfoFromPlaylist(
    url: string,
): Promise<PlaylistInfo> {
    const { stdout } = await promisify(execFile)("yt-dlp", [
        // https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#usage-and-options
        // run quiet
        "-q",
        "--no-warnings",
        // print JSON information
        "--print",
        "{title,url,webpage_url,duration_string,playlist_title}",
        // select format
        "-f",
        "bestaudio/best",
        url,
    ]);
    const parsed = stdout.split("\n");
    // there is always a line ending at the end
    parsed.pop();
    return {
        title:
            parsed.length !== 0
                ? (JSON.parse(parsed[0]) as YTDLPPlaylistInfo).title
                : "未知播放清單",
        items: parsed.map((json) => toVideoInfo(JSON.parse(json))),
    };
}

export async function search(
    keyword: string,
    options?: { limit?: number },
): Promise<VideoInfo[]> {
    if (options?.limit !== undefined && options.limit <= 0) {
        throw new Error("The result amount limit should larger than 0");
    }
    const { stdout } = await promisify(execFile)("yt-dlp", [
        // https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#usage-and-options
        // run quiet
        "-q",
        "--no-warnings",
        // print JSON information
        "--print",
        "{title,url,webpage_url,duration_string}",
        // select format
        "-f",
        "bestaudio/best",
        `ytsearch${options?.limit ?? 5}:${keyword}`,
    ]);
    const parsed = stdout.split("\n");
    // there is always a line ending at the end
    parsed.pop();
    return parsed.map((json) => toVideoInfo(JSON.parse(json)));
}
