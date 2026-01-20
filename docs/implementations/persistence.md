# Persistence

Save and restore player states across restarts.

## Enabling Persistence

```javascript
const fuelink = new Fuelink({
  nodes: [/* ... */],
  autoResume: true,
  persistence: {
    enabled: true,
    backend: 'file',
    autoSave: true,
    saveInterval: 30000
  }
});
```

## Backends

### Memory (Default)

Data is stored in memory. Lost when process exits.

```javascript
persistence: {
  enabled: true,
  backend: 'memory'
}
```

### File System

Data is saved to a JSON file.

```javascript
persistence: {
  enabled: true,
  backend: 'file',
  options: {
    path: './fuelink-sessions.json'
  }
}
```

### Redis

Data is stored in Redis with automatic expiration.

```javascript
const Redis = require('ioredis');
const redis = new Redis();

persistence: {
  enabled: true,
  backend: 'redis',
  options: {
    client: redis
  }
}
```

### MongoDB

Data is stored in a MongoDB collection.

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const collection = client.db('bot').collection('fuelink-sessions');

persistence: {
  enabled: true,
  backend: 'mongodb',
  options: {
    collection: collection
  }
}
```

## Auto-Save

Automatically save player states periodically:

```javascript
persistence: {
  enabled: true,
  autoSave: true,
  saveInterval: 30000  // Every 30 seconds
}
```

## Auto-Resume

Automatically restore players when the bot starts:

```javascript
const fuelink = new Fuelink({
  autoResume: true,
  persistence: {
    enabled: true,
    backend: 'file'
  }
});

client.once('ready', async () => {
  await fuelink.init(client);
  // Players are automatically restored
});
```

## Manual Save

### Save Single Player

```javascript
await fuelink.persistence.savePlayer(player);
```

### Save All Players

```javascript
await fuelink.persistence.saveAll();
```

## Manual Restore

### Restore Single Player

```javascript
const data = await fuelink.persistence.restorePlayer(guildId);
if (data) {
  const player = await fuelink.createPlayer({
    guildId: data.guildId,
    voiceChannel: data.voiceChannel
  });
  await player.fromJSON(data);
}
```

### Restore All Players

```javascript
const savedPlayers = await fuelink.persistence.restoreAll();
await fuelink.players.fromJSON(savedPlayers);
```

## What Gets Saved

Player state includes:
- Guild ID
- Voice channel ID
- Text channel ID
- Current volume
- Playing/paused state
- Current position
- Queue (all tracks)
- Filter settings
- Loop mode

## TTL (Time To Live)

Data expires after a set time (default: 1 hour):

```javascript
persistence: {
  enabled: true,
  ttl: 3600000  // 1 hour in milliseconds
}
```

## Store Methods

Access the persistence store directly:

```javascript
const store = fuelink.persistence;

// Set data
await store.set('key', { data: 'value' });

// Get data
const data = await store.get('key');

// Check if exists
const exists = await store.has('key');

// Delete
await store.delete('key');

// List all keys
const keys = await store.keys();

// Clear all
await store.clear();
```

## Graceful Shutdown

Save all players before shutting down:

```javascript
process.on('SIGINT', async () => {
  console.log('Saving players...');
  await fuelink.persistence.saveAll();
  await fuelink.destroy();
  process.exit(0);
});
```

## Handling Restore Failures

```javascript
fuelink.on('ready', async () => {
  if (fuelink.options.autoResume) {
    const restored = fuelink.players.size;
    console.log(`Restored ${restored} players`);
  }
});
```

Individual restore errors are logged but don't stop the process:

```javascript
// In Fuelink logs:
// [WARN] Failed to restore player 123456789: Voice channel not found
```
