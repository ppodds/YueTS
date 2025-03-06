import { ConfigService } from "../config/config-service";
import { Reply } from "../database/models/reply";
import { LoggerService } from "../utils/logger-service";
import { Collection, Guild, Message, TextChannel } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";

@Discord()
@injectable()
export class ReplyEvent {
    private readonly _cooldown = new Collection<string, boolean>();

    constructor(
        private readonly _loggerService: LoggerService,
        private readonly _configService: ConfigService,
    ) {}

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
                    false,
                ),
                Reply.getResponse(
                    message.content,
                    message.author.id,
                    true,
                    false,
                ),
            ]);

            this._loggerService.info(
                `${message.guild.name}-${
                    (message.channel as TextChannel).name
                }-${message.author.username}: ${message.content}`,
            );

            // 對話反應內容
            if (globalReply !== null)
                await this.sendReply(message, globalReply);
            else if (reply !== null) await this.sendReply(message, reply);

            // TODO 增加rpg經驗值
        } else {
            // in dm channel
            const [globalReply] = await Promise.all([
                Reply.getResponse(
                    message.content,
                    message.author.id,
                    true,
                    false,
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

    /**
     * Send reply to user (it would check cooldown and auto reset)
     * @param message Message object from event
     * @param response reply's response
     */
    async sendReply(message: Message, reply: Reply) {
        if (!message.guild)
            return await message.reply("似乎在私聊時不能做這些呢....");
        if (
            this._cooldown.get(message.guild.id) === undefined ||
            this._cooldown.get(message.guild.id)
        ) {
            this._cooldown.set(message.guild.id, false);
            // 30s cooldown
            setTimeout(
                () => this._cooldown.set((message.guild as Guild).id, true),
                30000,
            );
            if (message.channel.isSendable()) {
                await message.channel.sendTyping();
                await message.channel.send(reply.response);
            }
        } else if (
            message.author.id === this._configService.config.bot.author.id
        ) {
            if (message.channel.isSendable()) {
                await message.channel.sendTyping();
                await message.channel.send(reply.response);
            }
        }
    }
}
