import {
    Message,
    MessageEmbed,
    MessageButton,
    Client,
    ColorResolvable,
    CommandInteraction,
    ButtonInteraction,
} from "discord.js";
import { Color } from "./Color.js";
import {
    ButtonPaginator,
    PaginatorEvents,
} from "@psibean/discord.js-pagination";
import { Reaction } from "./Reaction.js";
import { Logger } from "../utils/Logger.js";
import configManager from "../../config/ConfigManager.js";

const author = (await configManager.getBotConfig()).author;

export function info(
    client: Client,
    description: string,
    color?: Color | ColorResolvable
): MessageEmbed {
    return new MessageEmbed()
        .setColor(color || Color.PRIMARY)
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(description)

        .setFooter({
            text: "由ppodds親手調教",
            iconURL: author.avatar,
        });
}

export function warn(client: Client, description: string) {
    return new MessageEmbed()
        .setColor(Color.WARN)
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(description)
        .setFooter({
            text: "由ppodds親手調教",
            iconURL: author.avatar,
        });
}

export function error(client: Client, description: string) {
    return new MessageEmbed()
        .setColor(Color.ERROR)
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(description)
        .setFooter({
            text: "由ppodds親手調教",
            iconURL: author.avatar,
        });
}
/**
 * Send a pagination embed reply
 * @param {CommandInteraction} interaction interaction object of interaction event
 * @param {MessageEmbed[]} pages an array of MessageEmbed, each one is a page of paginationEmbed
 * @param {MessageButton[]} buttonList an array of MessageButton which length is 2
 * @returns {Promise<Message>} reply message
 */
export async function paginationEmbed(
    interaction: CommandInteraction,
    pages: MessageEmbed[],
    buttonList: MessageButton[]
): Promise<void> {
    if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
        throw new Error("Link buttons are not supported");
    if (buttonList.length !== 2) throw new Error("Need two buttons.");

    for (let page = 0; page < pages.length; page++) {
        pages[page].setDescription(
            pages[page].description +
                `
                目前顯示的是第 ${page + 1} 頁的結果 共有 ${pages.length} 頁`
        );
    }

    const identifiersResolver = async ({
        interaction,
        paginator,
    }: {
        interaction: ButtonInteraction;
        paginator: ButtonPaginator;
    }) => {
        let { pageIdentifier } = paginator.currentIdentifiers;
        switch (interaction.customId) {
            case buttonList[0].customId:
                pageIdentifier =
                    pageIdentifier > 0 ? --pageIdentifier : pages.length - 1;
                break;
            case buttonList[1].customId:
                pageIdentifier =
                    pageIdentifier + 1 < pages.length ? ++pageIdentifier : 0;
                break;
            default:
                break;
        }
        return { ...paginator.currentIdentifier, pageIdentifier };
    };

    const paginator = new ButtonPaginator(interaction, {
        pages,
        buttons: buttonList,
        identifiersResolver: identifiersResolver,
    })
        .on(PaginatorEvents.PAGINATION_READY, async (paginator) => {
            for (const actionRow of paginator.messageActionRows) {
                for (const button of actionRow.components) {
                    button.disabled = false;
                }
            }
            await paginator.message.edit(paginator.currentPage);
        })
        .on(PaginatorEvents.COLLECT_ERROR, ({ error }) => {
            Logger.error("Paginator encounter collect error!", error);
        })
        .on(PaginatorEvents.PAGINATION_END, async ({ reason, paginator }) => {
            try {
                if (paginator.message.deletable)
                    await paginator.message.delete();
            } catch (error) {
                Logger.error(
                    "There was an error when deleting the message!",
                    error
                );
            }
        });
    await paginator.send();
    return paginator.message;
}
/**
 * Send a select menu embed reply
 * @param interaction interaction object of interaction event
 * @param embed original embed
 * @param options options amount (1~5)
 * @param callback option callback function Ex: function foo(option) {}
 * @param timeout timeout(ms)
 * @returns {Promise<Message>} reply message
 */
export async function selectMenuEmbed(
    interaction: CommandInteraction,
    embed: MessageEmbed,
    options: number,
    callback: (option: number) => void,
    timeout = 60000
): Promise<Message> {
    if (options > 5 || options < 1)
        throw new Error("options amount need be a integer in 1~5.");

    const buttonList: MessageButton[] = [];
    for (let i = 0; i < options; i++) {
        switch (i) {
            case 0:
                buttonList.push(
                    new MessageButton()
                        .setCustomId("one")
                        .setEmoji(Reaction.one)
                        .setStyle("SECONDARY")
                );
                break;
            case 1:
                buttonList.push(
                    new MessageButton()
                        .setCustomId("two")
                        .setEmoji(Reaction.two)
                        .setStyle("SECONDARY")
                );
                break;
            case 2:
                buttonList.push(
                    new MessageButton()
                        .setCustomId("three")
                        .setEmoji(Reaction.three)
                        .setStyle("SECONDARY")
                );
                break;
            case 3:
                buttonList.push(
                    new MessageButton()
                        .setCustomId("four")
                        .setEmoji(Reaction.four)
                        .setStyle("SECONDARY")
                );
                break;
            case 4:
                buttonList.push(
                    new MessageButton()
                        .setCustomId("five")
                        .setEmoji(Reaction.five)
                        .setStyle("SECONDARY")
                );
                break;
        }
    }

    const identifiersResolver = async ({
        interaction,
        paginator,
    }: {
        interaction: ButtonInteraction;
        paginator: ButtonPaginator;
    }) => {
        for (let i = 0; i < 5; i++) {
            if (interaction.customId === buttonList[i].customId) {
                callback(i);
                break;
            }
        }
        paginator.stop("USER_SELECTED");
        return paginator.currentIdentifier;
    };

    const paginator = new ButtonPaginator(interaction, {
        pages: [embed],
        buttons: buttonList,
        identifiersResolver: identifiersResolver,
    })
        .on(
            PaginatorEvents.PAGINATION_READY,
            async (paginator: ButtonPaginator) => {
                for (const actionRow of paginator.messageActionRows) {
                    for (const button of actionRow.components) {
                        button.disabled = false;
                    }
                }
                await paginator.message.edit(paginator.currentPage);
            }
        )
        .on(PaginatorEvents.COLLECT_ERROR, ({ error }) => {
            Logger.error("Paginator encounter collect error!", error);
        })
        .on(PaginatorEvents.PAGINATION_END, async ({ reason, paginator }) => {
            if (reason === "USER_SELECTED") {
                for (const actionRow of paginator.messageActionRows) {
                    for (const button of actionRow.components) {
                        button.disabled = true;
                    }
                }
                await paginator.message.edit(paginator.currentPage);
            }
        });

    if (!interaction.deferred) await interaction.deferReply();
    await paginator.send();

    return paginator.message;
}
/**
 * Generate a button list for paginationEmbed
 * @returns {MessageButton[]} a button list for paginationEmbed
 */
export function paginationButton(): MessageButton[] {
    const buttonList = [
        new MessageButton()
            .setCustomId("prevPage")
            .setLabel("上一頁")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("nextPage")
            .setLabel("下一頁")
            .setStyle("PRIMARY"),
    ];
    return buttonList;
}
