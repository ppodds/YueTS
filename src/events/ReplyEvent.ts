import { Reply } from "../database/models/reply";
import { Logger } from "../utils/Logger";
import { Collection, Message, TextChannel } from "discord.js";
import { ConfigManager } from "../config/ConfigManager";
import { ArgsOf, Discord, On } from "discordx";

const cooldown = new Collection();

/**
 * Send reply to user (it would check cooldown and auto reset)
 * @param message Message object from event
 * @param response reply's response
 */
async function sendReply(message: Message, reply: Reply) {
    if (
        cooldown.get(message.guild.id) === undefined ||
        cooldown.get(message.guild.id)
    ) {
        cooldown.set(message.guild.id, false);
        // 30s cooldown
        setTimeout(() => cooldown.set(message.guild.id, true), 30000);
        await message.channel.sendTyping();
        await message.channel.send(reply.response);
    } else if (
        message.author.id === ConfigManager.instance.botConfig.author.id
    ) {
        await message.channel.sendTyping();
        await message.channel.send(reply.response);
    }
}

@Discord()
class ReplyEvent {
    @On({ event: "messageCreate" })
    async execute([message]: ArgsOf<"messageCreate">) {
        if (message.author.bot) return;
        // TODO formatted message response
        if (message.guild !== null) {
            const [reply, globalReply] = await Promise.all([
                Reply.getResponse(
                    message.content,
                    message.guildId,
                    false,
                    false
                ),
                Reply.getResponse(
                    message.content,
                    message.author.id,
                    true,
                    false
                ),
            ]);

            Logger.instance.info(
                `${message.guild.name}-${
                    (message.channel as TextChannel).name
                }-${message.author.username}: ${message.content}`
            );

            // 對話反應內容
            if (globalReply !== null) await sendReply(message, globalReply);
            else if (reply !== null) await sendReply(message, reply);

            // TODO 增加rpg經驗值
        } else {
            // in dm channel
            const [globalReply] = await Promise.all([
                Reply.getResponse(
                    message.content,
                    message.author.id,
                    true,
                    false
                ),
                // Reply.getResponse(message.content, message.guildId, true, true)
            ]);
            // 對話反應內容
            if (globalReply !== null) {
                await message.channel.sendTyping();
                await message.channel.send(globalReply.response);
            }
        }
    }
}
