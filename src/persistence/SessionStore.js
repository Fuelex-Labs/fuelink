'use strict';

/**
 * @file Session persistence store
 * @module fuelink/persistence/SessionStore
 */

/**
 * @typedef {Object} StoreOptions
 * @property {string} [backend='memory'] - Storage backend
 * @property {number} [ttl=3600000] - Time to live in ms (1 hour default)
 * @property {string} [prefix='fuelink:'] - Key prefix
 * @property {Object} [options] - Backend-specific options
 */

/**
 * Session persistence store for player state
 */
class SessionStore {
    /**
     * Create a new SessionStore
     * @param {Object} manager - Fuelink manager
     * @param {StoreOptions} [options] - Store options
     */
    constructor(manager, options = {}) {
        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * Storage backend name
         * @type {string}
         */
        this.backend = options.backend ?? 'memory';

        /**
         * Default TTL for stored data (1 hour)
         * @type {number}
         */
        this.ttl = options.ttl ?? 3600000;

        /**
         * Key prefix
         * @type {string}
         */
        this.prefix = options.prefix ?? 'fuelink:';

        /**
         * Backend-specific options
         * @type {Object}
         */
        this.options = options.options ?? {};

        /**
         * Memory store (for memory backend)
         * @type {Map<string, { data: Object, expires: number }>}
         * @private
         */
        this._memory = new Map();

        /**
         * External store client (Redis, MongoDB, etc.)
         * @type {Object|null}
         * @private
         */
        this._client = null;

        /**
         * Auto-save interval
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._autoSaveInterval = null;
    }

    /**
     * Initialize the store
     * @returns {Promise<void>}
     */
    async init() {
        switch (this.backend) {
            case 'memory':
                // Nothing to initialize
                break;
            case 'redis':
                await this._initRedis();
                break;
            case 'mongodb':
                await this._initMongoDB();
                break;
            case 'file':
                await this._initFile();
                break;
            default:
                throw new Error(`Unknown storage backend: ${this.backend}`);
        }

        this.manager.logger?.debug(`Persistence initialized (${this.backend})`);
    }

    /**
     * Initialize Redis backend
     * @private
     */
    async _initRedis() {
        // Redis should be passed in options.client
        if (!this.options.client) {
            throw new Error('Redis client must be provided in options.client');
        }
        this._client = this.options.client;
    }

    /**
     * Initialize MongoDB backend
     * @private
     */
    async _initMongoDB() {
        // MongoDB collection should be passed in options.collection
        if (!this.options.collection) {
            throw new Error('MongoDB collection must be provided in options.collection');
        }
        this._client = this.options.collection;
    }

    /**
     * Initialize file backend
     * @private
     */
    async _initFile() {
        const fs = require('fs').promises;
        const path = this.options.path ?? './fuelink-sessions.json';

        try {
            const data = await fs.readFile(path, 'utf8');
            const parsed = JSON.parse(data);
            for (const [key, value] of Object.entries(parsed)) {
                this._memory.set(key, value);
            }
        } catch {
            // File doesn't exist, start fresh
        }

        this._client = path;
    }

    /**
     * Build full key with prefix
     * @private
     * @param {string} key
     * @returns {string}
     */
    _key(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Save data to store
     * @param {string} key - Storage key
     * @param {Object} data - Data to store
     * @param {number} [ttl] - Optional TTL override
     * @returns {Promise<void>}
     */
    async set(key, data, ttl) {
        const fullKey = this._key(key);
        const expires = Date.now() + (ttl ?? this.ttl);

        switch (this.backend) {
            case 'memory':
                this._memory.set(fullKey, { data, expires });
                break;

            case 'redis':
                await this._client.setex(
                    fullKey,
                    Math.floor((ttl ?? this.ttl) / 1000),
                    JSON.stringify(data)
                );
                break;

            case 'mongodb':
                await this._client.updateOne(
                    { _id: fullKey },
                    { $set: { data, expires } },
                    { upsert: true }
                );
                break;

            case 'file':
                this._memory.set(fullKey, { data, expires });
                await this._saveFile();
                break;
        }
    }

    /**
     * Get data from store
     * @param {string} key - Storage key
     * @returns {Promise<Object|null>}
     */
    async get(key) {
        const fullKey = this._key(key);

        switch (this.backend) {
            case 'memory':
            case 'file': {
                const entry = this._memory.get(fullKey);
                if (!entry) return null;
                if (entry.expires < Date.now()) {
                    this._memory.delete(fullKey);
                    return null;
                }
                return entry.data;
            }

            case 'redis': {
                const data = await this._client.get(fullKey);
                return data ? JSON.parse(data) : null;
            }

            case 'mongodb': {
                const doc = await this._client.findOne({ _id: fullKey });
                if (!doc) return null;
                if (doc.expires < Date.now()) {
                    await this._client.deleteOne({ _id: fullKey });
                    return null;
                }
                return doc.data;
            }
        }

        return null;
    }

    /**
     * Delete data from store
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async delete(key) {
        const fullKey = this._key(key);

        switch (this.backend) {
            case 'memory':
            case 'file': {
                const existed = this._memory.delete(fullKey);
                if (this.backend === 'file') await this._saveFile();
                return existed;
            }

            case 'redis':
                return (await this._client.del(fullKey)) > 0;

            case 'mongodb':
                return (await this._client.deleteOne({ _id: fullKey })).deletedCount > 0;
        }

        return false;
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        return (await this.get(key)) !== null;
    }

    /**
     * Get all keys
     * @returns {Promise<string[]>}
     */
    async keys() {
        switch (this.backend) {
            case 'memory':
            case 'file':
                return Array.from(this._memory.keys())
                    .filter(k => k.startsWith(this.prefix))
                    .map(k => k.slice(this.prefix.length));

            case 'redis':
                return (await this._client.keys(`${this.prefix}*`))
                    .map(k => k.slice(this.prefix.length));

            case 'mongodb':
                return (await this._client.find({ _id: { $regex: `^${this.prefix}` } })
                    .project({ _id: 1 }).toArray())
                    .map(doc => doc._id.slice(this.prefix.length));
        }

        return [];
    }

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clear() {
        switch (this.backend) {
            case 'memory':
                this._memory.clear();
                break;

            case 'file':
                this._memory.clear();
                await this._saveFile();
                break;

            case 'redis':
                const keys = await this._client.keys(`${this.prefix}*`);
                if (keys.length > 0) {
                    await this._client.del(...keys);
                }
                break;

            case 'mongodb':
                await this._client.deleteMany({ _id: { $regex: `^${this.prefix}` } });
                break;
        }
    }

    /**
     * Save file backend to disk
     * @private
     */
    async _saveFile() {
        const fs = require('fs').promises;
        const obj = Object.fromEntries(this._memory);
        await fs.writeFile(this._client, JSON.stringify(obj, null, 2));
    }

    /**
     * Save a player's state
     * @param {Object} player - Player instance
     * @returns {Promise<void>}
     */
    async savePlayer(player) {
        await this.set(`player:${player.guildId}`, player.toJSON());
    }

    /**
     * Restore a player's state
     * @param {string} guildId - Guild ID
     * @returns {Promise<Object|null>}
     */
    async restorePlayer(guildId) {
        return this.get(`player:${guildId}`);
    }

    /**
     * Save all active players
     * @returns {Promise<void>}
     */
    async saveAll() {
        const promises = [];
        for (const player of this.manager.players.values()) {
            promises.push(this.savePlayer(player));
        }
        await Promise.all(promises);
    }

    /**
     * Restore all saved players
     * @returns {Promise<Object[]>}
     */
    async restoreAll() {
        const keys = await this.keys();
        const playerKeys = keys.filter(k => k.startsWith('player:'));
        const restored = [];

        for (const key of playerKeys) {
            const data = await this.get(key);
            if (data) {
                restored.push(data);
            }
        }

        return restored;
    }

    /**
     * Start auto-save interval
     * @param {number} interval - Interval in ms
     */
    startAutoSave(interval = 30000) {
        this.stopAutoSave();
        this._autoSaveInterval = setInterval(() => {
            this.saveAll().catch(err => {
                this.manager.logger?.error(`Auto-save failed: ${err.message}`);
            });
        }, interval);
    }

    /**
     * Stop auto-save interval
     */
    stopAutoSave() {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
            this._autoSaveInterval = null;
        }
    }

    /**
     * Cleanup and close store
     */
    async destroy() {
        this.stopAutoSave();

        if (this.backend === 'file') {
            await this._saveFile();
        }

        this._memory.clear();
        this._client = null;
    }
}

module.exports = { SessionStore };
