# Research: Update Project Information

**Branch**: `002-update-project-info` | **Date**: 2026-01-07

## Summary

This research documents the files that need updating and the standard messaging to apply across all project documentation.

## Files Inventory

### High Priority (Core Documentation)

| File | Current State | Required Update |
|------|--------------|-----------------|
| `CLAUDE.md` | Generic monorepo description | Add AI video platform context |
| `.claude/docs/architecture.md` | App structure only | Add platform purpose and feature context |
| `.claude/docs/database.md` | Schema reference | Add AI generation and content context |
| `.specify/memory/constitution.md` | "Clippizo Constitution" header | Add platform description |

### Medium Priority (Package Metadata)

| File | Current State | Required Update |
|------|--------------|-----------------|
| `package.json` (root) | Name only | Add description field |
| `apps/app/package.json` | Name only | Add description |
| `apps/web/package.json` | Name only | Add description |
| `apps/api/package.json` | Name only | Add description |
| `packages/ai/package.json` | Name only | Add description |
| `packages/database/package.json` | Name only | Add description |

### Low Priority (Supporting Packages)

| File | Current State | Required Update |
|------|--------------|-----------------|
| `apps/docs/package.json` | Name only | Add description |
| `apps/email/package.json` | Name only | Add description |
| `apps/studio/package.json` | Name only | Add description |
| `apps/storybook/package.json` | Name only | Add description |
| Other packages | Name only | Optional description |

## Standard Messaging

### Platform Identity

- **Name**: Clippizo
- **Type**: SaaS Platform
- **Purpose**: AI-powered video creation tools
- **Target Users**: Content creators, video producers
- **Comparable**: Higgsfield.ai, similar AI video platforms

### Core Features

1. **AI Image Generation** - Create images using AI for video content
2. **AI Video Generation** - Generate video clips and sequences with AI
3. **Content Management** - Organize and manage created assets
4. **AI Chatbot** - Assist creators with workflow and content suggestions

### Description Templates

**Full description**:
```
Clippizo is a SaaS platform providing AI-powered tools for video creation, 
including image generation, video generation, content management, and AI 
chatbot assistance. Built for content creators and video producers.
```

**Short description**:
```
AI-powered video creation platform
```

**One-liner**:
```
AI video creation SaaS
```

## Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep project name "clippizo" | Per spec assumption | N/A |
| Documentation-only changes | Preserve working code | Full rebrand (out of scope) |
| Consistent messaging | Developer onboarding | Per-file custom descriptions |

## Unknowns Resolved

- No NEEDS CLARIFICATION items - all context provided in spec
- Target users confirmed: content creators and video producers
- Platform model: subscription-based SaaS

## Next Phase

Proceed to `/speckit.tasks` for task generation.
