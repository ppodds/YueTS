import axios from "axios";
import { Message } from "discord.js";
import { nhentaiBookPreviewEmbed } from "../../graphics/embeds";
import { event } from "../../decorator/event/event";
import { GalleryResponse, Host } from "@ppodds/nhentai-api";

export class EhentaiEvent {
    @event("messageCreate", false)
    async execute(message: Message) {
        if (message.author.bot) return;
        const result = message.content.match(
            /https:\/\/nhentai\.net\/g\/([0-9]+)\//
        );
        if (result) {
            await message.channel.sendTyping();

            const resp = await axios.get(
                `https://${Host.API}/api/gallery/${result[1]}`
            );

            const data = resp.data as GalleryResponse;

            const embed = nhentaiBookPreviewEmbed(message.client, data);

            await message.channel.send({ embeds: [embed] });
        }
    }
}
