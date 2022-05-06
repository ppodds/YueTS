import { SlashCommandBuilder } from "@discordjs/builders";
import { Reply } from "../../../core/database/models/reply";
import { Logger } from "../../../core/utils/Logger";
import { info, paginationEmbed } from "../../../core/graphics/embeds";
import { CommandInteraction } from "discord.js";
import { subcommandGroup } from "../../../decorator/command/subcommand-group";
import { subcommand } from "../../../decorator/command/subcommand";

function generateEmbed(interaction: CommandInteraction) {
    const embed = info(
        interaction.client,
        "「以前你跟我說過的這些~ Yue通通都記住了喔~ :heart:」"
    );

    embed.addFields(
        {
            name: "格式範例",
            value: "「待會Yue就用這種方式照著念喔~」",
            inline: false,
        },
        {
            name: "關鍵字",
            value: "回應內容",
            inline: false,
        }
    );
    return embed;
}

function getDm(interaction: CommandInteraction, isGlobal: boolean) {
    if (interaction.inGuild()) {
        if (isGlobal) return true;
        else return false;
    } else return true;
}
function getScope(interaction: CommandInteraction, isGlobal: boolean) {
    if (interaction.inGuild()) {
        if (isGlobal) return interaction.user.id;
        else return interaction.guildId;
    } else return interaction.user.id;
}

@subcommandGroup(
    new SlashCommandBuilder()
        .setName("reply")
        .setDescription("設定對話回應")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("新增對話回應")
                .addBooleanOption((option) =>
                    option
                        .setName("global")
                        .setDescription("是否全域")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("key")
                        .setDescription("關鍵字")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("del")
                .setDescription("刪除對話回應")
                .addBooleanOption((option) =>
                    option
                        .setName("global")
                        .setDescription("是否全域")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("key")
                        .setDescription("關鍵字")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("檢視對話回應清單")
                .addBooleanOption((option) =>
                    option
                        .setName("global")
                        .setDescription("是否全域")
                        .setRequired(true)
                )
        )
        .toJSON()
)
export class ReplyCommand {
    @subcommand("reply", "add")
    async add(interaction: CommandInteraction) {
        const isGlobal = interaction.options.getBoolean("global");
        const key = interaction.options.getString("key");

        if (
            await Reply.findOne({
                where: {
                    key: key,
                    dm: getDm(interaction, isGlobal),
                    scope: getScope(interaction, isGlobal),
                    formatted: false,
                },
                attributes: ["id"],
            })
        )
            return await interaction.reply(
                "好像已經有人對Yue下過相同的指示了呢~"
            );

        await interaction.reply("請輸入回應內容，若未輸入60秒後會自動取消");
        const response = (
            await interaction.channel.awaitMessages({
                filter: (message) => message.author.id === interaction.user.id,
                maxProcessed: 1,
                time: 60000,
            })
        ).first();
        await Reply.create({
            key: key,
            dm: getDm(interaction, isGlobal),
            scope: getScope(interaction, isGlobal),
            response: response.content,
            formatted: false,
        });
        await interaction.followUp("Yue記下來啦~ 下次會努力的~");
        Logger.instance.info(
            `${interaction.user.id} use reply add at ${
                interaction.inGuild() ? interaction.guildId : "dm channel"
            } key；${key} response: ${response.content} ${
                interaction.inGuild() ? "global: " + isGlobal : ""
            }`
        );
    }

    @subcommand("reply", "del")
    async del(interaction: CommandInteraction) {
        const isGlobal = interaction.options.getBoolean("global");
        const key = interaction.options.getString("key");

        const reply = await Reply.findOne({
            where: {
                key: key,
                dm: getDm(interaction, isGlobal),
                scope: getScope(interaction, isGlobal),
                formatted: false,
            },
        });

        if (reply === null) {
            await interaction.reply("好像沒有對Yue下過這樣的指示呢~");
        } else {
            await reply.destroy();
            await interaction.reply("Yue記下來啦~");
        }
    }

    @subcommand("reply", "list")
    async list(interaction: CommandInteraction) {
        const isGlobal = interaction.options.getBoolean("global");
        const replies = await Reply.findAll({
            where: {
                dm: getDm(interaction, isGlobal),
                scope: getScope(interaction, isGlobal),
                formatted: false,
            },
            attributes: ["key", "response"],
        });

        // don't need paginationEmbed
        if (replies.length <= 23) {
            const embed = generateEmbed(interaction);
            replies.forEach((reply) =>
                embed.addField(reply.key, reply.response)
            );
            await interaction.reply({ embeds: [embed] });
        } else {
            // generate pages
            let i = 0;
            const pagesData = [];
            while (i < replies.length) {
                pagesData.push(replies.slice(i, (i += 23)));
            }

            const pages = [];
            pagesData.forEach((pageData) => {
                const embed = generateEmbed(interaction);
                pageData.forEach((reply: Reply) => {
                    embed.addField(reply.key, reply.response);
                });
                pages.push(embed);
            });
            await interaction.deferReply();
            await paginationEmbed(interaction, pages);
        }
    }
}
