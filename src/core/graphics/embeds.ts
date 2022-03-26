import {
    Message,
    MessageEmbed,
    MessageButton,
    Client,
    ColorResolvable,
    CommandInteraction,
    ButtonInteraction,
    MessageActionRow,
} from "discord.js";
import { Color } from "./Color.js";
import { Reaction } from "./Reaction.js";
import { Logger } from "../utils/Logger.js";
import configManager from "../../config/ConfigManager.js";
import {
    ActionRowMessageListener,
    Paginator,
} from "discord.js-message-listener";

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
    const message = (
        interaction.replied || interaction.deferred
            ? await interaction.editReply({ embeds: [pages[0]] })
            : await interaction.reply({ embeds: [pages[0]], fetchReply: true })
    ) as Message;
    const messageActionRows = [new MessageActionRow()];
    messageActionRows[0].addComponents(buttonList);
    const listener = new ActionRowMessageListener(message, {
        messageActionRows,
    });
    const paginator = new Paginator(listener, {
        pages,
        nextPageFilter: (arg) =>
            (arg as ButtonInteraction).customId === buttonList[1].customId,
        previousPageFilter: (arg) =>
            (arg as ButtonInteraction).customId === buttonList[0].customId,
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
 * @returns {Promise<Message>} reply message
 */
export async function selectMenuEmbed(
    interaction: CommandInteraction,
    embed: MessageEmbed,
    options: number,
    callback: (option: number) => void,
    timeout = 60000
): Promise<void> {
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

    const message = (
        interaction.replied || interaction.deferred
            ? await interaction.editReply({ embeds: [embed] })
            : await interaction.reply({ embeds: [embed], fetchReply: true })
    ) as Message;
    const messageActionRows = [new MessageActionRow()];
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
                    buttonList[i].customId
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
                        button.disabled = true;
                    }
                }
                await listener.editMessage({ components: messageActionRows });
            }
        })
        .on("collectError", (error) =>
            Logger.error(
                "Button select menu encounter collect error!",
                error.error as Error
            )
        );
    await listener.start();
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
