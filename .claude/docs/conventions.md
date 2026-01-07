# Conventions

## TypeScript

- Strict mode enabled (`strict: true`, `strictNullChecks: true`)
- No `any` types — use `unknown` with type guards
- Use `readonly` for React props: `readonly children: ReactNode`
- Prefer type aliases over interfaces for props

## Formatting

- **Biome via Ultracite** for linting/formatting
- Run `npm run check` before committing
- Run `npm run fix` to auto-fix issues
- Use `// biome-ignore` with explanation when disabling rules

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-profile.tsx` |
| Components | PascalCase | `UserProfile` |
| Functions/variables | camelCase | `getUserProfile` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Types | PascalCase + suffix | `UserProfileProps` |

## Commits

Conventional commits format: `type(scope): description`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Tests
- `chore` - Maintenance

**Breaking changes:** Include `BREAKING CHANGE:` in footer

## Documentation Standards

### Code Comments
- Prefer self-documenting code over comments
- Use comments for "why", not "what"
- Use `// biome-ignore` with reason when disabling lint rules
- No JSDoc unless generating API documentation

### Inline Documentation
```typescript
// Good: explains why
// Skip validation for internal API calls (already validated upstream)
const data = await fetchInternal(url);

// Bad: explains what (obvious from code)
// Fetch data from URL
const data = await fetch(url);
```

### README Files
- Each package should have a README if it has non-obvious setup
- Document environment variables in `keys.ts` with Zod descriptions
- No duplicate documentation — link to canonical source
