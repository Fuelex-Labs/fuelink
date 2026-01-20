# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Nothing yet

### Changed
- Nothing yet

### Fixed
- Nothing yet

---

## [1.0.0] - 2026-01-20

### Added
- **Core Client** (`Fuelink.js`) - Main orchestrator with Discord integration
- **Multi-Node Support** - Connect to multiple Lavalink nodes with load balancing
- **Session Resume** - Resume Lavalink sessions after reconnection
- **Node Failover** - Automatic player migration on node failure
- **Player System** - Complete playback control with gapless transitions
- **Queue Management** - Priority queue, loop modes, shuffle, jump, history
- **Audio Filters** - EQ, bass boost, nightcore, vaporwave, 8D, and more
- **Filter Presets** - Built-in EQ and bass boost presets
- **Real-time Filters** - Apply filter changes without restarting tracks
- **Voice Adapter** - Discord.js and Eris auto-detection
- **DisTube Adapter** - Search and resolve integration
- **Plugin System** - Hot-loadable custom source plugins
- **LavaSrc Support** - Built-in Spotify, Apple Music, Deezer, Yandex support
- **Persistence Layer** - Memory, file, Redis, MongoDB backends
- **Auto-Save** - Periodic state saving with crash recovery
- **Requester Tracking** - Track who requested each song
- **Auto-Play** - Recommendations when queue ends
- **Inactivity Handling** - Auto-disconnect when idle
- **JSDoc Types** - Complete type documentation
- **Example Bot** - Full-featured example implementation

### Technical Details
- JavaScript (CommonJS) format
- Node.js 18+ required
- Lavalink v4 API support
- 34 public exports
- 26 source files

---

[Unreleased]: https://github.com/Fuelex-Labs/fuelink/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Fuelex-Labs/fuelink/releases/tag/v1.0.0
