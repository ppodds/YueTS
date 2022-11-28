import { User } from "../../database/models/user";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
class ExpCommand {
    @Slash({
        name: "exp",
        description: "檢視Yue對目標的好感度，若無目標則顯示自己的好感度",
    })
    async execute(
        @SlashOption({
            name: "target",
            description: "目標使用者",
            type: ApplicationCommandOptionType.User,
        })
        target: User | undefined,
        interaction: CommandInteraction
    ) {
        const donor = target
            ? await User.get(target.id)
            : await User.get(interaction.user.id);

        donor.contribution === 0
            ? await interaction.reply(
                  `嗯....Yue跟${target ? "他" : "你"}還不熟呢....`
              )
            : await interaction.reply(
                  `目前我對${target ? "他" : "你"}的好感度是${
                      donor.contribution
                  }點喔!`
              );
    }
}
