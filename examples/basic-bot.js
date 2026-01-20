'use strict';

/**
 * @file Basic bot example
 * @description Simple example showing how to use Fuelink with Discord.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Fuelink, Events, LoopMode } = require('../index');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Create Fuelink client
const fuelink = new Fuelink({
    nodes: [
        {
            name: 'main',
            host: process.env.LAVALINK_HOST || 'localhost',
            port: parseInt(process.env.LAVALINK_PORT) || 2333,
            password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
            secure: false
        }
    ],
    autoConnect: true,
    persistence: {
        enabled: true,
        backend: 'memory'
    }
});

// ==================== Fuelink Events ====================

fuelink.on(Events.READY, () => {
    console.log('Fuelink is ready!');
});

fuelink.on(Events.NODE_CONNECT, ({ node }) => {
    console.log(`Node "${node.name}" connected`);
});

fuelink.on(Events.NODE_ERROR, ({ node, error }) => {
    console.error(`Node "${node.name}" error:`, error.message);
});

fuelink.on(Events.TRACK_START, ({ player, track }) => {
    console.log(`Now playing: ${track.title} by ${track.author}`);
});

fuelink.on(Events.TRACK_END, ({ player, track, reason }) => {
    console.log(`Track ended (${reason}): ${track.title}`);
});

fuelink.on(Events.QUEUE_END, ({ player }) => {
    console.log(`Queue ended for guild ${player.guildId}`);
});

// ==================== Discord Events ====================

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Initialize Fuelink with Discord client
    await fuelink.init(client);
});

// Simple command handler
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Play command
    if (command === 'play') {
        const query = args.join(' ');
        if (!query) {
            return message.reply('Please provide a search query or URL.');
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel!');
        }

        try {
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
            message.reply(`Added to queue: **${tracks[0].title}**`);

            // Start playback if not playing
            if (!player.playing) {
                await player.play();
            }
        } catch (error) {
            console.error('Play error:', error);
            message.reply(`Error: ${error.message}`);
        }
    }

    // Skip command
    if (command === 'skip') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        await player.skip();
        message.reply('Skipped!');
    }

    // Stop command
    if (command === 'stop') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        await player.stop(true);
        message.reply('Stopped and cleared queue.');
    }

    // Pause command
    if (command === 'pause') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        await player.pause();
        message.reply('Paused.');
    }

    // Resume command
    if (command === 'resume') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        await player.resume();
        message.reply('Resumed.');
    }

    // Queue command
    if (command === 'queue') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        const queue = player.queue;
        const current = queue.current;

        let response = '**Queue:**\n';
        if (current) {
            response += `Now playing: ${current.title}\n\n`;
        }

        const upcoming = queue.upcoming.slice(0, 10);
        if (upcoming.length === 0) {
            response += 'No tracks in queue.';
        } else {
            upcoming.forEach((track, i) => {
                response += `${i + 1}. ${track.title}\n`;
            });
            if (queue.size > 10) {
                response += `\n...and ${queue.size - 10} more`;
            }
        }

        message.reply(response);
    }

    // Loop command
    if (command === 'loop') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        const mode = args[0]?.toLowerCase();
        if (mode && Object.values(LoopMode).includes(mode)) {
            player.queue.setLoop(mode);
            message.reply(`Loop mode set to: ${mode}`);
        } else {
            const newMode = player.queue.cycleLoop();
            message.reply(`Loop mode: ${newMode}`);
        }
    }

    // Shuffle command
    if (command === 'shuffle') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        player.queue.shuffle();
        message.reply('Queue shuffled!');
    }

    // Volume command
    if (command === 'volume') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) {
            return message.reply(`Current volume: ${player.volume}%`);
        }

        await player.setVolume(volume);
        message.reply(`Volume set to ${volume}%`);
    }

    // Bass boost command
    if (command === 'bass') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        const level = args[0]?.toLowerCase() || 'medium';
        await player.filters.setBassBoost(level);
        message.reply(`Bass boost: ${level}`);
    }

    // Nightcore command
    if (command === 'nightcore') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        const current = player.filters.timescale?.speed === 1.25;
        await player.filters.setNightcore(!current);
        message.reply(`Nightcore: ${!current ? 'on' : 'off'}`);
    }

    // Disconnect command
    if (command === 'disconnect' || command === 'leave') {
        const player = fuelink.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found.');

        await player.destroy();
        message.reply('Disconnected.');
    }

    // Stats command
    if (command === 'stats') {
        const stats = fuelink.getStats();
        message.reply(
            `**Fuelink Stats:**\n` +
            `Nodes: ${stats.nodes.connected}/${stats.nodes.total}\n` +
            `Players: ${stats.players.total} (${stats.players.playing} playing)\n` +
            `Uptime: ${Math.floor(stats.uptime / 60000)} minutes`
        );
    }
});

// Login
client.login(process.env.DISCORD_TOKEN);
