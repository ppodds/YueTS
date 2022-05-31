import { Donor } from "../../database/models/donor";
import { Message, TextChannel } from "discord.js";
import filetype from "file-type";
import { send } from "../../graphics/message";
import { ImageManager } from "../../image/ImageManager";
import { event } from "../../decorator/event/event";
const { fromBuffer } = filetype;

export class DonateEvent {
    @event("messageCreate", false)
    async execute(message: Message) {
        if (message.author.bot) return;

        const donor = await Donor.findOne({
            where: {
                guild: message.guildId ? message.guildId : "dm",
                channel: message.channelId,
                user: message.author.id,
            },
        });

        // user is not donating
        if (donor === null) return;

        message.channel.sendTyping();
        const imgurImage = await ImageManager.getImgurImage(message.content);
        if (message.attachments.size === 0 && !imgurImage) return;

        const imagesData: Buffer[] = [];

        if (message.attachments.size !== 0) {
            for (const attachmentPair of message.attachments) {
                const attachment = attachmentPair[1];
                imagesData.push(
                    await ImageManager.getAttachmentImage(attachment)
                );
            }
        } else if (imgurImage) imagesData.push(imgurImage);

        for (const imageData of imagesData) {
            const filetype = await fromBuffer(imageData);

            if (!ImageManager.isSupportType(filetype)) {
                await send(
                    message.channel as TextChannel,
                    "這不是我能使用的呢....",
                    20000
                );
                continue;
            }

            const imagePhash = await ImageManager.instance.makePhash(imageData);
            if (
                await ImageManager.instance.isInDatabase(donor.type, imagePhash)
            ) {
                await send(
                    message.channel as TextChannel,
                    "Yue已經有這個了....",
                    20000
                );
                continue;
            }

            await ImageManager.save(
                donor.type,
                message.author,
                filetype.ext,
                imageData,
                imagePhash
            );
            await donor.increment("amount", { by: 1 });
            await ImageManager.updateContribution(
                message.author.id,
                donor.type
            );
            await send(
                message.channel as TextChannel,
                "已收到! 請繼續上傳!",
                5000
            );
        }
        if (message.deletable) await message.delete();
    }
}
