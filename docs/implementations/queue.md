# Queue

The Queue manages tracks for a player.

## Accessing the Queue

```javascript
const player = fuelink.getPlayer(guildId);
const queue = player.queue;
```

## Adding Tracks

### Add to End

```javascript
// Add single track
queue.add(track);

// Add multiple tracks
queue.add([track1, track2, track3]);
```

### Add to Priority Queue

Priority tracks play next, before the main queue.

```javascript
queue.addPriority(track);
```

### Insert at Position

```javascript
// Insert at index 2
queue.addAt(track, 2);
```

## Removing Tracks

### Remove by Index

```javascript
// Remove track at index 3
const removed = queue.remove(3);
```

### Remove Range

```javascript
// Remove tracks from index 2 to 5
queue.removeRange(2, 5);
```

### Clear Queue

```javascript
// Clear all tracks
queue.clear();
```

## Queue Navigation

### Skip to Position

```javascript
// Jump to track at index 5 (skips tracks 0-4)
await player.queue.jump(5);
```

### Back to Previous

```javascript
// Go back to previous track
const previous = queue.back();
```

## Queue Manipulation

### Shuffle

```javascript
queue.shuffle();
```

### Move Track

```javascript
// Move track from index 2 to index 5
queue.move(2, 5);
```

### Swap Tracks

```javascript
// Swap tracks at index 1 and 4
queue.swap(1, 4);
```

## Loop Modes

```javascript
import { LoopMode } from 'fuelink';

// Set loop mode
queue.setLoop(LoopMode.OFF);     // No looping
queue.setLoop(LoopMode.TRACK);   // Repeat current track
queue.setLoop(LoopMode.QUEUE);   // Loop entire queue

// Get current mode
console.log(queue.loop);  // 'off', 'track', or 'queue'

// Cycle through modes
const newMode = queue.cycleLoop();  // off -> track -> queue -> off
```

## Queue Properties

| Property | Type | Description |
|----------|------|-------------|
| `current` | Track | Currently playing track |
| `previous` | Track | Previously played track |
| `tracks` | Track[] | Main queue tracks |
| `priorityTracks` | Track[] | Priority queue tracks |
| `size` | number | Total tracks in queue |
| `duration` | number | Total duration (ms) |
| `loop` | string | Current loop mode |
| `autoplay` | boolean | Auto-play enabled |

## Accessing Tracks

### Get All Upcoming

```javascript
const upcoming = queue.upcoming;  // Priority + main queue
```

### Get by Index

```javascript
const track = queue.at(3);  // Get track at index 3
```

### Find Track

```javascript
const track = queue.find(t => t.title.includes('Never Gonna'));
```

### Search Queue

```javascript
const results = queue.search('rick astley');
```

## History

Access previously played tracks:

```javascript
// Get history
const history = queue.history;

// Go back
const previousTrack = queue.back();
```

## Auto-Play

Enable automatic recommendations when queue ends:

```javascript
// Enable auto-play
queue.autoplay = true;

// Set custom provider
queue.setAutoplayProvider(async (currentTrack) => {
  // Return array of recommended tracks
  const tracks = await fuelink.search(`${currentTrack.author} mix`);
  return tracks.slice(0, 5);
});

// Get auto-play tracks
const recommendations = await queue.getAutoplayTracks();
```

## Serialization

```javascript
// Export queue state
const data = queue.toJSON();

// Restore queue state
queue.fromJSON(data);
```

## Events

Queue events are emitted on the player:

```javascript
fuelink.on('queueAdd', ({ player, tracks }) => {
  console.log(`Added ${tracks.length} tracks`);
});

fuelink.on('queueRemove', ({ player, track }) => {
  console.log(`Removed: ${track.title}`);
});

fuelink.on('queueShuffle', ({ player }) => {
  console.log('Queue shuffled');
});

fuelink.on('queueEnd', ({ player }) => {
  console.log('Queue finished');
});
```
