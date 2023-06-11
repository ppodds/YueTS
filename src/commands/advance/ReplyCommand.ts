import { Reply } from "../../database/models/reply";
import { Logger } from "../../utils/Logger";
import { info, paginationEmbed } from "../../graphics/embeds";
import {
    ApplicationCommandOptionType,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

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
    if (isGlobal) return interaction.user.id;
    else return interaction.guildId;
}

@Discord()
@SlashGroup({ name: "reply", description: "設定對話回應" })
class ReplyCommand {
    @Slash({ description: "新增對話回應" })
    @SlashGroup("reply")
    async add(
        @SlashOption({
            name: "global",
            description: "是否全域",
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        })
        isGlobal: boolean,
        @SlashOption({
            name: "key",
            description: "關鍵字",
            required: true,
            type: ApplicationCommandOptionType.String,
        })
        key: string,
        interaction: CommandInteraction
    ) {
        if (!interaction.channel)
            return await interaction.reply(
                "這個指令只能在有文字頻道的時候使用"
            );
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
        if (!response || response.content.length < 1) return;
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

    @Slash({ description: "刪除對話回應" })
    @SlashGroup("reply")
    async del(
        @SlashOption({
            name: "global",
            description: "是否全域",
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        })
        isGlobal: boolean,
        @SlashOption({
            name: "key",
            description: "關鍵字",
            required: true,
            type: ApplicationCommandOptionType.String,
        })
        key: string,
        interaction: CommandInteraction
    ) {
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

    @Slash({ description: "檢視對話回應清單" })
    @SlashGroup("reply")
    async list(
        @SlashOption({
            name: "global",
            description: "是否全域",
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        })
        isGlobal: boolean,
        interaction: CommandInteraction
    ) {
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
                embed.addFields({ name: reply.key, value: reply.response })
            );
            await interaction.reply({ embeds: [embed] });
        } else {
            // generate pages
            let i = 0;
            const pagesData: Reply[][] = [];
            while (i < replies.length) {
                pagesData.push(replies.slice(i, (i += 23)));
            }

            const pages: EmbedBuilder[] = [];
            pagesData.forEach((pageData) => {
                const embed = generateEmbed(interaction);
                pageData.forEach((reply: Reply) => {
                    embed.addFields({ name: reply.key, value: reply.response });
                });
                pages.push(embed);
            });
            await interaction.deferReply();
            await paginationEmbed(interaction, pages);
        }
    }
}
