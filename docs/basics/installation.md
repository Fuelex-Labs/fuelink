# Installation

Add Fuelink to your project using your preferred package manager.

## Package Managers

::: code-group

```bash [npm]
npm install fuelink
```

```bash [yarn]
yarn add fuelink
```

```bash [pnpm]
pnpm add fuelink
```

:::

## Requirements

Before using Fuelink, ensure you have:

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Node.js | 18.0.0 | Required |
| Lavalink | 4.0.0 | Your audio server |
| Discord.js | 14.x | Or Eris 0.17.x |

## Lavalink Server

Fuelink requires a running Lavalink server. If you don't have one:

### Option 1: Self-Hosted

Download from [Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases) and run:

```bash
java -jar Lavalink.jar
```

### Option 2: Free Hosting

Several services offer free Lavalink hosting. Search for "free lavalink hosting" or check Discord bot development communities.

## Verify Installation

Create a test file to verify the installation:

```javascript
const { Fuelink, version } = require('fuelink');

console.log('Fuelink version:', version);
console.log('Installation successful!');
```

Run it:

```bash
node test.js
```

You should see:
```
Fuelink version: 1.0.0
Installation successful!
```

## Next Steps

- [Quick Start](/basics/quick-start) - Create your first player
- [Configuration](/basics/configuration) - Configure Fuelink options
