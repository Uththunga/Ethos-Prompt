# Testing with Firebase Emulators

This guide explains how to run the emulator-based test suite, how it differs from the mocked (fast) suite, common test patterns for emulator compatibility, and troubleshooting tips.

## Why Emulator Tests?
- Exercise real Firebase SDK behavior against local emulators (Auth, Firestore, Functions, Storage).
- Catch integration issues that pure mocks may miss (API shape, permission errors, query constraints).

## Prerequisites
- Node.js 18+
- Firebase CLI (available via `npx firebase-tools`)
- Ports available (default): Auth 9099, Firestore 8080, Functions 5001, Storage 9199, Emulator UI 4000

## Commands
- Run emulator suite (orchestrates emulators + tests):
  - `npm --prefix frontend run test:emulators`
- Run inner test runner only (assumes emulators already started elsewhere):
  - `npm --prefix frontend run test:emulators:inner`
- Start emulators manually (optional):
  - `npm --prefix frontend run emulators:start`
- Run the standard mocked suite (fast path):
  - `npm --prefix frontend run test -- --run --reporter=default`

## Test Modes: Mocked vs Emulator
- Mocked mode
  - Uses `vitest.config.ts` + `src/test/setup.ts`
  - Firebase modules are mocked for speed and isolation
  - Ideal for unit tests and deterministic component tests
- Emulator mode
  - Uses `vitest.emulators.config.ts` + `src/test/setup.emulators.ts`
  - Real Firebase SDK connected to local emulators
  - Ideal for integration tests that validate SDK behavior and Firestore query correctness

## Patterns for Emulator-Compatible Tests
- Avoid `vi.spyOn` on ESM namespace exports (e.g., `firebase/functions`). Use partial mocks instead:
  ```ts
  vi.mock('firebase/functions', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return { ...actual, httpsCallable: vi.fn(() => vi.fn()) };
  });
  ```
- TDZ-safe overrides: prefer global setters rather than referencing variables before initialization (Vitest hoists `vi.mock()`):
  ```ts
  vi.mock('firebase/functions', async (importOriginal) => {
    const actual = await importOriginal<any>();
    let current = vi.fn();
    (globalThis as any).__setCallable = (fn: any) => { current = fn; };
    return { ...actual, httpsCallable: vi.fn(() => current) };
  });
  ```
- Firestore safe stubs for mocked mode in tests that import emulator-friendly components:
  ```ts
  vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<any>();
    const noop = {} as any;
    return {
      ...actual,
      getFirestore: vi.fn(() => noop),
      collection: vi.fn(() => ({} as any)),
      query: vi.fn(() => ({} as any)),
      where: vi.fn(() => ({} as any)),
      orderBy: vi.fn(() => ({} as any)),
      limit: vi.fn(() => ({} as any)),
      getDocs: vi.fn(async () => ({ empty: true, size: 0, docs: [], forEach: () => {} } as any)),
    };
  });
  ```

## Troubleshooting
- ESM spy error: "Cannot spy on export. Module namespace is not configurable in ESM"
  - Solution: Replace with partial `vi.mock` and `importOriginal` as shown above.
- TDZ/hoist issues: "Cannot access X before initialization"
  - Solution: Use `globalThis` setter to update mocks after hoisted factory runs.
- Firestore errors like: "Expected first argument to collection() ..."
  - Cause: Partial mock replaced a full mock and is calling the real `collection` with a mocked `db`.
  - Solution: Provide stubbed `getFirestore` + `collection`/`query` chain (see snippet above).
- jsdom Canvas warnings with axe-core
  - Harmless; jsdom does not implement `HTMLCanvasElement.getContext`. Tests are resilient.
- React Router future flag warnings
  - Non-blocking and expected unless v7 flags are enabled.

## Best Practices
- Keep emulator tests focused on integration and behavior that benefits from real SDK calls.
- Keep unit tests in mocked mode for speed; prefer deterministic stubs over emulator state.
- If tests need non-empty data, add a small seeder util for emulator runs (clear and write consistent docs).
- Factor common ESM mocking helpers into a shared test util for reuse.

## CI/CD Notes
- Emulator suite can run in CI using `npx firebase-tools emulators:exec`.
- Ensure CI ports are free and ephemeral containers can start the emulators.
- No external network calls (OpenRouter) should be made in automated tests; ensure `OPENROUTER_USE_MOCK=true` where applicable.

