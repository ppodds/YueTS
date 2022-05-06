import { REST } from "@discordjs/rest";
import { ConfigManager } from "./config/ConfigManager";
import { CommandManager } from "./command/CommandManager";
import {
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from "discord-api-types/v10";
import { CommandData } from "./command/CommandData";

class CommandDeployer {
    private readonly _rest: REST;
    private readonly _commandsData: IterableIterator<CommandData>;
    constructor() {
        this._rest = new REST({ version: "10" }).setToken(
            ConfigManager.instance.botConfig.token
        );
        this._commandsData = CommandManager.instance.getCommandsData();
    }

    public async run() {
        try {
            console.log("Started refreshing application (/) commands.");
            const route =
                ConfigManager.instance.botConfig.env === "prod"
                    ? Routes.applicationCommands(
                          ConfigManager.instance.botConfig.dev.clientId
                      )
                    : Routes.applicationGuildCommands(
                          ConfigManager.instance.botConfig.dev.clientId,
                          ConfigManager.instance.botConfig.dev.guildId
                      );
            const body: RESTPostAPIApplicationCommandsJSONBody[] = [];
            for (const command of this._commandsData) body.push(command.data);
            await this._rest.put(route, { body });
            console.log("Successfully reloaded application (/) commands.");
            process.exit(0);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}

process.chdir("dist");
const commandDeployer = new CommandDeployer();
commandDeployer.run();
