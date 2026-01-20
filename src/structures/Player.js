'use strict';

/**
 * @file Guild player for Fuelink
 * @module fuelink/structures/Player
 */

const { FuelinkEmitter } = require('../events/EventEmitter');
const { Queue } = require('./Queue');
const { Filters } = require('./Filters');
const { Connection } = require('./Connection');
const { Track } = require('./Track');
const {
    PlayerState,
    Events,
    Defaults,
    TrackEndReason
} = require('../utils/Constants');

/**
 * @typedef {Object} PlayerOptions
 * @property {string} guildId - Guild ID
 * @property {string} voiceChannel - Voice channel ID
 * @property {string} [textChannel] - Text channel ID for messages
 * @property {number} [volume=100] - Initial volume
 * @property {boolean} [selfDeaf=true] - Self deafen
 * @property {boolean} [selfMute=false] - Self mute
 * @property {Object} [node] - Preferred node
 */

/**
 * Represents a player for a guild
 * @extends FuelinkEmitter
 */
class Player extends FuelinkEmitter {
    /**
     * Create a new Player
     * @param {Object} manager - Fuelink manager
     * @param {PlayerOptions} options - Player options
     */
    constructor(manager, options) {
        super();

        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;

        /**
         * Guild ID
         * @type {string}
         */
        this.guildId = options.guildId;

        /**
         * Voice channel ID
         * @type {string}
         */
        this.voiceChannel = options.voiceChannel;

        /**
         * Text channel ID
         * @type {string|null}
         */
        this.textChannel = options.textChannel ?? null;

        /**
         * Current volume (0-100 normalized scale)
         * @type {number}
         */
        this.volume = options.volume ?? Defaults.PLAYER.volume;

        /**
         * Current player state
         * @type {string}
         */
        this.state = PlayerState.CONNECTING;

        /**
         * Queue manager
         * @type {Queue}
         */
        this.queue = new Queue(this);

        /**
         * Filter manager
         * @type {Filters}
         */
        this.filters = new Filters(this);

        /**
         * Voice connection handler
         * @type {Connection}
         */
        this.connection = new Connection(this);

        /**
         * Current node
         * @type {Object|null}
         */
        this.node = options.node ?? null;

        /**
         * Whether player is playing
         * @type {boolean}
         */
        this.playing = false;

        /**
         * Whether player is paused
         * @type {boolean}
         */
        this.paused = false;

        /**
         * Current track position in ms
         * @type {number}
         */
        this.position = 0;

        /**
         * Timestamp of last position update
         * @type {number}
         */
        this.positionTimestamp = 0;

        /**
         * Whether player is connected to voice
         * @type {boolean}
         */
        this.connected = false;

        /**
         * Inactivity timeout settings
         * @type {Object}
         */
        this.inactivity = { ...Defaults.INACTIVITY };

        /**
         * Inactivity timer
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._inactivityTimer = null;

        /**
         * Preloaded next track
         * @type {Object|null}
         * @private
         */
        this._preloadedTrack = null;

        /**
         * Self deafen setting
         * @type {boolean}
         */
        this.selfDeaf = options.selfDeaf ?? Defaults.PLAYER.selfDeaf;

        /**
         * Self mute setting  
         * @type {boolean}
         */
        this.selfMute = options.selfMute ?? Defaults.PLAYER.selfMute;

        // Setup connection event handlers
        this._setupConnectionEvents();
    }

    /**
     * Get the current track
     * @type {Track|null}
     */
    get current() {
        return this.queue.current;
    }

    /**
     * Get estimated current position
     * @type {number}
     */
    get estimatedPosition() {
        if (!this.playing || this.paused) {
            return this.position;
        }
        return this.position + (Date.now() - this.positionTimestamp);
    }

    /**
     * Check if player is active (connected and has something to play)
     * @type {boolean}
     */
    get isActive() {
        return this.connected && (this.playing || this.queue.size > 0);
    }

    /**
     * Setup connection event handlers
     * @private
     */
    _setupConnectionEvents() {
        this.connection.on('ready', (data) => {
            this._sendVoiceUpdate(data);
        });

        this.connection.on('disconnect', () => {
            this.connected = false;
            this.playing = false;
            this.emit(Events.PLAYER_DISCONNECT, { player: this });
        });

        this.connection.on('move', ({ oldChannel, newChannel }) => {
            this.voiceChannel = newChannel;
            this.emit(Events.PLAYER_MOVE, {
                player: this,
                oldChannel,
                newChannel
            });
        });

        this.connection.on('voiceUpdate', (data) => {
            // Forward to voice adapter
            this.manager._sendVoiceUpdate(data);
        });
    }

    /**
     * Connect to voice channel
     * @returns {Promise<void>}
     */
    async connect() {
        this.state = PlayerState.CONNECTING;

        await this.connection.connect({
            channelId: this.voiceChannel,
            selfDeaf: this.selfDeaf,
            selfMute: this.selfMute
        });

        this.connected = true;
        this.state = PlayerState.CONNECTED;
    }

    /**
     * Disconnect from voice channel
     * @returns {void}
     */
    disconnect() {
        this.connection.disconnect();
        this.connected = false;
        this.state = PlayerState.DISCONNECTED;
    }

    /**
     * Send voice update to Lavalink
     * @private
     * @param {Object} data - Voice connection data
     */
    async _sendVoiceUpdate(data) {
        if (!this.node) {
            this.node = this.manager.nodes.getBest(this.connection.region);
        }

        await this.node.updatePlayer(this.guildId, {
            voice: {
                sessionId: data.sessionId,
                token: data.token,
                endpoint: data.endpoint
            }
        });
    }

    // ==================== Playback ====================

    /**
     * Play a track or the next track in queue
     * @param {Track} [track] - Track to play (optional)
     * @param {Object} [options] - Play options
     * @param {number} [options.startTime] - Start time in ms
     * @param {number} [options.endTime] - End time in ms
     * @param {boolean} [options.noReplace=false] - Don't replace current track
     * @returns {Promise<Track|null>}
     */
    async play(track, options = {}) {
        // If no track provided, get from queue
        if (!track) {
            track = this.queue.next();
            if (!track) {
                this.emit(Events.QUEUE_END, { player: this });
                this._handleQueueEnd();
                return null;
            }
        } else {
            // Set as current track
            this.queue.current = track instanceof Track ? track : Track.from(track);
        }

        const playOptions = {
            track: { encoded: this.queue.current.encoded }
        };

        if (options.startTime) {
            playOptions.position = options.startTime;
        }
        if (options.endTime) {
            playOptions.endTime = options.endTime;
        }

        // Apply current filters
        if (this.filters.hasActiveFilters) {
            playOptions.filters = this.filters.toJSON();
        }

        // Set volume
        playOptions.volume = this.volume;

        await this.node.updatePlayer(this.guildId, playOptions, options.noReplace);

        this.playing = true;
        this.paused = false;
        this.state = PlayerState.PLAYING;

        this._resetInactivityTimer();
        this._preloadNextTrack();

        return this.queue.current;
    }

    /**
     * Pause playback
     * @returns {Promise<void>}
     */
    async pause() {
        if (!this.playing) return;

        await this.node.updatePlayer(this.guildId, { paused: true });

        this.paused = true;
        this.state = PlayerState.PAUSED;

        this._startInactivityTimer('paused');
    }

    /**
     * Resume playback
     * @returns {Promise<void>}
     */
    async resume() {
        if (!this.paused) return;

        await this.node.updatePlayer(this.guildId, { paused: false });

        this.paused = false;
        this.state = PlayerState.PLAYING;

        this._resetInactivityTimer();
    }

    /**
     * Stop playback
     * @param {boolean} [clearQueue=false] - Also clear the queue
     * @returns {Promise<void>}
     */
    async stop(clearQueue = false) {
        await this.node.updatePlayer(this.guildId, { track: { encoded: null } });

        this.playing = false;
        this.paused = false;
        this.position = 0;
        this.queue.current = null;
        this.state = PlayerState.STOPPED;

        if (clearQueue) {
            this.queue.clear();
        }

        this._startInactivityTimer('stopped');
    }

    /**
     * Skip to the next track
     * @returns {Promise<Track|null>}
     */
    async skip() {
        return this.play();
    }

    /**
     * Go back to the previous track
     * @returns {Promise<Track|null>}
     */
    async back() {
        const track = this.queue.back();
        if (track) {
            return this.play(track);
        }
        return null;
    }

    /**
     * Seek to a position
     * @param {number} position - Position in milliseconds
     * @returns {Promise<void>}
     */
    async seek(position) {
        const clampedPosition = Math.max(0, Math.min(position, this.current?.duration || 0));

        await this.node.updatePlayer(this.guildId, { position: clampedPosition });

        this.position = clampedPosition;
        this.positionTimestamp = Date.now();
    }

    /**
     * Set the volume
     * @param {number} volume - Volume level (0-100)
     * @returns {Promise<void>}
     */
    async setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        await this.filters.setVolume(this.volume);
    }

    // ==================== Event Handlers ====================

    /**
     * Handle player state update from Lavalink
     * @private
     * @param {Object} state
     */
    _handleUpdate(state) {
        this.position = state.position ?? 0;
        this.positionTimestamp = state.time ?? Date.now();
        this.connected = state.connected ?? this.connected;

        this.emit(Events.PLAYER_UPDATE, { player: this, state });
    }

    /**
     * Handle track start event
     * @private
     * @param {Object} trackData
     */
    _handleTrackStart(trackData) {
        this.playing = true;
        this.paused = false;
        this.state = PlayerState.PLAYING;

        this.emit(Events.TRACK_START, {
            player: this,
            track: this.queue.current
        });
    }

    /**
     * Handle track end event
     * @private
     * @param {Object} trackData
     * @param {string} reason
     */
    _handleTrackEnd(trackData, reason) {
        this.emit(Events.TRACK_END, {
            player: this,
            track: this.queue.current,
            reason
        });

        // Only auto-play next if track finished normally
        if (reason === TrackEndReason.FINISHED) {
            this.play();
        } else if (reason === TrackEndReason.LOAD_FAILED) {
            // Try next track on load failure
            this.play();
        }
    }

    /**
     * Handle track stuck event
     * @private
     * @param {Object} trackData
     * @param {number} thresholdMs
     */
    _handleTrackStuck(trackData, thresholdMs) {
        this.emit(Events.TRACK_STUCK, {
            player: this,
            track: this.queue.current,
            threshold: thresholdMs
        });

        // Skip to next track
        this.play();
    }

    /**
     * Handle track exception event
     * @private
     * @param {Object} trackData
     * @param {Object} exception
     */
    _handleTrackException(trackData, exception) {
        this.emit(Events.TRACK_ERROR, {
            player: this,
            track: this.queue.current,
            error: new Error(exception.message)
        });

        // Skip to next track
        this.play();
    }

    /**
     * Handle WebSocket closed event
     * @private
     * @param {number} code
     * @param {string} reason
     * @param {boolean} byRemote
     */
    _handleWebSocketClosed(code, reason, byRemote) {
        this.manager.logger?.warn(
            `Voice WebSocket closed (${code}): ${reason}`,
            `Player:${this.guildId}`
        );

        if (code === 4014) {
            // Disconnected from voice channel
            this.connected = false;
            this.playing = false;
            this.emit(Events.PLAYER_DISCONNECT, { player: this });
        }
    }

    /**
     * Handle queue end
     * @private
     */
    async _handleQueueEnd() {
        // Try autoplay
        if (this.queue.autoplay && this.queue.autoplayProvider) {
            try {
                const tracks = await this.queue.getAutoplayTracks();
                if (tracks.length > 0) {
                    this.queue.add(tracks);
                    return this.play();
                }
            } catch (error) {
                this.manager.logger?.warn(`Autoplay failed: ${error.message}`);
            }
        }

        this.playing = false;
        this.state = PlayerState.STOPPED;
        this._startInactivityTimer('empty');
    }

    // ==================== Filters ====================

    /**
     * Send filters to Lavalink
     * @private
     * @param {Object} filterPayload
     */
    async _sendFilters(filterPayload) {
        await this.node.updatePlayer(this.guildId, { filters: filterPayload });
    }

    // ==================== Inactivity ====================

    /**
     * Reset inactivity timer
     * @private
     */
    _resetInactivityTimer() {
        if (this._inactivityTimer) {
            clearTimeout(this._inactivityTimer);
            this._inactivityTimer = null;
        }
    }

    /**
     * Start inactivity timer
     * @private
     * @param {string} reason - Reason for inactivity
     */
    _startInactivityTimer(reason) {
        if (!this.inactivity.enabled) return;

        this._resetInactivityTimer();

        let timeout;
        switch (reason) {
            case 'paused':
                timeout = this.inactivity.pausedTimeout;
                break;
            case 'empty':
                timeout = this.inactivity.emptyTimeout;
                break;
            default:
                timeout = this.inactivity.timeout;
        }

        this._inactivityTimer = setTimeout(() => {
            this.manager.logger?.info(`Inactivity timeout (${reason})`, `Player:${this.guildId}`);
            this.destroy();
        }, timeout);
    }

    // ==================== Preloading ====================

    /**
     * Preload the next track for gapless playback
     * @private
     */
    async _preloadNextTrack() {
        const nextTrack = this.queue.at(0);
        if (!nextTrack || !nextTrack.encoded) return;

        // Lavalink v4 handles preloading internally
        this._preloadedTrack = nextTrack;
    }

    // ==================== Node Migration ====================

    /**
     * Migrate player to a different node
     * @param {Object} newNode - Target node
     * @returns {Promise<void>}
     */
    async migrateNode(newNode) {
        const oldNode = this.node;

        // Destroy on old node
        try {
            await oldNode.destroyPlayer(this.guildId);
        } catch {
            // Ignore errors - old node might be down
        }

        // Setup on new node
        this.node = newNode;

        // Restore state
        if (this.connected) {
            await this._sendVoiceUpdate(this.connection.getVoicePayload());
        }

        if (this.queue.current && this.playing) {
            await this.play(this.queue.current, {
                startTime: this.estimatedPosition
            });
        }

        this.manager.logger?.info(
            `Migrated from ${oldNode.name} to ${newNode.name}`,
            `Player:${this.guildId}`
        );
    }

    // ==================== Cleanup ====================

    /**
     * Destroy the player
     * @returns {Promise<void>}
     */
    async destroy() {
        this._resetInactivityTimer();

        // Destroy on Lavalink
        if (this.node?.connected) {
            try {
                await this.node.destroyPlayer(this.guildId);
            } catch {
                // Ignore errors
            }
        }

        // Disconnect from voice
        this.disconnect();

        // Cleanup
        this.queue.destroy();
        this.connection.destroy();
        this.state = PlayerState.DESTROYED;

        // Remove from manager
        this.manager.players.delete(this.guildId);

        this.emit(Events.PLAYER_DESTROY, { player: this });
        this.removeAllListeners();
    }

    // ==================== Serialization ====================

    /**
     * Serialize player state
     * @returns {Object}
     */
    toJSON() {
        return {
            guildId: this.guildId,
            voiceChannel: this.voiceChannel,
            textChannel: this.textChannel,
            volume: this.volume,
            state: this.state,
            playing: this.playing,
            paused: this.paused,
            position: this.estimatedPosition,
            queue: this.queue.toJSON(),
            filters: this.filters.toJSON(),
            connection: this.connection.toJSON(),
            node: this.node?.name
        };
    }

    /**
     * Restore player from serialized state
     * @param {Object} data - Serialized player data
     */
    async fromJSON(data) {
        this.volume = data.volume ?? 100;
        this.queue.fromJSON(data.queue);

        if (data.filters) {
            await this.filters.fromJSON(data.filters);
        }

        // Resume playback if was playing
        if (data.playing && this.queue.current) {
            await this.play(this.queue.current, {
                startTime: data.position
            });

            if (data.paused) {
                await this.pause();
            }
        }
    }
}

module.exports = { Player };
