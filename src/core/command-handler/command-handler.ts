import * as fs from "fs";
import { Collection } from "discord.js";
import { CommandInterface } from "./CommandInterface";

const commands = new Collection<string, CommandInterface>();

(async () => {
    const commandFolders = fs.readdirSync("./core/command-handler/commands");
    for (const folder of commandFolders) {
        const commandFiles = fs
            .readdirSync(`./core/command-handler/commands/${folder}`)
            .filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command = (await import(`./commands/${folder}/${file}`))
                .default;
            commands.set(command.data.name, command);
        }
    }
})();

export default commands;
