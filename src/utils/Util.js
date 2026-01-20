'use strict';

/**
 * @file Utility functions for Fuelink
 * @module fuelink/utils/Util
 */

/**
 * Utility class with static helper methods
 */
class Util {
    /**
     * Format milliseconds to human-readable duration
     * @param {number} ms - Milliseconds
     * @param {boolean} [short=false] - Use short format (1:23:45 vs 1h 23m 45s)
     * @returns {string}
     */
    static formatDuration(ms, short = false) {
        if (!ms || isNaN(ms)) return short ? '0:00' : '0s';

        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        if (short) {
            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return `${minutes}:${String(seconds).padStart(2, '0')}`;
        }

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
        return parts.join(' ');
    }

    /**
     * Parse duration string to milliseconds
     * @param {string} str - Duration string (e.g., "1h30m", "2:30", "90")
     * @returns {number} Milliseconds
     */
    static parseDuration(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;

        // Handle "1:30" format
        if (str.includes(':')) {
            const parts = str.split(':').map(Number).reverse();
            let ms = 0;
            if (parts[0]) ms += parts[0] * 1000; // seconds
            if (parts[1]) ms += parts[1] * 60000; // minutes
            if (parts[2]) ms += parts[2] * 3600000; // hours
            return ms;
        }

        // Handle "1h30m45s" format
        const regex = /(\d+)\s*(h|m|s)/gi;
        let match;
        let ms = 0;
        while ((match = regex.exec(str)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            if (unit === 'h') ms += value * 3600000;
            else if (unit === 'm') ms += value * 60000;
            else if (unit === 's') ms += value * 1000;
        }

        // Handle plain number (assume seconds)
        if (ms === 0 && /^\d+$/.test(str)) {
            ms = parseInt(str) * 1000;
        }

        return ms;
    }

    /**
     * Deep merge objects
     * @param {Object} target - Target object
     * @param {...Object} sources - Source objects
     * @returns {Object} Merged object
     */
    static deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (Util.isObject(target) && Util.isObject(source)) {
            for (const key in source) {
                if (Util.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    Util.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return Util.deepMerge(target, ...sources);
    }

    /**
     * Check if value is a plain object
     * @param {*} item - Value to check
     * @returns {boolean}
     */
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean}
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Extract source from URL
     * @param {string} url - URL to parse
     * @returns {string|null} Source name or null
     */
    static extractSource(url) {
        if (!Util.isValidUrl(url)) return null;

        const patterns = {
            youtube: /(?:youtube\.com|youtu\.be)/i,
            spotify: /spotify\.com/i,
            soundcloud: /soundcloud\.com/i,
            twitch: /twitch\.tv/i,
            bandcamp: /bandcamp\.com/i,
            vimeo: /vimeo\.com/i,
            deezer: /deezer\.com/i,
            appleMusic: /music\.apple\.com/i,
            yandex: /music\.yandex/i
        };

        for (const [source, pattern] of Object.entries(patterns)) {
            if (pattern.test(url)) return source;
        }

        return 'http';
    }

    /**
     * Sleep for specified duration
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {Object} options - Retry options
     * @param {number} [options.maxRetries=3] - Maximum retries
     * @param {number} [options.initialDelay=1000] - Initial delay in ms
     * @param {number} [options.maxDelay=30000] - Maximum delay in ms
     * @param {number} [options.factor=2] - Backoff factor
     * @returns {Promise<*>}
     */
    static async retry(fn, options = {}) {
        const {
            maxRetries = 3,
            initialDelay = 1000,
            maxDelay = 30000,
            factor = 2
        } = options;

        let lastError;
        let delay = initialDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn(attempt);
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await Util.sleep(delay);
                    delay = Math.min(delay * factor, maxDelay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Generate unique ID
     * @param {string} [prefix=''] - Optional prefix
     * @returns {string}
     */
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Chunk an array into smaller arrays
     * @param {Array} array - Array to chunk
     * @param {number} size - Chunk size
     * @returns {Array[]}
     */
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Shuffle an array (Fisher-Yates)
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array (mutates original)
     */
    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Clamp a number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    static clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Escape regex special characters
     * @param {string} str - String to escape
     * @returns {string}
     */
    static escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Create a deferred promise
     * @returns {{ promise: Promise, resolve: Function, reject: Function }}
     */
    static createDeferred() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    }

    /**
     * Timeout a promise
     * @param {Promise} promise - Promise to timeout
     * @param {number} ms - Timeout in milliseconds
     * @param {string} [message='Operation timed out'] - Timeout error message
     * @returns {Promise}
     */
    static timeoutPromise(promise, ms, message = 'Operation timed out') {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(message)), ms)
            )
        ]);
    }
}

module.exports = { Util };
