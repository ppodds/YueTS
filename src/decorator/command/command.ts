import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CommandDataType } from "../../command/CommandDataType";
import { CommandManager } from "../../command/CommandManager";

export function command(data: RESTPostAPIApplicationCommandsJSONBody) {
    return function (
        target: any,
        propertyKey: string,
        _descriptor: PropertyDescriptor
    ) {
        CommandManager.instance.registerCommand({
            type: CommandDataType.COMMAND,
            data,
            executer: {
                classRef: target,
                methodName: propertyKey,
            },
        });
    };
}
