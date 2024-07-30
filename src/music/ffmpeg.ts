import { spawn } from "child_process";
import { Readable } from "stream";
import { ReadableStreamBuffer } from "stream-buffers";

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
        // reconnect options
        "-reconnect",
        "1",
        "-reconnect_streamed",
        "1",
        "-reconnect_delay_max",
        "5",
        "pipe:1",
    ]);

    // Handle FFmpeg errors
    ffmpeg.stderr.on("data", (data) => {
        console.error(`Error occur while streaming with FFmpeg: ${data}`);
    });
    return ffmpeg.stdout;
}

// There is a TLS session issue which cause stop playing when streaming with ffmpeg
// So this function download it and store it in memory instread
export function createOpusStreamByDownload(url: string): Readable {
    const stream = new ReadableStreamBuffer();
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
    ffmpeg.stdout.on("data", (data) => {
        stream.put(data);
    });
    // Handle FFmpeg errors
    ffmpeg.stderr.on("data", (data) => {
        console.error(`Error occur while streaming with FFmpeg: ${data}`);
    });
    return stream;
}
