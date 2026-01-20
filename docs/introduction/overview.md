# Overview

Fuelink is a powerful, feature-complete Lavalink client built for Node.js. It serves as the unified audio control layer for Discord bots, providing everything you need to build professional music functionality.

## What is Fuelink?

Fuelink is designed to be the single audio engine for your Discord bot. It handles:

- **Lavalink Communication** - WebSocket and REST API management
- **Player Management** - Playback control, volume, seeking
- **Queue System** - Track ordering, loops, shuffle
- **Audio Filters** - Equalizer, effects, presets
- **State Persistence** - Save and restore across restarts

## Key Features

### Multi-Node Architecture

Connect to multiple Lavalink servers simultaneously. Fuelink automatically distributes players across nodes based on load and health metrics.

### Production Ready

Built with reliability in mind:
- Automatic reconnection with exponential backoff
- Session resume after disconnects
- Node failover and player migration
- Comprehensive error handling

### Extensible

The plugin system allows you to:
- Add custom audio sources
- Intercept and modify track loading
- Extend functionality without modifying core code

## Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 18.0.0 |
| Lavalink | 4.0.0 |

## Discord Library Support

Fuelink works with:
- **Discord.js** v14.x and above
- **Eris** v0.17.x and above

The library is automatically detected - no configuration needed.

## Next Steps

- [Installation](/basics/installation) - Add Fuelink to your project
- [Quick Start](/basics/quick-start) - Get playing in minutes
- [Configuration](/basics/configuration) - Full configuration options
