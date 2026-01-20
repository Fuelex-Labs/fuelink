---
layout: home

hero:
  name: Fuelink
  text: Lavalink Client for Node.js
  tagline: A powerful, feature-complete audio engine for Discord bots
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/overview
    - theme: alt
      text: View on GitHub
      link: https://github.com/Fuelex-Labs/fuelink

features:
  - title: Multi-Node Support
    details: Connect to multiple Lavalink nodes with intelligent load balancing, health monitoring, and automatic failover.
  - title: Advanced Queue
    details: Priority tracks, loop modes, shuffle, jump, history tracking, and auto-play recommendations.
  - title: Audio Filters
    details: 15-band equalizer, bass boost, nightcore, vaporwave, 8D audio, and more. Stack filters in real-time.
  - title: Session Persistence
    details: Save and restore player states across restarts. Supports memory, file, Redis, and MongoDB backends.
  - title: Plugin System
    details: Hot-loadable plugins with LavaSrc support for Spotify, Apple Music, Deezer, and custom sources.
  - title: Discord Integration
    details: Works with Discord.js and Eris. Automatic library detection and DisTube compatibility.
---

## Quick Install

```bash
npm install fuelink
```

## Basic Usage

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Fuelink } = require('fuelink');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const fuelink = new Fuelink({
  nodes: [{ name: 'main', host: 'localhost', port: 2333, password: 'youshallnotpass' }]
});

client.once('ready', async () => {
  await fuelink.init(client);
  console.log('Ready!');
});

client.login('YOUR_TOKEN');
```
