'use strict';

/**
 * @file DisTube integration adapter for Fuelink
 * @module fuelink/adapters/DistubeAdapter
 */

const { Track } = require('../structures/Track');

/**
 * @typedef {Object} SearchOptions
 * @property {string} [source='youtube'] - Search source
 * @property {number} [limit=10] - Max results
 * @property {Object} [requester] - Requester data
 */

/**
 * DisTube adapter for searching and resolving tracks
 */
class DistubeAdapter {
    /**
     * Create a new DistubeAdapter
     * @param {Object} manager - Fuelink manager
     */
    constructor(manager) {
        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * DisTube instance (optional)
         * @type {Object|null}
         */
        this.distube = null;

        /**
         * Registered plugins
         * @type {Map<string, Object>}
         */
        this.plugins = new Map();

        /**
         * Source handlers for URL resolution
         * @type {Map<string, Object>}
         */
        this.sourceHandlers = new Map();

        /**
         * Whether to prefer Lavalink for resolution
         * @type {boolean}
         */
        this.preferLavalink = true;
    }

    /**
     * Initialize with DisTube instance
     * @param {Object} distube - DisTube instance
     */
    setDistube(distube) {
        this.distube = distube;

        // Register DisTube plugins as source handlers
        if (distube.extractorPlugins) {
            for (const plugin of distube.extractorPlugins) {
                this.sourceHandlers.set(plugin.constructor.name, plugin);
            }
        }

        this.manager.logger?.debug('DisTube adapter initialized');
    }

    /**
     * Register a source plugin
     * @param {Object} plugin - Plugin instance
     */
    use(plugin) {
        if (plugin.name) {
            this.plugins.set(plugin.name, plugin);
        }
        if (plugin.init) {
            plugin.init(this.manager);
        }
        return this;
    }

    /**
     * Search for tracks using Lavalink
     * @param {string} query - Search query
     * @param {SearchOptions} [options] - Search options
     * @returns {Promise<Track[]>}
     */
    async search(query, options = {}) {
        const { source = 'youtube', limit = 10, requester = null } = options;

        // Get a node
        const node = this.manager.nodes.getBest();
        if (!node) {
            throw new Error('No available nodes');
        }

        // Build search identifier
        let identifier;
        if (this._isUrl(query)) {
            identifier = query;
        } else {
            // Use source prefixes based on source
            const prefixes = {
                youtube: 'ytsearch:',
                youtubemusic: 'ytmsearch:',
                soundcloud: 'scsearch:',
                spotify: 'spsearch:',
                applemusic: 'amsearch:',
                deezer: 'dzsearch:'
            };
            identifier = `${prefixes[source] || 'ytsearch:'}${query}`;
        }

        // Load tracks from Lavalink
        const result = await node.loadTracks(identifier);

        return this._processLoadResult(result, requester, limit);
    }

    /**
     * Resolve a URL to tracks
     * @param {string} url - URL to resolve
     * @param {Object} [requester] - Requester data
     * @returns {Promise<Track[]|Object>}
     */
    async resolve(url, requester = null) {
        // Get a node
        const node = this.manager.nodes.getBest();
        if (!node) {
            throw new Error('No available nodes');
        }

        // Load from Lavalink
        const result = await node.loadTracks(url);

        // Handle different load types
        switch (result.loadType) {
            case 'track':
                return [Track.from(result.data, requester)];

            case 'playlist':
                return {
                    name: result.data.info.name,
                    tracks: result.data.tracks.map(t => Track.from(t, requester)),
                    url: url,
                    selectedTrack: result.data.info.selectedTrack ?? 0
                };

            case 'search':
                return result.data.map(t => Track.from(t, requester));

            case 'empty':
            case 'error':
            default:
                return [];
        }
    }

    /**
     * Process Lavalink load result
     * @private
     * @param {Object} result - Load result
     * @param {Object} requester - Requester
     * @param {number} limit - Max results
     * @returns {Track[]}
     */
    _processLoadResult(result, requester, limit) {
        switch (result.loadType) {
            case 'track':
                return [Track.from(result.data, requester)];

            case 'playlist':
                return result.data.tracks
                    .slice(0, limit)
                    .map(t => Track.from(t, requester));

            case 'search':
                return result.data
                    .slice(0, limit)
                    .map(t => Track.from(t, requester));

            case 'empty':
                return [];

            case 'error':
                throw new Error(result.data?.message || 'Failed to load tracks');

            default:
                return [];
        }
    }

    /**
     * Convert DisTube Song to Fuelink Track
     * @param {Object} song - DisTube Song
     * @param {Object} [requester] - Requester data
     * @returns {Track}
     */
    convertFromDistube(song, requester = null) {
        return new Track({
            encoded: null, // Will need to be resolved by Lavalink
            info: {
                identifier: song.id || song.url,
                isSeekable: !song.isLive,
                author: song.uploader?.name || song.author || 'Unknown',
                length: song.duration * 1000, // DisTube uses seconds
                isStream: song.isLive || false,
                title: song.name || 'Unknown',
                uri: song.url || '',
                artworkUrl: song.thumbnail || null,
                sourceName: song.source || 'unknown'
            }
        }, requester || song.user);
    }

    /**
     * Convert Fuelink Track to DisTube-like Song
     * @param {Track} track - Fuelink Track
     * @returns {Object}
     */
    convertToDistube(track) {
        return {
            id: track.identifier,
            name: track.title,
            url: track.uri,
            thumbnail: track.artworkUrl,
            duration: Math.floor(track.duration / 1000), // Convert to seconds
            isLive: track.isStream,
            uploader: {
                name: track.author
            },
            source: track.sourceName,
            user: track.requester
        };
    }

    /**
     * Check if string is a URL
     * @private
     * @param {string} str
     * @returns {boolean}
     */
    _isUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get available search sources
     * @returns {string[]}
     */
    getAvailableSources() {
        const sources = ['youtube', 'youtubemusic', 'soundcloud'];

        // Add sources from plugins
        for (const [name] of this.plugins) {
            if (!sources.includes(name.toLowerCase())) {
                sources.push(name.toLowerCase());
            }
        }

        return sources;
    }
}

module.exports = { DistubeAdapter };
