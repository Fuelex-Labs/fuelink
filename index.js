'use strict';

/**
 * @file Fuelink - Complete Lavalink Client for Fuelex
 * @module fuelink
 * @author Sploov
 * @license MIT
 */

// Main client
const { Fuelink } = require('./src/Fuelink');

// Structures
const { Track } = require('./src/structures/Track');
const { Queue } = require('./src/structures/Queue');
const { Player } = require('./src/structures/Player');
const { Node } = require('./src/structures/Node');
const { Filters } = require('./src/structures/Filters');
const { Connection } = require('./src/structures/Connection');

// Managers
const { NodeManager } = require('./src/managers/NodeManager');
const { PlayerManager } = require('./src/managers/PlayerManager');

// Adapters
const { VoiceAdapter } = require('./src/adapters/VoiceAdapter');
const { DistubeAdapter } = require('./src/adapters/DistubeAdapter');

// Plugins
const { PluginManager } = require('./src/plugins/PluginManager');
const { BaseSource } = require('./src/plugins/sources/BaseSource');

// Persistence
const { SessionStore } = require('./src/persistence/SessionStore');

// Events
const { FuelinkEmitter, EventPriority } = require('./src/events/EventEmitter');

// Utils
const {
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
} = require('./src/utils/Constants');
const { Logger, LogLevel, Colors } = require('./src/utils/Logger');
const { Util } = require('./src/utils/Util');

// Version
const { version } = require('./package.json');

/**
 * Create a new Fuelink instance
 * @param {Object} options - Client options
 * @returns {Fuelink}
 */
function createClient(options) {
    return new Fuelink(options);
}

module.exports = {
    // Main
    Fuelink,
    createClient,
    version,

    // Structures
    Track,
    Queue,
    Player,
    Node,
    Filters,
    Connection,

    // Managers
    NodeManager,
    PlayerManager,

    // Adapters
    VoiceAdapter,
    DistubeAdapter,

    // Plugins
    PluginManager,
    BaseSource,

    // Persistence
    SessionStore,

    // Events
    FuelinkEmitter,
    EventPriority,

    // Constants
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
    TimescalePresets,

    // Utils
    Logger,
    LogLevel,
    Colors,
    Util
};
