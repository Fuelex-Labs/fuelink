# Plugin Overview

Extend Fuelink with custom functionality.

## Plugin System

Fuelink's plugin system allows you to:

- Add custom audio sources
- Intercept track loading
- Hook into playback events
- Extend core functionality

## Using Plugins

### Register a Plugin

```javascript
const plugin = new MyPlugin();
fuelink.use(plugin);
```

### Unload a Plugin

```javascript
fuelink.plugins.unload('plugin-name');
```

### Check if Loaded

```javascript
if (fuelink.plugins.has('plugin-name')) {
  const plugin = fuelink.plugins.get('plugin-name');
}
```

## Plugin Configuration

### Directory Auto-Loading

Load all plugins from a folder:

```javascript
const fuelink = new Fuelink({
  plugins: {
    directory: './plugins'
  }
});
```

Fuelink will load any `.js` file in the directory.

### LavaSrc

Enable LavaSrc sources:

```javascript
const fuelink = new Fuelink({
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

See [LavaSrc](/plugins/lavasrc) for details.

## Plugin Types

### Source Plugins

Add new audio sources:

```javascript
const { BaseSource } = require('fuelink');

class MySource extends BaseSource {
  name = 'mysource';
  
  canResolve(query) {
    return query.includes('mysource.com');
  }
  
  async resolve(query) {
    // Return tracks
  }
}
```

### Middleware Plugins

Intercept and modify behavior:

```javascript
class LoggingPlugin {
  name = 'logging';
  
  onTrackLoad(track) {
    console.log(`Loading: ${track.title}`);
    return track;
  }
  
  onPlay(player, track) {
    console.log(`Playing: ${track.title}`);
  }
}
```

## Plugin Lifecycle

### init(manager)

Called when plugin is registered:

```javascript
class MyPlugin {
  name = 'myplugin';
  
  init(manager) {
    this.manager = manager;
    console.log('Plugin initialized');
  }
}
```

### destroy()

Called when plugin is unloaded:

```javascript
class MyPlugin {
  destroy() {
    console.log('Plugin cleanup');
  }
}
```

## Listing Plugins

```javascript
const plugins = fuelink.plugins.getNames();
console.log('Loaded plugins:', plugins);
```

## Next Steps

- [LavaSrc](/plugins/lavasrc) - Spotify, Apple Music, Deezer support
- [Custom Sources](/plugins/custom-sources) - Create your own source plugin
