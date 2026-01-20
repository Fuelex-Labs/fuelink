'use strict';

/**
 * @file Track structure for Fuelink
 * @module fuelink/structures/Track
 */

const { Util } = require('../utils/Util');

/**
 * @typedef {Object} TrackInfo
 * @property {string} identifier - Track identifier
 * @property {boolean} isSeekable - Whether track is seekable
 * @property {string} author - Track author/artist
 * @property {number} duration - Track duration in ms
 * @property {boolean} isStream - Whether track is a stream
 * @property {number} position - Current position in ms
 * @property {string} title - Track title
 * @property {string} uri - Track URI
 * @property {string} artworkUrl - Artwork/thumbnail URL
 * @property {string} sourceName - Source name (youtube, spotify, etc.)
 */

/**
 * @typedef {Object} Requester
 * @property {string} id - User ID
 * @property {string} [username] - Username
 * @property {string} [displayName] - Display name
 * @property {string} [avatar] - Avatar URL
 */

/**
 * Represents a playable track
 */
class Track {
    /**
     * Create a new Track
     * @param {Object} data - Track data
     * @param {string} data.encoded - Base64 encoded track
     * @param {TrackInfo} data.info - Track info
     * @param {Object} [data.pluginInfo] - Plugin-specific info
     * @param {Requester} [requester] - Track requester
     */
    constructor(data, requester = null) {
        /**
         * Base64 encoded track data for Lavalink
         * @type {string}
         */
        this.encoded = data.encoded || data.track;

        /**
         * Track identifier
         * @type {string}
         */
        this.identifier = data.info?.identifier || '';

        /**
         * Whether track is seekable
         * @type {boolean}
         */
        this.isSeekable = data.info?.isSeekable ?? true;

        /**
         * Track author/artist
         * @type {string}
         */
        this.author = data.info?.author || 'Unknown Artist';

        /**
         * Track duration in milliseconds
         * @type {number}
         */
        this.duration = data.info?.length || data.info?.duration || 0;

        /**
         * Whether track is a live stream
         * @type {boolean}
         */
        this.isStream = data.info?.isStream ?? false;

        /**
         * Track title
         * @type {string}
         */
        this.title = data.info?.title || 'Unknown Title';

        /**
         * Track URI
         * @type {string}
         */
        this.uri = data.info?.uri || '';

        /**
         * Artwork/thumbnail URL
         * @type {string|null}
         */
        this.artworkUrl = data.info?.artworkUrl || data.info?.thumbnail || null;

        /**
         * ISRC code if available
         * @type {string|null}
         */
        this.isrc = data.info?.isrc || null;

        /**
         * Source name
         * @type {string}
         */
        this.sourceName = data.info?.sourceName || Util.extractSource(this.uri) || 'unknown';

        /**
         * Plugin-specific info (e.g., from LavaSrc)
         * @type {Object}
         */
        this.pluginInfo = data.pluginInfo || {};

        /**
         * Track requester
         * @type {Requester|null}
         */
        this.requester = requester;

        /**
         * Timestamp when track was added
         * @type {number}
         */
        this.addedAt = Date.now();

        /**
         * Custom metadata
         * @type {Object}
         */
        this.metadata = {};
    }

    /**
     * Get formatted duration string
     * @type {string}
     */
    get formattedDuration() {
        if (this.isStream) return 'LIVE';
        return Util.formatDuration(this.duration, true);
    }

    /**
     * Get display name (title - author)
     * @type {string}
     */
    get displayName() {
        return `${this.title} - ${this.author}`;
    }

    /**
     * Get thumbnail URL (alias for artworkUrl)
     * @type {string|null}
     */
    get thumbnail() {
        return this.artworkUrl;
    }

    /**
     * Check if track is from YouTube
     * @type {boolean}
     */
    get isYouTube() {
        return this.sourceName === 'youtube';
    }

    /**
     * Check if track is from Spotify
     * @type {boolean}
     */
    get isSpotify() {
        return this.sourceName === 'spotify';
    }

    /**
     * Check if track is from SoundCloud
     * @type {boolean}
     */
    get isSoundCloud() {
        return this.sourceName === 'soundcloud';
    }

    /**
     * Set the requester
     * @param {Requester} requester - Requester data
     * @returns {Track}
     */
    setRequester(requester) {
        this.requester = requester;
        return this;
    }

    /**
     * Set custom metadata
     * @param {string} key - Metadata key
     * @param {*} value - Metadata value
     * @returns {Track}
     */
    setMetadata(key, value) {
        this.metadata[key] = value;
        return this;
    }

    /**
     * Get custom metadata
     * @param {string} key - Metadata key
     * @returns {*}
     */
    getMetadata(key) {
        return this.metadata[key];
    }

    /**
     * Create a track from raw Lavalink track data
     * @param {Object} data - Raw track data from Lavalink
     * @param {Requester} [requester] - Track requester
     * @returns {Track}
     */
    static from(data, requester = null) {
        return new Track(data, requester);
    }

    /**
     * Create a track from a URL with minimal info
     * @param {string} url - Track URL
     * @param {Requester} [requester] - Track requester
     * @returns {Track}
     */
    static fromUrl(url, requester = null) {
        return new Track({
            encoded: null,
            info: {
                uri: url,
                identifier: url,
                title: 'Loading...',
                author: 'Unknown'
            }
        }, requester);
    }

    /**
     * Serialize track to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            encoded: this.encoded,
            info: {
                identifier: this.identifier,
                isSeekable: this.isSeekable,
                author: this.author,
                length: this.duration,
                isStream: this.isStream,
                title: this.title,
                uri: this.uri,
                artworkUrl: this.artworkUrl,
                isrc: this.isrc,
                sourceName: this.sourceName
            },
            pluginInfo: this.pluginInfo,
            requester: this.requester,
            metadata: this.metadata
        };
    }

    /**
     * Create track from serialized JSON
     * @param {Object} json - Serialized track data
     * @returns {Track}
     */
    static fromJSON(json) {
        const track = new Track({
            encoded: json.encoded,
            info: json.info,
            pluginInfo: json.pluginInfo
        }, json.requester);
        track.metadata = json.metadata || {};
        return track;
    }

    /**
     * Clone the track
     * @returns {Track}
     */
    clone() {
        return Track.fromJSON(this.toJSON());
    }

    /**
     * String representation
     * @returns {string}
     */
    toString() {
        return `Track<${this.title} by ${this.author}>`;
    }
}

module.exports = { Track };
