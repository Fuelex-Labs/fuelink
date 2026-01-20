'use strict';

/**
 * @file Node manager for Fuelink
 * @module fuelink/managers/NodeManager
 */

const { Node } = require('../structures/Node');
const { Events, NodeState } = require('../utils/Constants');

/**
 * Manages multiple Lavalink nodes
 */
class NodeManager extends Map {
    /**
     * Create a new NodeManager
     * @param {Object} manager - Fuelink manager
     */
    constructor(manager) {
        super();

        /**
         * Fuelink manager
         * @type {Object}
         */
        this.manager = manager;
    }

    /**
     * Add a node to the manager
     * @param {Object} options - Node options
     * @returns {Node}
     */
    add(options) {
        if (this.has(options.name)) {
            return this.get(options.name);
        }

        const node = new Node(this.manager, options);
        this.set(node.name, node);

        // Forward node events to manager
        node.on(Events.NODE_CONNECT, (data) => this.manager.emit(Events.NODE_CONNECT, data));
        node.on(Events.NODE_DISCONNECT, (data) => this.manager.emit(Events.NODE_DISCONNECT, data));
        node.on(Events.NODE_RECONNECT, (data) => this.manager.emit(Events.NODE_RECONNECT, data));
        node.on(Events.NODE_ERROR, (data) => this.manager.emit(Events.NODE_ERROR, data));
        node.on(Events.NODE_READY, (data) => this.manager.emit(Events.NODE_READY, data));
        node.on(Events.NODE_STATS, (data) => this.manager.emit(Events.NODE_STATS, data));

        return node;
    }

    /**
     * Remove a node from the manager
     * @param {string} name - Node name
     * @returns {boolean}
     */
    remove(name) {
        const node = this.get(name);
        if (!node) return false;

        node.destroy();
        return this.delete(name);
    }

    /**
     * Connect all nodes
     * @returns {Promise<void>}
     */
    async connectAll() {
        const promises = [];

        for (const node of this.values()) {
            if (node.state === NodeState.DISCONNECTED) {
                promises.push(
                    node.connect().catch(error => {
                        this.manager.logger?.error(
                            `Failed to connect node ${node.name}: ${error.message}`
                        );
                    })
                );
            }
        }

        await Promise.all(promises);
    }

    /**
     * Disconnect all nodes
     * @returns {void}
     */
    disconnectAll() {
        for (const node of this.values()) {
            node.disconnect();
        }
    }

    /**
     * Get all connected nodes
     * @returns {Node[]}
     */
    getConnected() {
        return Array.from(this.values()).filter(n => n.connected);
    }

    /**
     * Get the best node for a given region
     * @param {string} [region] - Preferred region
     * @returns {Node|null}
     */
    getBest(region = null) {
        const connected = this.getConnected();
        if (connected.length === 0) return null;

        // Filter by region if specified
        let candidates = connected;
        if (region) {
            const regionNodes = connected.filter(n =>
                n.regions.length === 0 || n.regions.includes(region)
            );
            if (regionNodes.length > 0) {
                candidates = regionNodes;
            }
        }

        // Sort by priority first, then by penalty
        candidates.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.penalty - b.penalty;
        });

        return candidates[0] || null;
    }

    /**
     * Get a node by name
     * @param {string} name - Node name
     * @returns {Node|undefined}
     */
    getByName(name) {
        return this.get(name);
    }

    /**
     * Get nodes sorted by penalty (best first)
     * @returns {Node[]}
     */
    getSortedByPenalty() {
        return this.getConnected().sort((a, b) => a.penalty - b.penalty);
    }

    /**
     * Get total player count across all nodes
     * @returns {number}
     */
    getTotalPlayers() {
        return this.getConnected().reduce((acc, n) => acc + (n.stats?.players || 0), 0);
    }

    /**
     * Get overall cluster statistics
     * @returns {Object}
     */
    getClusterStats() {
        const connected = this.getConnected();

        return {
            nodes: {
                total: this.size,
                connected: connected.length,
                disconnected: this.size - connected.length
            },
            players: {
                total: connected.reduce((acc, n) => acc + (n.stats?.players || 0), 0),
                playing: connected.reduce((acc, n) => acc + (n.stats?.playingPlayers || 0), 0)
            },
            memory: {
                used: connected.reduce((acc, n) => acc + (n.stats?.memory?.used || 0), 0),
                allocated: connected.reduce((acc, n) => acc + (n.stats?.memory?.allocated || 0), 0)
            }
        };
    }

    /**
     * Handle node failure - migrate players to healthy nodes
     * @param {Node} failedNode - The failed node
     * @returns {Promise<void>}
     */
    async handleNodeFailure(failedNode) {
        const playersToMigrate = [];

        // Find players on the failed node
        for (const player of this.manager.players.values()) {
            if (player.node?.name === failedNode.name) {
                playersToMigrate.push(player);
            }
        }

        if (playersToMigrate.length === 0) return;

        this.manager.logger?.warn(
            `Migrating ${playersToMigrate.length} players from failed node ${failedNode.name}`
        );

        // Migrate each player
        for (const player of playersToMigrate) {
            const newNode = this.getBest(player.connection.region);

            if (newNode) {
                try {
                    await player.migrateNode(newNode);
                } catch (error) {
                    this.manager.logger?.error(
                        `Failed to migrate player ${player.guildId}: ${error.message}`
                    );
                }
            } else {
                this.manager.logger?.error(
                    `No healthy nodes available for player ${player.guildId}`
                );
            }
        }
    }
}

module.exports = { NodeManager };
