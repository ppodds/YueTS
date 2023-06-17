import { Donor } from "../../database/models/donor";
import { LoggerService } from "../../utils/logger-service";
import {
    ApplicationCommandOptionType,
    CommandInteraction,
    TextChannel,
} from "discord.js";
import { ImageType } from "../../image/image-type";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { GuildOnly } from "../../guards/guild-only";
import { injectable } from "tsyringe";
import { GraphicService } from "../../graphics/graphic-service";

@Discord()
@SlashGroup({ name: "donate", description: "貢獻相關指令" })
@SlashGroup("donate")
@injectable()
export class DonateCommand {
    constructor(
        private readonly _loggerService: LoggerService,
        private readonly _graphicService: GraphicService
    ) {}

    @Slash({ description: "開始貢獻資料" })
    @Guard(GuildOnly)
    async start(
        @SlashOption({
            name: "type",
            description: "資料類型",
            required: true,
            type: ApplicationCommandOptionType.String,
        })
        typeText: string,
        interaction: CommandInteraction
    ) {
        const type: ImageType | undefined = ImageType[typeText.toUpperCase()];
        if (type === undefined)
            return await interaction.reply({
                content: "這不是我能使用的呢....",
                ephemeral: true,
            });
        else if (
            type === ImageType.HPIC &&
            interaction.inGuild() &&
            !(interaction.channel as TextChannel).nsfw
        )
            return await interaction.reply({
                content: "在這裡h是不行的!",
                ephemeral: true,
            });
        // create donor if not exist
        const [_, created] = await Donor.findOrCreate({
            where: {
                guild: interaction.inGuild() ? interaction.guildId : "dm",
                channel: interaction.channelId,
                user: interaction.user.id,
            },
            defaults: {
                type: type,
            },
        });

        // user is donating in current channel
        if (!created) {
            return await interaction.reply({
                content: "你不是要給我東西嗎? 還沒給又想來了?",
                ephemeral: true,
            });
        }
        if (interaction.guild && interaction.channel)
            this._loggerService.info(
                `${interaction.user.username} start donate ${typeText} at ${
                    interaction.inGuild()
                        ? interaction.guild.name +
                          "-" +
                          interaction.channel.name
                        : "dm channel"
                }`
            );
        return await interaction.reply("了解... 那麼把東西給我吧...");
    }

    @Slash({ description: "結束貢獻資料" })
    async end(interaction: CommandInteraction) {
        const donor = await Donor.findOne({
            where: {
                guild: interaction.inGuild() ? interaction.guildId : "dm",
                channel: interaction.channelId,
                user: interaction.user.id,
            },
        });

        if (donor === null)
            return await interaction.reply({
                content: "剛剛沒有說要給我東西呢...",
                ephemeral: true,
            });

        await interaction.reply(
            `一共貢獻了${
                donor.amount
            }張圖片，貢獻值增加了${donor.gainContribution()}點`
        );
        await donor.destroy();
    }

    @Slash({ description: "檢視可以貢獻給Yue的類別清單" })
    async list(interaction: CommandInteraction) {
        const embed = this._graphicService.info(
            interaction.client,
            "「想為Yue做些什麼? 可以呦....」\n貢獻說明:貢獻完會獲得Yue的喜愛，Yue會願意為你做更多事"
        );
        embed.addFields(
            {
                name: "pic",
                value: "油圖(一張一點)",
                inline: false,
            },
            {
                name: "hpic",
                value: "18+油圖(只能在nsfw頻道使用)(一張三點)",
                inline: false,
            },
            {
                name: "wtfpic",
                value: "圖戰圖或梗圖(一張一點)",
                inline: false,
            }
        );
        await interaction.reply({ embeds: [embed] });
    }
}
