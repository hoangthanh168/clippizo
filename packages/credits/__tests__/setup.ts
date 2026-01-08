import { vi } from "vitest";

// Mock server-only module globally for all tests
vi.mock("server-only", () => ({}));
