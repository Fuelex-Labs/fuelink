'use strict';

/**
 * @file Constants and enums for Fuelink
 * @module fuelink/utils/Constants
 */

/**
 * Player state enumeration
 * @readonly
 * @enum {string}
 */
const PlayerState = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  DISCONNECTED: 'DISCONNECTED',
  DESTROYED: 'DESTROYED'
};

/**
 * Node state enumeration
 * @readonly
 * @enum {string}
 */
const NodeState = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  DESTROYED: 'DESTROYED'
};

/**
 * Loop mode enumeration
 * @readonly
 * @enum {string}
 */
const LoopMode = {
  OFF: 'off',
  TRACK: 'track',
  QUEUE: 'queue'
};

/**
 * Track end reason enumeration
 * @readonly
 * @enum {string}
 */
const TrackEndReason = {
  FINISHED: 'finished',
  LOAD_FAILED: 'loadFailed',
  STOPPED: 'stopped',
  REPLACED: 'replaced',
  CLEANUP: 'cleanup'
};

/**
 * Event names for the client
 * @readonly
 * @enum {string}
 */
const Events = {
  // Node events
  NODE_CONNECT: 'nodeConnect',
  NODE_DISCONNECT: 'nodeDisconnect',
  NODE_RECONNECT: 'nodeReconnect',
  NODE_ERROR: 'nodeError',
  NODE_READY: 'nodeReady',
  NODE_STATS: 'nodeStats',
  NODE_RAW: 'nodeRaw',

  // Player events
  PLAYER_CREATE: 'playerCreate',
  PLAYER_DESTROY: 'playerDestroy',
  PLAYER_MOVE: 'playerMove',
  PLAYER_DISCONNECT: 'playerDisconnect',
  PLAYER_UPDATE: 'playerUpdate',

  // Track events
  TRACK_START: 'trackStart',
  TRACK_END: 'trackEnd',
  TRACK_STUCK: 'trackStuck',
  TRACK_ERROR: 'trackError',

  // Queue events
  QUEUE_ADD: 'queueAdd',
  QUEUE_REMOVE: 'queueRemove',
  QUEUE_SHUFFLE: 'queueShuffle',
  QUEUE_CLEAR: 'queueClear',
  QUEUE_END: 'queueEnd',

  // System events
  DEBUG: 'debug',
  ERROR: 'error',
  READY: 'ready'
};

/**
 * Lavalink OP codes
 * @readonly
 * @enum {string}
 */
const OpCodes = {
  // Outgoing
  VOICE_UPDATE: 'voiceUpdate',
  PLAY: 'play',
  STOP: 'stop',
  PAUSE: 'pause',
  SEEK: 'seek',
  VOLUME: 'volume',
  FILTERS: 'filters',
  DESTROY: 'destroy',
  CONFIGURE_RESUMING: 'configureResuming',

  // Incoming
  PLAYER_UPDATE: 'playerUpdate',
  STATS: 'stats',
  EVENT: 'event',
  READY: 'ready'
};

/**
 * Lavalink event types
 * @readonly
 * @enum {string}
 */
const LavalinkEvents = {
  TRACK_START: 'TrackStartEvent',
  TRACK_END: 'TrackEndEvent',
  TRACK_EXCEPTION: 'TrackExceptionEvent',
  TRACK_STUCK: 'TrackStuckEvent',
  WEBSOCKET_CLOSED: 'WebSocketClosedEvent'
};

/**
 * Error codes for Fuelink
 * @readonly
 * @enum {string}
 */
const ErrorCodes = {
  INVALID_NODE: 'INVALID_NODE',
  NO_NODES: 'NO_NODES',
  PLAYER_EXISTS: 'PLAYER_EXISTS',
  NO_PLAYER: 'NO_PLAYER',
  VOICE_ERROR: 'VOICE_ERROR',
  TRACK_ERROR: 'TRACK_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
  FILTER_ERROR: 'FILTER_ERROR',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  PERSISTENCE_ERROR: 'PERSISTENCE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR'
};

/**
 * Default configuration values
 * @readonly
 */
const Defaults = {
  NODE: {
    port: 2333,
    secure: false,
    retryAmount: 5,
    retryDelay: 5000,
    resumeTimeout: 60,
    priority: 1
  },
  PLAYER: {
    volume: 100,
    selfDeaf: true,
    selfMute: false
  },
  INACTIVITY: {
    enabled: true,
    timeout: 300000,        // 5 minutes
    pausedTimeout: 600000,  // 10 minutes
    emptyTimeout: 30000     // 30 seconds
  },
  RECONNECT: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2
  }
};

/**
 * Bass boost presets
 * @readonly
 */
const BassBoostPresets = {
  off: [],
  low: [
    { band: 0, gain: 0.1 },
    { band: 1, gain: 0.1 },
    { band: 2, gain: 0.05 }
  ],
  medium: [
    { band: 0, gain: 0.25 },
    { band: 1, gain: 0.2 },
    { band: 2, gain: 0.15 },
    { band: 3, gain: 0.1 }
  ],
  high: [
    { band: 0, gain: 0.4 },
    { band: 1, gain: 0.35 },
    { band: 2, gain: 0.25 },
    { band: 3, gain: 0.2 },
    { band: 4, gain: 0.1 }
  ],
  extreme: [
    { band: 0, gain: 0.65 },
    { band: 1, gain: 0.55 },
    { band: 2, gain: 0.45 },
    { band: 3, gain: 0.35 },
    { band: 4, gain: 0.25 },
    { band: 5, gain: 0.15 }
  ]
};

/**
 * Equalizer presets
 * @readonly
 */
const EQPresets = {
  flat: Array.from({ length: 15 }, (_, i) => ({ band: i, gain: 0 })),
  bass: [
    { band: 0, gain: 0.6 },
    { band: 1, gain: 0.5 },
    { band: 2, gain: 0.3 },
    { band: 3, gain: 0.15 },
    ...Array.from({ length: 11 }, (_, i) => ({ band: i + 4, gain: 0 }))
  ],
  pop: [
    { band: 0, gain: -0.1 },
    { band: 1, gain: 0.15 },
    { band: 2, gain: 0.25 },
    { band: 3, gain: 0.2 },
    { band: 4, gain: 0.1 },
    { band: 5, gain: 0 },
    { band: 6, gain: -0.1 },
    { band: 7, gain: -0.15 },
    { band: 8, gain: -0.1 },
    { band: 9, gain: 0 },
    { band: 10, gain: 0.1 },
    { band: 11, gain: 0.2 },
    { band: 12, gain: 0.25 },
    { band: 13, gain: 0.2 },
    { band: 14, gain: 0.1 }
  ],
  rock: [
    { band: 0, gain: 0.3 },
    { band: 1, gain: 0.25 },
    { band: 2, gain: 0.2 },
    { band: 3, gain: 0.1 },
    { band: 4, gain: -0.05 },
    { band: 5, gain: -0.15 },
    { band: 6, gain: -0.1 },
    { band: 7, gain: 0 },
    { band: 8, gain: 0.1 },
    { band: 9, gain: 0.2 },
    { band: 10, gain: 0.3 },
    { band: 11, gain: 0.35 },
    { band: 12, gain: 0.3 },
    { band: 13, gain: 0.25 },
    { band: 14, gain: 0.2 }
  ],
  classical: [
    { band: 0, gain: 0.35 },
    { band: 1, gain: 0.25 },
    { band: 2, gain: 0.15 },
    { band: 3, gain: 0.05 },
    { band: 4, gain: -0.05 },
    { band: 5, gain: -0.1 },
    { band: 6, gain: -0.05 },
    { band: 7, gain: 0 },
    { band: 8, gain: 0.1 },
    { band: 9, gain: 0.15 },
    { band: 10, gain: 0.2 },
    { band: 11, gain: 0.25 },
    { band: 12, gain: 0.3 },
    { band: 13, gain: 0.25 },
    { band: 14, gain: 0.2 }
  ]
};

/**
 * Timescale presets for effects
 * @readonly
 */
const TimescalePresets = {
  nightcore: { speed: 1.25, pitch: 1.25, rate: 1.0 },
  vaporwave: { speed: 0.8, pitch: 0.9, rate: 1.0 },
  daycore: { speed: 0.85, pitch: 0.85, rate: 1.0 }
};

module.exports = {
  PlayerState,
  NodeState,
  LoopMode,
  TrackEndReason,
  Events,
  OpCodes,
  LavalinkEvents,
  ErrorCodes,
  Defaults,
  BassBoostPresets,
  EQPresets,
  TimescalePresets
};
