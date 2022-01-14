import { REST } from "@discordjs/rest";
import {
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from "discord-api-types/v9";
import { token, env, dev } from "./config/bot-config.json";
import * as fs from "fs";
import { CommandInterface } from "./core/command-handler/CommandInterface";
import { SlashCommandBuilder } from "@discordjs/builders";

process.chdir("dist");

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const commandFolders = fs.readdirSync("./core/command-handler/commands");

const clientId = dev.clientId;
const guildId = dev.guildId;

for (const folder of commandFolders) {
    const commandFiles = fs
        .readdirSync(`./core/command-handler/commands/${folder}`)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command: CommandInterface = require(`./core/command-handler/commands/${folder}/${file}`);
        commands.push((<SlashCommandBuilder>command.data).toJSON());
    }
}

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        if (env === "prod") {
            await rest.put(Routes.applicationCommands(clientId), {
                body: commands,
            });
        } else {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
                body: commands,
            });
        }
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();
