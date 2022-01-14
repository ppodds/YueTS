import {
    Message,
    MessageActionRow,
    MessageEmbed,
    MessageButton,
    Client,
    ColorResolvable,
    MessageComponentInteraction,
    CommandInteraction,
    ButtonInteraction,
} from "discord.js";
import { Color } from "./Color";
import { author } from "../../config/bot-config.json";
import {
    ButtonPaginator,
    PaginatorEvents,
} from "@psibean/discord.js-pagination";
import { Reaction } from "./Reaction";
import { Logger } from "../utils/Logger";

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

        .setFooter({ text: "由ppodds親手調教", iconURL: author.avatar });
}

export function warn(client: Client, description: string) {
    return new MessageEmbed()
        .setColor(Color.WARN)
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(description)
        .setFooter({ text: "由ppodds親手調教", iconURL: author.avatar });
}

export function error(client: Client, description: string) {
    return new MessageEmbed()
        .setColor(Color.ERROR)
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(description)
        .setFooter({ text: "由ppodds親手調教", iconURL: author.avatar });
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
 * @param {Interaction} interaction interaction object of interaction event
 * @param {MessageEmbed} embed original embed
 * @param {number} options options amount (1~5)
 * @param {Function} callback option callback function Ex: function foo(option) {}
 * @param {number} timeout timeout(ms)
 * @returns {Promise<Message>} reply message
 */
// async selectMenuEmbed(
//     interaction,
//     embed,
//     options,
//     callback,
//     timeout = 60000
// ) {
//     if (!embed) throw new Error("Embed are not given.");
//     if (!options) throw new Error("options amount are not given.");
//     if (options > 5 || options < 1)
//         throw new Error("options amount need be a integer in 1~5.");
//     if (!callback)
//         throw new Error("options callback function are not given.");

//     const buttonList = [];
//     for (let i = 0; i < options; i++) {
//         switch (i) {
//             case 0:
//                 buttonList.push(
//                     new MessageButton()
//                         .setCustomId("one")
//                         .setEmoji(reactions.one)
//                         .setStyle("SECONDARY")
//                 );
//                 break;
//             case 1:
//                 buttonList.push(
//                     new MessageButton()
//                         .setCustomId("two")
//                         .setEmoji(reactions.two)
//                         .setStyle("SECONDARY")
//                 );
//                 break;
//             case 2:
//                 buttonList.push(
//                     new MessageButton()
//                         .setCustomId("three")
//                         .setEmoji(reactions.three)
//                         .setStyle("SECONDARY")
//                 );
//                 break;
//             case 3:
//                 buttonList.push(
//                     new MessageButton()
//                         .setCustomId("four")
//                         .setEmoji(reactions.four)
//                         .setStyle("SECONDARY")
//                 );
//                 break;
//             case 4:
//                 buttonList.push(
//                     new MessageButton()
//                         .setCustomId("five")
//                         .setEmoji(reactions.five)
//                         .setStyle("SECONDARY")
//                 );
//                 break;
//         }
//     }

//     const row = new MessageActionRow().addComponents(buttonList);
//     let menuEmbed;
//     if (interaction.deferred) {
//         // menuEmbed = await interaction.editReply({
//         //     content: "請選擇以下選項",
//         //     fetchReply: true,
//         // });
//         menuEmbed = await interaction.editReply({
//             embeds: [embed],
//             components: [row],
//             fetchReply: true,
//         });
//     } else {
//         menuEmbed = await interaction.reply({
//             embeds: [embed],
//             components: [row],
//             fetchReply: true,
//         });
//     }

//     const filter = (i) =>
//         i.customId === "one" ||
//         i.customId === "two" ||
//         i.customId === "three" ||
//         i.customId === "four" ||
//         i.customId === "five";

//     const collector = await menuEmbed.createMessageComponentCollector({
//         filter,
//         time: timeout,
//     });

//     collector.on("collect", async (i) => {
//         switch (i.customId) {
//             case "one":
//                 callback(0);
//                 break;
//             case "two":
//                 callback(1);
//                 break;
//             case "three":
//                 callback(2);
//                 break;
//             case "four":
//                 callback(3);
//                 break;
//             case "five":
//                 callback(4);
//                 break;
//             default:
//                 break;
//         }
//         await i.deferUpdate();
//         collector.stop("user select");
//     });

//     collector.on("end", () => {
//         if (!menuEmbed.deleted) {
//             buttonList.forEach((button) => button.setDisabled(true));
//             const disabledRow = new MessageActionRow().addComponents(
//                 buttonList
//             );
//             menuEmbed.edit({
//                 embeds: [embed],
//                 components: [disabledRow],
//             });
//         }
//     });

//     return menuEmbed;
// },
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
