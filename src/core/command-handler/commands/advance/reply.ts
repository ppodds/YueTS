import { SlashCommandBuilder } from "@discordjs/builders";
import { Reply } from "../../../database/models/reply.js";
import { Logger } from "../../../utils/Logger.js";
import { CommandInterface } from "../../CommandInterface";
import {
    info,
    paginationEmbed,
    paginationButton,
} from "../../../graphics/embeds.js";
import { CommandInteraction } from "discord.js";

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

const command: CommandInterface = {
    data: new SlashCommandBuilder()
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
                .addStringOption((option) =>
                    option
                        .setName("response")
                        .setDescription("反應內容")
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
        ),
    async execute(interaction) {
        const isGlobal = interaction.options.getBoolean("global");
        function getDm() {
            if (interaction.inGuild()) {
                if (isGlobal) return true;
                else return false;
            } else return true;
        }
        function getScope() {
            if (interaction.inGuild()) {
                if (isGlobal) return interaction.user.id;
                else return interaction.guildId;
            } else return interaction.user.id;
        }

        if (interaction.options.getSubcommand() === "add") {
            const key = interaction.options.getString("key");
            const response = interaction.options.getString("response");

            // create reply if not exist
            const [reply, created] = await Reply.findOrCreate({
                where: {
                    key: key,
                    dm: getDm(),
                    scope: getScope(),
                    formatted: false,
                },
                defaults: {
                    response: response,
                },
            });

            if (created) {
                await interaction.reply("Yue記下來啦~ 下次會努力的~");
                Logger.info(
                    `${interaction.user.id} use reply add at ${
                        interaction.inGuild()
                            ? interaction.guildId
                            : "dm channel"
                    } key；{key} response: {value} ${
                        interaction.inGuild() ? "global: " + isGlobal : ""
                    }`
                );
            } else {
                await interaction.reply("好像已經有人對Yue下過相同的指示了呢~");
            }
        } else if (interaction.options.getSubcommand() === "del") {
            const key = interaction.options.getString("key");

            const reply = await Reply.findOne({
                where: {
                    key: key,
                    dm: getDm(),
                    scope: getScope(),
                    formatted: false,
                },
            });

            if (reply === null) {
                await interaction.reply("好像沒有對Yue下過這樣的指示呢~");
            } else {
                await reply.destroy();
                await interaction.reply("Yue記下來啦~");
            }
        } else if (interaction.options.getSubcommand() === "list") {
            const replies = await Reply.findAll({
                where: {
                    dm: getDm(),
                    scope: getScope(),
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
                await paginationEmbed(interaction, pages, paginationButton());
            }
        }
    },
};

export default command;
