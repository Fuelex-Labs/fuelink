# Filters

Audio filters and effects for players.

## Accessing Filters

```javascript
const player = fuelink.getPlayer(guildId);
const filters = player.filters;
```

## Volume

```javascript
// Set volume (0-100, converted internally for Lavalink)
await filters.setVolume(75);
```

## Equalizer

### Set Bands

```javascript
// Set individual bands (0-14)
await filters.setEqualizer([
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.25 },
  { band: 2, gain: 0.15 }
]);
```

### EQ Presets

```javascript
// Available presets: flat, bass, pop, rock, classical
await filters.setEQPreset('bass');
```

## Bass Boost

```javascript
// Levels: off, low, medium, high, extreme
await filters.setBassBoost('high');
```

## Timescale Effects

### Nightcore

Speed up with higher pitch:

```javascript
await filters.setNightcore(true);

// Disable
await filters.setNightcore(false);
```

### Vaporwave

Slow down with lower pitch:

```javascript
await filters.setVaporwave(true);
```

### Custom Timescale

```javascript
// Set individual values
await filters.setSpeed(1.2);   // 1.0 = normal
await filters.setPitch(1.1);   // 1.0 = normal
await filters.setRate(1.0);    // 1.0 = normal

// Or set all at once
await filters.setTimescale({
  speed: 1.2,
  pitch: 1.1,
  rate: 1.0
});
```

## 8D Audio

Rotation effect for immersive sound:

```javascript
await filters.set8D(true);

// Disable
await filters.set8D(false);
```

## Karaoke

Vocal removal effect:

```javascript
await filters.setKaraoke(true);

// With options
await filters.setKaraoke({
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0
});
```

## Tremolo

Oscillating volume:

```javascript
await filters.setTremolo({
  frequency: 2.0,  // Hz
  depth: 0.5       // 0-1
});
```

## Vibrato

Oscillating pitch:

```javascript
await filters.setVibrato({
  frequency: 2.0,  // Hz
  depth: 0.5       // 0-1
});
```

## Distortion

```javascript
await filters.setDistortion({
  sinOffset: 0,
  sinScale: 1,
  cosOffset: 0,
  cosScale: 1,
  tanOffset: 0,
  tanScale: 1,
  offset: 0,
  scale: 1
});
```

## Low Pass

Filter high frequencies:

```javascript
await filters.setLowPass({
  smoothing: 20.0
});
```

## Channel Mix

Mix left and right channels:

```javascript
await filters.setChannelMix({
  leftToLeft: 1.0,
  leftToRight: 0.0,
  rightToLeft: 0.0,
  rightToRight: 1.0
});
```

## Stacking Filters

All filters can be combined:

```javascript
// Apply multiple filters
await filters.setBassBoost('medium');
await filters.setNightcore(true);
await filters.setEQPreset('rock');

// All active at once
```

## Check Active Filters

```javascript
// Check if any filters are active
if (filters.hasActiveFilters) {
  console.log('Filters are active');
}
```

## Reset Filters

```javascript
// Reset all filters to default
await filters.reset();
```

## Presets

### Save Custom Preset

```javascript
// Save current filter state
filters.savePreset('my-preset');
```

### Load Preset

```javascript
// Load saved preset
await filters.loadPreset('my-preset');
```

### List Presets

```javascript
const presets = filters.getPresets();
```

## Raw Filter Data

```javascript
// Get current filter state as JSON
const filterData = filters.toJSON();

// Apply raw filter data
await filters.fromJSON(filterData);
```
