# Clippizo

**AI-powered video creation platform**

## Overview

[Clippizo](https://clippizo.com) is a SaaS platform providing AI-powered tools for video creation. The platform includes:

- **AI Image Generation** - Create images using AI for video content
- **AI Video Generation** - Generate video clips and sequences with AI
- **Content Management** - Organize and manage created assets
- **AI Chatbot** - Assist creators with workflow and content suggestions

Built for **content creators and video producers** who want to leverage AI for efficient video production. Similar in concept to Higgsfield.ai.

### Philosophy

Clippizo is built around five core principles:

- **Fast** — Quick to build, run, deploy, and iterate on
- **Cheap** — Free to start with services that scale with you
- **Opinionated** — Integrated tooling designed to work together
- **Modern** — Latest stable features with healthy community support
- **Safe** — End-to-end type safety and robust security posture

## Demo

Experience Clippizo in action:

- [Web](https://clippizo.com) — Marketing website
- [App](https://app.clippizo.com) — Main application
- [Storybook](https://storybook.clippizo.com) — Component library
- [API](https://api.clippizo.com/health) — API health check

## Features

### Apps

- **App** — Main Clippizo dashboard for AI video creation tools
- **Web** — Marketing site showcasing AI video capabilities
- **API** — Backend API for AI generation services and content management
- **Docs** — Platform and API documentation
- **Email** — Email templates for notifications and marketing
- **Storybook** — UI component library for Clippizo design system

### Packages

- **AI** — AI service integrations (image generation, video generation, chatbot)
- **Database** — Data models for users, content, AI generations, subscriptions
- **Authentication** — Powered by [Clerk](https://clerk.com)
- **Design System** — Clippizo UI components and design tokens
- **Payments** — Subscriptions via [PayPal](https://paypal.com) (international) and [SePay](https://sepay.vn) (Vietnam)
- **Email** — Transactional emails via [Resend](https://resend.com)
- **Analytics** — Usage tracking and AI generation analytics
- **Observability** — Error tracking ([Sentry](https://sentry.io)), logging, and monitoring
- **Security** — Application security ([Arcjet](https://arcjet.com)), rate limiting
- **Storage** — File upload and asset management
- **Webhooks** — Inbound and outbound webhook handling

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn/bun)
- [ngrok](https://ngrok.com) or similar for local webhook testing

### Development

```bash
# Install dependencies
npm install

# Start all apps
npm run dev

# Start specific app
npm run dev --filter app       # Main app (port 3000)
npm run dev --filter web       # Marketing site (port 3001)
npm run dev --filter api       # API server (port 3002)
npm run dev --filter storybook # Component library (port 6006)
```

### Setup

1. Configure your environment variables
2. Set up required service accounts (Clerk, PayPal, SePay, Resend, etc.)
3. Run the development server

For detailed setup instructions, read the [documentation](https://clippizo.com/docs).

## Structure

Clippizo uses a monorepo structure managed by Turborepo:

```
clippizo/
├── apps/           # Deployable applications
│   ├── app/        # Main application - AI video creation dashboard (port 3000)
│   ├── web/        # Marketing website (port 3001)
│   ├── api/        # Backend API for AI services (port 3002)
│   ├── docs/       # Platform documentation
│   ├── email/      # Email templates
│   └── storybook/  # Component library (port 6006)
└── packages/       # Shared packages
    ├── ai/         # AI service integrations
    ├── design-system/
    ├── database/
    ├── auth/
    └── ...
```

Each app is self-contained and independently deployable. Packages are shared across apps for consistency and maintainability.

## Documentation

Full documentation is available at [clippizo.com/docs](https://clippizo.com/docs), including:

- Platform guides
- API documentation
- AI integration examples
- Deployment instructions

## License

MIT
