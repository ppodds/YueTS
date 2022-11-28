import { ActivityType } from "discord.js";

export interface BotConfig {
    readonly name: string;
    readonly statusList: string[];
    readonly statusType: ActivityType;
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
