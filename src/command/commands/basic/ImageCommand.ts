import { SlashCommandBuilder } from "@discordjs/builders";
import { Image } from "../../../core/database/models/image";
import { User } from "../../../core/database/models/user";
import { Logger } from "../../../core/utils/Logger";
import { info } from "../../../core/graphics/embeds";
import {
    CommandInteraction,
    DMChannel,
    MessageAttachment,
    TextChannel,
} from "discord.js";
import { toDatetimeString } from "../../../core/utils/time";
import { ImageType } from "../../../core/image/ImageType";
import { subcommandGroup } from "../../../decorator/command/subcommand-group";
import { subcommand } from "../../../decorator/command/subcommand";

const MinimumDemand = new Map<ImageType, number>([
    [ImageType.PIC, 20],
    [ImageType.HPIC, 30],
    [ImageType.WTFPIC, 0],
]);

async function replyImageEmbed(
    interaction: CommandInteraction,
    imageData: Image
) {
    if (!imageData) return await interaction.reply("該項圖庫中沒有圖片呢...");
    const file = new MessageAttachment(
        imageData.image,
        `${imageData.id}.${imageData.ext}`
    );

    let uploader: string;

    try {
        const t = await interaction.client.users.fetch(imageData.uploader);
        uploader = t ? t.username : "窩不知道";
    } catch (err) {
        Logger.error("Got an error while trying to fetch user data", err);
    }

    const embed = info(interaction.client, "「我找到了這個...」");

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

@subcommandGroup(
    new SlashCommandBuilder()
        .setName("image")
        .setDescription("從貢獻的圖庫抽一張圖片")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("pic")
                .setDescription("從貢獻的pic圖庫抽一張圖(需要好感度20)")
                .addIntegerOption((option) =>
                    option.setName("id").setDescription("圖片的編號")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("hpic")
                .setDescription(
                    "從貢獻的hpic圖庫抽一張圖(需要在nsfw頻道/好感度30)"
                )
                .addIntegerOption((option) =>
                    option.setName("id").setDescription("圖片的編號")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("wtfpic")
                .setDescription("從貢獻的wtfpic圖庫抽一張圖")
                .addIntegerOption((option) =>
                    option.setName("id").setDescription("圖片的編號")
                )
        )
)
export class ImageCommand {
    private async validate(interaction: CommandInteraction): Promise<boolean> {
        const user = await User.get(interaction.user.id);
        const imageID = interaction.options.getInteger("id");
        const type: ImageType = this.getImageType(interaction);

        if (user.contribution < MinimumDemand.get(type)) {
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

    private getImageType(
        interaction: CommandInteraction
    ): ImageType | undefined {
        return ImageType[interaction.options.getSubcommand().toUpperCase()];
    }

    private async pickImage(interaction: CommandInteraction): Promise<Image> {
        // user picked image (null if user doesn't assign)
        const imageID = interaction.options.getInteger("id");
        const type = this.getImageType(interaction);
        let picked: Image;
        if (imageID) {
            picked = await Image.findOne({ where: { id: imageID } });

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

    @subcommand("image", "wtfpic")
    @subcommand("image", "hpic")
    @subcommand("image", "pic")
    async pic(interaction: CommandInteraction) {
        if (!(await this.validate(interaction))) return;

        const picked = await this.pickImage(interaction);
        if (!picked) return;

        await replyImageEmbed(interaction, picked);
    }
}
