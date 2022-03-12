import { SlashCommandBuilder } from "@discordjs/builders";
import imageManager from "../../../image/ImageManager.js";
import axios from "axios";
import { Logger } from "../../../utils/Logger.js";
import { Image } from "../../../database/models/image.js";
import { ownerOnly, setPermission } from "../../../utils/permission.js";
import { Grab } from "../../../database/models/grab.js";
import { fileTypeFromBuffer } from "file-type";
import { User } from "../../../database/models/user.js";
import { Donor } from "../../../database/models/donor.js";
import { toDatetimeString } from "../../../utils/time.js";
import { Message, TextChannel } from "discord.js";
import { ImageType, toString } from "../../../image/ImageType.js";
import { CommandInterface } from "../../CommandInterface.js";

/**
 * Save image to database.
 * @param message Message object of event.
 * @param type grab type
 * @param imageData Binary image data.
 * @returns save success or not.
 */
async function save(
    message: Message,
    type: ImageType,
    imageData: Buffer
): Promise<boolean> {
    // get image ext and mime
    const filetype = await fileTypeFromBuffer(imageData);
    if (filetype.mime.startsWith("image/")) {
        const imagePhash = await imageManager.makePhash(imageData);
        const inDatabase = await imageManager.inDatabase(type, imagePhash);
        if (inDatabase) return false;

        const image = await Image.add(
            type,
            message.author.id,
            filetype.ext,
            imageData,
            imagePhash
        );
        // update contribution
        const user = await User.get(message.author.id);

        await user.increment("contribution", {
            by: Donor.contributionRatio(type),
        });
        Logger.info(
            `Collect ${image.id}.${image.ext} to ${toString(
                type
            )} database. author: ${message.author.username}`
        );
        imageManager.addPhash(type, image.id, imagePhash);
        return true;
    }
}

const command: CommandInterface = {
    data: new SlashCommandBuilder()
        .setName("grab")
        .setDescription("從指定頻道收集圖片進對應的資料庫")
        .addChannelOption((option) =>
            option.setName("channel").setDescription("頻道").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("type").setDescription("圖片類型").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("range").setDescription("時機範圍")
        )
        .setDefaultPermission(false),
    async init(client, name) {
        // This command is owner only
        const permissions = await ownerOnly(client);
        await setPermission(client, name, permissions);
    },
    async execute(interaction) {
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

        let now = new Date();
        const grabTime = new Date();

        const time = new Date(
            range || grabData
                ? range
                    ? now.setDate(now.getDate() - range)
                    : grabData.time
                : now.setDate(now.getDate() - 10)
        );

        let done = false;
        let before = null;
        let messageCount = 0;
        let imageCount = 0;
        while (!done) {
            const messages = await (channel as TextChannel).messages.fetch({
                limit: 100,
                before: before,
            });

            for (const [id, message] of messages) {
                before = id;
                if (message.createdAt < time) {
                    done = true;
                    break;
                }
                messageCount++;
                if (message.author.bot) continue;

                // imgur match
                const imgurResult = message.content.match(
                    /https:\/\/imgur\.com\/([0-9a-zA-Z]+)/
                );

                if (message.attachments.size === 0 && !imgurResult) continue;
                // save image
                if (message.attachments.size !== 0) {
                    for (const attachmentPair of message.attachments) {
                        const attachment = attachmentPair[1];

                        // get image binarydata
                        const resp = await axios.get(attachment.url, {
                            responseType: "arraybuffer",
                        });

                        if (await save(message, type, resp.data)) imageCount++;
                    }
                } else if (imgurResult) {
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
                    if (await save(message, type, imageResp.data)) imageCount++;
                }
            }

            // no more message!
            if (messages.size !== 100) done = true;
        }
        now = new Date();
        try {
            await interaction.editReply(
                `Yue從${toDatetimeString(
                    new Date(
                        range || grabData
                            ? range
                                ? now.setDate(now.getDate() - range)
                                : grabData.time
                            : now.setDate(now.getDate() - 10)
                    )
                )}以來的 ${messageCount} 則訊息中擷取了 ${imageCount} 張圖片，再繼續學習下去很快就會變得厲害了呢....`
            );
        } catch (error) {
            await interaction.channel.send(
                `Yue從${toDatetimeString(
                    new Date(
                        range || grabData
                            ? range
                                ? now.setDate(now.getDate() - range)
                                : grabData.time
                            : now.setDate(now.getDate() - 10)
                    )
                )}以來的 ${messageCount} 則訊息中擷取了 ${imageCount} 張圖片，再繼續學習下去很快就會變得厲害了呢....`
            );
        }
        // update grab time
        if (grabData) {
            grabData.time = grabTime;
            await grabData.save();
        } else
            await Grab.create({
                guild: interaction.guildId,
                channel: channel.id,
                time: grabTime,
            });
    },
};

export default command;
