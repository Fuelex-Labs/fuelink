# Events

Complete event reference for Fuelink.

## Listening to Events

```javascript
// On Fuelink instance
fuelink.on('trackStart', ({ player, track }) => {
  console.log(`Now playing: ${track.title}`);
});

// On individual player
player.on('trackStart', ({ track }) => {
  console.log(`Now playing: ${track.title}`);
});
```

## Player Events

### playerCreate

Emitted when a new player is created.

```javascript
fuelink.on('playerCreate', ({ player }) => {
  console.log(`Player created for guild: ${player.guildId}`);
});
```

### playerDestroy

Emitted when a player is destroyed.

```javascript
fuelink.on('playerDestroy', ({ player }) => {
  console.log(`Player destroyed for guild: ${player.guildId}`);
});
```

### playerUpdate

Emitted when player state is updated (position, connected state).

```javascript
fuelink.on('playerUpdate', ({ player, state }) => {
  console.log(`Position: ${state.position}ms`);
  console.log(`Connected: ${state.connected}`);
});
```

### playerMove

Emitted when the bot is moved to another voice channel.

```javascript
fuelink.on('playerMove', ({ player, oldChannel, newChannel }) => {
  console.log(`Moved from ${oldChannel} to ${newChannel}`);
});
```

### playerDisconnect

Emitted when the bot is disconnected from voice.

```javascript
fuelink.on('playerDisconnect', ({ player }) => {
  console.log(`Disconnected from voice`);
});
```

## Track Events

### trackStart

Emitted when a track starts playing.

```javascript
fuelink.on('trackStart', ({ player, track }) => {
  console.log(`Playing: ${track.title} by ${track.author}`);
});
```

### trackEnd

Emitted when a track ends.

```javascript
fuelink.on('trackEnd', ({ player, track, reason }) => {
  console.log(`Track ended: ${reason}`);
  // Reasons: finished, loadFailed, stopped, replaced, cleanup
});
```

### trackStuck

Emitted when a track gets stuck (no audio frames).

```javascript
fuelink.on('trackStuck', ({ player, track, threshold }) => {
  console.log(`Track stuck for ${threshold}ms`);
});
```

### trackError

Emitted when a track fails to play.

```javascript
fuelink.on('trackError', ({ player, track, error }) => {
  console.error(`Track error: ${error.message}`);
});
```

## Queue Events

### queueAdd

Emitted when tracks are added to the queue.

```javascript
fuelink.on('queueAdd', ({ player, tracks }) => {
  console.log(`Added ${tracks.length} track(s)`);
});
```

### queueRemove

Emitted when a track is removed from the queue.

```javascript
fuelink.on('queueRemove', ({ player, track }) => {
  console.log(`Removed: ${track.title}`);
});
```

### queueShuffle

Emitted when the queue is shuffled.

```javascript
fuelink.on('queueShuffle', ({ player }) => {
  console.log('Queue shuffled');
});
```

### queueClear

Emitted when the queue is cleared.

```javascript
fuelink.on('queueClear', ({ player }) => {
  console.log('Queue cleared');
});
```

### queueEnd

Emitted when the queue finishes (no more tracks).

```javascript
fuelink.on('queueEnd', ({ player }) => {
  console.log('Queue ended');
  // Optionally disconnect
  player.destroy();
});
```

## Node Events

### nodeConnect

Emitted when a node connects.

```javascript
fuelink.on('nodeConnect', ({ node }) => {
  console.log(`Node ${node.name} connected`);
});
```

### nodeDisconnect

Emitted when a node disconnects.

```javascript
fuelink.on('nodeDisconnect', ({ node, reason }) => {
  console.log(`Node ${node.name} disconnected: ${reason}`);
});
```

### nodeReconnect

Emitted when attempting to reconnect to a node.

```javascript
fuelink.on('nodeReconnect', ({ node }) => {
  console.log(`Reconnecting to ${node.name}...`);
});
```

### nodeError

Emitted when a node encounters an error.

```javascript
fuelink.on('nodeError', ({ node, error }) => {
  console.error(`Node ${node.name} error:`, error);
});
```

### nodeReady

Emitted when a node is ready.

```javascript
fuelink.on('nodeReady', ({ node, resumed }) => {
  console.log(`Node ${node.name} ready (resumed: ${resumed})`);
});
```

### nodeStats

Emitted when node stats are received.

```javascript
fuelink.on('nodeStats', ({ node, stats }) => {
  console.log(`Players: ${stats.players}`);
  console.log(`CPU: ${stats.cpu.systemLoad}%`);
});
```

## Client Events

### ready

Emitted when Fuelink is initialized and ready.

```javascript
fuelink.on('ready', ({ fuelink }) => {
  console.log('Fuelink ready!');
});
```

## Event Constants

```javascript
import { Events } from 'fuelink';

// Use constants instead of strings
fuelink.on(Events.TRACK_START, handler);
fuelink.on(Events.QUEUE_END, handler);
fuelink.on(Events.NODE_CONNECT, handler);
```

All available event constants:

```javascript
Events.READY
Events.PLAYER_CREATE
Events.PLAYER_DESTROY
Events.PLAYER_UPDATE
Events.PLAYER_MOVE
Events.PLAYER_DISCONNECT
Events.TRACK_START
Events.TRACK_END
Events.TRACK_STUCK
Events.TRACK_ERROR
Events.QUEUE_ADD
Events.QUEUE_REMOVE
Events.QUEUE_SHUFFLE
Events.QUEUE_CLEAR
Events.QUEUE_END
Events.NODE_CONNECT
Events.NODE_DISCONNECT
Events.NODE_RECONNECT
Events.NODE_ERROR
Events.NODE_READY
Events.NODE_STATS
```
