import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";
import { ConfigManager } from "../config/ConfigManager";

export const OwnerOnly: GuardFunction<CommandInteraction> = async (
    interaction,
    client,
    next
) => {
    if (interaction.user.id !== ConfigManager.instance.botConfig.author.id) {
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
