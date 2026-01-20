import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Fuelink',
    description: 'A powerful, feature-complete Lavalink client for Node.js',

    head: [
        ['meta', { name: 'theme-color', content: '#FF6B35' }],
        ['meta', { name: 'og:type', content: 'website' }],
        ['meta', { name: 'og:site_name', content: 'Fuelink' }]
    ],

    themeConfig: {
        siteTitle: 'Fuelink',

        nav: [
            { text: 'Guide', link: '/introduction/overview' },
            { text: 'GitHub', link: 'https://github.com/Fuelex-Labs/fuelink' },
            { text: 'npm', link: 'https://www.npmjs.com/package/fuelink' }
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'Overview', link: '/introduction/overview' },
                    { text: 'Features', link: '/introduction/features' }
                ]
            },
            {
                text: 'Basics',
                items: [
                    { text: 'Installation', link: '/basics/installation' },
                    { text: 'Quick Start', link: '/basics/quick-start' },
                    { text: 'Configuration', link: '/basics/configuration' },
                    { text: 'Discord Setup', link: '/basics/discord-setup' }
                ]
            },
            {
                text: 'Implementations',
                items: [
                    { text: 'Player', link: '/implementations/player' },
                    { text: 'Queue', link: '/implementations/queue' },
                    { text: 'Filters', link: '/implementations/filters' },
                    { text: 'Node', link: '/implementations/node' },
                    { text: 'Track', link: '/implementations/track' },
                    { text: 'Events', link: '/implementations/events' },
                    { text: 'Autoplay', link: '/implementations/autoplay' },
                    { text: 'Persistence', link: '/implementations/persistence' }
                ]
            },
            {
                text: 'Plugins',
                items: [
                    { text: 'Overview', link: '/plugins/overview' },
                    { text: 'LavaSrc', link: '/plugins/lavasrc' },
                    { text: 'Custom Sources', link: '/plugins/custom-sources' }
                ]
            },
            {
                text: 'Resources',
                items: [
                    { text: 'Examples', link: '/resources/examples' },
                    { text: 'Changelog', link: '/resources/changelog' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Fuelex-Labs/fuelink' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2026 Fuelex Labs'
        },

        search: {
            provider: 'local'
        },

        editLink: {
            pattern: 'https://github.com/Fuelex-Labs/fuelink/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        }
    }
})
