import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'AgentForge',
  description: 'Production-ready AI agent framework built on LangGraph',

  // GitHub Pages deployment base path
  base: '/agentforge/',

  // Favicon and meta tags
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/agentforge/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/agentforge/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'AgentForge' }],
    ['meta', { property: 'og:description', content: 'Production-ready AI agent framework built on LangGraph' }],
    ['meta', { property: 'og:url', content: 'https://tvscoundrel.github.io/agentforge/' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'AgentForge' }],
    ['meta', { name: 'twitter:description', content: 'Production-ready AI agent framework built on LangGraph' }]
  ],

  ignoreDeadLinks: true, // Allow dead links during development

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/core' },
      { text: 'Examples', link: '/examples/react-agent' },
      { text: 'Tutorials', link: '/tutorials/first-agent' },
      {
        text: 'v0.10.5',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is AgentForge?', link: '/guide/what-is-agentforge' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Migration Guide', link: '/guide/migration' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Tools', link: '/guide/concepts/tools' },
            { text: 'Agent Patterns', link: '/guide/concepts/patterns' },
            { text: 'Middleware', link: '/guide/concepts/middleware' },
            { text: 'State Management', link: '/guide/concepts/state' },
            { text: 'Memory & Persistence', link: '/guide/concepts/memory' }
          ]
        },
        {
          text: 'Agent Patterns',
          items: [
            { text: 'ReAct Pattern', link: '/guide/patterns/react' },
            { text: 'Plan-Execute Pattern', link: '/guide/patterns/plan-execute' },
            { text: 'Reflection Pattern', link: '/guide/patterns/reflection' },
            { text: 'Multi-Agent Pattern', link: '/guide/patterns/multi-agent' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Streaming', link: '/guide/advanced/streaming' },
            { text: 'Human-in-the-Loop', link: '/guide/advanced/human-in-the-loop' },
            { text: 'Tool Deduplication', link: '/guide/advanced/tool-deduplication' },
            { text: 'Creating Vertical Agents', link: '/guide/advanced/vertical-agents' },
            { text: 'Resource Management', link: '/guide/advanced/resources' },
            { text: 'Monitoring', link: '/guide/advanced/monitoring' },
            { text: 'Deployment', link: '/guide/advanced/deployment' },
            { text: 'Debugging', link: '/guide/advanced/debugging' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '@agentforge/core', link: '/api/core' },
            { text: '@agentforge/patterns', link: '/api/patterns' },
            { text: '@agentforge/cli', link: '/api/cli' },
            { text: '@agentforge/testing', link: '/api/testing' },
            { text: '@agentforge/tools', link: '/api/tools' }
          ]
        }
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'ReAct Agent', link: '/examples/react-agent' },
            { text: 'Plan-Execute Agent', link: '/examples/plan-execute' },
            { text: 'Reflection Agent', link: '/examples/reflection' },
            { text: 'Multi-Agent System', link: '/examples/multi-agent' },
            { text: 'Custom Tools', link: '/examples/custom-tools' },
            { text: 'Middleware Stack', link: '/examples/middleware' }
          ]
        }
      ],

      '/tutorials/': [
        {
          text: 'Tutorials',
          items: [
            { text: 'Your First Agent', link: '/tutorials/first-agent' },
            { text: 'Building Custom Tools', link: '/tutorials/custom-tools' },
            { text: 'Advanced Patterns', link: '/tutorials/advanced-patterns' },
            { text: 'Production Deployment', link: '/tutorials/production-deployment' },
            { text: 'Testing Strategies', link: '/tutorials/testing' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/TVScoundrel/agentforge' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 AgentForge Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/TVScoundrel/agentforge/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
});

