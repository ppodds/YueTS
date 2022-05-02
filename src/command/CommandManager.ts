import { Collection } from "discord.js";
import { Command } from "./Command";
import grab from "./commands/admin/grab";
import reply from "./commands/advance/reply";
import xhelp from "./commands/advance/xhelp";
import avatar from "./commands/basic/avatar";
import choose from "./commands/basic/choose";
import help from "./commands/basic/help";
import image from "./commands/basic/image";
import info from "./commands/basic/info";
import dhelp from "./commands/donate/dhelp";
import donate from "./commands/donate/donate";
import exp from "./commands/donate/exp";
import join from "./commands/music/join";
import loop from "./commands/music/loop";
import mhelp from "./commands/music/mhelp";
import pause from "./commands/music/pause";
import play from "./commands/music/play";
import playing from "./commands/music/playing";
import queue from "./commands/music/queue";
import resume from "./commands/music/resume";
import skip from "./commands/music/skip";
import stop from "./commands/music/stop";

export class CommandManager {
    private static _instance: CommandManager;
    private readonly _commands: Collection<string, Command>;

    private constructor() {
        this._commands = new Collection<string, Command>();
        this.loadCommands();
    }

    public static get instance(): CommandManager {
        if (!CommandManager._instance) {
            CommandManager._instance = new CommandManager();
        }
        return CommandManager._instance;
    }

    public getCommands(): IterableIterator<Command> {
        return this._commands.values();
    }

    public getCommand(name: string): Command | undefined {
        return this._commands.get(name);
    }

    private loadCommands() {
        this.loadAdminCommands();
        this.loadAdvanceCommands();
        this.loadBasicCommands();
        this.loadDonateCommands();
        this.loadMusicCommands();
    }

    private loadCommand(command: Command) {
        this._commands.set(command.data.name, command);
    }

    private loadMusicCommands() {
        this.loadCommand(join);
        this.loadCommand(loop);
        this.loadCommand(mhelp);
        this.loadCommand(pause);
        this.loadCommand(play);
        this.loadCommand(playing);
        this.loadCommand(queue);
        this.loadCommand(resume);
        this.loadCommand(skip);
        this.loadCommand(stop);
    }

    private loadDonateCommands() {
        this.loadCommand(dhelp);
        this.loadCommand(donate);
        this.loadCommand(exp);
    }

    private loadBasicCommands() {
        this.loadCommand(avatar);
        this.loadCommand(choose);
        this.loadCommand(help);
        this.loadCommand(image);
        this.loadCommand(info);
    }

    private loadAdvanceCommands() {
        this.loadCommand(reply);
        this.loadCommand(xhelp);
    }

    private loadAdminCommands() {
        this.loadCommand(grab);
    }
}
