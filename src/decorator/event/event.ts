import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { ClientEvents } from "discord.js";
import { CommandDataType } from "../../command/CommandDataType";
import { CommandManager } from "../../command/CommandManager";
import { EventManager } from "../../event/EventManager";

export function event(name: keyof ClientEvents, once: boolean) {
    return function (
        target: any,
        propertyKey: string,
        _descriptor: PropertyDescriptor
    ) {
        EventManager.instance.registerEvent({
            name,
            once,
            executer: {
                classRef: target,
                methodName: propertyKey,
            },
        });
    };
}
