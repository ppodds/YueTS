import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";

export const GuildOnly: GuardFunction<CommandInteraction> = async (
    interaction,
    client,
    next
) => {
    if (interaction.inGuild()) await next();
    const content = "這個指令只能在伺服器中使用";
    if (interaction.deferred) {
        await interaction.editReply(content);
    } else if (interaction.replied) {
        await interaction.followUp(content);
    } else {
        await interaction.reply(content);
    }
};
