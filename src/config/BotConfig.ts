import { ActivityTypes } from "discord.js/typings/enums";

export interface BotConfig {
    readonly name: string;
    readonly statusList: string[];
    readonly statusType: ActivityTypes;
    readonly token: string;
    readonly env: string;
    readonly dev: {
        readonly clientId: string;
        readonly guildId: string;
    };
    readonly author: {
        readonly id: string;
        readonly avatar: string;
    };
}
