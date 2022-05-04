import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CommandManager } from "../../command/CommandManager";

export function subcommandGroup(data: RESTPostAPIApplicationCommandsJSONBody) {
    return function (_target: any) {
        CommandManager.instance.registerSubcommandGroup(data);
    };
}
