# Autoplay

Automatic track recommendations when the queue ends.

## Enabling Autoplay

```javascript
const player = fuelink.getPlayer(guildId);

// Enable autoplay
player.queue.autoplay = true;
```

## Default Behavior

When autoplay is enabled and the queue ends, Fuelink will:

1. Check for an autoplay provider
2. Get recommended tracks
3. Add them to the queue
4. Continue playback

## Custom Autoplay Provider

Set a function that returns recommended tracks:

```javascript
player.queue.setAutoplayProvider(async (currentTrack) => {
  // Search for similar tracks
  const query = `${currentTrack.author} mix`;
  const tracks = await fuelink.search(query);
  
  // Return up to 5 recommendations
  return tracks.slice(0, 5);
});
```

### Provider Arguments

The provider receives the last played track:

```javascript
player.queue.setAutoplayProvider(async (track) => {
  console.log('Last track:', track.title);
  console.log('Artist:', track.author);
  console.log('Source:', track.sourceName);
  
  // Use this info to find related tracks
  return await findRelatedTracks(track);
});
```

## Autoplay Sources

### YouTube Mix

```javascript
player.queue.setAutoplayProvider(async (track) => {
  // YouTube video ID
  const videoId = track.identifier;
  
  // Load YouTube mix
  const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
  const result = await fuelink.resolve(mixUrl);
  
  if (result.tracks) {
    // Skip the first track (current track)
    return result.tracks.slice(1, 6);
  }
  return [];
});
```

### Related Search

```javascript
player.queue.setAutoplayProvider(async (track) => {
  const queries = [
    `${track.author} songs`,
    `${track.title} similar`,
    `${track.author} popular`
  ];
  
  // Pick random query
  const query = queries[Math.floor(Math.random() * queries.length)];
  const tracks = await fuelink.search(query);
  
  return tracks.slice(0, 3);
});
```

## Getting Autoplay Tracks Manually

```javascript
const recommendations = await player.queue.getAutoplayTracks();

if (recommendations.length > 0) {
  player.queue.add(recommendations);
}
```

## Disabling Autoplay

```javascript
// Disable
player.queue.autoplay = false;

// Remove provider
player.queue.autoplayProvider = null;
```

## Autoplay Events

When autoplay kicks in, normal queue events still fire:

```javascript
fuelink.on('queueEnd', ({ player }) => {
  // This fires when the original queue ends
  // Autoplay will then add new tracks
  console.log('Original queue ended');
});

fuelink.on('queueAdd', ({ player, tracks }) => {
  // This fires when autoplay adds tracks
  console.log(`Autoplay added ${tracks.length} tracks`);
});
```

## Best Practices

1. **Limit recommendations** - Don't add too many at once (3-5 is good)
2. **Avoid duplicates** - Check if tracks are already in history
3. **Handle errors** - Wrap provider in try/catch
4. **Respect source** - Try to match the source (YouTube, Spotify, etc.)

```javascript
player.queue.setAutoplayProvider(async (track) => {
  try {
    const tracks = await fuelink.search(`${track.author}`, {
      source: track.sourceName
    });
    
    // Filter out recently played
    const history = player.queue.history.map(t => t.identifier);
    const filtered = tracks.filter(t => !history.includes(t.identifier));
    
    return filtered.slice(0, 3);
  } catch (error) {
    console.error('Autoplay failed:', error);
    return [];
  }
});
```
