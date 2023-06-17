import { Donor } from "../database/models/donor";
import { TextChannel } from "discord.js";
import filetype from "file-type";
import { send } from "../graphics/message";
import { ImageService } from "../image/image-service";
import { ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
const { fromBuffer } = filetype;

@Discord()
@injectable()
export class DonateEvent {
    constructor(private readonly _imageService: ImageService) {}

    @On({ event: "messageCreate" })
    async execute([message]: ArgsOf<"messageCreate">) {
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
        const imgurImage = await ImageService.getImgurImage(message.content);
        if (message.attachments.size === 0 && !imgurImage) return;

        const imagesData: Buffer[] = [];

        if (message.attachments.size !== 0) {
            for (const attachmentPair of message.attachments) {
                const attachment = attachmentPair[1];
                imagesData.push(
                    await ImageService.getAttachmentImage(attachment)
                );
            }
        } else if (imgurImage) imagesData.push(imgurImage);

        for (const imageData of imagesData) {
            const filetype = await fromBuffer(imageData);
            if (!filetype || !this._imageService.isSupportType(filetype)) {
                await send(
                    message.channel as TextChannel,
                    "這不是我能使用的呢....",
                    20000
                );
                continue;
            }

            const imagePhash = await this._imageService.makePhash(imageData);
            if (await this._imageService.isInDatabase(donor.type, imagePhash)) {
                await send(
                    message.channel as TextChannel,
                    "Yue已經有這個了....",
                    20000
                );
                continue;
            }

            await this._imageService.save(
                donor.type,
                message.author,
                filetype.ext,
                imageData,
                imagePhash
            );
            await donor.increment("amount", { by: 1 });
            await this._imageService.updateContribution(
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
