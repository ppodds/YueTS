import { CommandDataType } from "../../command/CommandDataType";
import { CommandManager } from "../../command/CommandManager";

export function subcommand(root: string, name: string) {
    return function (
        target: any,
        propertyKey: string,
        _descriptor: PropertyDescriptor
    ) {
        CommandManager.instance.registerSubCommand(root, {
            type: CommandDataType.SUBCOMMAND,
            name,
            executer: {
                classRef: target,
                methodName: propertyKey,
            },
        });
    };
}
