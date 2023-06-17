import axios from "axios";
import { GalleryResponse, Host } from "@ppodds/nhentai-api";
import { ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { GraphicService } from "../graphics/graphic-service";

@Discord()
@injectable()
export class NhentaiEvent {
    constructor(private readonly _graphicService: GraphicService) {}

    @On({ event: "messageCreate" })
    async execute([message]: ArgsOf<"messageCreate">) {
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

            const embed = this._graphicService.nhentaiBookPreviewEmbed(
                message.client,
                data
            );

            await message.channel.send({ embeds: [embed] });
        }
    }
}
