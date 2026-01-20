'use strict';

/**
 * @file Base source plugin class
 * @module fuelink/plugins/sources/BaseSource
 */

/**
 * Base class for source plugins
 * Extend this to create custom source handlers
 */
class BaseSource {
    /**
     * Plugin name (override in subclass)
     * @type {string}
     */
    name = 'base';

    /**
     * Manager reference (set by init)
     * @type {Object|null}
     */
    manager = null;

    /**
     * Initialize the plugin
     * @param {Object} manager - Fuelink manager
     */
    init(manager) {
        this.manager = manager;
    }

    /**
     * Check if this plugin can resolve a query
     * Override in subclass
     * @param {string} query - Query or URL
     * @returns {boolean}
     */
    canResolve(query) {
        return false;
    }

    /**
     * Resolve a query to tracks
     * Override in subclass
     * @param {string} query - Query or URL
     * @param {Object} [options] - Resolve options
     * @returns {Promise<Object[]>}
     */
    async resolve(query, options = {}) {
        throw new Error('resolve() must be implemented');
    }

    /**
     * Search for tracks
     * Override in subclass
     * @param {string} query - Search query
     * @param {Object} [options] - Search options
     * @returns {Promise<Object[]>}
     */
    async search(query, options = {}) {
        throw new Error('search() must be implemented');
    }

    /**
     * Cleanup the plugin
     * Override in subclass if needed
     */
    destroy() {
        this.manager = null;
    }
}

module.exports = { BaseSource };
