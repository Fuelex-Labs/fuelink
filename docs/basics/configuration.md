# Configuration

Complete reference for Fuelink configuration options.

## Basic Configuration

```javascript
const { Fuelink } = require('fuelink');

const fuelink = new Fuelink({
  nodes: [
    {
      name: 'main',
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass'
    }
  ]
});
```

## Full Configuration

```javascript
const fuelink = new Fuelink({
  // Lavalink nodes (required)
  nodes: [
    {
      name: 'main',
      host: 'lavalink.example.com',
      port: 2333,
      password: 'secure_password',
      secure: true,              // Use HTTPS/WSS
      retryAmount: 5,            // Max reconnection attempts
      retryDelay: 5000,          // Delay between retries (ms)
      resumeKey: 'fuelink-main', // Session resume identifier
      resumeTimeout: 60,         // Resume timeout (seconds)
      priority: 1,               // Lower = preferred (load balancing)
      regions: ['us-east']       // Preferred voice regions
    },
    {
      name: 'backup',
      host: 'lavalink2.example.com',
      port: 2333,
      password: 'secure_password',
      priority: 2
    }
  ],

  // Auto-connect to nodes when init() is called
  autoConnect: true,

  // Auto-restore players from persistence on startup
  autoResume: true,

  // Persistence configuration
  persistence: {
    enabled: true,
    backend: 'memory',     // 'memory' | 'file' | 'redis' | 'mongodb'
    autoSave: true,
    saveInterval: 30000,   // Auto-save interval (ms)
    options: {}            // Backend-specific options
  },

  // Plugin configuration
  plugins: {
    directory: './plugins', // Auto-load plugins from directory
    lavaSrc: {
      spotify: true,
      applemusic: true,
      deezer: true
    }
  },

  // Logger configuration
  logger: {
    level: 1  // 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
  }
});
```

## Node Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | required | Unique identifier for the node |
| `host` | string | required | Lavalink server hostname |
| `port` | number | `2333` | Lavalink server port |
| `password` | string | required | Lavalink password |
| `secure` | boolean | `false` | Use HTTPS/WSS |
| `retryAmount` | number | `5` | Max reconnection attempts |
| `retryDelay` | number | `5000` | Delay between retries (ms) |
| `resumeKey` | string | `null` | Session resume identifier |
| `resumeTimeout` | number | `60` | Resume timeout (seconds) |
| `priority` | number | `0` | Load balancing priority (lower = preferred) |
| `regions` | string[] | `[]` | Preferred voice regions |

## Persistence Options

### Memory (Default)

```javascript
persistence: {
  enabled: true,
  backend: 'memory'
}
```

### File System

```javascript
persistence: {
  enabled: true,
  backend: 'file',
  options: {
    path: './sessions.json'
  }
}
```

### Redis

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

```javascript
const { MongoClient } = require('mongodb');
const mongo = new MongoClient('mongodb://localhost:27017');
await mongo.connect();
const collection = mongo.db('fuelink').collection('sessions');

persistence: {
  enabled: true,
  backend: 'mongodb',
  options: {
    collection: collection
  }
}
```

## Logger Levels

| Level | Value | Description |
|-------|-------|-------------|
| DEBUG | 0 | Verbose debugging information |
| INFO | 1 | General information |
| WARN | 2 | Warnings only |
| ERROR | 3 | Errors only |

## Environment Variables

Recommended approach using environment variables:

```javascript
const fuelink = new Fuelink({
  nodes: [
    {
      name: 'main',
      host: process.env.LAVALINK_HOST,
      port: parseInt(process.env.LAVALINK_PORT),
      password: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_SECURE === 'true'
    }
  ]
});
```

Example `.env` file:

```env
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
```
