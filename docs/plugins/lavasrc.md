# LavaSrc

Support for Spotify, Apple Music, Deezer, and more.

## What is LavaSrc?

LavaSrc is a Lavalink plugin that adds support for additional audio sources. Fuelink has built-in support for LavaSrc-enabled sources.

## Requirements

LavaSrc must be installed on your Lavalink server:

1. Download [LavaSrc](https://github.com/topisenpai/LavaSrc) plugin
2. Place in Lavalink's `plugins` folder
3. Configure in `application.yml`

## Enabling in Fuelink

```javascript
const fuelink = new Fuelink({
  nodes: [/* ... */],
  plugins: {
    lavaSrc: {
      spotify: true,
      applemusic: true,
      deezer: true,
      yandex: true
    }
  }
});
```

## Searching

### Spotify

```javascript
// Search Spotify
const tracks = await fuelink.search('never gonna give you up', {
  source: 'spotify'
});

// Resolve Spotify URL
const result = await fuelink.resolve('https://open.spotify.com/track/...');
```

### Apple Music

```javascript
const tracks = await fuelink.search('query', {
  source: 'applemusic'
});

const result = await fuelink.resolve('https://music.apple.com/...');
```

### Deezer

```javascript
const tracks = await fuelink.search('query', {
  source: 'deezer'
});

const result = await fuelink.resolve('https://www.deezer.com/track/...');
```

### Yandex Music

```javascript
const tracks = await fuelink.search('query', {
  source: 'yandex'
});
```

## Playlists and Albums

LavaSrc supports playlists and albums:

```javascript
const result = await fuelink.resolve('https://open.spotify.com/playlist/...');

if (result.tracks) {
  console.log(`Playlist: ${result.name}`);
  console.log(`Tracks: ${result.tracks.length}`);
  
  // Add all to queue
  player.queue.add(result.tracks);
}
```

## Check Source Support

```javascript
if (fuelink.plugins.isLavaSrcSource('spotify')) {
  // Spotify is enabled
}
```

## Available Sources

| Source | Search Prefix | Notes |
|--------|--------------|-------|
| Spotify | `spsearch:` | Requires API credentials on Lavalink |
| Apple Music | `amsearch:` | Requires API credentials on Lavalink |
| Deezer | `dzsearch:` | Works without credentials |
| Yandex Music | `ymsearch:` | May require credentials |
| Flowery TTS | `ftts:` | Text-to-speech |

## Lavalink Configuration

Example `application.yml` for LavaSrc:

```yaml
plugins:
  lavasrc:
    providers:
      - "ytsearch:\"%ISRC%\""
      - "ytsearch:%QUERY%"
    sources:
      spotify: true
      applemusic: true
      deezer: true
      yandexmusic: true
    spotify:
      clientId: "your-client-id"
      clientSecret: "your-client-secret"
      countryCode: "US"
    applemusic:
      countryCode: "US"
      mediaAPIToken: "your-token"
```

## Error Handling

```javascript
try {
  const tracks = await fuelink.search('query', { source: 'spotify' });
} catch (error) {
  if (error.message.includes('No matches')) {
    console.log('No Spotify results');
  } else {
    console.error('Search error:', error);
  }
}
```
