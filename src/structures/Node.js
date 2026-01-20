'use strict';

/**
 * @file Lavalink node connection handler
 * @module fuelink/structures/Node
 */

const WebSocket = require('ws');
const { request } = require('undici');
const { FuelinkEmitter } = require('../events/EventEmitter');
const {
    NodeState,
    Events,
    OpCodes,
    LavalinkEvents,
    Defaults
} = require('../utils/Constants');
const { Util } = require('../utils/Util');

/**
 * @typedef {Object} NodeOptions
 * @property {string} name - Node identifier
 * @property {string} host - Node host
 * @property {number} [port=2333] - Node port
 * @property {string} password - Node password
 * @property {boolean} [secure=false] - Use HTTPS/WSS
 * @property {number} [retryAmount=5] - Max reconnection attempts
 * @property {number} [retryDelay=5000] - Delay between reconnects
 * @property {string} [resumeKey] - Session resume key
 * @property {number} [resumeTimeout=60] - Resume timeout in seconds
 * @property {number} [priority=1] - Node priority (lower = preferred)
 * @property {string[]} [regions] - Preferred regions
 */

/**
 * @typedef {Object} NodeStats
 * @property {number} players - Total players
 * @property {number} playingPlayers - Currently playing
 * @property {number} uptime - Node uptime
 * @property {Object} memory - Memory usage
 * @property {Object} cpu - CPU usage
 * @property {Object} frameStats - Frame statistics
 */

/**
 * Represents a Lavalink node connection
 * @extends FuelinkEmitter
 */
class Node extends FuelinkEmitter {
    /**
     * Create a new Node
     * @param {Object} manager - Fuelink manager instance
     * @param {NodeOptions} options - Node options
     */
    constructor(manager, options) {
        super();

        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * Node name/identifier
         * @type {string}
         */
        this.name = options.name;

        /**
         * Node host
         * @type {string}
         */
        this.host = options.host;

        /**
         * Node port
         * @type {number}
         */
        this.port = options.port ?? Defaults.NODE.port;

        /**
         * Node password
         * @type {string}
         */
        this.password = options.password;

        /**
         * Use secure connection
         * @type {boolean}
         */
        this.secure = options.secure ?? Defaults.NODE.secure;

        /**
         * Max reconnection attempts
         * @type {number}
         */
        this.retryAmount = options.retryAmount ?? Defaults.NODE.retryAmount;

        /**
         * Delay between reconnects (ms)
         * @type {number}
         */
        this.retryDelay = options.retryDelay ?? Defaults.NODE.retryDelay;

        /**
         * Session resume key
         * @type {string|null}
         */
        this.resumeKey = options.resumeKey ?? null;

        /**
         * Resume timeout in seconds
         * @type {number}
         */
        this.resumeTimeout = options.resumeTimeout ?? Defaults.NODE.resumeTimeout;

        /**
         * Node priority (lower = preferred)
         * @type {number}
         */
        this.priority = options.priority ?? Defaults.NODE.priority;

        /**
         * Preferred regions for this node
         * @type {string[]}
         */
        this.regions = options.regions ?? [];

        /**
         * Current node state
         * @type {string}
         */
        this.state = NodeState.DISCONNECTED;

        /**
         * Session ID from Lavalink
         * @type {string|null}
         */
        this.sessionId = null;

        /**
         * Node statistics
         * @type {NodeStats|null}
         */
        this.stats = null;

        /**
         * WebSocket connection
         * @type {WebSocket|null}
         * @private
         */
        this._ws = null;

        /**
         * Reconnection attempts
         * @type {number}
         * @private
         */
        this._reconnectAttempts = 0;

        /**
         * Reconnection timer
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._reconnectTimeout = null;

        /**
         * Last connection time
         * @type {number}
         */
        this.connectedAt = 0;
    }

    /**
     * Get REST URL
     * @type {string}
     */
    get restUrl() {
        return `http${this.secure ? 's' : ''}://${this.host}:${this.port}`;
    }

    /**
     * Get WebSocket URL
     * @type {string}
     */
    get wsUrl() {
        return `ws${this.secure ? 's' : ''}://${this.host}:${this.port}/v4/websocket`;
    }

    /**
     * Check if node is connected
     * @type {boolean}
     */
    get connected() {
        return this.state === NodeState.CONNECTED;
    }

    /**
     * Calculate node penalty for load balancing
     * @type {number}
     */
    get penalty() {
        if (!this.stats) return 0;

        let penalty = 0;

        // Player count penalties
        penalty += this.stats.players * 1;
        penalty += this.stats.playingPlayers * 1.5;

        // CPU penalty
        if (this.stats.cpu) {
            penalty += Math.pow(this.stats.cpu.systemLoad, 2) * 100;
        }

        // Frame stats penalty
        if (this.stats.frameStats) {
            penalty += this.stats.frameStats.deficit * 3;
            penalty += this.stats.frameStats.nulled * 2;
        }

        return penalty;
    }

    /**
     * Connect to the Lavalink node
     * @returns {Promise<void>}
     */
    async connect() {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            return;
        }

        this.state = NodeState.CONNECTING;

        const headers = {
            'Authorization': this.password,
            'User-Id': this.manager.userId,
            'Client-Name': 'Fuelink/1.0.0'
        };

        // Add resume key if available
        if (this.sessionId) {
            headers['Session-Id'] = this.sessionId;
        }

        return new Promise((resolve, reject) => {
            this._ws = new WebSocket(this.wsUrl, { headers });

            const timeout = setTimeout(() => {
                if (this._ws.readyState !== WebSocket.OPEN) {
                    this._ws.close();
                    reject(new Error('Connection timeout'));
                }
            }, 15000);

            this._ws.on('open', () => {
                clearTimeout(timeout);
                this._onOpen();
                resolve();
            });

            this._ws.on('close', (code, reason) => {
                clearTimeout(timeout);
                this._onClose(code, reason.toString());
            });

            this._ws.on('error', (error) => {
                clearTimeout(timeout);
                this._onError(error);
                if (this.state === NodeState.CONNECTING) {
                    reject(error);
                }
            });

            this._ws.on('message', (data) => {
                this._onMessage(data);
            });
        });
    }

    /**
     * Disconnect from the node
     * @param {number} [code=1000] - Close code
     * @param {string} [reason='Normal closure'] - Close reason
     */
    disconnect(code = 1000, reason = 'Normal closure') {
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }

        if (this._ws) {
            this._ws.close(code, reason);
            this._ws = null;
        }

        this.state = NodeState.DISCONNECTED;
    }

    /**
     * Destroy the node
     */
    destroy() {
        this.disconnect(1000, 'Node destroyed');
        this.state = NodeState.DESTROYED;
        this.removeAllListeners();
    }

    /**
     * Handle WebSocket open
     * @private
     */
    _onOpen() {
        this._reconnectAttempts = 0;
        this.connectedAt = Date.now();
        this.manager.logger?.success(`Connected to node`, this.name);
    }

    /**
     * Handle WebSocket close
     * @private
     * @param {number} code - Close code
     * @param {string} reason - Close reason
     */
    _onClose(code, reason) {
        this.manager.logger?.warn(`Disconnected (${code}): ${reason}`, this.name);

        this.emit(Events.NODE_DISCONNECT, { node: this, code, reason });

        if (this.state !== NodeState.DESTROYED && this._reconnectAttempts < this.retryAmount) {
            this._scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket error
     * @private
     * @param {Error} error
     */
    _onError(error) {
        this.manager.logger?.error(`Error: ${error.message}`, this.name);
        this.emit(Events.NODE_ERROR, { node: this, error });
    }

    /**
     * Handle WebSocket message
     * @private
     * @param {Buffer} data
     */
    _onMessage(data) {
        let payload;
        try {
            payload = JSON.parse(data.toString());
        } catch {
            return;
        }

        this.emit(Events.NODE_RAW, { node: this, payload });

        switch (payload.op) {
            case OpCodes.READY:
                this._handleReady(payload);
                break;
            case OpCodes.STATS:
                this._handleStats(payload);
                break;
            case OpCodes.PLAYER_UPDATE:
                this._handlePlayerUpdate(payload);
                break;
            case OpCodes.EVENT:
                this._handleEvent(payload);
                break;
        }
    }

    /**
     * Handle ready payload
     * @private
     * @param {Object} payload
     */
    _handleReady(payload) {
        this.sessionId = payload.sessionId;
        this.state = NodeState.CONNECTED;

        const resumed = payload.resumed ?? false;
        this.manager.logger?.success(
            resumed ? 'Session resumed' : 'Ready',
            this.name
        );

        // Configure resuming if key is set
        if (this.resumeKey) {
            this._configureResuming();
        }

        this.emit(Events.NODE_READY, { node: this, resumed });
        this.manager.emit(Events.NODE_CONNECT, { node: this });
    }

    /**
     * Handle stats payload
     * @private
     * @param {Object} payload
     */
    _handleStats(payload) {
        this.stats = {
            players: payload.players,
            playingPlayers: payload.playingPlayers,
            uptime: payload.uptime,
            memory: payload.memory,
            cpu: payload.cpu,
            frameStats: payload.frameStats
        };
        this.emit(Events.NODE_STATS, { node: this, stats: this.stats });
    }

    /**
     * Handle player update payload
     * @private
     * @param {Object} payload
     */
    _handlePlayerUpdate(payload) {
        const player = this.manager.players.get(payload.guildId);
        if (player) {
            player._handleUpdate(payload.state);
        }
    }

    /**
     * Handle event payload
     * @private
     * @param {Object} payload
     */
    _handleEvent(payload) {
        const player = this.manager.players.get(payload.guildId);
        if (!player) return;

        switch (payload.type) {
            case LavalinkEvents.TRACK_START:
                player._handleTrackStart(payload.track);
                break;
            case LavalinkEvents.TRACK_END:
                player._handleTrackEnd(payload.track, payload.reason);
                break;
            case LavalinkEvents.TRACK_STUCK:
                player._handleTrackStuck(payload.track, payload.thresholdMs);
                break;
            case LavalinkEvents.TRACK_EXCEPTION:
                player._handleTrackException(payload.track, payload.exception);
                break;
            case LavalinkEvents.WEBSOCKET_CLOSED:
                player._handleWebSocketClosed(payload.code, payload.reason, payload.byRemote);
                break;
        }
    }

    /**
     * Configure session resuming
     * @private
     */
    async _configureResuming() {
        try {
            await this.rest('PATCH', `/v4/sessions/${this.sessionId}`, {
                resuming: true,
                timeout: this.resumeTimeout
            });
            this.manager.logger?.debug('Resuming configured', this.name);
        } catch (error) {
            this.manager.logger?.warn(`Failed to configure resuming: ${error.message}`, this.name);
        }
    }

    /**
     * Schedule reconnection attempt
     * @private
     */
    _scheduleReconnect() {
        this.state = NodeState.RECONNECTING;
        this._reconnectAttempts++;

        const delay = this.retryDelay * Math.pow(1.5, this._reconnectAttempts - 1);
        const jitter = Math.random() * 1000;

        this.manager.logger?.info(
            `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this._reconnectAttempts}/${this.retryAmount})`,
            this.name
        );

        this.emit(Events.NODE_RECONNECT, {
            node: this,
            attempt: this._reconnectAttempts
        });

        this._reconnectTimeout = setTimeout(async () => {
            try {
                await this.connect();
            } catch {
                // Error handled in _onError
            }
        }, delay + jitter);
    }

    /**
     * Send payload via WebSocket
     * @param {Object} payload - Payload to send
     */
    send(payload) {
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }
        this._ws.send(JSON.stringify(payload));
    }

    /**
     * Make a REST request to Lavalink
     * @param {string} method - HTTP method
     * @param {string} path - API path
     * @param {Object} [body] - Request body
     * @returns {Promise<Object>}
     */
    async rest(method, path, body = null) {
        const url = `${this.restUrl}${path}`;

        const options = {
            method,
            headers: {
                'Authorization': this.password,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await request(url, options);

        if (response.statusCode >= 400) {
            const text = await response.body.text();
            throw new Error(`REST ${method} ${path} failed (${response.statusCode}): ${text}`);
        }

        // Handle empty responses
        const text = await response.body.text();
        if (!text) return null;

        return JSON.parse(text);
    }

    /**
     * Load tracks from Lavalink
     * @param {string} identifier - Search query or URL
     * @returns {Promise<Object>}
     */
    async loadTracks(identifier) {
        return this.rest('GET', `/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`);
    }

    /**
     * Decode a track
     * @param {string} encoded - Encoded track
     * @returns {Promise<Object>}
     */
    async decodeTrack(encoded) {
        return this.rest('GET', `/v4/decodetrack?encodedTrack=${encodeURIComponent(encoded)}`);
    }

    /**
     * Decode multiple tracks
     * @param {string[]} tracks - Encoded tracks
     * @returns {Promise<Object[]>}
     */
    async decodeTracks(tracks) {
        return this.rest('POST', '/v4/decodetracks', tracks);
    }

    /**
     * Get Lavalink info
     * @returns {Promise<Object>}
     */
    async getInfo() {
        return this.rest('GET', '/v4/info');
    }

    /**
     * Get node statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        return this.rest('GET', '/v4/stats');
    }

    /**
     * Update player state
     * @param {string} guildId - Guild ID
     * @param {Object} data - Player data
     * @param {boolean} [noReplace=false] - Don't replace current track
     * @returns {Promise<Object>}
     */
    async updatePlayer(guildId, data, noReplace = false) {
        const path = `/v4/sessions/${this.sessionId}/players/${guildId}?noReplace=${noReplace}`;
        return this.rest('PATCH', path, data);
    }

    /**
     * Destroy a player
     * @param {string} guildId - Guild ID
     * @returns {Promise<void>}
     */
    async destroyPlayer(guildId) {
        const path = `/v4/sessions/${this.sessionId}/players/${guildId}`;
        await this.rest('DELETE', path);
    }

    /**
     * Serialize node state
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            host: this.host,
            port: this.port,
            secure: this.secure,
            priority: this.priority,
            regions: this.regions,
            state: this.state,
            sessionId: this.sessionId,
            stats: this.stats,
            penalty: this.penalty,
            connectedAt: this.connectedAt
        };
    }
}

module.exports = { Node };
