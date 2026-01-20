# Track

The Track structure represents a playable audio track.

## Track Structure

```javascript
{
  encoded: 'QAAAjQIAJV...',  // Lavalink encoded track
  info: {
    identifier: 'dQw4w9WgXcQ',
    isSeekable: true,
    author: 'Rick Astley',
    length: 212000,
    isStream: false,
    title: 'Never Gonna Give You Up',
    uri: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    artworkUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    sourceName: 'youtube'
  },
  requester: {
    id: '123456789',
    username: 'User'
  },
  pluginInfo: {},
  metadata: {}
}
```

## Creating Tracks

### From Search

```javascript
const tracks = await fuelink.search('never gonna give you up', {
  requester: { id: userId, username: 'User' }
});

const track = tracks[0];
```

### From URL

```javascript
const result = await fuelink.resolve('https://youtube.com/watch?v=dQw4w9WgXcQ');

// Single track
const track = result[0];

// Playlist
const playlist = result;  // { name, tracks, url }
```

### Manual Creation

```javascript
const { Track } = require('fuelink');

const track = new Track({
  encoded: 'QAAAjQIAJV...',
  info: {
    identifier: 'dQw4w9WgXcQ',
    title: 'My Track',
    author: 'Artist',
    length: 180000,
    uri: 'https://example.com/track'
  }
}, requester);
```

## Track Properties

| Property | Type | Description |
|----------|------|-------------|
| `encoded` | string | Lavalink encoded track data |
| `identifier` | string | Platform-specific ID |
| `title` | string | Track title |
| `author` | string | Artist/uploader name |
| `duration` | number | Duration in milliseconds |
| `uri` | string | Original URL |
| `artworkUrl` | string | Thumbnail URL |
| `sourceName` | string | Source (youtube, soundcloud, etc.) |
| `isSeekable` | boolean | Can seek |
| `isStream` | boolean | Is live stream |
| `requester` | object | Who requested the track |

## Requester

```javascript
const track = tracks[0];

// Access requester info
console.log(`Requested by: ${track.requester.username}`);
console.log(`User ID: ${track.requester.id}`);
```

## Duration Formatting

```javascript
// Get formatted duration
console.log(track.formattedDuration);  // "3:32"

// For longer tracks
console.log(track.formattedDuration);  // "1:23:45"
```

## Display String

```javascript
// Get display string
console.log(track.displayTitle);  // "Never Gonna Give You Up - Rick Astley"
```

## Track Metadata

Store custom data on tracks:

```javascript
// Set metadata
track.metadata.addedAt = Date.now();
track.metadata.playCount = 0;

// Access metadata
const addedAt = track.metadata.addedAt;
```

## Plugin Info

Additional data from Lavalink plugins:

```javascript
// For tracks from plugins like LavaSrc
const spotifyData = track.pluginInfo;
```

## Cloning Tracks

```javascript
// Create a copy
const copy = track.clone();
```

## Serialization

```javascript
// Export track data
const data = track.toJSON();

// Restore track
const { Track } = require('fuelink');
const restored = Track.fromJSON(data);
```

## Static Methods

### From Raw Data

```javascript
const { Track } = require('fuelink');

// Create from Lavalink response
const track = Track.from(lavalinkData, requester);
```

### From JSON

```javascript
const track = Track.fromJSON(jsonData);
```
