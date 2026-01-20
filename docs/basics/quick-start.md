# Quick Start

Get Fuelink playing music in minutes.

## Basic Setup

### 1. Create the Client

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Fuelink } = require('fuelink');

// Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Fuelink client
const fuelink = new Fuelink({
  nodes: [
    {
      name: 'main',
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass'
    }
  ]
});
```

### 2. Initialize on Ready

```javascript
client.once('ready', async () => {
  // Initialize Fuelink with Discord client
  await fuelink.init(client);
  console.log(`${client.user.tag} is ready!`);
});
```

### 3. Handle Events

```javascript
// Track started playing
fuelink.on('trackStart', ({ player, track }) => {
  console.log(`Now playing: ${track.title}`);
});

// Queue finished
fuelink.on('queueEnd', ({ player }) => {
  console.log('Queue ended');
});

// Node connected
fuelink.on('nodeConnect', ({ node }) => {
  console.log(`Node ${node.name} connected`);
});
```

### 4. Play Command

```javascript
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!play ')) {
    const query = message.content.slice(6);
    
    // Check if user is in voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('Join a voice channel first!');
    }

    // Get or create player
    let player = fuelink.getPlayer(message.guild.id);
    if (!player) {
      player = await fuelink.createPlayer({
        guildId: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id
      });
    }

    // Search for tracks
    const tracks = await fuelink.search(query, {
      requester: {
        id: message.author.id,
        username: message.author.username
      }
    });

    if (tracks.length === 0) {
      return message.reply('No results found.');
    }

    // Add to queue
    player.queue.add(tracks[0]);
    message.reply(`Added: **${tracks[0].title}**`);

    // Start playing if not already
    if (!player.playing) {
      await player.play();
    }
  }
});
```

### 5. Login

```javascript
client.login('YOUR_DISCORD_TOKEN');
```

## Complete Example

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Fuelink } = require('fuelink');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const fuelink = new Fuelink({
  nodes: [
    {
      name: 'main',
      host: process.env.LAVALINK_HOST || 'localhost',
      port: parseInt(process.env.LAVALINK_PORT) || 2333,
      password: process.env.LAVALINK_PASSWORD || 'youshallnotpass'
    }
  ]
});

// Events
fuelink.on('trackStart', ({ player, track }) => {
  console.log(`Playing: ${track.title}`);
});

fuelink.on('nodeConnect', ({ node }) => {
  console.log(`Node ${node.name} connected`);
});

// Ready
client.once('ready', async () => {
  await fuelink.init(client);
  console.log('Bot is ready!');
});

// Commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  if (command === '!play') {
    const query = args.slice(1).join(' ');
    if (!query) return message.reply('Provide a search query.');
    
    const vc = message.member.voice.channel;
    if (!vc) return message.reply('Join a voice channel.');

    let player = fuelink.getPlayer(message.guild.id);
    if (!player) {
      player = await fuelink.createPlayer({
        guildId: message.guild.id,
        voiceChannel: vc.id
      });
    }

    const tracks = await fuelink.search(query);
    if (!tracks.length) return message.reply('Nothing found.');

    player.queue.add(tracks[0]);
    if (!player.playing) await player.play();
    message.reply(`Added: ${tracks[0].title}`);
  }

  if (command === '!skip') {
    const player = fuelink.getPlayer(message.guild.id);
    if (player) await player.skip();
  }

  if (command === '!stop') {
    const player = fuelink.getPlayer(message.guild.id);
    if (player) await player.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
```

## Next Steps

- [Configuration](/basics/configuration) - Full configuration options
- [Player](/implementations/player) - Player methods and events
- [Queue](/implementations/queue) - Queue management
