import { SlashCommandBuilder } from "@discordjs/builders";
import { ImageManager } from "../../../image/ImageManager";
import axios from "axios";
import { Logger } from "../../../utils/Logger";
import { Image } from "../../../database/models/image";
import { Grab } from "../../../database/models/grab";
import filetype from "file-type";
import { User } from "../../../database/models/user";
import { Donor } from "../../../database/models/donor";
import { toDatetimeString } from "../../../utils/time";
import { CommandInteraction, Message, TextChannel } from "discord.js";
import { ImageType, toString } from "../../../image/ImageType";
import { ConfigManager } from "../../../config/ConfigManager";
import { command } from "../../../decorator/command/command";
const { fromBuffer } = filetype;

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
    Logger.instance.debug("checking if image is valid");
    // get image ext and mime

    const filetype = await fromBuffer(imageData);
    if (filetype.mime.startsWith("image/")) {
        Logger.instance.debug("Making phash of the image");
        const imagePhash = await ImageManager.instance.makePhash(imageData);
        Logger.instance.debug("Checking if image is already in database");
        const inDatabase = await ImageManager.instance.inDatabase(
            type,
            imagePhash
        );
        if (inDatabase) {
            Logger.instance.debug("Image is already in database, skipped");
            return false;
        }
        Logger.instance.debug("Saving image to database");
        const image = await Image.add(
            type,
            message.author.id,
            filetype.ext,
            imageData,
            imagePhash
        );
        Logger.instance.debug("Updating user's contribution");
        // update contribution
        const user = await User.get(message.author.id);

        await user.increment("contribution", {
            by: Donor.contributionRatio(type),
        });
        Logger.instance.info(
            `Collect ${image.id}.${image.ext} to ${toString(
                type
            )} database. author: ${message.author.username}`
        );
        ImageManager.instance.addPhash(type, image.id, imagePhash);
        return true;
    }
    Logger.instance.debug(`Image is not valid, skipped (${filetype.mime})`);
    return false;
}

export class GrabCommand {
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
                if (message.createdAt < time) {
                    Logger.instance.debug(
                        `Message ${id} is too old, stop grabbing`
                    );
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
                    Logger.instance.debug(
                        `Saving attachments of message ${id}`
                    );
                    for (const attachmentPair of message.attachments) {
                        const attachment = attachmentPair[1];

                        // get image binarydata
                        const resp = await axios.get(attachment.url, {
                            responseType: "arraybuffer",
                        });

                        if (await save(message, type, resp.data)) imageCount++;
                    }
                } else if (imgurResult) {
                    Logger.instance.debug(
                        `Message ${id} is a link to imgur, saving image from imgur`
                    );
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
            if (messages.size !== 100) {
                done = true;
                Logger.instance.debug("No more message, stop grabbing");
            }
        }
        now = new Date();
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
        Logger.instance.debug("Grab finished, updating grab time database");
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
    }
}