# Examples

Code examples for common use cases.

## Basic Music Bot

A minimal music bot with play, skip, and stop commands:

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
  nodes: [{
    name: 'main',
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass'
  }]
});

client.once('ready', async () => {
  await fuelink.init(client);
  console.log('Bot ready!');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const [cmd, ...args] = msg.content.split(' ');
  
  if (cmd === '!play') {
    const vc = msg.member.voice.channel;
    if (!vc) return msg.reply('Join a voice channel!');
    
    let player = fuelink.getPlayer(msg.guild.id);
    if (!player) {
      player = await fuelink.createPlayer({
        guildId: msg.guild.id,
        voiceChannel: vc.id
      });
    }
    
    const tracks = await fuelink.search(args.join(' '));
    if (!tracks.length) return msg.reply('Nothing found.');
    
    player.queue.add(tracks[0]);
    if (!player.playing) await player.play();
    msg.reply(`Added: ${tracks[0].title}`);
  }
  
  if (cmd === '!skip') {
    const player = fuelink.getPlayer(msg.guild.id);
    if (player) await player.skip();
  }
  
  if (cmd === '!stop') {
    await fuelink.destroyPlayer(msg.guild.id);
  }
});

client.login(process.env.TOKEN);
```

## Slash Commands

Using Discord.js slash commands:

```javascript
const { SlashCommandBuilder } = require('discord.js');

// Register command
const playCommand = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play music')
  .addStringOption(opt => 
    opt.setName('query')
      .setDescription('Song name or URL')
      .setRequired(true)
  );

// Handle interaction
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'play') {
    await interaction.deferReply();
    
    const query = interaction.options.getString('query');
    const vc = interaction.member.voice.channel;
    
    if (!vc) {
      return interaction.editReply('Join a voice channel!');
    }
    
    let player = fuelink.getPlayer(interaction.guild.id);
    if (!player) {
      player = await fuelink.createPlayer({
        guildId: interaction.guild.id,
        voiceChannel: vc.id
      });
    }
    
    const tracks = await fuelink.search(query);
    player.queue.add(tracks[0]);
    if (!player.playing) await player.play();
    
    interaction.editReply(`Playing: ${tracks[0].title}`);
  }
});
```

## Now Playing Embed

```javascript
const { EmbedBuilder } = require('discord.js');

fuelink.on('trackStart', async ({ player, track }) => {
  const channel = client.channels.cache.get(player.textChannel);
  if (!channel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('Now Playing')
    .setDescription(`**${track.title}**\nby ${track.author}`)
    .setThumbnail(track.artworkUrl)
    .addFields(
      { name: 'Duration', value: track.formattedDuration, inline: true },
      { name: 'Requested by', value: track.requester?.username || 'Unknown', inline: true }
    )
    .setColor(0xFF6B35);
  
  channel.send({ embeds: [embed] });
});
```

## Queue Display

```javascript
function getQueueEmbed(player) {
  const queue = player.queue;
  const current = queue.current;
  
  let description = '';
  
  if (current) {
    description += `**Now Playing:**\n${current.title}\n\n`;
  }
  
  description += '**Queue:**\n';
  
  const upcoming = queue.upcoming.slice(0, 10);
  if (upcoming.length === 0) {
    description += 'Empty';
  } else {
    upcoming.forEach((track, i) => {
      description += `${i + 1}. ${track.title}\n`;
    });
    
    if (queue.size > 10) {
      description += `\n...and ${queue.size - 10} more`;
    }
  }
  
  return new EmbedBuilder()
    .setTitle('Music Queue')
    .setDescription(description)
    .setFooter({ text: `Loop: ${queue.loop} | Tracks: ${queue.size}` })
    .setColor(0xFF6B35);
}
```

## Filter Presets

```javascript
async function applyPreset(player, preset) {
  switch (preset) {
    case 'bass':
      await player.filters.setBassBoost('high');
      await player.filters.setEQPreset('bass');
      break;
    case 'party':
      await player.filters.setBassBoost('extreme');
      await player.filters.setSpeed(1.1);
      break;
    case 'nightcore':
      await player.filters.setNightcore(true);
      break;
    case 'chill':
      await player.filters.setVaporwave(true);
      break;
    case 'reset':
      await player.filters.reset();
      break;
  }
}
```

## Persistence Example

```javascript
const fuelink = new Fuelink({
  nodes: [/* ... */],
  autoResume: true,
  persistence: {
    enabled: true,
    backend: 'file',
    autoSave: true,
    saveInterval: 30000
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await fuelink.persistence.saveAll();
  await fuelink.destroy();
  process.exit(0);
});
```

## GitHub Repository

For more examples, see the [examples folder](https://github.com/Fuelex-Labs/fuelink/tree/main/examples) on GitHub.
