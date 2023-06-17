import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";

export const OwnerOnly: GuardFunction<CommandInteraction> = async (
    interaction,
    client,
    next,
    authorId: string
) => {
    if (interaction.user.id !== authorId) {
        const content = "無此權限";
        if (interaction.deferred) {
            await interaction.editReply(content);
        } else if (interaction.replied) {
            await interaction.followUp(content);
        } else {
            await interaction.reply(content);
        }
        return;
    }
    await next();
};
