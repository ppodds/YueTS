import { Collection, CommandInteraction, Guild } from "discord.js";
import { Logger } from "../utils/Logger";
import { MusicPlayer } from "./MusicPlayer";

class PlayerManager {
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
        const musicPlayer = this.players.get(interaction.guildId);
        if (musicPlayer && !musicPlayer.destroyed) {
            return musicPlayer;
        } else {
            Logger.debug(
                `Creating new music player for ${interaction.guild.name}`
            );
            const t = new MusicPlayer(interaction);
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
        musicPlayer.destroy();
        this.players.delete(guild.id);
    }
}

const playerManager = new PlayerManager();

export default playerManager;
