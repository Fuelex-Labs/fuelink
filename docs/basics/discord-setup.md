# Discord Setup

How Fuelink integrates with Discord libraries.

## Supported Libraries

Fuelink supports:
- **Discord.js** v14.x and above
- **Eris** v0.17.x and above

The library is automatically detected when you call `init()`.

## Discord.js Setup

### Required Intents

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates  // Required for voice
  ]
});
```

### Initialization

```javascript
const { Fuelink } = require('fuelink');

const fuelink = new Fuelink({
  nodes: [/* ... */]
});

client.once('ready', async () => {
  await fuelink.init(client);
});
```

### How It Works

Fuelink automatically:
1. Detects Discord.js by checking for `client.ws`
2. Listens for raw `VOICE_STATE_UPDATE` and `VOICE_SERVER_UPDATE` events
3. Sends voice gateway payloads through the appropriate shard

## Eris Setup

### Required Intents

```javascript
const Eris = require('eris');

const client = new Eris('BOT_TOKEN', {
  intents: ['guilds', 'guildVoiceStates']
});
```

### Initialization

```javascript
const { Fuelink } = require('fuelink');

const fuelink = new Fuelink({
  nodes: [/* ... */]
});

client.once('ready', async () => {
  await fuelink.init(client);
});
```

## Voice Connection Flow

When you create a player and call `play()`:

1. **Fuelink** sends a voice state update to Discord
2. **Discord** responds with `VOICE_STATE_UPDATE`
3. **Discord** responds with `VOICE_SERVER_UPDATE`
4. **Fuelink** forwards this to Lavalink
5. **Lavalink** connects to the Discord voice server
6. **Playback begins**

This happens automatically - you just call `createPlayer()` and `play()`.

## Sharding

Fuelink works with sharded bots automatically. It detects the correct shard for each guild and sends voice updates through that shard.

### Discord.js Sharding

```javascript
// Works automatically with ShardingManager
const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { token: 'TOKEN' });
manager.spawn();
```

### Eris Sharding

```javascript
// Works automatically with Eris shards
const client = new Eris('TOKEN', {
  maxShards: 'auto'
});
```

## Manual Voice Handling

If you need manual control over voice updates:

```javascript
// Send voice update manually
fuelink.voice.sendVoiceUpdate({
  guildId: '123456789',
  channelId: '987654321',
  selfDeaf: true,
  selfMute: false
});
```

## Troubleshooting

### Player Not Connecting

1. Ensure `GuildVoiceStates` intent is enabled
2. Check that your bot has permission to join the voice channel
3. Verify Lavalink is running and accessible

### No Audio

1. Check Lavalink logs for errors
2. Ensure the track was properly loaded
3. Verify volume is not set to 0
