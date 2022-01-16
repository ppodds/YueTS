import { Collection, CommandInteraction, Guild } from "discord.js";
import { MusicPlayer } from "./MusicPlayer.js";

class PlayerManager {
    /**
     * Guild music players
     * key: guildId  value: MusicPlayer
     */
    private players = new Collection<string, MusicPlayer>();
    /**
     * Get guild music player
     * @param {CommandInteraction} interaction interaction object of discord.js
     * @returns {MusicPlayer} guild's music player
     */
    public get(interaction: CommandInteraction): MusicPlayer {
        const musicPlayer = this.players.get(interaction.guildId);
        if (musicPlayer && !musicPlayer.destroyed) {
            return this.players.get(interaction.guildId);
        } else {
            const musicPlayer = new MusicPlayer(interaction);
            this.players.set(interaction.guildId, musicPlayer);
            return musicPlayer;
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
