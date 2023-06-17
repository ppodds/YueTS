import { Collection, CommandInteraction, Guild } from "discord.js";
import { MusicPlayer } from "./music-player";
import { singleton, injectable } from "tsyringe";
import { LoggerService } from "../utils/logger-service";

@singleton()
@injectable()
export class MusicService {
    constructor(private readonly _loggerService: LoggerService) {}

    /**
     * Guild music players
     * key: guildId  value: MusicPlayer
     */
    private players = new Collection<string, MusicPlayer>();
    /**
     * Get guild music player
     * @param {CommandInteraction} interaction interaction object of discord
     * @returns {MusicPlayer} guild's music player
     */
    public get(interaction: CommandInteraction): MusicPlayer {
        if (!interaction.guild || !interaction.guildId)
            throw new Error("Guild is undefined in interaction object");
        const musicPlayer = this.players.get(interaction.guildId);
        if (musicPlayer && !musicPlayer.destroyed) {
            return musicPlayer;
        } else {
            this._loggerService.debug(
                `Creating new music player for ${interaction.guild.name}`
            );
            const t = new MusicPlayer(this._loggerService, interaction);
            this.players.set(interaction.guildId, t);
            return t;
        }
    }
    /**
     * Check whether the guild's music player exists
     * @param guild guild object
     */
    public exist(guild: Guild) {
        const musicPlayer = this.players.get(guild.id);
        if (musicPlayer) {
            if (!musicPlayer.destroyed) return true;
            else this.cleanup(guild);
        }
        return false;
    }
    /**
     * Delete guild's music player
     * @param guild target guild
     */
    public cleanup(guild: Guild) {
        const musicPlayer = this.players.get(guild.id);
        if (!musicPlayer) return;
        musicPlayer.destroy();
        this.players.delete(guild.id);
    }
}
