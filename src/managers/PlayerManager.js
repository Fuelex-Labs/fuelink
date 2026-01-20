'use strict';

/**
 * @file Player manager for Fuelink
 * @module fuelink/managers/PlayerManager
 */

const { Player } = require('../structures/Player');
const { Events, ErrorCodes } = require('../utils/Constants');

/**
 * Manages player instances
 */
class PlayerManager extends Map {
    /**
     * Create a new PlayerManager
     * @param {Object} manager - Fuelink manager
     */
    constructor(manager) {
        super();

        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;
    }

    /**
     * Create a new player
     * @param {Object} options - Player options
     * @returns {Promise<Player>}
     */
    async create(options) {
        // Check if player already exists
        if (this.has(options.guildId)) {
            return this.get(options.guildId);
        }

        // Get a node
        const node = options.node || this.manager.nodes.getBest();
        if (!node) {
            const error = new Error('No available nodes');
            error.code = ErrorCodes.NO_NODES;
            throw error;
        }

        // Create the player
        const player = new Player(this.manager, {
            ...options,
            node
        });

        this.set(options.guildId, player);

        // Forward player events
        this._forwardPlayerEvents(player);

        // Connect to voice
        await player.connect();

        this.manager.emit(Events.PLAYER_CREATE, { player });

        return player;
    }

    /**
     * Get an existing player
     * @param {string} guildId - Guild ID
     * @returns {Player|undefined}
     */
    get(guildId) {
        return super.get(guildId);
    }

    /**
     * Check if a player exists
     * @param {string} guildId - Guild ID
     * @returns {boolean}
     */
    has(guildId) {
        return super.has(guildId);
    }

    /**
     * Get or create a player
     * @param {Object} options - Player options (must include guildId)
     * @returns {Promise<Player>}
     */
    async resolve(options) {
        return this.get(options.guildId) || this.create(options);
    }

    /**
     * Destroy a player
     * @param {string} guildId - Guild ID
     * @returns {Promise<boolean>}
     */
    async destroy(guildId) {
        const player = this.get(guildId);
        if (!player) return false;

        await player.destroy();
        return true;
    }

    /**
     * Destroy all players
     * @returns {Promise<void>}
     */
    async destroyAll() {
        const promises = [];
        for (const player of this.values()) {
            promises.push(player.destroy().catch(() => { }));
        }
        await Promise.all(promises);
    }

    /**
     * Get all active players (playing or paused)
     * @returns {Player[]}
     */
    getActive() {
        return Array.from(this.values()).filter(p => p.isActive);
    }

    /**
     * Get all playing players
     * @returns {Player[]}
     */
    getPlaying() {
        return Array.from(this.values()).filter(p => p.playing && !p.paused);
    }

    /**
     * Get players by node
     * @param {string} nodeName - Node name
     * @returns {Player[]}
     */
    getByNode(nodeName) {
        return Array.from(this.values()).filter(p => p.node?.name === nodeName);
    }

    /**
     * Forward player events to manager
     * @private
     * @param {Player} player
     */
    _forwardPlayerEvents(player) {
        const events = [
            Events.PLAYER_UPDATE,
            Events.PLAYER_MOVE,
            Events.PLAYER_DISCONNECT,
            Events.PLAYER_DESTROY,
            Events.TRACK_START,
            Events.TRACK_END,
            Events.TRACK_STUCK,
            Events.TRACK_ERROR,
            Events.QUEUE_ADD,
            Events.QUEUE_REMOVE,
            Events.QUEUE_SHUFFLE,
            Events.QUEUE_CLEAR,
            Events.QUEUE_END
        ];

        for (const event of events) {
            player.on(event, (data) => this.manager.emit(event, data));
        }
    }

    /**
     * Get player statistics
     * @returns {Object}
     */
    getStats() {
        const players = Array.from(this.values());

        return {
            total: players.length,
            playing: players.filter(p => p.playing && !p.paused).length,
            paused: players.filter(p => p.paused).length,
            idle: players.filter(p => !p.playing).length,
            totalQueueSize: players.reduce((acc, p) => acc + p.queue.size, 0)
        };
    }

    /**
     * Serialize all players
     * @returns {Object[]}
     */
    toJSON() {
        return Array.from(this.values()).map(p => p.toJSON());
    }

    /**
     * Restore players from serialized data
     * @param {Object[]} data - Serialized player data
     * @returns {Promise<Player[]>}
     */
    async fromJSON(data) {
        const restored = [];

        for (const playerData of data) {
            try {
                const player = await this.create({
                    guildId: playerData.guildId,
                    voiceChannel: playerData.voiceChannel,
                    textChannel: playerData.textChannel
                });

                await player.fromJSON(playerData);
                restored.push(player);
            } catch (error) {
                this.manager.logger?.error(
                    `Failed to restore player ${playerData.guildId}: ${error.message}`
                );
            }
        }

        return restored;
    }
}

module.exports = { PlayerManager };
