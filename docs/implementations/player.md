# Player

The Player handles playback for a single guild.

## Creating a Player

```javascript
const player = await fuelink.createPlayer({
  guildId: '123456789',
  voiceChannel: '987654321',
  textChannel: '111222333',  // Optional
  volume: 100,               // Optional, default 100
  selfDeaf: true,            // Optional, default true
  selfMute: false            // Optional, default false
});
```

## Getting a Player

```javascript
// Get existing player (returns undefined if not found)
const player = fuelink.getPlayer(guildId);

// Check if player exists
if (fuelink.players.has(guildId)) {
  // Player exists
}
```

## Playback Control

### Play

```javascript
// Play next track in queue
await player.play();

// Play specific track
await player.play(track);

// Play with options
await player.play(track, {
  startTime: 30000,  // Start at 30 seconds
  endTime: 180000,   // End at 3 minutes
  noReplace: false   // Replace current track
});
```

### Pause / Resume

```javascript
await player.pause();
await player.resume();
```

### Stop

```javascript
// Stop playback (keeps queue)
await player.stop();

// Stop and clear queue
await player.stop(true);
```

### Skip / Back

```javascript
// Skip to next track
await player.skip();

// Go to previous track
await player.back();
```

### Seek

```javascript
// Seek to position (milliseconds)
await player.seek(60000);  // 1 minute
```

### Volume

```javascript
// Set volume (0-100)
await player.setVolume(75);

// Get current volume
console.log(player.volume);
```

## Player Properties

| Property | Type | Description |
|----------|------|-------------|
| `guildId` | string | Guild ID |
| `voiceChannel` | string | Voice channel ID |
| `textChannel` | string | Text channel ID |
| `volume` | number | Current volume (0-100) |
| `playing` | boolean | Is currently playing |
| `paused` | boolean | Is paused |
| `position` | number | Current position (ms) |
| `connected` | boolean | Is voice connected |
| `state` | string | Player state |

## Player States

```javascript
import { PlayerState } from 'fuelink';

// Available states
PlayerState.CONNECTING  // Connecting to voice
PlayerState.CONNECTED   // Connected, ready to play
PlayerState.PLAYING     // Currently playing
PlayerState.PAUSED      // Paused
PlayerState.STOPPED     // Stopped
PlayerState.DISCONNECTED // Disconnected from voice
PlayerState.DESTROYED   // Player destroyed
```

## Current Track

```javascript
// Get current track
const track = player.current;  // or player.queue.current

if (track) {
  console.log(`Playing: ${track.title} by ${track.author}`);
  console.log(`Duration: ${track.duration}ms`);
}
```

## Estimated Position

```javascript
// Get estimated current position (accounts for time since last update)
const position = player.estimatedPosition;
```

## Destroying a Player

```javascript
// Destroy and cleanup
await player.destroy();

// Or through the manager
await fuelink.destroyPlayer(guildId);
```

## Accessing Subsystems

```javascript
// Queue
player.queue.add(track);

// Filters
await player.filters.setBassBoost('high');

// Connection
player.connection.channelId;
```

## Player Events

Events are emitted both on the player and the main Fuelink instance:

```javascript
// On player
player.on('trackStart', ({ track }) => {
  console.log(`Started: ${track.title}`);
});

// On Fuelink (includes player reference)
fuelink.on('trackStart', ({ player, track }) => {
  console.log(`Guild ${player.guildId}: ${track.title}`);
});
```

See [Events](/implementations/events) for the complete event reference.
