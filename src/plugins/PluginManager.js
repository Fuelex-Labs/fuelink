'use strict';

/**
 * @file Plugin manager for Fuelink
 * @module fuelink/plugins/PluginManager
 */

const { readdirSync, statSync } = require('fs');
const { join } = require('path');

/**
 * Manages plugins for Fuelink
 */
class PluginManager {
    /**
     * Create a new PluginManager
     * @param {Object} manager - Fuelink manager
     */
    constructor(manager) {
        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * Registered plugins
         * @type {Map<string, Object>}
         */
        this.plugins = new Map();

        /**
         * Source plugins for track resolution
         * @type {Map<string, Object>}
         */
        this.sources = new Map();

        /**
         * Middleware plugins
         * @type {Array<Object>}
         */
        this.middlewares = [];

        /**
         * LavaSrc enabled sources
         * @type {Set<string>}
         */
        this.lavaSrcSources = new Set();
    }

    /**
     * Register a plugin
     * @param {Object} plugin - Plugin instance
     * @returns {PluginManager}
     */
    register(plugin) {
        if (!plugin.name) {
            throw new Error('Plugin must have a name');
        }

        if (this.plugins.has(plugin.name)) {
            this.manager.logger?.warn(`Plugin ${plugin.name} already registered`);
            return this;
        }

        // Initialize plugin
        if (typeof plugin.init === 'function') {
            try {
                plugin.init(this.manager);
            } catch (error) {
                this.manager.logger?.error(`Failed to init plugin ${plugin.name}: ${error.message}`);
                throw error;
            }
        }

        this.plugins.set(plugin.name, plugin);

        // Register as source plugin if applicable
        if (typeof plugin.canResolve === 'function') {
            this.sources.set(plugin.name, plugin);
        }

        // Register as middleware if applicable
        if (typeof plugin.onTrackLoad === 'function' ||
            typeof plugin.onPlay === 'function' ||
            typeof plugin.onFilter === 'function') {
            this.middlewares.push(plugin);
        }

        this.manager.logger?.debug(`Plugin ${plugin.name} registered`);
        return this;
    }

    /**
     * Unload a plugin
     * @param {string} name - Plugin name
     * @returns {boolean}
     */
    unload(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        // Call destroy if exists
        if (typeof plugin.destroy === 'function') {
            try {
                plugin.destroy();
            } catch (error) {
                this.manager.logger?.warn(`Error destroying plugin ${name}: ${error.message}`);
            }
        }

        this.plugins.delete(name);
        this.sources.delete(name);
        this.middlewares = this.middlewares.filter(p => p.name !== name);

        this.manager.logger?.debug(`Plugin ${name} unloaded`);
        return true;
    }

    /**
     * Load plugins from a directory
     * @param {string} directory - Directory path
     * @returns {Promise<void>}
     */
    async loadFromDirectory(directory) {
        try {
            const files = readdirSync(directory);

            for (const file of files) {
                const filePath = join(directory, file);
                const stat = statSync(filePath);

                if (stat.isFile() && file.endsWith('.js')) {
                    await this.load(filePath);
                } else if (stat.isDirectory()) {
                    // Check for index.js in subdirectory
                    const indexPath = join(filePath, 'index.js');
                    try {
                        statSync(indexPath);
                        await this.load(indexPath);
                    } catch {
                        // No index.js, skip
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.manager.logger?.debug(`Plugin directory ${directory} does not exist`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Load a single plugin file
     * @param {string} path - File path
     * @returns {Promise<Object>}
     */
    async load(path) {
        try {
            // Clear from require cache for hot-reload
            delete require.cache[require.resolve(path)];

            const PluginClass = require(path);
            const plugin = typeof PluginClass === 'function'
                ? new PluginClass()
                : PluginClass;

            this.register(plugin);
            return plugin;
        } catch (error) {
            this.manager.logger?.error(`Failed to load plugin from ${path}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a plugin by name
     * @param {string} name - Plugin name
     * @returns {Object|undefined}
     */
    get(name) {
        return this.plugins.get(name);
    }

    /**
     * Check if plugin is registered
     * @param {string} name - Plugin name
     * @returns {boolean}
     */
    has(name) {
        return this.plugins.has(name);
    }

    /**
     * Enable LavaSrc sources
     * @param {Object} options - LavaSrc options
     */
    enableLavaSrc(options = {}) {
        const sources = ['spotify', 'applemusic', 'deezer', 'yandex', 'flowery'];

        for (const source of sources) {
            if (options[source]) {
                this.lavaSrcSources.add(source);
            }
        }

        if (this.lavaSrcSources.size > 0) {
            this.manager.logger?.info(
                `LavaSrc enabled for: ${Array.from(this.lavaSrcSources).join(', ')}`
            );
        }
    }

    /**
     * Check if a source is LavaSrc-enabled
     * @param {string} source - Source name
     * @returns {boolean}
     */
    isLavaSrcSource(source) {
        return this.lavaSrcSources.has(source.toLowerCase());
    }

    /**
     * Find a source plugin that can resolve a query
     * @param {string} query - Query or URL
     * @returns {Object|null}
     */
    findSourceFor(query) {
        for (const [, plugin] of this.sources) {
            if (plugin.canResolve(query)) {
                return plugin;
            }
        }
        return null;
    }

    /**
     * Run middleware on track load
     * @param {Object} track - Track being loaded
     * @returns {Promise<Object>}
     */
    async runTrackLoadMiddleware(track) {
        for (const middleware of this.middlewares) {
            if (typeof middleware.onTrackLoad === 'function') {
                try {
                    track = await middleware.onTrackLoad(track) || track;
                } catch (error) {
                    this.manager.logger?.warn(
                        `Middleware ${middleware.name} onTrackLoad failed: ${error.message}`
                    );
                }
            }
        }
        return track;
    }

    /**
     * Run middleware on play
     * @param {Object} player - Player
     * @param {Object} track - Track
     * @returns {Promise<void>}
     */
    async runPlayMiddleware(player, track) {
        for (const middleware of this.middlewares) {
            if (typeof middleware.onPlay === 'function') {
                try {
                    await middleware.onPlay(player, track);
                } catch (error) {
                    this.manager.logger?.warn(
                        `Middleware ${middleware.name} onPlay failed: ${error.message}`
                    );
                }
            }
        }
    }

    /**
     * Get all plugin names
     * @returns {string[]}
     */
    getNames() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Destroy all plugins
     */
    destroyAll() {
        for (const name of this.plugins.keys()) {
            this.unload(name);
        }
    }
}

module.exports = { PluginManager };
