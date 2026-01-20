# Node

Lavalink node connection and management.

## Node Configuration

```javascript
const fuelink = new Fuelink({
  nodes: [
    {
      name: 'main',
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
      secure: false,
      priority: 1,
      regions: ['us-east', 'us-west']
    }
  ]
});
```

## Node Manager

### Get All Nodes

```javascript
// Get all nodes
for (const [name, node] of fuelink.nodes) {
  console.log(`${name}: ${node.connected ? 'online' : 'offline'}`);
}
```

### Get Connected Nodes

```javascript
const connectedNodes = fuelink.nodes.getConnected();
```

### Get Best Node

```javascript
// Get best available node
const node = fuelink.nodes.getBest();

// Get best for a specific region
const node = fuelink.nodes.getBest('us-east');
```

### Get by Name

```javascript
const mainNode = fuelink.nodes.getByName('main');
```

## Adding Nodes

```javascript
// Add at runtime
const node = fuelink.nodes.add({
  name: 'new-node',
  host: 'lavalink.example.com',
  port: 2333,
  password: 'secret'
});
```

## Removing Nodes

```javascript
fuelink.nodes.remove('node-name');
```

## Node Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node identifier |
| `host` | string | Hostname |
| `port` | number | Port |
| `connected` | boolean | Connection status |
| `state` | NodeState | Current state |
| `stats` | object | Node statistics |
| `penalty` | number | Load penalty score |

## Node States

```javascript
import { NodeState } from 'fuelink';

NodeState.DISCONNECTED  // Not connected
NodeState.CONNECTING    // Connection in progress
NodeState.CONNECTED     // Connected and ready
NodeState.RECONNECTING  // Reconnecting after disconnect
```

## Node Statistics

```javascript
const node = fuelink.nodes.getBest();

console.log('Players:', node.stats.players);
console.log('Playing:', node.stats.playingPlayers);
console.log('Uptime:', node.stats.uptime);
console.log('Memory Used:', node.stats.memory.used);
console.log('CPU Load:', node.stats.cpu.systemLoad);
```

## Load Balancing

Nodes are selected based on penalty score, which considers:

- Player count
- CPU usage
- Frame statistics
- Priority setting

Lower penalty = better choice.

```javascript
// Get nodes sorted by penalty
const sorted = fuelink.nodes.getSortedByPenalty();
```

## Cluster Statistics

```javascript
const stats = fuelink.nodes.getClusterStats();

console.log('Nodes:', stats.nodes.connected, '/', stats.nodes.total);
console.log('Players:', stats.players.total);
console.log('Playing:', stats.players.playing);
console.log('Memory:', stats.memory.used);
```

## Manual Connection

```javascript
// Connect all nodes
await fuelink.nodes.connectAll();

// Disconnect all
fuelink.nodes.disconnectAll();

// Individual node
await node.connect();
node.disconnect();
```

## Node Migration

When a node fails, players are automatically migrated:

```javascript
fuelink.on('nodeDisconnect', ({ node, reason }) => {
  console.log(`Node ${node.name} disconnected: ${reason}`);
  // Players are auto-migrated to healthy nodes
});
```

Manual migration:

```javascript
const newNode = fuelink.nodes.getBest();
await player.migrateNode(newNode);
```

## Node Events

```javascript
fuelink.on('nodeConnect', ({ node }) => {
  console.log(`${node.name} connected`);
});

fuelink.on('nodeDisconnect', ({ node, reason }) => {
  console.log(`${node.name} disconnected: ${reason}`);
});

fuelink.on('nodeReconnect', ({ node }) => {
  console.log(`${node.name} reconnecting...`);
});

fuelink.on('nodeError', ({ node, error }) => {
  console.error(`${node.name} error:`, error);
});

fuelink.on('nodeReady', ({ node, resumed }) => {
  console.log(`${node.name} ready (resumed: ${resumed})`);
});

fuelink.on('nodeStats', ({ node, stats }) => {
  console.log(`${node.name} stats:`, stats.players);
});
```

## REST API

Nodes provide REST methods:

```javascript
// Load tracks
const result = await node.loadTracks('ytsearch:never gonna give you up');

// Decode track
const track = await node.decodeTrack(encodedTrack);

// Get Lavalink info
const info = await node.getInfo();

// Get node stats
const stats = await node.getStats();
```
