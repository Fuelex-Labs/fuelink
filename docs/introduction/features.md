# Features

A comprehensive breakdown of everything Fuelink offers.

## Lavalink Connectivity

### Multi-Node Support
Connect to multiple Lavalink nodes simultaneously. Each node can have different priorities and region preferences.

### Load Balancing
Intelligent penalty-based node selection considers:
- CPU usage
- Player count
- Frame statistics
- Custom penalties

### Health Monitoring
Continuous health checks track node statistics and detect issues before they affect playback.

### Auto-Reconnect
Exponential backoff reconnection handles temporary disconnects gracefully.

### Session Resume
Resume Lavalink sessions after reconnection, maintaining player state.

### Node Migration
Automatic player migration when a node fails, ensuring uninterrupted playback.

### Region Awareness
Prefer nodes closest to Discord voice servers for optimal latency.

---

## Player System

### Playback Control
Full control over playback:
- Play, pause, resume, stop
- Seek to any position
- Volume adjustment (0-100)

### Gapless Playback
Preloading enables seamless transitions between tracks.

### Crossfade Support
Configurable crossfade between tracks for smooth transitions.

### Inactivity Handling
Automatic disconnect when:
- Player is idle too long
- Paused without activity
- Alone in voice channel

### Position Tracking
Real-time estimated position calculation, even between updates.

### State Persistence
Save and restore player state across bot restarts.

---

## Queue Management

### Priority Queue
Add tracks that play next, before the main queue.

### Loop Modes
- **Off** - No looping
- **Track** - Repeat current track
- **Queue** - Loop entire queue

### Advanced Operations
- Shuffle the queue
- Move tracks to new positions
- Swap two tracks
- Remove by index or range
- Jump to specific position
- Clear entire queue

### History Tracking
Navigate back to previous tracks with full history.

### Requester Tracking
Track who requested each song for DJ features.

### Auto-Play
Automatic recommendations when the queue ends.

---

## Audio Filters

### Equalizer
15-band equalizer with built-in presets:
- Flat, Bass, Pop, Rock, Classical

### Bass Boost
Multiple intensity levels:
- Off, Low, Medium, High, Extreme

### Timescale Effects
- **Nightcore** - Speed up with pitch shift
- **Vaporwave** - Slow down with pitch down
- Custom speed, pitch, and rate

### Spatial Effects
- **8D Audio** - Rotation effect
- **Karaoke** - Vocal removal

### Modulation
- Tremolo
- Vibrato
- Distortion

### Filtering
- Low pass filter

### Real-Time Application
All filters can be stacked and applied without restarting the track.

### Presets
Save and load custom filter presets.

---

## Plugin System

### Hot-Loadable
Add and remove plugins at runtime without restart.

### LavaSrc Compatible
Built-in support for:
- Spotify
- Apple Music
- Deezer
- Yandex Music

### Custom Sources
Create your own source plugins for any audio platform.

### Middleware Hooks
Intercept:
- Track loading
- Playback events
- Filter changes

### Directory Loading
Auto-discover and load plugins from a folder.

---

## Persistence & Recovery

### Multiple Backends
Choose your storage:
- Memory (default)
- File system
- Redis
- MongoDB

### Auto-Save
Periodic automatic state saving at configurable intervals.

### Crash Recovery
Restore all players after bot restarts.

### TTL Management
Automatic cleanup of expired session data.

---

## Discord Integration

### Multi-Library Support
Works with Discord.js and Eris out of the box.

### Auto-Detection
Automatically detects your Discord library.

### Raw Events
Direct handling of voice state and server updates.

### DisTube Compatible
Use DisTube plugins for search and resolve.
