import { SlashCommandBuilder } from "@discordjs/builders";
import { ImageManager } from "../../../image/ImageManager";
import { Logger } from "../../../utils/Logger";
import { Grab } from "../../../database/models/grab";
import filetype from "file-type";
import { toDatetimeString } from "../../../utils/time";
import { CommandInteraction, Message, TextChannel, User } from "discord.js";
import { ImageType, toString } from "../../../image/ImageType";
import { ConfigManager } from "../../../config/ConfigManager";
import { command } from "../../../decorator/command/command";
const { fromBuffer } = filetype;

export class GrabCommand {
    private isMessageTooOld(message: Message, time: Date): boolean {
        if (message.createdAt < time) {
            Logger.instance.debug(`Message ${message.id} is too old`);
            return true;
        }
        return false;
    }

    private async updateGrabTime(
        grabData: Grab,
        grabTime: Date,
        guildID: string,
        channelID: string
    ) {
        Logger.instance.debug("Grab finished, updating grab time database");
        // update grab time
        if (grabData) {
            grabData.time = grabTime;
            await grabData.save();
        } else
            await Grab.create({
                guild: guildID,
                channel: channelID,
                time: grabTime,
            });
    }

    private async sendResult(
        range: number,
        grabData: Grab,
        messageCount: number,
        imageCount: number,
        interaction: CommandInteraction
    ) {
        const now = new Date();
        const resultMessage = `Yue從${toDatetimeString(
            new Date(
                range || grabData
                    ? range
                        ? now.setDate(now.getDate() - range)
                        : grabData.time
                    : now.setDate(now.getDate() - 10)
            )
        )}以來的 ${messageCount} 則訊息中擷取了 ${imageCount} 張圖片，再繼續學習下去很快就會變得厲害了呢....`;
        try {
            await interaction.editReply(resultMessage);
        } catch (error) {
            await interaction.channel.send(resultMessage);
        }
    }

    private async saveImagesData(
        type: ImageType,
        uploader: User,
        imagesData: Buffer[]
    ): Promise<number> {
        let imageCount = 0;
        for (const imageData of imagesData) {
            const filetype = await fromBuffer(imageData);

            if (!ImageManager.isSupportType(filetype)) continue;

            const imagePhash = await ImageManager.instance.makePhash(imageData);

            if (await ImageManager.instance.isInDatabase(type, imagePhash))
                continue;

            if (
                await ImageManager.save(
                    type,
                    uploader,
                    filetype.ext,
                    imageData,
                    imagePhash
                )
            )
                imageCount++;
        }
        return imageCount;
    }

    @command(
        new SlashCommandBuilder()
            .setName("grab")
            .setDescription("從指定頻道收集圖片進對應的資料庫")
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription("頻道")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("type")
                    .setDescription("圖片類型")
                    .setRequired(true)
            )
            .addIntegerOption((option) =>
                option.setName("range").setDescription("時機範圍")
            )
            .setDefaultPermission(false)
            .toJSON()
    )
    async execute(interaction: CommandInteraction) {
        if (interaction.user.id !== ConfigManager.instance.botConfig.author.id)
            return await interaction.reply("無此權限");

        const range = interaction.options.getInteger("range");
        const type =
            ImageType[interaction.options.getString("type").toUpperCase()];
        const channel = interaction.options.getChannel("channel");

        if (type === undefined)
            return await interaction.reply("這不是我能使用的呢....");

        const grabData = await Grab.findOne({
            where: {
                guild: interaction.guildId,
                channel: channel.id,
            },
        });

        await interaction.deferReply();

        const now = new Date();
        const grabTime = new Date();

        const time = new Date(
            range || grabData
                ? range
                    ? now.setDate(now.getDate() - range)
                    : grabData.time
                : now.setDate(now.getDate() - 10)
        );

        let done = false;
        let before: string = null;
        let messageCount = 0;
        let imageCount = 0;

        Logger.instance.debug(`Grabing ${toString(type)} from ${channel.name}`);
        while (!done) {
            Logger.instance.debug(
                `Fetching ${before ? "" : "latest "}messages ${
                    before ? "sent before message which id is " + before : ""
                }`
            );
            const messages = await (channel as TextChannel).messages.fetch({
                limit: 100,
                before: before,
            });
            Logger.instance.debug(`Fetched ${messages.size} messages`);

            for (const [id, message] of messages) {
                Logger.instance.debug(`Checking message ${id}`);
                before = id;
                if (this.isMessageTooOld(message, time)) {
                    done = true;
                    break;
                }
                messageCount++;
                if (message.author.bot) continue;
                const imgurImage = await ImageManager.getImgurImage(
                    message.content
                );
                if (message.attachments.size === 0 && !imgurImage) continue;
                const imagesData: Buffer[] = [];
                if (message.attachments.size !== 0) {
                    Logger.instance.debug(
                        `Saving attachments of message ${id}`
                    );
                    for (const attachmentPair of message.attachments) {
                        const attachment = attachmentPair[1];
                        imagesData.push(
                            await ImageManager.getAttachmentImage(attachment)
                        );
                    }
                } else if (imgurImage) {
                    Logger.instance.debug(
                        `Message ${id} is a link to imgur, saving image from imgur`
                    );
                    imagesData.push(imgurImage);
                }
                imageCount += await this.saveImagesData(
                    type,
                    message.author,
                    imagesData
                );
            }
            // no more message!
            if (messages.size !== 100) {
                done = true;
                Logger.instance.debug("No more message, stop grabbing");
            }
        }
        await this.sendResult(
            range,
            grabData,
            messageCount,
            imageCount,
            interaction
        );
        await this.updateGrabTime(
            grabData,
            grabTime,
            interaction.guildId,
            channel.id
        );
    }
}
