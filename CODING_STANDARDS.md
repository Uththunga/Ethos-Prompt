## Coding Standards

This project follows a TypeScript-first, React 18 functional components approach with strict linting. These standards are mandatory for all new and modified code.

- Language and Types
  - Use TypeScript for all files (`.ts`, `.tsx`)
  - No `any` in exported types; prefer explicit interfaces/types
  - Avoid `Function` type; prefer `(...args: unknown[]) => void` or generics
  - Narrow types with guards/refinement (e.g., `zod`)

- React
  - Functional components with hooks; no class components
  - Prefer controlled components for forms
  - Memoize callbacks/derived values (`useCallback`, `useMemo`) when beneficial
  - Accessibility: label inputs, keyboard focus states, aria attributes where needed

- Styling & Design System
  - Use Tailwind utility classes and Ethos tokens exclusively
  - Brand color: ethos purple (`bg-ethos-purple`, `hover:bg-ethos-purple-light`, `focus:ring-ethos-purple`)
  - Do not introduce raw hex colors in components; if missing, add tokens

- State & Data
  - Server state via React Query; local UI state via component state
  - No client-side joins on large datasets; paginate or use server aggregation

- File Structure
  - src/components/ for reusable UI
  - src/features/ for domain modules
  - src/lib/ for api/firebase wrappers
  - src/test/ mirrors source structure

- Error Handling
  - Prefer `Result`-like returns or typed errors for utilities
  - Log with context; avoid console noise in production paths

- Testing
  - All new logic needs unit tests (Vitest/RTL)
  - Use Firebase emulators for functions/firestore tests

- Linting & Formatting
  - `npm run lint` must pass with 0 errors
  - Fix warnings in touched files

- Security
  - No secrets in repo; use env vars
  - Sanitize/escape user-generated content; validate inputs

- Performance
  - Avoid unnecessary re-renders; virtualize long lists; code-split heavy routes

## Commit & PR
- Conventional commits (feat/fix/chore/docs/refactor/test)
- PR must pass: lint, typecheck, tests, build

