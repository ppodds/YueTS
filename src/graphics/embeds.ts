import {
    Message,
    EmbedBuilder,
    ButtonBuilder,
    Client,
    ColorResolvable,
    CommandInteraction,
    ButtonInteraction,
    ActionRowBuilder,
    ButtonStyle,
    User,
} from "discord.js";
import { Color } from "./Color";
import { Reaction } from "./Reaction";
import { Logger } from "../utils/Logger";
import { ConfigManager } from "../config/ConfigManager";
import {
    ActionRowMessageListener,
    Paginator,
} from "discord.js-message-listener";
import { GalleryMetadata } from "ehentai-api";
import { GalleryResponse, URLBuilder } from "@ppodds/nhentai-api";

const author = ConfigManager.instance.botConfig.author;

export function info(
    client: Client,
    description: string,
    color?: Color | ColorResolvable
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(color || Color.PRIMARY)
        .setAuthor({
            name: (client.user as User).username,
            iconURL: (client.user as User).displayAvatarURL(),
        })
        .setDescription(description)
        .setFooter({
            text: "由ppodds親手調教",
            iconURL: author.avatar,
        });
}

/**
 * Send a pagination embed reply
 * @param interaction interaction object of interaction event
 * @param pages an array of MessageEmbed, each one is a page of paginationEmbed
 * @returns reply message
 */
export async function paginationEmbed(
    interaction: CommandInteraction,
    pages: EmbedBuilder[]
): Promise<void> {
    const buttonList = [
        new ButtonBuilder()
            .setCustomId("prevPage")
            .setLabel("上一頁")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("nextPage")
            .setLabel("下一頁")
            .setStyle(ButtonStyle.Primary),
    ];

    for (let page = 0; page < pages.length; page++) {
        pages[page].setDescription(
            pages[page].toJSON().description +
                `
                目前顯示的是第 ${page + 1} 頁的結果 共有 ${pages.length} 頁`
        );
    }
    const message = (
        interaction.replied || interaction.deferred
            ? await interaction.editReply({ embeds: [pages[0]] })
            : await interaction.reply({ embeds: [pages[0]], fetchReply: true })
    ) as Message;
    const messageActionRows = [new ActionRowBuilder()];
    messageActionRows[0].addComponents(buttonList);
    const listener = new ActionRowMessageListener(message, {
        messageActionRows,
    });
    const paginator = new Paginator(listener, {
        pages,
        nextPageFilter: (arg) =>
            arg.customId ===
            (buttonList[1].data as { custom_id?: string }).custom_id,
        previousPageFilter: (arg) =>
            arg.customId ===
            (buttonList[0].data as { custom_id?: string }).custom_id,
    });
    await paginator.start();
}
/**
 * Send a select menu embed reply
 * @param interaction interaction object of interaction event
 * @param embed original embed
 * @param options options amount (1~5)
 * @param callback option callback function Ex: function foo(option) {}
 * @param timeout timeout(ms)
 * @returns reply message
 */
export async function selectMenuEmbed(
    interaction: CommandInteraction,
    embed: EmbedBuilder,
    options: number,
    callback: (option: number) => void,
    timeout = 60000
): Promise<void> {
    if (options > 5 || options < 1)
        throw new Error("options amount need be a integer in 1~5.");

    const buttonList: ButtonBuilder[] = [];
    for (let i = 0; i < options; i++) {
        switch (i) {
            case 0:
                buttonList.push(
                    new ButtonBuilder()
                        .setCustomId("one")
                        .setEmoji(Reaction.one)
                        .setStyle(ButtonStyle.Secondary)
                );
                break;
            case 1:
                buttonList.push(
                    new ButtonBuilder()
                        .setCustomId("two")
                        .setEmoji(Reaction.two)
                        .setStyle(ButtonStyle.Secondary)
                );
                break;
            case 2:
                buttonList.push(
                    new ButtonBuilder()
                        .setCustomId("three")
                        .setEmoji(Reaction.three)
                        .setStyle(ButtonStyle.Secondary)
                );
                break;
            case 3:
                buttonList.push(
                    new ButtonBuilder()
                        .setCustomId("four")
                        .setEmoji(Reaction.four)
                        .setStyle(ButtonStyle.Secondary)
                );
                break;
            case 4:
                buttonList.push(
                    new ButtonBuilder()
                        .setCustomId("five")
                        .setEmoji(Reaction.five)
                        .setStyle(ButtonStyle.Secondary)
                );
                break;
        }
    }

    const message = (
        interaction.replied || interaction.deferred
            ? await interaction.editReply({ embeds: [embed] })
            : await interaction.reply({ embeds: [embed], fetchReply: true })
    ) as Message;
    const messageActionRows = [new ActionRowBuilder()];
    messageActionRows[0].addComponents(buttonList);
    const listener = new ActionRowMessageListener(message, {
        messageActionRows,
        collectorOptions: {
            time: timeout,
        },
    });
    listener
        .on("collect", (arg) => {
            for (let i = 0; i < 5; i++) {
                if (
                    (arg as ButtonInteraction).customId ===
                    (buttonList[i].data as { custom_id?: string }).custom_id
                ) {
                    callback(i);
                    break;
                }
            }
            listener.stop("USER_SELECTED");
        })
        .on("end", async (_, reason) => {
            if (reason === "USER_SELECTED") {
                for (const actionRow of messageActionRows) {
                    for (const button of actionRow.components) {
                        (button as ButtonBuilder).setDisabled(true);
                    }
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await listener.editMessage({ components: messageActionRows });
            }
        })
        .on("collectError", (error) =>
            Logger.instance.error(
                "Button select menu encounter collect error!",
                error.error as Error
            )
        );
    await listener.start();
}

export function ehentaiBookPreviewEmbed(
    client: Client,
    galleryMetadata: GalleryMetadata
) {
    const embed = info(client, "「以下是這本魔法書的相關資訊...」");
    embed.setImage(galleryMetadata.thumb);

    //merge the tag with same keys
    const tagMap = new Map<string, string[]>();
    galleryMetadata.tags.forEach((element) => {
        const tag = element.split(":");
        const tagList = tagMap.get(tag[0]);
        if (tagList) {
            tagList.push(tag[1]);
        } else {
            tagMap.set(tag[0], [tag[1]]);
        }
    });

    //translate the tag keys
    const translateTags: string[] = [];
    const tagReplaceList = new Map<string, string>([
        ["artist", "繪師"],
        ["character", "角色"],
        ["cosplayer", "coser"],
        ["female", "女性"],
        ["group", "社團"],
        ["language", "語言"],
        ["male", "男性"],
        ["mixed", "混合"],
        ["other", "其他"],
        ["parody", "原作"],
        ["reclass", "重新分類"],
        ["temp", "臨時"]
    ]);

    tagMap.forEach((value, key) => {
        const values = value.join(", ");
        if (tagReplaceList.has(key)) {
            translateTags.push(tagReplaceList.get(key) + ": " + values);
        } else {
            translateTags.push(key + ": " + values);
        }
    });
    
    embed.addFields(
        {
            name: "標題",
            value: galleryMetadata.title,
            inline: false,
        },
        {
            name: "類別",
            value: galleryMetadata.category,
            inline: true,
        },
        {
            name: "評分",
            value: galleryMetadata.rating,
            inline: true,
        },
        {
            name: "上傳者",
            value: galleryMetadata.uploader,
            inline: true,
        },
        {
            name: "標籤",
            value: translateTags.join("\n"),
            inline: false,
        },
        {
            name: "檔案數量",
            value: galleryMetadata.filecount,
            inline: true,
        },
        {
            name: "已清除",
            value: galleryMetadata.expunged ? "是" : "否",
            inline: true,
        },
        {
            name: "id",
            value: `${galleryMetadata.gid}`,
            inline: true,
        },
        {
            name: "token",
            value: galleryMetadata.token,
            inline: true,
        }
    );

    return embed;
}

export function nhentaiBookPreviewEmbed(
    client: Client,
    galleryResponse: GalleryResponse
) {
    const embed = info(client, "「以下是這本魔法書的相關資訊...」");

    const builder = new URLBuilder(galleryResponse);
    const category = galleryResponse.tags.find(
        (tag) => tag.type === "category"
    );
    const tags: string[] = [];

    for (const tag of galleryResponse.tags) {
        tags.push(tag.name);
    }

    embed.setImage(builder.getCover());

    embed.addFields(
        {
            name: "標題",
            value: galleryResponse.title.pretty,
            inline: false,
        },
        {
            name: "類別",
            value: category?.name ?? "未知",
            inline: true,
        },
        {
            name: "收藏數",
            value: `${galleryResponse.num_favorites}`,
            inline: true,
        },
        {
            name: "標籤",
            value: tags.join("\n"),
            inline: false,
        },
        {
            name: "檔案數量",
            value: `${galleryResponse.num_pages}`,
            inline: true,
        },
        {
            name: "id",
            value: `${galleryResponse.id}`,
            inline: true,
        },
        {
            name: "media id",
            value: `${galleryResponse.media_id}`,
            inline: true,
        }
    );

    return embed;
}
