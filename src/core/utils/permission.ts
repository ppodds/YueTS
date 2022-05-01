import {
    ApplicationCommand,
    ApplicationCommandPermissionData,
    Client,
    Collection,
    User,
} from "discord.js";
import { ConfigManager } from "../../config/ConfigManager";

/**
 * Check if a user is one of bot owners.
 * @param client Client object
 * @param user user who needs to be check
 * @returns if the user is one of bot owners
 */
export async function isOwner(client: Client, user: User): Promise<boolean> {
    if (!client.application?.owner) await client.application?.fetch();

    if (client.application.owner instanceof User) {
        return user.id === client.application.owner.id;
    } else {
        // owner is a Team object
        return client.application.owner.members.find(
            (member) => member.user.id === user.id
        )
            ? true
            : false;
    }
}
/**
 * Get owner only permission for slash command
 * @param client client object
 * @returns owner only permission setting
 */
export async function ownerOnly(
    client: Client
): Promise<ApplicationCommandPermissionData[]> {
    if (!client.application?.owner) await client.application?.fetch();

    if (client.application.owner instanceof User) {
        return [
            {
                id: client.application.owner.id,
                type: "USER",
                permission: true,
            },
        ];
    } else {
        // owner is a Team object
        const owners = [];
        client.application.owner.members.forEach((member) => {
            owners.push({
                id: member.user.id,
                type: "USER",
                permission: true,
            });
        });
        return owners;
    }
}
/**
 * Set slash command permission
 * @param client client object
 * @param name command name
 * @param permissions permissions you want to set
 */
export async function setPermission(
    client: Client,
    name: string,
    permissions: ApplicationCommandPermissionData[]
) {
    let commands: Collection<string, ApplicationCommand>;
    if (ConfigManager.instance.botConfig.env === "prod") {
        if (!client.application) await client.application?.fetch();
        commands = await client.application.commands.fetch();
        const command = commands.find((command) => command.name === name);
        client.guilds.cache.forEach(async (key, guild) => {
            const options = {
                guild: guild,
                permissions: permissions,
            };
            // await command.permissions.set(options);
        });
    } else {
        commands = await client.guilds.cache
            .get(ConfigManager.instance.botConfig.dev.guildId)
            ?.commands.fetch();
        // await commands
        //     .find((command) => command.name === name)
        //     .permissions.set({ permissions });
    }
}
