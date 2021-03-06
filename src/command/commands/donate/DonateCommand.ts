import { SlashCommandBuilder } from "@discordjs/builders";
import { info } from "../../../graphics/embeds";
import { Donor } from "../../../database/models/donor";
import { Logger } from "../../../utils/Logger";
import { CommandInteraction, TextChannel } from "discord.js";
import { ImageType } from "../../../image/ImageType";
import { subcommandGroup } from "../../../decorator/command/subcommand-group";
import { subcommand } from "../../../decorator/command/subcommand";

@subcommandGroup(
    new SlashCommandBuilder()
        .setName("donate")
        .setDescription("貢獻相關指令")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .setDescription("開始貢獻資料")
                .addStringOption((option) =>
                    option
                        .setName("type")
                        .setDescription("資料類型")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("end").setDescription("結束貢獻資料")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("檢視可以貢獻給Yue的類別清單")
        )
        .toJSON()
)
export class DonateCommand {
    @subcommand("donate", "start")
    async start(interaction: CommandInteraction) {
        const typeText = interaction.options.getString("type");
        const type: ImageType = ImageType[typeText.toUpperCase()];
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
        Logger.instance.info(
            `${interaction.user.username} start donate ${typeText} at ${
                interaction.inGuild()
                    ? interaction.guild.name + "-" + interaction.channel.name
                    : "dm channel"
            }`
        );
        return await interaction.reply("了解... 那麼把東西給我吧...");
    }

    @subcommand("donate", "end")
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
    @subcommand("donate", "list")
    async list(interaction: CommandInteraction) {
        const embed = info(
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
