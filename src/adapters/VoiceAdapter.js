'use strict';

/**
 * @file Voice adapter for Discord library integration
 * @module fuelink/adapters/VoiceAdapter
 */

/**
 * Voice adapter for Discord voice state handling
 * Bridges between Discord.js/Eris and Fuelink
 */
class VoiceAdapter {
    /**
     * Create a new VoiceAdapter
     * @param {Object} manager - Fuelink manager
     */
    constructor(manager) {
        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * Discord client reference
         * @type {Object|null}
         */
        this.client = null;

        /**
         * Pending voice state updates (guildId -> voiceState)
         * @type {Map<string, Object>}
         * @private
         */
        this._pendingStates = new Map();

        /**
         * Pending voice server updates (guildId -> voiceServer)
         * @type {Map<string, Object>}
         * @private
         */
        this._pendingServers = new Map();
    }

    /**
     * Setup the adapter with a Discord client
     * @param {Object} client - Discord client
     */
    setup(client) {
        this.client = client;

        // Auto-detect library and setup handlers
        if (this._isDiscordJS(client)) {
            this._setupDiscordJS(client);
        } else if (this._isEris(client)) {
            this._setupEris(client);
        } else {
            this.manager.logger?.warn('Unknown Discord library - manual voice handling required');
        }
    }

    /**
     * Check if client is Discord.js
     * @private
     * @param {Object} client
     * @returns {boolean}
     */
    _isDiscordJS(client) {
        return !!client.ws && typeof client.ws.on === 'function';
    }

    /**
     * Check if client is Eris
     * @private
     * @param {Object} client
     * @returns {boolean}
     */
    _isEris(client) {
        return !!client.shards && typeof client.on === 'function';
    }

    /**
     * Setup Discord.js handlers
     * @private
     * @param {Object} client
     */
    _setupDiscordJS(client) {
        // Listen for raw events for voice updates
        client.on('raw', (packet) => {
            this._handleRawPacket(packet);
        });

        this.manager.logger?.debug('Discord.js voice adapter configured');
    }

    /**
     * Setup Eris handlers
     * @private
     * @param {Object} client
     */
    _setupEris(client) {
        // Eris uses different event names
        client.on('rawWS', (packet) => {
            this._handleRawPacket(packet);
        });

        this.manager.logger?.debug('Eris voice adapter configured');
    }

    /**
     * Handle raw Discord packet
     * @private
     * @param {Object} packet
     */
    _handleRawPacket(packet) {
        switch (packet.t) {
            case 'VOICE_STATE_UPDATE':
                this._handleVoiceStateUpdate(packet.d);
                break;
            case 'VOICE_SERVER_UPDATE':
                this._handleVoiceServerUpdate(packet.d);
                break;
        }
    }

    /**
     * Handle VOICE_STATE_UPDATE
     * @private
     * @param {Object} data
     */
    _handleVoiceStateUpdate(data) {
        // Only handle our own voice state
        if (data.user_id !== this.manager.userId) return;

        const guildId = data.guild_id;
        const player = this.manager.players.get(guildId);

        if (player) {
            player.connection.handleVoiceStateUpdate({
                sessionId: data.session_id,
                channelId: data.channel_id,
                selfDeaf: data.self_deaf,
                selfMute: data.self_mute
            });
        }

        // Store for pending connection
        this._pendingStates.set(guildId, {
            sessionId: data.session_id,
            channelId: data.channel_id
        });

        // Check if we have both updates
        this._checkPendingConnection(guildId);
    }

    /**
     * Handle VOICE_SERVER_UPDATE
     * @private
     * @param {Object} data
     */
    _handleVoiceServerUpdate(data) {
        const guildId = data.guild_id;
        const player = this.manager.players.get(guildId);

        if (player) {
            player.connection.handleVoiceServerUpdate({
                token: data.token,
                endpoint: data.endpoint
            });
        }

        // Store for pending connection
        this._pendingServers.set(guildId, {
            token: data.token,
            endpoint: data.endpoint
        });

        // Check if we have both updates
        this._checkPendingConnection(guildId);
    }

    /**
     * Check for pending voice connection completion
     * @private
     * @param {string} guildId
     */
    _checkPendingConnection(guildId) {
        const state = this._pendingStates.get(guildId);
        const server = this._pendingServers.get(guildId);

        if (state && server) {
            // Clear pending data
            this._pendingStates.delete(guildId);
            this._pendingServers.delete(guildId);

            this.manager.logger?.debug(
                `Voice connection ready for ${guildId}`,
                'VoiceAdapter'
            );
        }
    }

    /**
     * Send voice state update to Discord
     * @param {Object} data - Voice update data
     */
    sendVoiceUpdate(data) {
        if (!this.client) {
            throw new Error('Voice adapter not initialized');
        }

        const payload = {
            op: 4, // VOICE_STATE_UPDATE
            d: {
                guild_id: data.guildId,
                channel_id: data.channelId,
                self_deaf: data.selfDeaf ?? true,
                self_mute: data.selfMute ?? false
            }
        };

        // Discord.js
        if (this._isDiscordJS(this.client)) {
            const guild = this.client.guilds.cache.get(data.guildId);
            if (guild?.shard) {
                guild.shard.send(payload);
            } else {
                // Fallback for shardless clients
                this.client.ws.shards?.first()?.send(payload);
            }
            return;
        }

        // Eris
        if (this._isEris(this.client)) {
            const guild = this.client.guilds.get(data.guildId);
            if (guild) {
                guild.shard.sendWS(4, payload.d);
            }
            return;
        }

        throw new Error('Unable to send voice update - unknown library');
    }

    /**
     * Get guild shard ID (Discord.js)
     * @param {string} guildId - Guild ID
     * @returns {number}
     */
    getShardId(guildId) {
        if (!this.client) return 0;

        // Discord.js
        if (this._isDiscordJS(this.client)) {
            const guild = this.client.guilds.cache.get(guildId);
            return guild?.shardId ?? 0;
        }

        // Eris - calculate shard ID
        if (this._isEris(this.client)) {
            const shardCount = this.client.shards.size || 1;
            return Number((BigInt(guildId) >> BigInt(22)) % BigInt(shardCount));
        }

        return 0;
    }

    /**
     * Check if connected to a voice channel in a guild
     * @param {string} guildId - Guild ID
     * @returns {boolean}
     */
    isConnected(guildId) {
        if (!this.client) return false;

        // Discord.js
        if (this._isDiscordJS(this.client)) {
            const guild = this.client.guilds.cache.get(guildId);
            return !!guild?.members?.me?.voice?.channelId;
        }

        // Eris
        if (this._isEris(this.client)) {
            return !!this.client.voiceConnections.get(guildId);
        }

        return false;
    }

    /**
     * Get current voice channel ID
     * @param {string} guildId - Guild ID
     * @returns {string|null}
     */
    getVoiceChannelId(guildId) {
        if (!this.client) return null;

        // Discord.js
        if (this._isDiscordJS(this.client)) {
            const guild = this.client.guilds.cache.get(guildId);
            return guild?.members?.me?.voice?.channelId ?? null;
        }

        // Eris
        if (this._isEris(this.client)) {
            const connection = this.client.voiceConnections.get(guildId);
            return connection?.channelId ?? null;
        }

        return null;
    }
}

module.exports = { VoiceAdapter };
