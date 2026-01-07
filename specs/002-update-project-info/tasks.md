# Tasks: Update Project Information

**Input**: Design documents from `/specs/002-update-project-info/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not required - this is a documentation-only update with manual verification.

**Organization**: Single user story (US1) with tasks grouped by file priority.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 for all documentation tasks
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Review current state and prepare for updates

- [x] T001 Review current CLAUDE.md content in CLAUDE.md
- [x] T002 [P] Review current architecture.md content in .claude/docs/architecture.md
- [x] T003 [P] Review current database.md content in .claude/docs/database.md
- [x] T004 [P] Review current constitution.md content in .specify/memory/constitution.md

---

## Phase 2: User Story 1 - Update Project Identity (Priority: P1) 🎯 MVP

**Goal**: Update all documentation to reflect Clippizo as an AI-powered video creation SaaS platform

**Independent Test**: Developer can read updated docs and understand: (1) Platform purpose - AI video creation, (2) Core features - image gen, video gen, content mgmt, chatbot, (3) Target users - content creators and video producers

### High Priority - Core Documentation

- [x] T005 [US1] Update CLAUDE.md with AI video platform description and feature overview in CLAUDE.md
- [x] T006 [P] [US1] Update architecture.md with app/package purposes for video creation workflow in .claude/docs/architecture.md
- [x] T007 [P] [US1] Update database.md with entity context for AI content management in .claude/docs/database.md
- [x] T008 [P] [US1] Update constitution.md header with platform description in .specify/memory/constitution.md

**Checkpoint**: Core documentation reflects AI video platform identity

### Medium Priority - Package Metadata

- [x] T009 [P] [US1] Add description field to root package.json: "AI-powered video creation platform" in package.json
- [x] T010 [P] [US1] Add description to apps/app/package.json: "Main Clippizo application - dashboard for AI video creation tools"
- [x] T011 [P] [US1] Add description to apps/web/package.json: "Marketing website showcasing Clippizo's AI video capabilities"
- [x] T012 [P] [US1] Add description to apps/api/package.json: "Backend API for AI generation services and content management"
- [x] T013 [P] [US1] Add description to packages/ai/package.json: "AI service integrations (image generation, video generation, chatbot)"
- [x] T014 [P] [US1] Add description to packages/database/package.json: "Data models for users, content, AI generations, subscriptions"

**Checkpoint**: Core package metadata updated

### Low Priority - Supporting Packages

- [x] T015 [P] [US1] Add description to apps/docs/package.json: "Documentation for Clippizo platform and API"
- [x] T016 [P] [US1] Add description to apps/email/package.json: "Email templates for user notifications and marketing"
- [x] T017 [P] [US1] Add description to apps/studio/package.json: "Admin studio for platform management"
- [x] T018 [P] [US1] Add description to apps/storybook/package.json: "UI component library for Clippizo design system"
- [x] T019 [P] [US1] Add description to packages/analytics/package.json: "Usage tracking and AI generation analytics"
- [x] T020 [P] [US1] Add description to packages/design-system/package.json: "Clippizo UI components and design tokens"

**Checkpoint**: All package metadata updated

---

## Phase 3: Polish & Verification

**Purpose**: Ensure consistency and completeness

- [x] T021 Verify all documentation references to project purpose are consistent
- [x] T022 Run `npm run check` to ensure no formatting issues introduced
- [x] T023 Review updated files for any remaining generic/old descriptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - review phase
- **Phase 2 (US1)**: Can start immediately after Phase 1
- **Phase 3 (Polish)**: Depends on Phase 2 completion

### Parallel Opportunities

Within Phase 2, all tasks marked [P] can run in parallel:
- T006, T007, T008 (core docs) - different files
- T009-T014 (core packages) - different files
- T015-T020 (supporting packages) - different files

### Recommended Execution Order

1. T001-T004: Review (parallel)
2. T005: CLAUDE.md first (main entry point)
3. T006-T008: Other core docs (parallel)
4. T009-T014: Core packages (parallel)
5. T015-T020: Supporting packages (parallel)
6. T021-T023: Verification (sequential)

---

## Parallel Example: Core Documentation

```bash
# Launch all core doc updates together:
Task: "Update architecture.md with app/package purposes in .claude/docs/architecture.md"
Task: "Update database.md with entity context in .claude/docs/database.md"
Task: "Update constitution.md header in .specify/memory/constitution.md"
```

## Parallel Example: Package Metadata

```bash
# Launch all package.json updates together:
Task: "Add description to apps/app/package.json"
Task: "Add description to apps/web/package.json"
Task: "Add description to apps/api/package.json"
Task: "Add description to packages/ai/package.json"
Task: "Add description to packages/database/package.json"
```

---

## Implementation Strategy

### MVP First Approach

1. Complete T001-T004: Review current state
2. Complete T005: Update main CLAUDE.md
3. **STOP and VALIDATE**: Verify messaging is clear
4. Continue with remaining tasks

### Incremental Delivery

1. Core docs (T005-T008) → Primary messaging complete
2. Core packages (T009-T014) → Main packages documented
3. Supporting packages (T015-T020) → Full coverage
4. Verification (T021-T023) → Quality check

---

## Standard Messaging Reference

From research.md - use these descriptions:

**Full description**:
> Clippizo is a SaaS platform providing AI-powered tools for video creation, including image generation, video generation, content management, and AI chatbot assistance. Built for content creators and video producers.

**Short description**:
> AI-powered video creation platform

**Core features**:
1. AI Image Generation
2. AI Video Generation
3. Content Management
4. AI Chatbot

---

## Notes

- All tasks are documentation-only (no code changes)
- [P] tasks = different files, can run in parallel
- All tasks belong to US1 (single user story)
- Commit after each priority group completion
- Preserve existing structure and conventions per FR-004
