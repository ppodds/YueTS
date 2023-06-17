import { Configuration } from "log4js";

export type Config = {
    bot: {
        readonly name: string;
        readonly statusList: string[];
        readonly statusType: string;
        readonly token: string;
        readonly dev: {
            readonly clientId: string;
            readonly guildId: string;
        };
        readonly author: {
            readonly id: string;
            readonly avatar: string;
        };
    };
    db: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly database: string;
        readonly timezone: string;
    };
    log: Configuration;
};
