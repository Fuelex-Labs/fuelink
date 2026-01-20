'use strict';

/**
 * @file Main Fuelink client
 * @module fuelink
 */

const { FuelinkEmitter } = require('./events/EventEmitter');
const { NodeManager } = require('./managers/NodeManager');
const { PlayerManager } = require('./managers/PlayerManager');
const { PluginManager } = require('./plugins/PluginManager');
const { VoiceAdapter } = require('./adapters/VoiceAdapter');
const { DistubeAdapter } = require('./adapters/DistubeAdapter');
const { SessionStore } = require('./persistence/SessionStore');
const { Track } = require('./structures/Track');
const { Logger, LogLevel } = require('./utils/Logger');
const { Events, ErrorCodes, Defaults } = require('./utils/Constants');

/**
 * @typedef {Object} FuelinkOptions
 * @property {Object[]} nodes - Lavalink node configurations
 * @property {string} [clientName='Fuelink'] - Client name for Lavalink
 * @property {boolean} [autoConnect=true] - Auto-connect to nodes on init
 * @property {boolean} [autoResume=false] - Auto-resume players on startup
 * @property {Object} [persistence] - Persistence configuration
 * @property {Object} [player] - Default player options
 * @property {Object} [plugins] - Plugin options
 * @property {Object} [logger] - Logger options
 */

/**
 * Main Fuelink client - the unified Lavalink client for Fuelex
 * @extends FuelinkEmitter
 */
class Fuelink extends FuelinkEmitter {
    /**
     * Create a new Fuelink client
     * @param {FuelinkOptions} options - Client options
     */
    constructor(options = {}) {
        super();

        /**
         * Client options
         * @type {FuelinkOptions}
         */
        this.options = options;

        /**
         * Logger instance
         * @type {Logger}
         */
        this.logger = new Logger({
            prefix: 'Fuelink',
            level: options.logger?.level ?? LogLevel.INFO,
            ...options.logger
        });

        /**
         * Discord user ID (set during init)
         * @type {string|null}
         */
        this.userId = null;

        /**
         * Node manager
         * @type {NodeManager}
         */
        this.nodes = new NodeManager(this);

        /**
         * Player manager
         * @type {PlayerManager}
         */
        this.players = new PlayerManager(this);

        /**
         * Plugin manager
         * @type {PluginManager}
         */
        this.plugins = new PluginManager(this);

        /**
         * Voice adapter
         * @type {VoiceAdapter}
         */
        this.voice = new VoiceAdapter(this);

        /**
         * DisTube adapter
         * @type {DistubeAdapter}
         */
        this.distube = new DistubeAdapter(this);

        /**
         * Session persistence store
         * @type {SessionStore|null}
         */
        this.persistence = null;

        /**
         * Whether client is initialized
         * @type {boolean}
         */
        this.initialized = false;

        /**
         * Initialization timestamp
         * @type {number}
         */
        this.initTime = 0;
    }

    /**
     * Initialize with Discord client
     * @param {Object} client - Discord client
     * @returns {Promise<void>}
     */
    async init(client) {
        if (this.initialized) {
            throw new Error('Fuelink is already initialized');
        }

        // Get user ID from client
        this.userId = client.user?.id;
        if (!this.userId) {
            // Wait for ready if not logged in
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Client login timeout')), 30000);
                client.once('ready', () => {
                    clearTimeout(timeout);
                    this.userId = client.user.id;
                    resolve();
                });
            });
        }

        // Setup voice adapter
        this.voice.setup(client);

        // Add nodes from options
        if (this.options.nodes?.length > 0) {
            for (const nodeConfig of this.options.nodes) {
                this.nodes.add(nodeConfig);
            }
        }

        // Initialize persistence if configured
        if (this.options.persistence?.enabled) {
            this.persistence = new SessionStore(this, this.options.persistence);
            await this.persistence.init();

            if (this.options.persistence.autoSave) {
                this.persistence.startAutoSave(this.options.persistence.saveInterval);
            }
        }

        // Load plugins from directory if configured
        if (this.options.plugins?.directory) {
            await this.plugins.loadFromDirectory(this.options.plugins.directory);
        }

        // Enable LavaSrc if configured
        if (this.options.plugins?.lavaSrc) {
            this.plugins.enableLavaSrc(this.options.plugins.lavaSrc);
        }

        // Connect to nodes
        if (this.options.autoConnect !== false) {
            await this.nodes.connectAll();
        }

        // Restore players if configured
        if (this.options.autoResume && this.persistence) {
            try {
                const savedPlayers = await this.persistence.restoreAll();
                if (savedPlayers.length > 0) {
                    await this.players.fromJSON(savedPlayers);
                    this.logger.info(`Restored ${savedPlayers.length} players`);
                }
            } catch (error) {
                this.logger.error(`Failed to restore players: ${error.message}`);
            }
        }

        this.initialized = true;
        this.initTime = Date.now();

        this.logger.success('Initialized');
        this.emit(Events.READY, { fuelink: this });
    }

    /**
     * Send voice update to Discord
     * @param {Object} data - Voice update data
     */
    _sendVoiceUpdate(data) {
        this.voice.sendVoiceUpdate(data);
    }

    // ==================== Player Management ====================

    /**
     * Create a new player
     * @param {Object} options - Player options
     * @returns {Promise<Object>}
     */
    async createPlayer(options) {
        return this.players.create(options);
    }

    /**
     * Get an existing player
     * @param {string} guildId - Guild ID
     * @returns {Object|undefined}
     */
    getPlayer(guildId) {
        return this.players.get(guildId);
    }

    /**
     * Destroy a player
     * @param {string} guildId - Guild ID
     * @returns {Promise<boolean>}
     */
    async destroyPlayer(guildId) {
        return this.players.destroy(guildId);
    }

    // ==================== Search & Resolve ====================

    /**
     * Search for tracks
     * @param {string} query - Search query
     * @param {Object} [options] - Search options
     * @returns {Promise<Track[]>}
     */
    async search(query, options = {}) {
        return this.distube.search(query, options);
    }

    /**
     * Resolve a URL to tracks
     * @param {string} url - URL to resolve
     * @param {Object} [requester] - Requester data
     * @returns {Promise<Track[]|Object>}
     */
    async resolve(url, requester = null) {
        return this.distube.resolve(url, requester);
    }

    // ==================== Plugin System ====================

    /**
     * Register a plugin
     * @param {Object} plugin - Plugin instance
     * @returns {Fuelink}
     */
    use(plugin) {
        this.plugins.register(plugin);
        return this;
    }

    // ==================== Utility ====================

    /**
     * Get a connected node
     * @param {string} [region] - Preferred region
     * @returns {Object|null}
     */
    getNode(region) {
        return this.nodes.getBest(region);
    }

    /**
     * Decode a track
     * @param {string} encoded - Encoded track
     * @returns {Promise<Track>}
     */
    async decodeTrack(encoded) {
        const node = this.nodes.getBest();
        if (!node) {
            throw new Error('No available nodes');
        }
        const data = await node.decodeTrack(encoded);
        return Track.from(data);
    }

    /**
     * Get client statistics
     * @returns {Object}
     */
    getStats() {
        return {
            nodes: this.nodes.getClusterStats(),
            players: this.players.getStats(),
            uptime: this.initialized ? Date.now() - this.initTime : 0
        };
    }

    // ==================== Cleanup ====================

    /**
     * Destroy the client
     * @returns {Promise<void>}
     */
    async destroy() {
        this.logger.info('Shutting down...');

        // Save player states if persistence enabled
        if (this.persistence) {
            await this.persistence.saveAll();
            await this.persistence.destroy();
        }

        // Destroy all players
        await this.players.destroyAll();

        // Disconnect all nodes
        this.nodes.disconnectAll();

        // Cleanup plugins
        this.plugins.destroyAll();

        this.initialized = false;
        this.logger.success('Shutdown complete');
    }
}

module.exports = { Fuelink };
