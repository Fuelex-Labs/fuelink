'use strict';

/**
 * @file Voice connection handler for Fuelink
 * @module fuelink/structures/Connection
 */

const { FuelinkEmitter } = require('../events/EventEmitter');

/**
 * @typedef {Object} VoiceState
 * @property {string} sessionId - Voice session ID
 * @property {string} channelId - Voice channel ID
 * @property {boolean} selfDeaf - Self deafen state
 * @property {boolean} selfMute - Self mute state
 */

/**
 * @typedef {Object} VoiceServer
 * @property {string} token - Voice server token
 * @property {string} endpoint - Voice server endpoint
 */

/**
 * Handles voice connection state for a player
 * @extends FuelinkEmitter
 */
class Connection extends FuelinkEmitter {
    /**
     * Create a new Connection
     * @param {Object} player - Parent player instance
     */
    constructor(player) {
        super();

        /**
         * Parent player
         * @type {Object}
         */
        this.player = player;

        /**
         * Guild ID
         * @type {string}
         */
        this.guildId = player.guildId;

        /**
         * Voice channel ID
         * @type {string|null}
         */
        this.channelId = null;

        /**
         * Voice session ID
         * @type {string|null}
         */
        this.sessionId = null;

        /**
         * Voice server token
         * @type {string|null}
         */
        this.token = null;

        /**
         * Voice server endpoint
         * @type {string|null}
         */
        this.endpoint = null;

        /**
         * Voice region
         * @type {string|null}
         */
        this.region = null;

        /**
         * Whether connection is established
         * @type {boolean}
         */
        this.connected = false;

        /**
         * Self deafen state
         * @type {boolean}
         */
        this.selfDeaf = true;

        /**
         * Self mute state
         * @type {boolean}
         */
        this.selfMute = false;

        /**
         * Connection timeout timer
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._connectTimeout = null;

        /**
         * Pending voice update deferred
         * @type {Object|null}
         * @private
         */
        this._pendingConnection = null;
    }

    /**
     * Connect to a voice channel
     * @param {Object} options - Connection options
     * @param {string} options.channelId - Voice channel ID
     * @param {boolean} [options.selfDeaf=true] - Self deafen
     * @param {boolean} [options.selfMute=false] - Self mute
     * @param {number} [options.timeout=15000] - Connection timeout
     * @returns {Promise<void>}
     */
    async connect(options) {
        const {
            channelId,
            selfDeaf = true,
            selfMute = false,
            timeout = 15000
        } = options;

        this.channelId = channelId;
        this.selfDeaf = selfDeaf;
        this.selfMute = selfMute;

        // Create pending connection promise
        this._pendingConnection = this._createDeferred();

        // Set connection timeout
        this._connectTimeout = setTimeout(() => {
            if (this._pendingConnection) {
                this._pendingConnection.reject(new Error('Voice connection timeout'));
                this._pendingConnection = null;
            }
        }, timeout);

        // Send voice state update to Discord
        this._sendVoiceUpdate();

        // Wait for voice connection to be established
        await this._pendingConnection.promise;
    }

    /**
     * Disconnect from voice channel
     * @returns {void}
     */
    disconnect() {
        this.channelId = null;
        this.sessionId = null;
        this.token = null;
        this.endpoint = null;
        this.connected = false;

        this._clearTimeout();

        // Send disconnect to Discord
        this._sendVoiceUpdate();
    }

    /**
     * Move to a different voice channel
     * @param {string} channelId - New channel ID
     * @returns {void}
     */
    move(channelId) {
        this.channelId = channelId;
        this._sendVoiceUpdate();
    }

    /**
     * Update self deafen state
     * @param {boolean} deaf - Deafen state
     * @returns {void}
     */
    setDeaf(deaf) {
        this.selfDeaf = deaf;
        this._sendVoiceUpdate();
    }

    /**
     * Update self mute state
     * @param {boolean} mute - Mute state
     * @returns {void}
     */
    setMute(mute) {
        this.selfMute = mute;
        this._sendVoiceUpdate();
    }

    /**
     * Handle voice state update from Discord
     * @param {VoiceState} state - Voice state data
     */
    handleVoiceStateUpdate(state) {
        // Check if we've been disconnected
        if (!state.channelId && this.channelId) {
            this.channelId = null;
            this.connected = false;
            this.emit('disconnect');
            return;
        }

        // Check if we've moved channels
        if (state.channelId && this.channelId && state.channelId !== this.channelId) {
            const oldChannel = this.channelId;
            this.channelId = state.channelId;
            this.emit('move', { oldChannel, newChannel: state.channelId });
        }

        this.sessionId = state.sessionId;
        this.channelId = state.channelId;

        this._checkReady();
    }

    /**
     * Handle voice server update from Discord
     * @param {VoiceServer} server - Voice server data
     */
    handleVoiceServerUpdate(server) {
        this.token = server.token;
        this.endpoint = server.endpoint;

        // Extract region from endpoint
        if (this.endpoint) {
            const match = this.endpoint.match(/^([a-z-]+)\d*\./);
            this.region = match ? match[1] : null;
        }

        this._checkReady();
    }

    /**
     * Check if voice connection is ready
     * @private
     */
    _checkReady() {
        if (this.sessionId && this.token && this.endpoint) {
            this.connected = true;
            this._clearTimeout();

            // Resolve pending connection
            if (this._pendingConnection) {
                this._pendingConnection.resolve();
                this._pendingConnection = null;
            }

            // Emit ready event with connection details
            this.emit('ready', {
                sessionId: this.sessionId,
                token: this.token,
                endpoint: this.endpoint,
                region: this.region
            });
        }
    }

    /**
     * Send voice state update to Discord
     * @private
     */
    _sendVoiceUpdate() {
        // This should be overridden by the voice adapter
        this.emit('voiceUpdate', {
            guildId: this.guildId,
            channelId: this.channelId,
            selfDeaf: this.selfDeaf,
            selfMute: this.selfMute
        });
    }

    /**
     * Clear connection timeout
     * @private
     */
    _clearTimeout() {
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
    }

    /**
     * Create a deferred promise
     * @private
     * @returns {{ promise: Promise, resolve: Function, reject: Function }}
     */
    _createDeferred() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    }

    /**
     * Get voice update payload for Lavalink
     * @returns {Object}
     */
    getVoicePayload() {
        return {
            sessionId: this.sessionId,
            event: {
                token: this.token,
                endpoint: this.endpoint
            }
        };
    }

    /**
     * Serialize connection state
     * @returns {Object}
     */
    toJSON() {
        return {
            guildId: this.guildId,
            channelId: this.channelId,
            sessionId: this.sessionId,
            selfDeaf: this.selfDeaf,
            selfMute: this.selfMute,
            connected: this.connected,
            region: this.region
        };
    }

    /**
     * Clean up connection
     */
    destroy() {
        this.disconnect();
        this.removeAllListeners();
    }
}

module.exports = { Connection };
