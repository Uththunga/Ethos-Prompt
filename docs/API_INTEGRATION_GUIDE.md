# Prompt CRUD via Callable API

This guide documents the single source of truth for Prompt CRUD in the RAG Prompt Library: Firebase Functions callable endpoints. All frontend code should go through these callables instead of direct Firestore access.

## Overview
- Transport: Firebase Functions (Node 18)
- Region: australia-southeast1
- Auth: Firebase Auth required
- Collections: prompts, prompts/{id}/versions, executions
- Validation: Server-side (Pydantic/validators) and Firestore Rules

## Endpoints
- create_prompt
- update_prompt
- delete_prompt
- get_prompt
- list_prompts
- search_prompts

Each endpoint requires the user to be authenticated. Ownership checks are enforced.

## Example: Client usage with Firebase Functions

```ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

export async function createPrompt(input: {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  category?: string;
}) {
  const callable = httpsCallable(functions, 'create_prompt');
  const { data } = await callable(input);
  return data; // { id, ...prompt }
}
```

## Request/Response shapes
- Input: Strongly typed in frontend; validated on backend (title/content length, tags, variables).
- Response: Normalized object with id, metadata (createdAt/updatedAt), and derived fields.
- Errors: HttpsError codes: unauthenticated, permission-denied, invalid-argument, already-exists, not-found.

## Security & Ownership
- Users can only create/read/update/delete their own prompts.
- Public prompts (isPublic) are readable by authenticated users.
- Firestore Rules mirror the callable checks to prevent direct access.

## Versioning
- update_prompt creates a new version when content-significant fields change.
- versions are available at prompts/{id}/versions and via callable endpoints when applicable.

## Migration notes (from direct Firestore)
- Replace promptService (direct Firestore) with promptApi (callables).
- Prompts.tsx and usePrompts.ts already migrated.
- Ensure any remaining components use promptApi for consistency and validation.

## Error handling (frontend)
- Show user-friendly messages for HttpsError codes.
- Use toast/notification for transient issues; inline messages for validation.
- Consider retry for idempotent reads; do not auto-retry writes without user action.

## Testing
- Unit tests: mock httpsCallable and validate payloads and responses.
- Integration tests: render pages using promptApi and assert CRUD flows.
- E2E: validate full flow (create → list → update → delete) via callables.

## Performance
- Prefer pagination on list/search endpoints (cursor-based).
- Avoid N+1 reads; batch when possible.

## Notes
- The backend runtime is Node 18 for callables. Python functions are present but not deployed in production yet.
- If staging or runtime changes are introduced, update this guide accordingly.

