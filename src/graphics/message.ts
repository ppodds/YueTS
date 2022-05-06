import { TextChannel } from "discord.js";

/**
 * Send a message to text channel and delete it after delay
 * @param channel the channel where you want to send message
 * @param content message content
 * @param deleteAfter delete delay (ms)
 */
export async function send(
    channel: TextChannel,
    content: string,
    deleteAfter: number
) {
    if (deleteAfter < 0) throw new Error("only accept number > 0");
    else if (deleteAfter === 0) return;
    const message = await channel.send(content);
    setTimeout(async () => await message.delete(), deleteAfter);
}
