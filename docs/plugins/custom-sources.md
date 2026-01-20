# Custom Sources

Create your own audio source plugins.

## BaseSource Class

Extend `BaseSource` to create a source plugin:

```javascript
const { BaseSource } = require('fuelink');

class MyMusicSource extends BaseSource {
  name = 'mymusic';
  
  canResolve(query) {
    return query.includes('mymusic.com');
  }
  
  async resolve(query, options) {
    // Resolve URL to tracks
  }
  
  async search(query, options) {
    // Search for tracks
  }
}
```

## Required Properties

### name

Unique identifier for the plugin:

```javascript
class MySource extends BaseSource {
  name = 'mymusic';
}
```

## Required Methods

### canResolve(query)

Return `true` if this plugin can handle the query:

```javascript
canResolve(query) {
  return query.includes('mymusic.com') || 
         query.startsWith('mymusic:');
}
```

### resolve(query, options)

Resolve a URL or query to tracks:

```javascript
async resolve(query, options) {
  const data = await fetchFromAPI(query);
  
  return data.tracks.map(track => ({
    encoded: null,  // Will be resolved by Lavalink
    info: {
      identifier: track.id,
      title: track.title,
      author: track.artist,
      length: track.duration * 1000,
      uri: track.url,
      artworkUrl: track.thumbnail,
      sourceName: 'mymusic',
      isSeekable: true,
      isStream: false
    }
  }));
}
```

### search(query, options)

Search for tracks:

```javascript
async search(query, options) {
  const limit = options.limit || 10;
  const results = await searchAPI(query, limit);
  
  return results.map(track => ({
    info: {
      identifier: track.id,
      title: track.title,
      // ... other properties
    }
  }));
}
```

## Optional Methods

### init(manager)

Called when the plugin is registered:

```javascript
init(manager) {
  this.manager = manager;
  this.logger = manager.logger;
  this.logger?.info('MyMusic plugin loaded');
}
```

### destroy()

Called when the plugin is unloaded:

```javascript
destroy() {
  // Cleanup resources
  this.manager = null;
}
```

## Complete Example

```javascript
const { BaseSource } = require('fuelink');

class SoundGasmSource extends BaseSource {
  name = 'soundgasm';
  
  init(manager) {
    this.manager = manager;
    manager.logger?.debug('SoundGasm source loaded');
  }
  
  canResolve(query) {
    return query.includes('soundgasm.net');
  }
  
  async resolve(query, options) {
    const response = await fetch(query);
    const html = await response.text();
    
    // Parse audio URL from HTML
    const match = html.match(/m4a: "(.+?)"/);
    if (!match) return [];
    
    const audioUrl = match[1];
    const titleMatch = html.match(/<title>(.+?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    return [{
      encoded: null,
      info: {
        identifier: query,
        title: title,
        author: 'SoundGasm',
        length: 0,
        uri: audioUrl,
        sourceName: 'soundgasm',
        isSeekable: true,
        isStream: false
      }
    }];
  }
  
  async search(query, options) {
    // SoundGasm doesn't have search API
    return [];
  }
}

module.exports = SoundGasmSource;
```

## Registering the Plugin

```javascript
const SoundGasmSource = require('./plugins/SoundGasm');

fuelink.use(new SoundGasmSource());
```

Or use directory auto-loading:

```javascript
// plugins/SoundGasm.js
module.exports = SoundGasmSource;

// In config
plugins: {
  directory: './plugins'
}
```

## Best Practices

1. **Handle errors gracefully** - Return empty array on failure
2. **Respect rate limits** - Add delays if needed
3. **Cache when possible** - Reduce API calls
4. **Log appropriately** - Use manager.logger
5. **Clean up resources** - Implement destroy()

## Middleware Hooks

Plugins can also intercept events:

```javascript
class TrackingPlugin {
  name = 'tracking';
  
  onTrackLoad(track) {
    // Modify or log track
    track.metadata.loadedAt = Date.now();
    return track;
  }
  
  onPlay(player, track) {
    // Log play event
    console.log(`Playing: ${track.title}`);
  }
  
  onFilter(player, filters) {
    // Log filter changes
    console.log('Filters changed:', filters);
  }
}
```
