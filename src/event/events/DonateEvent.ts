import { Donor } from "../../core/database/models/donor";
import { Logger } from "../../core/utils/Logger";
import { Message, TextChannel } from "discord.js";
import axios from "axios";
import filetype from "file-type";
import { Image } from "../../core/database/models/image";
import { send } from "../../core/graphics/message";
import { ImageManager } from "../../core/image/ImageManager";
import { User } from "../../core/database/models/user";
import { event } from "../../decorator/event/event";
const { fromBuffer } = filetype;

/**
 * Save image to database. It will send hint message to user.
 * @param message Message object of event.
 * @param imageData Binary image data.
 * @param donor Database Donor object.
 */
async function saveAndSendMessage(
    message: Message,
    imageData: Buffer,
    donor: Donor
) {
    // get image ext and mime
    const filetype = await fromBuffer(imageData);
    if (filetype.mime.startsWith("image/")) {
        const imagePhash = await ImageManager.instance.makePhash(imageData);
        const inDatabase = await ImageManager.instance.inDatabase(
            donor.type,
            imagePhash
        );
        if (inDatabase)
            // the picture is already in the database
            return await send(
                message.channel as TextChannel,
                "Yue已經有這個了....",
                20000
            );
        const image = await Image.add(
            donor.type,
            message.author.id,
            filetype.ext,
            imageData,
            imagePhash
        );
        await donor.increment("amount", { by: 1 });
        // update contribution
        const user = await User.get(message.author.id);
        await user.increment("contribution", {
            by: Donor.contributionRatio(donor.type),
        });

        await send(message.channel as TextChannel, "已收到! 請繼續上傳!", 5000);
        Logger.instance.info(
            `${message.author.username} uploaded ${image.id}.${image.ext} type: ${image.type}`
        );
        ImageManager.instance.addPhash(donor.type, image.id, imagePhash);
        if (!message.deleted && message.deletable) await message.delete();
    } else {
        await send(
            message.channel as TextChannel,
            "這不是我能使用的呢....",
            20000
        );
    }
}

export class DonateEvent {
    @event("messageCreate", false)
    async execute(message: Message) {
        if (message.author.bot) return;

        // imgur match
        const imgurResult = message.content.match(
            /https:\/\/imgur\.com\/([0-9a-zA-Z]+)/
        );

        if (message.attachments.size === 0 && !imgurResult) return;

        const donor = await Donor.findOne({
            where: {
                guild: message.guildId ? message.guildId : "dm",
                channel: message.channelId,
                user: message.author.id,
            },
        });

        // user is not donating
        if (donor === null) return;

        if (message.attachments.size !== 0) {
            for (const attachmentPair of message.attachments) {
                await message.channel.sendTyping();
                const attachment = attachmentPair[1];

                // get image binarydata
                const resp = await axios.get(attachment.url, {
                    responseType: "arraybuffer",
                });

                await saveAndSendMessage(message, resp.data, donor);
            }
        } else if (imgurResult) {
            await message.channel.sendTyping();

            // get imgur website
            const resp = await axios.get(imgurResult[0], {
                responseType: "document",
            });

            const re = new RegExp(
                "https://i.imgur.com/" + imgurResult[1] + ".([0-9a-z]+)"
            );
            const imageResult = resp.data.match(re);

            // get image
            const imageResp = await axios.get(imageResult[0], {
                responseType: "arraybuffer",
            });
            await saveAndSendMessage(message, imageResp.data, donor);
        }
    }
}
