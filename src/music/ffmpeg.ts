import { spawn } from "child_process";
import { Readable } from "stream";

export function createOpusStream(url: string): Readable {
    const ffmpeg = spawn("ffmpeg", [
        "-i",
        url,
        "-f",
        "opus",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-loglevel",
        "warning",
        "-c:a",
        "copy",
        "pipe:1",
    ]);

    // Handle FFmpeg errors
    ffmpeg.stderr.on("data", (data) => {
        console.error(`Error occur while streaming with FFmpeg: ${data}`);
    });
    return ffmpeg.stdout;
}
