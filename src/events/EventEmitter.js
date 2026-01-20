'use strict';

/**
 * @file Custom event emitter for Fuelink
 * @module fuelink/events/EventEmitter
 */

const { EventEmitter: NodeEmitter } = require('events');

/**
 * Priority levels for event processing
 * @readonly
 * @enum {number}
 */
const EventPriority = {
    HIGH: 1,
    NORMAL: 2,
    LOW: 3
};

/**
 * Enhanced EventEmitter with queueing and priority support
 * @extends NodeEmitter
 */
class FuelinkEmitter extends NodeEmitter {
    /**
     * Create a new FuelinkEmitter
     * @param {Object} [options] - Emitter options
     * @param {boolean} [options.debug=false] - Enable debug mode
     * @param {boolean} [options.queueEvents=false] - Queue events for reliable delivery
     */
    constructor(options = {}) {
        super();

        /** @type {boolean} */
        this.debug = options.debug ?? false;

        /** @type {boolean} */
        this.queueEvents = options.queueEvents ?? false;

        /** @type {Array} */
        this._eventQueue = [];

        /** @type {boolean} */
        this._processing = false;

        /** @type {Map<string, Function[]>} */
        this._wildcardListeners = new Map();

        // Increase default max listeners
        this.setMaxListeners(50);
    }

    /**
     * Emit an event with optional priority
     * @param {string} event - Event name
     * @param {...*} args - Event arguments
     * @returns {boolean}
     */
    emit(event, ...args) {
        if (this.debug) {
            console.log(`[FuelinkEmitter] Emitting: ${event}`, args);
        }

        // Handle wildcard listeners
        this._wildcardListeners.forEach((listeners, pattern) => {
            if (this._matchPattern(pattern, event)) {
                listeners.forEach(listener => {
                    try {
                        listener(event, ...args);
                    } catch (error) {
                        console.error(`[FuelinkEmitter] Error in wildcard listener:`, error);
                    }
                });
            }
        });

        if (this.queueEvents) {
            this._eventQueue.push({ event, args, priority: EventPriority.NORMAL });
            this._processQueue();
            return true;
        }

        return super.emit(event, ...args);
    }

    /**
     * Emit an event with specific priority
     * @param {string} event - Event name
     * @param {number} priority - Event priority
     * @param {...*} args - Event arguments
     * @returns {boolean}
     */
    emitWithPriority(event, priority, ...args) {
        if (this.queueEvents) {
            this._eventQueue.push({ event, args, priority });
            this._eventQueue.sort((a, b) => a.priority - b.priority);
            this._processQueue();
            return true;
        }
        return super.emit(event, ...args);
    }

    /**
     * Process the event queue
     * @private
     */
    async _processQueue() {
        if (this._processing || this._eventQueue.length === 0) return;

        this._processing = true;

        while (this._eventQueue.length > 0) {
            const { event, args } = this._eventQueue.shift();
            try {
                super.emit(event, ...args);
            } catch (error) {
                console.error(`[FuelinkEmitter] Error processing event ${event}:`, error);
            }
        }

        this._processing = false;
    }

    /**
     * Add a wildcard listener
     * @param {string} pattern - Glob-like pattern (e.g., "player*", "*Error")
     * @param {Function} listener - Event listener
     */
    onPattern(pattern, listener) {
        if (!this._wildcardListeners.has(pattern)) {
            this._wildcardListeners.set(pattern, []);
        }
        this._wildcardListeners.get(pattern).push(listener);
    }

    /**
     * Remove a wildcard listener
     * @param {string} pattern - Pattern to remove
     * @param {Function} [listener] - Specific listener to remove (removes all if not provided)
     */
    offPattern(pattern, listener) {
        if (!listener) {
            this._wildcardListeners.delete(pattern);
            return;
        }

        const listeners = this._wildcardListeners.get(pattern);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Match pattern against event name
     * @private
     * @param {string} pattern - Pattern to match
     * @param {string} event - Event name
     * @returns {boolean}
     */
    _matchPattern(pattern, event) {
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp(`^${regexPattern}$`).test(event);
    }

    /**
     * Wait for an event to be emitted
     * @param {string} event - Event name to wait for
     * @param {number} [timeout=30000] - Timeout in ms
     * @returns {Promise<*>}
     */
    waitFor(event, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.removeListener(event, handler);
                reject(new Error(`Timeout waiting for event: ${event}`));
            }, timeout);

            const handler = (...args) => {
                clearTimeout(timer);
                resolve(args.length === 1 ? args[0] : args);
            };

            this.once(event, handler);
        });
    }

    /**
     * Collect multiple emissions of an event
     * @param {string} event - Event name
     * @param {number} count - Number of emissions to collect
     * @param {number} [timeout=60000] - Timeout in ms
     * @returns {Promise<Array>}
     */
    collect(event, count, timeout = 60000) {
        return new Promise((resolve, reject) => {
            const collected = [];

            const timer = setTimeout(() => {
                this.removeListener(event, handler);
                reject(new Error(`Timeout collecting events: ${event}`));
            }, timeout);

            const handler = (...args) => {
                collected.push(args.length === 1 ? args[0] : args);
                if (collected.length >= count) {
                    clearTimeout(timer);
                    this.removeListener(event, handler);
                    resolve(collected);
                }
            };

            this.on(event, handler);
        });
    }

    /**
     * Remove all listeners and cleanup
     */
    destroy() {
        this.removeAllListeners();
        this._wildcardListeners.clear();
        this._eventQueue = [];
    }
}

module.exports = { FuelinkEmitter, EventPriority };
