import { Image } from "../../database/models/image";
import { User } from "../../database/models/user";
import { LoggerService } from "../../utils/logger-service";
import {
    ApplicationCommandOptionType,
    AttachmentBuilder,
    CommandInteraction,
    CommandInteractionOptionResolver,
    DMChannel,
    TextChannel,
} from "discord.js";
import { toDatetimeString } from "../../utils/time";
import { ImageType } from "../../image/image-type";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { GraphicService } from "../../graphics/graphic-service";

const MinimumDemand = new Map<ImageType, number>([
    [ImageType.PIC, 20],
    [ImageType.HPIC, 30],
    [ImageType.WTFPIC, 0],
]);

@Discord()
@SlashGroup({
    name: "image",
    description: "從貢獻的圖庫抽一張圖片",
})
@SlashGroup("image")
@injectable()
class ImageCommand {
    constructor(
        private readonly _loggerService: LoggerService,
        private readonly _graphicService: GraphicService
    ) {}

    private async validate(
        imageID: number | undefined,
        interaction: CommandInteraction
    ): Promise<boolean> {
        const user = await User.get(interaction.user.id);
        const type: ImageType =
            ImageType[
                (interaction.options as CommandInteractionOptionResolver)
                    .getSubcommand()
                    .toUpperCase()
            ];

        if (user.contribution < (MinimumDemand.get(type) as number)) {
            await interaction.reply(
                "你跟Yue還不夠熟呢... 他有跟我說不要隨便幫陌生人忙的..."
            );
            return false;
        }

        if (type === undefined) {
            await interaction.reply("不是支援的圖片類型呢...");
            return false;
        }

        if (imageID && imageID <= 0) {
            await interaction.reply("號碼需要大於0才行呢...");
            return false;
        }

        if (
            type === ImageType.HPIC &&
            !(interaction.channel instanceof DMChannel) &&
            !(interaction.channel as TextChannel).nsfw
        ) {
            await interaction.reply("在這邊h是不可以的!");
            return false;
        }

        return true;
    }

    private async pickImage(
        imageID: number | undefined,
        interaction: CommandInteraction
    ): Promise<Image | null> {
        // user picked image (null if user doesn't assign)
        const type = ImageType[
            (interaction.options as CommandInteractionOptionResolver)
                .getSubcommand()
                .toUpperCase()
        ] as ImageType;
        let picked: Image | null = null;
        if (imageID) {
            picked = await Image.findOne({ where: { id: imageID } });
            if (!picked) {
                await interaction.reply(
                    "找不到這張圖片呢... 你確定編號是對的嗎?"
                );
                return null;
            }
            if (type !== picked.type) {
                await interaction.reply("這張圖不是你選擇的圖片類型呢...");
                return null;
            }
        } else {
            picked = await Image.random(type);
        }
        if (!picked) {
            await interaction.reply("找不到這張圖呢...");
            return null;
        }
        return picked;
    }

    @Slash({
        description: "從貢獻的wtfpic圖庫抽一張圖",
    })
    async wtfpic(
        @SlashOption({
            name: "id",
            description: "圖片的編號",
            type: ApplicationCommandOptionType.Integer,
        })
        id: number | undefined,
        interaction: CommandInteraction
    ) {
        this.execute(id, interaction);
    }

    @Slash({
        description: "從貢獻的hpic圖庫抽一張圖(需要在nsfw頻道/好感度30)",
    })
    async hpic(
        @SlashOption({
            name: "id",
            description: "圖片的編號",
            type: ApplicationCommandOptionType.Integer,
        })
        id: number | undefined,
        interaction: CommandInteraction
    ) {
        this.execute(id, interaction);
    }

    @Slash({
        description: "從貢獻的pic圖庫抽一張圖(需要好感度20)",
    })
    async pic(
        @SlashOption({
            name: "id",
            description: "圖片的編號",
            type: ApplicationCommandOptionType.Integer,
        })
        id: number | undefined,
        interaction: CommandInteraction
    ) {
        this.execute(id, interaction);
    }

    async execute(id: number | undefined, interaction: CommandInteraction) {
        if (!(await this.validate(id, interaction))) return;

        const picked = await this.pickImage(id, interaction);
        if (!picked) return;

        await this.replyImageEmbed(interaction, picked);
    }

    async replyImageEmbed(interaction: CommandInteraction, imageData: Image) {
        if (!imageData)
            return await interaction.reply("該項圖庫中沒有圖片呢...");
        const file = new AttachmentBuilder(imageData.image, {
            name: `${imageData.id}.${imageData.ext}`,
        });

        let uploader: string | undefined = undefined;

        try {
            const t = await interaction.client.users.fetch(imageData.uploader);
            uploader = t.username;
        } catch (err) {
            this._loggerService.error(
                "Got an error while trying to fetch user data",
                err
            );
        }
        uploader = uploader ? uploader : "窩不知道";

        const embed = this._graphicService.info(
            interaction.client,
            "「我找到了這個...」"
        );

        embed.addFields(
            {
                name: "上傳者",
                value: uploader,
                inline: true,
            },
            { name: "圖片編號", value: imageData.id.toString(), inline: true },
            {
                name: "上傳時間",
                value: toDatetimeString(imageData.createdAt),
                inline: false,
            }
        );
        embed.setImage(`attachment://${imageData.id}.${imageData.ext}`);
        await interaction.reply({ embeds: [embed], files: [file] });
    }
}
