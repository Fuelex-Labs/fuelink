'use strict';

/**
 * @file Audio filters system for Fuelink
 * @module fuelink/structures/Filters
 */

const { BassBoostPresets, EQPresets, TimescalePresets } = require('../utils/Constants');

/**
 * @typedef {Object} EQBand
 * @property {number} band - Band number (0-14)
 * @property {number} gain - Gain value (-0.25 to 1.0)
 */

/**
 * @typedef {Object} TimescaleOptions
 * @property {number} [speed=1.0] - Playback speed (0.25 to 2.0)
 * @property {number} [pitch=1.0] - Pitch shift (0.25 to 2.0)
 * @property {number} [rate=1.0] - Sample rate (0.25 to 2.0)
 */

/**
 * @typedef {Object} KaraokeOptions
 * @property {number} [level=1.0] - Effect level
 * @property {number} [monoLevel=1.0] - Mono level
 * @property {number} [filterBand=220] - Filter band frequency
 * @property {number} [filterWidth=100] - Filter width
 */

/**
 * @typedef {Object} TremoloOptions
 * @property {number} [frequency=2.0] - Tremolo frequency (> 0)
 * @property {number} [depth=0.5] - Tremolo depth (0 to 1)
 */

/**
 * @typedef {Object} VibratoOptions
 * @property {number} [frequency=2.0] - Vibrato frequency (0 to 14)
 * @property {number} [depth=0.5] - Vibrato depth (0 to 1)
 */

/**
 * @typedef {Object} RotationOptions
 * @property {number} [rotationHz=0.2] - Rotation speed in Hz
 */

/**
 * @typedef {Object} DistortionOptions
 * @property {number} [sinOffset=0] - Sin wave offset
 * @property {number} [sinScale=1] - Sin wave scale
 * @property {number} [cosOffset=0] - Cos wave offset
 * @property {number} [cosScale=1] - Cos wave scale
 * @property {number} [tanOffset=0] - Tan wave offset
 * @property {number} [tanScale=1] - Tan wave scale
 * @property {number} [offset=0] - Overall offset
 * @property {number} [scale=1] - Overall scale
 */

/**
 * @typedef {Object} ChannelMixOptions
 * @property {number} [leftToLeft=1.0] - Left to left mix
 * @property {number} [leftToRight=0.0] - Left to right mix
 * @property {number} [rightToLeft=0.0] - Right to left mix
 * @property {number} [rightToRight=1.0] - Right to right mix
 */

/**
 * @typedef {Object} LowPassOptions
 * @property {number} [smoothing=20.0] - Smoothing factor
 */

/**
 * Manages audio filters for a player
 */
class Filters {
    /**
     * Create a new Filters instance
     * @param {Object} player - Parent player instance
     */
    constructor(player) {
        /**
         * Parent player
         * @type {Object}
         */
        this.player = player;

        /**
         * Current volume (0-1000, Lavalink scale)
         * @type {number}
         */
        this.volume = 100;

        /**
         * Equalizer bands
         * @type {EQBand[]}
         */
        this.equalizer = [];

        /**
         * Timescale settings
         * @type {TimescaleOptions|null}
         */
        this.timescale = null;

        /**
         * Karaoke settings
         * @type {KaraokeOptions|null}
         */
        this.karaoke = null;

        /**
         * Tremolo settings
         * @type {TremoloOptions|null}
         */
        this.tremolo = null;

        /**
         * Vibrato settings
         * @type {VibratoOptions|null}
         */
        this.vibrato = null;

        /**
         * Rotation settings (8D audio)
         * @type {RotationOptions|null}
         */
        this.rotation = null;

        /**
         * Distortion settings
         * @type {DistortionOptions|null}
         */
        this.distortion = null;

        /**
         * Channel mix settings
         * @type {ChannelMixOptions|null}
         */
        this.channelMix = null;

        /**
         * Low pass filter settings
         * @type {LowPassOptions|null}
         */
        this.lowPass = null;

        /**
         * Custom filter presets
         * @type {Map<string, Object>}
         */
        this.presets = new Map();
    }

    /**
     * Apply the current filters to Lavalink
     * @returns {Promise<void>}
     */
    async apply() {
        const payload = this.toJSON();
        await this.player._sendFilters(payload);
    }

    /**
     * Reset all filters to default
     * @returns {Promise<void>}
     */
    async reset() {
        this.volume = 100;
        this.equalizer = [];
        this.timescale = null;
        this.karaoke = null;
        this.tremolo = null;
        this.vibrato = null;
        this.rotation = null;
        this.distortion = null;
        this.channelMix = null;
        this.lowPass = null;
        await this.apply();
    }

    // ==================== Volume ====================

    /**
     * Set the volume
     * @param {number} volume - Volume level (0-1000)
     * @returns {Promise<void>}
     */
    async setVolume(volume) {
        this.volume = Math.max(0, Math.min(1000, volume));
        await this.apply();
    }

    // ==================== Equalizer ====================

    /**
     * Set equalizer bands
     * @param {EQBand[]} bands - Array of band settings
     * @returns {Promise<void>}
     */
    async setEqualizer(bands) {
        this.equalizer = bands.map(b => ({
            band: b.band,
            gain: Math.max(-0.25, Math.min(1.0, b.gain))
        }));
        await this.apply();
    }

    /**
     * Set a single equalizer band
     * @param {number} band - Band number (0-14)
     * @param {number} gain - Gain value (-0.25 to 1.0)
     * @returns {Promise<void>}
     */
    async setBand(band, gain) {
        const clampedGain = Math.max(-0.25, Math.min(1.0, gain));
        const existing = this.equalizer.find(b => b.band === band);

        if (existing) {
            existing.gain = clampedGain;
        } else {
            this.equalizer.push({ band, gain: clampedGain });
        }

        await this.apply();
    }

    /**
     * Apply an EQ preset
     * @param {string} preset - Preset name (flat, bass, pop, rock, classical)
     * @returns {Promise<void>}
     */
    async setEQPreset(preset) {
        const presetBands = EQPresets[preset];
        if (!presetBands) {
            throw new Error(`Unknown EQ preset: ${preset}`);
        }
        await this.setEqualizer(presetBands);
    }

    /**
     * Clear equalizer
     * @returns {Promise<void>}
     */
    async clearEqualizer() {
        this.equalizer = [];
        await this.apply();
    }

    // ==================== Bass Boost ====================

    /**
     * Set bass boost level
     * @param {string} level - Level (off, low, medium, high, extreme)
     * @returns {Promise<void>}
     */
    async setBassBoost(level) {
        const preset = BassBoostPresets[level];
        if (preset === undefined) {
            throw new Error(`Unknown bass boost level: ${level}`);
        }

        // Merge bass boost with existing EQ (only affect bass bands)
        const bassBoostBands = new Set(preset.map(b => b.band));
        const otherBands = this.equalizer.filter(b => !bassBoostBands.has(b.band));

        this.equalizer = [...otherBands, ...preset];
        await this.apply();
    }

    // ==================== Timescale Effects ====================

    /**
     * Set timescale
     * @param {TimescaleOptions} options - Timescale options
     * @returns {Promise<void>}
     */
    async setTimescale(options) {
        this.timescale = {
            speed: options.speed ?? 1.0,
            pitch: options.pitch ?? 1.0,
            rate: options.rate ?? 1.0
        };
        await this.apply();
    }

    /**
     * Enable/disable nightcore effect
     * @param {boolean} enabled - Enable or disable
     * @returns {Promise<void>}
     */
    async setNightcore(enabled) {
        if (enabled) {
            this.timescale = { ...TimescalePresets.nightcore };
        } else if (this.timescale) {
            this.timescale = null;
        }
        await this.apply();
    }

    /**
     * Enable/disable vaporwave effect
     * @param {boolean} enabled - Enable or disable
     * @returns {Promise<void>}
     */
    async setVaporwave(enabled) {
        if (enabled) {
            this.timescale = { ...TimescalePresets.vaporwave };
        } else if (this.timescale) {
            this.timescale = null;
        }
        await this.apply();
    }

    /**
     * Set playback speed
     * @param {number} speed - Speed multiplier (0.25 to 2.0)
     * @returns {Promise<void>}
     */
    async setSpeed(speed) {
        const clampedSpeed = Math.max(0.25, Math.min(2.0, speed));
        this.timescale = {
            ...(this.timescale || {}),
            speed: clampedSpeed,
            pitch: this.timescale?.pitch ?? 1.0,
            rate: this.timescale?.rate ?? 1.0
        };
        await this.apply();
    }

    /**
     * Set pitch
     * @param {number} pitch - Pitch multiplier (0.25 to 2.0)
     * @returns {Promise<void>}
     */
    async setPitch(pitch) {
        const clampedPitch = Math.max(0.25, Math.min(2.0, pitch));
        this.timescale = {
            ...(this.timescale || {}),
            speed: this.timescale?.speed ?? 1.0,
            pitch: clampedPitch,
            rate: this.timescale?.rate ?? 1.0
        };
        await this.apply();
    }

    // ==================== Other Filters ====================

    /**
     * Enable/disable 8D audio (rotation)
     * @param {boolean} enabled - Enable or disable
     * @param {number} [rotationHz=0.2] - Rotation speed
     * @returns {Promise<void>}
     */
    async set8D(enabled, rotationHz = 0.2) {
        this.rotation = enabled ? { rotationHz } : null;
        await this.apply();
    }

    /**
     * Set karaoke effect
     * @param {KaraokeOptions|null} options - Karaoke options or null to disable
     * @returns {Promise<void>}
     */
    async setKaraoke(options) {
        this.karaoke = options;
        await this.apply();
    }

    /**
     * Set tremolo effect
     * @param {TremoloOptions|null} options - Tremolo options or null to disable
     * @returns {Promise<void>}
     */
    async setTremolo(options) {
        this.tremolo = options;
        await this.apply();
    }

    /**
     * Set vibrato effect
     * @param {VibratoOptions|null} options - Vibrato options or null to disable
     * @returns {Promise<void>}
     */
    async setVibrato(options) {
        this.vibrato = options;
        await this.apply();
    }

    /**
     * Set distortion effect
     * @param {DistortionOptions|null} options - Distortion options or null to disable
     * @returns {Promise<void>}
     */
    async setDistortion(options) {
        this.distortion = options;
        await this.apply();
    }

    /**
     * Set channel mix
     * @param {ChannelMixOptions|null} options - Channel mix options or null to disable
     * @returns {Promise<void>}
     */
    async setChannelMix(options) {
        this.channelMix = options;
        await this.apply();
    }

    /**
     * Set low pass filter
     * @param {LowPassOptions|null} options - Low pass options or null to disable
     * @returns {Promise<void>}
     */
    async setLowPass(options) {
        this.lowPass = options;
        await this.apply();
    }

    // ==================== Presets ====================

    /**
     * Save current filters as a preset
     * @param {string} name - Preset name
     */
    savePreset(name) {
        this.presets.set(name, this.toJSON());
    }

    /**
     * Load a saved preset
     * @param {string} name - Preset name
     * @returns {Promise<void>}
     */
    async loadPreset(name) {
        // Check custom presets first
        if (this.presets.has(name)) {
            await this.fromJSON(this.presets.get(name));
            return;
        }

        // Check built-in presets
        switch (name) {
            case 'nightcore':
                await this.setNightcore(true);
                break;
            case 'vaporwave':
                await this.setVaporwave(true);
                break;
            case 'bass-boost':
                await this.setBassBoost('high');
                break;
            case 'radio':
                await this.setEqualizer([
                    { band: 0, gain: 0.2 },
                    { band: 1, gain: 0.1 },
                    { band: 8, gain: -0.15 },
                    { band: 9, gain: -0.2 },
                    { band: 10, gain: -0.25 }
                ]);
                break;
            default:
                throw new Error(`Unknown preset: ${name}`);
        }
    }

    /**
     * Delete a saved preset
     * @param {string} name - Preset name
     * @returns {boolean} Whether the preset was deleted
     */
    deletePreset(name) {
        return this.presets.delete(name);
    }

    /**
     * Get all saved preset names
     * @returns {string[]}
     */
    getPresetNames() {
        return Array.from(this.presets.keys());
    }

    // ==================== Serialization ====================

    /**
     * Convert filters to Lavalink payload
     * @returns {Object}
     */
    toJSON() {
        const payload = {};

        if (this.volume !== 100) {
            payload.volume = this.volume / 100;
        }

        if (this.equalizer.length > 0) {
            payload.equalizer = this.equalizer;
        }

        if (this.timescale) {
            payload.timescale = this.timescale;
        }

        if (this.karaoke) {
            payload.karaoke = this.karaoke;
        }

        if (this.tremolo) {
            payload.tremolo = this.tremolo;
        }

        if (this.vibrato) {
            payload.vibrato = this.vibrato;
        }

        if (this.rotation) {
            payload.rotation = this.rotation;
        }

        if (this.distortion) {
            payload.distortion = this.distortion;
        }

        if (this.channelMix) {
            payload.channelMix = this.channelMix;
        }

        if (this.lowPass) {
            payload.lowPass = this.lowPass;
        }

        return payload;
    }

    /**
     * Load filters from JSON
     * @param {Object} data - Filter data
     * @returns {Promise<void>}
     */
    async fromJSON(data) {
        if (data.volume !== undefined) {
            this.volume = data.volume * 100;
        }
        if (data.equalizer) {
            this.equalizer = data.equalizer;
        }
        if (data.timescale !== undefined) {
            this.timescale = data.timescale;
        }
        if (data.karaoke !== undefined) {
            this.karaoke = data.karaoke;
        }
        if (data.tremolo !== undefined) {
            this.tremolo = data.tremolo;
        }
        if (data.vibrato !== undefined) {
            this.vibrato = data.vibrato;
        }
        if (data.rotation !== undefined) {
            this.rotation = data.rotation;
        }
        if (data.distortion !== undefined) {
            this.distortion = data.distortion;
        }
        if (data.channelMix !== undefined) {
            this.channelMix = data.channelMix;
        }
        if (data.lowPass !== undefined) {
            this.lowPass = data.lowPass;
        }

        await this.apply();
    }

    /**
     * Check if any filters are active
     * @type {boolean}
     */
    get hasActiveFilters() {
        return (
            this.volume !== 100 ||
            this.equalizer.length > 0 ||
            this.timescale !== null ||
            this.karaoke !== null ||
            this.tremolo !== null ||
            this.vibrato !== null ||
            this.rotation !== null ||
            this.distortion !== null ||
            this.channelMix !== null ||
            this.lowPass !== null
        );
    }
}

module.exports = { Filters };
