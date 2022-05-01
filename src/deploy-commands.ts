import { REST } from "@discordjs/rest";
import {
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from "discord-api-types/v9";
import * as fs from "fs";
import { CommandInterface } from "./core/command-handler/CommandInterface";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ConfigManager } from "./config/ConfigManager";

process.chdir("dist");

(async () => {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const commandFolders = fs.readdirSync(
        `${process.env.BASE_PATH}/src/core/command-handler/commands`
    );

    const clientId = ConfigManager.instance.botConfig.dev.clientId;
    const guildId = ConfigManager.instance.botConfig.dev.guildId;

    for (const folder of commandFolders) {
        const commandFiles = fs
            .readdirSync(`./core/command-handler/commands/${folder}`)
            .filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command: CommandInterface = (
                await import(
                    `./core/command-handler/commands/${folder}/${file}`
                )
            ).default;
            commands.push((<SlashCommandBuilder>command.data).toJSON());
        }
    }

    const rest = new REST({ version: "9" }).setToken(
        ConfigManager.instance.botConfig.token
    );

    try {
        console.log("Started refreshing application (/) commands.");

        if (ConfigManager.instance.botConfig.env === "prod") {
            await rest.put(Routes.applicationCommands(clientId), {
                body: commands,
            });
        } else {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
                body: commands,
            });
        }
        console.log("Successfully reloaded application (/) commands.");
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
