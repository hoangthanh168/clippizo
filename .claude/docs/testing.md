# Testing

## Test Location

- Place tests in `__tests__/` directory within each app/package
- Name test files as `*.test.ts` or `*.test.tsx`

## Test Pattern

```typescript
import { expect, test } from "vitest";

test("descriptive test name", async () => {
  // Arrange
  const input = "test";

  // Act
  const result = await processInput(input);

  // Assert
  expect(result).toBe(expected);
});
```

## Running Tests

```bash
# All tests
npm run test

# Single file
npx vitest run path/to/test.test.ts

# By name
npx vitest run --filter "test name"

# Watch mode
npx vitest --watch
```

## Coverage Expectations

**Test these:**
- API route handlers (request/response)
- Utility functions with edge cases
- React components with user interactions

**Skip testing:**
- Third-party library wrappers
- Simple re-exports
