'use strict';

/**
 * @file Queue management for Fuelink
 * @module fuelink/structures/Queue
 */

const { FuelinkEmitter } = require('../events/EventEmitter');
const { Track } = require('./Track');
const { LoopMode, Events } = require('../utils/Constants');
const { Util } = require('../utils/Util');

/**
 * @typedef {Object} AddOptions
 * @property {number} [position] - Position to insert at
 * @property {boolean} [priority] - Add to priority queue
 * @property {Object} [requester] - Track requester
 */

/**
 * Queue manager for a player
 * @extends FuelinkEmitter
 */
class Queue extends FuelinkEmitter {
    /**
     * Create a new Queue
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
         * Main track queue
         * @type {Track[]}
         */
        this.tracks = [];

        /**
         * Priority queue (plays before main queue)
         * @type {Track[]}
         */
        this.priorityTracks = [];

        /**
         * Currently playing track
         * @type {Track|null}
         */
        this.current = null;

        /**
         * Previously played track
         * @type {Track|null}
         */
        this.previous = null;

        /**
         * Current loop mode
         * @type {string}
         */
        this.loop = LoopMode.OFF;

        /**
         * Whether autoplay is enabled
         * @type {boolean}
         */
        this.autoplay = false;

        /**
         * Autoplay provider function
         * @type {Function|null}
         */
        this.autoplayProvider = null;

        /**
         * Queue history (for back functionality)
         * @type {Track[]}
         */
        this.history = [];

        /**
         * Maximum history size
         * @type {number}
         */
        this.maxHistorySize = 50;
    }

    /**
     * Get the total number of tracks (including priority)
     * @type {number}
     */
    get size() {
        return this.tracks.length + this.priorityTracks.length;
    }

    /**
     * Get total queue duration in milliseconds
     * @type {number}
     */
    get duration() {
        const currentDur = this.current?.duration || 0;
        const queueDur = [...this.priorityTracks, ...this.tracks]
            .reduce((acc, t) => acc + (t.duration || 0), 0);
        return currentDur + queueDur;
    }

    /**
     * Get formatted total duration
     * @type {string}
     */
    get formattedDuration() {
        return Util.formatDuration(this.duration);
    }

    /**
     * Get upcoming tracks (combined priority + main)
     * @type {Track[]}
     */
    get upcoming() {
        return [...this.priorityTracks, ...this.tracks];
    }

    /**
     * Check if queue is empty
     * @type {boolean}
     */
    get isEmpty() {
        return this.size === 0 && !this.current;
    }

    // ==================== Adding Tracks ====================

    /**
     * Add track(s) to the queue
     * @param {Track|Track[]} tracks - Track(s) to add
     * @param {AddOptions} [options] - Add options
     * @returns {Track[]} Added tracks
     */
    add(tracks, options = {}) {
        const trackArray = Array.isArray(tracks) ? tracks : [tracks];
        const addedTracks = [];

        for (const track of trackArray) {
            // Ensure it's a Track instance
            const trackInstance = track instanceof Track ? track : Track.from(track);

            // Set requester if provided
            if (options.requester) {
                trackInstance.setRequester(options.requester);
            }

            if (options.priority) {
                this.priorityTracks.push(trackInstance);
            } else if (options.position !== undefined) {
                this.tracks.splice(options.position, 0, trackInstance);
            } else {
                this.tracks.push(trackInstance);
            }

            addedTracks.push(trackInstance);
        }

        this.emit(Events.QUEUE_ADD, { tracks: addedTracks, queue: this });
        return addedTracks;
    }

    /**
     * Add track to priority queue (plays next)
     * @param {Track|Track[]} tracks - Track(s) to add
     * @param {Object} [requester] - Track requester
     * @returns {Track[]} Added tracks
     */
    addPriority(tracks, requester) {
        return this.add(tracks, { priority: true, requester });
    }

    /**
     * Add track at specific position
     * @param {Track} track - Track to add
     * @param {number} position - Position index
     * @param {Object} [requester] - Track requester
     * @returns {Track[]} Added tracks
     */
    addAt(track, position, requester) {
        return this.add(track, { position, requester });
    }

    // ==================== Removing Tracks ====================

    /**
     * Remove a track by index
     * @param {number} index - Index to remove
     * @returns {Track|null} Removed track
     */
    remove(index) {
        if (index < 0) return null;

        // Check priority queue first
        if (index < this.priorityTracks.length) {
            const [removed] = this.priorityTracks.splice(index, 1);
            this.emit(Events.QUEUE_REMOVE, { track: removed, index, queue: this });
            return removed;
        }

        // Adjust index for main queue
        const mainIndex = index - this.priorityTracks.length;
        if (mainIndex < this.tracks.length) {
            const [removed] = this.tracks.splice(mainIndex, 1);
            this.emit(Events.QUEUE_REMOVE, { track: removed, index, queue: this });
            return removed;
        }

        return null;
    }

    /**
     * Remove a track by reference
     * @param {Track} track - Track to remove
     * @returns {Track|null} Removed track
     */
    removeTrack(track) {
        let index = this.priorityTracks.indexOf(track);
        if (index !== -1) {
            return this.remove(index);
        }

        index = this.tracks.indexOf(track);
        if (index !== -1) {
            return this.remove(index + this.priorityTracks.length);
        }

        return null;
    }

    /**
     * Remove tracks by requester
     * @param {string} requesterId - Requester user ID
     * @returns {Track[]} Removed tracks
     */
    removeByRequester(requesterId) {
        const removed = [];

        this.priorityTracks = this.priorityTracks.filter(t => {
            if (t.requester?.id === requesterId) {
                removed.push(t);
                return false;
            }
            return true;
        });

        this.tracks = this.tracks.filter(t => {
            if (t.requester?.id === requesterId) {
                removed.push(t);
                return false;
            }
            return true;
        });

        return removed;
    }

    /**
     * Remove a range of tracks
     * @param {number} start - Start index
     * @param {number} end - End index
     * @returns {Track[]} Removed tracks
     */
    removeRange(start, end) {
        const removed = [];
        for (let i = end; i >= start; i--) {
            const track = this.remove(i);
            if (track) removed.unshift(track);
        }
        return removed;
    }

    /**
     * Clear the queue
     * @param {boolean} [includePriority=true] - Also clear priority queue
     * @returns {number} Number of removed tracks
     */
    clear(includePriority = true) {
        const count = includePriority ? this.size : this.tracks.length;

        this.tracks = [];
        if (includePriority) {
            this.priorityTracks = [];
        }

        this.emit(Events.QUEUE_CLEAR, { queue: this });
        return count;
    }

    // ==================== Reordering ====================

    /**
     * Shuffle the queue
     * @returns {Queue} This queue
     */
    shuffle() {
        Util.shuffle(this.tracks);
        this.emit(Events.QUEUE_SHUFFLE, { queue: this });
        return this;
    }

    /**
     * Move a track from one position to another
     * @param {number} from - Source index
     * @param {number} to - Destination index
     * @returns {boolean} Success
     */
    move(from, to) {
        if (from < 0 || from >= this.size || to < 0 || to >= this.size) {
            return false;
        }

        const combined = [...this.priorityTracks, ...this.tracks];
        const [track] = combined.splice(from, 1);
        combined.splice(to, 0, track);

        // Rebuild queues
        this.priorityTracks = combined.slice(0, this.priorityTracks.length);
        this.tracks = combined.slice(this.priorityTracks.length);

        return true;
    }

    /**
     * Swap two tracks
     * @param {number} index1 - First index
     * @param {number} index2 - Second index
     * @returns {boolean} Success
     */
    swap(index1, index2) {
        if (index1 < 0 || index1 >= this.size || index2 < 0 || index2 >= this.size) {
            return false;
        }

        const combined = [...this.priorityTracks, ...this.tracks];
        [combined[index1], combined[index2]] = [combined[index2], combined[index1]];

        // Rebuild queues
        this.priorityTracks = combined.slice(0, this.priorityTracks.length);
        this.tracks = combined.slice(this.priorityTracks.length);

        return true;
    }

    /**
     * Reverse the queue order
     * @returns {Queue} This queue
     */
    reverse() {
        this.tracks.reverse();
        return this;
    }

    // ==================== Playback Control ====================

    /**
     * Get the next track to play
     * @returns {Track|null}
     */
    next() {
        // Save current to history
        if (this.current) {
            this.previous = this.current;
            this._addToHistory(this.current);
        }

        // Handle loop modes
        if (this.loop === LoopMode.TRACK && this.current) {
            return this.current;
        }

        // Check priority queue first
        if (this.priorityTracks.length > 0) {
            this.current = this.priorityTracks.shift();
            return this.current;
        }

        // Check main queue
        if (this.tracks.length > 0) {
            this.current = this.tracks.shift();

            // Re-add to end if queue loop
            if (this.loop === LoopMode.QUEUE && this.previous) {
                this.tracks.push(this.previous);
            }

            return this.current;
        }

        // Queue is empty
        if (this.loop === LoopMode.QUEUE && this.previous) {
            this.current = this.previous;
            return this.current;
        }

        this.current = null;
        return null;
    }

    /**
     * Skip to a specific position in the queue
     * @param {number} position - Position to skip to
     * @returns {Track|null}
     */
    jump(position) {
        if (position < 0 || position >= this.size) {
            return null;
        }

        // Save current to history
        if (this.current) {
            this._addToHistory(this.current);
        }

        // Remove tracks before the position
        const combined = [...this.priorityTracks, ...this.tracks];
        const skipped = combined.splice(0, position);

        // Add skipped tracks to history
        skipped.forEach(t => this._addToHistory(t));

        // Get the target track
        this.current = combined.shift();

        // Rebuild queues
        const priorityCount = Math.max(0, this.priorityTracks.length - position - 1);
        this.priorityTracks = combined.slice(0, priorityCount);
        this.tracks = combined.slice(priorityCount);

        return this.current;
    }

    /**
     * Go back to the previous track
     * @returns {Track|null}
     */
    back() {
        if (this.history.length === 0) {
            return null;
        }

        // Put current back in front of queue
        if (this.current) {
            this.priorityTracks.unshift(this.current);
        }

        // Get previous from history
        this.current = this.history.pop();
        this.previous = this.history[this.history.length - 1] || null;

        return this.current;
    }

    // ==================== Loop & Autoplay ====================

    /**
     * Set the loop mode
     * @param {string} mode - Loop mode (off, track, queue)
     * @returns {Queue} This queue
     */
    setLoop(mode) {
        if (!Object.values(LoopMode).includes(mode)) {
            throw new Error(`Invalid loop mode: ${mode}`);
        }
        this.loop = mode;
        return this;
    }

    /**
     * Cycle through loop modes
     * @returns {string} New loop mode
     */
    cycleLoop() {
        const modes = Object.values(LoopMode);
        const currentIndex = modes.indexOf(this.loop);
        this.loop = modes[(currentIndex + 1) % modes.length];
        return this.loop;
    }

    /**
     * Enable/disable autoplay
     * @param {boolean} enabled - Enable or disable
     * @param {Function} [provider] - Autoplay provider function
     * @returns {Queue} This queue
     */
    setAutoplay(enabled, provider = null) {
        this.autoplay = enabled;
        if (provider) {
            this.autoplayProvider = provider;
        }
        return this;
    }

    /**
     * Get autoplay recommendations
     * @returns {Promise<Track[]>}
     */
    async getAutoplayTracks() {
        if (!this.autoplayProvider || !this.current) {
            return [];
        }
        return this.autoplayProvider(this.current, this);
    }

    // ==================== Query ====================

    /**
     * Get track at position
     * @param {number} index - Index
     * @returns {Track|null}
     */
    at(index) {
        if (index < 0) return null;
        if (index < this.priorityTracks.length) {
            return this.priorityTracks[index];
        }
        const mainIndex = index - this.priorityTracks.length;
        return this.tracks[mainIndex] || null;
    }

    /**
     * Get tracks by requester
     * @param {string} requesterId - User ID
     * @returns {Track[]}
     */
    getByRequester(requesterId) {
        return [...this.priorityTracks, ...this.tracks]
            .filter(t => t.requester?.id === requesterId);
    }

    /**
     * Search tracks
     * @param {string} query - Search query
     * @returns {Track[]}
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return [...this.priorityTracks, ...this.tracks].filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.author.toLowerCase().includes(lowerQuery)
        );
    }

    // ==================== History ====================

    /**
     * Add track to history
     * @private
     * @param {Track} track
     */
    _addToHistory(track) {
        this.history.push(track);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }

    // ==================== Serialization ====================

    /**
     * Serialize queue to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            tracks: this.tracks.map(t => t.toJSON()),
            priorityTracks: this.priorityTracks.map(t => t.toJSON()),
            current: this.current?.toJSON() || null,
            previous: this.previous?.toJSON() || null,
            loop: this.loop,
            autoplay: this.autoplay,
            history: this.history.map(t => t.toJSON())
        };
    }

    /**
     * Restore queue from JSON
     * @param {Object} data - Serialized queue data
     */
    fromJSON(data) {
        this.tracks = (data.tracks || []).map(t => Track.fromJSON(t));
        this.priorityTracks = (data.priorityTracks || []).map(t => Track.fromJSON(t));
        this.current = data.current ? Track.fromJSON(data.current) : null;
        this.previous = data.previous ? Track.fromJSON(data.previous) : null;
        this.loop = data.loop || LoopMode.OFF;
        this.autoplay = data.autoplay || false;
        this.history = (data.history || []).map(t => Track.fromJSON(t));
    }

    /**
     * Clean up queue
     */
    destroy() {
        this.clear(true);
        this.history = [];
        this.current = null;
        this.previous = null;
        this.removeAllListeners();
    }
}

module.exports = { Queue };
