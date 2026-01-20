'use strict';

/**
 * @file Logger utility for Fuelink
 * @module fuelink/utils/Logger
 */

/**
 * Log levels
 * @readonly
 * @enum {number}
 */
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * ANSI color codes for terminal output
 * @readonly
 */
const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',

    // Background colors
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
    bgCyan: '\x1b[46m'
};

/**
 * Logger class for Fuelink
 * Provides structured logging with levels, timestamps, and context
 */
class Logger {
    /**
     * Create a new Logger instance
     * @param {Object} options - Logger options
     * @param {string} [options.prefix='Fuelink'] - Log prefix
     * @param {number} [options.level=LogLevel.INFO] - Minimum log level
     * @param {boolean} [options.timestamps=true] - Include timestamps
     * @param {boolean} [options.colors=true] - Use ANSI colors
     * @param {Function} [options.output] - Custom output function
     */
    constructor(options = {}) {
        this.prefix = options.prefix ?? 'Fuelink';
        this.level = options.level ?? LogLevel.INFO;
        this.timestamps = options.timestamps ?? true;
        this.colors = options.colors ?? true;
        this.output = options.output ?? console.log;
    }

    /**
     * Format timestamp
     * @private
     * @returns {string}
     */
    _formatTimestamp() {
        if (!this.timestamps) return '';
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${time}.${ms}`;
    }

    /**
     * Format log message
     * @private
     * @param {string} level - Log level name
     * @param {string} color - Color code
     * @param {string} message - Log message
     * @param {string} [context] - Optional context
     * @returns {string}
     */
    _format(level, color, message, context) {
        const timestamp = this._formatTimestamp();
        const prefix = this.prefix;
        const ctx = context ? ` [${context}]` : '';

        if (this.colors) {
            const ts = timestamp ? `${Colors.gray}${timestamp}${Colors.reset} ` : '';
            const lvl = `${color}${Colors.bright}${level}${Colors.reset}`;
            const pfx = `${Colors.cyan}${prefix}${Colors.reset}`;
            const ctxStr = context ? `${Colors.magenta}${ctx}${Colors.reset}` : '';
            return `${ts}${lvl} ${pfx}${ctxStr} ${message}`;
        }

        const ts = timestamp ? `${timestamp} ` : '';
        return `${ts}${level} ${prefix}${ctx} ${message}`;
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     * @param {string} [context] - Optional context
     */
    debug(message, context) {
        if (this.level <= LogLevel.DEBUG) {
            this.output(this._format('DEBUG', Colors.gray, message, context));
        }
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {string} [context] - Optional context
     */
    info(message, context) {
        if (this.level <= LogLevel.INFO) {
            this.output(this._format('INFO ', Colors.blue, message, context));
        }
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {string} [context] - Optional context
     */
    warn(message, context) {
        if (this.level <= LogLevel.WARN) {
            this.output(this._format('WARN ', Colors.yellow, message, context));
        }
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {string} [context] - Optional context
     */
    error(message, context) {
        if (this.level <= LogLevel.ERROR) {
            this.output(this._format('ERROR', Colors.red, message, context));
        }
    }

    /**
     * Log success message (info level with green color)
     * @param {string} message - Message to log
     * @param {string} [context] - Optional context
     */
    success(message, context) {
        if (this.level <= LogLevel.INFO) {
            this.output(this._format('OK   ', Colors.green, message, context));
        }
    }

    /**
     * Create a child logger with a specific context
     * @param {string} context - Context name
     * @returns {Object} Logger-like object with bound context
     */
    child(context) {
        return {
            debug: (msg) => this.debug(msg, context),
            info: (msg) => this.info(msg, context),
            warn: (msg) => this.warn(msg, context),
            error: (msg) => this.error(msg, context),
            success: (msg) => this.success(msg, context)
        };
    }

    /**
     * Set the log level
     * @param {number} level - New log level
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Create a default logger instance
     * @param {Object} [options] - Logger options
     * @returns {Logger}
     */
    static create(options) {
        return new Logger(options);
    }
}

module.exports = { Logger, LogLevel, Colors };
