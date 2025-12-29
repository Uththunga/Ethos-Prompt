# EthosPrompt — Prompt Library Chat Interface

This guide explains how to use the Prompt Library chat interface (Mole assistant) to manage your prompts using natural language. It covers supported commands, new contextual behaviors, error handling, examples, and a short migration guide from ID‑based commands.

---

## Overview

- Endpoint: /api/ai/prompt-library-chat (served by httpApi)
- Auth: Firebase ID token (Bearer)
- Scope: Your own prompts (user‑scoped)
- Billing: Tool operations (list/update/delete) do not use the LLM — zero tokens, zero cost
- Conversation context: The assistant now remembers the last list of prompts you asked for within the same conversation for 10 minutes (TTL)

---

## Core Commands (ID or Explicit Target)

These work without any conversation context. They directly target a prompt by ID.

- List your prompts
  - Examples: "Show me all my prompts", "list prompts", "view my prompts"

- Update a prompt title by ID
  - Example: "Update the title of eREG2ROOa6WaXC5sQAq1 to \"New Title\""

- Update a prompt content by ID
  - Example: "Update the content of eREG2ROOa6WaXC5sQAq1 to \"New content\""

- Delete a prompt by ID
  - Example: "Delete the prompt N0UEac3fLSGgNmSX34Ht"

Notes:
- ID format: 5–64 chars; letters, numbers, dash, underscore
- Validation: You’ll get helpful errors for missing/invalid values or not‑found prompts

---

## Contextual Commands (New)

After you list your prompts in a conversation, the assistant stores a contextual snapshot of the list for 10 minutes. You can then reference items by position or title without specifying the ID.

Context lifespan
- Stored per conversationId + userId
- Expires after 10 minutes of inactivity
- Automatically refreshed when you list again

### Contextual Delete

- "delete it"
  - Deletes the only prompt if there’s exactly one item in the last list
  - If there were multiple items, it’s ambiguous and you’ll get an error suggesting: "delete the first one", "delete both", or specify ID/title

- "delete the first one" / "delete the second one" / "delete the third one"
  - Deletes by the position in the last list response (1‑based)

- "delete both" / "delete all of them"
  - Deletes all prompts from the last listed set

- "delete [title]"
  - Fuzzy match by title (case‑insensitive, partial match). Example: "delete Code Review"
  - Safety: Extremely short or contextual words (e.g., "it", "one", "this", "that") won’t match

Examples
- "Show me all my prompts" → "delete the first one"
- "list prompts" → "delete both"
- "list my prompts" → "delete Code Review Assistant"

### Contextual Update

- Update title (by position)
  - "update the title of the first one to \"Beginner Guide\""
  - "set the title of the second one to \"SEO Writer\""

- Update content (by position)
  - "update the content of the first one to \"Write a friendly intro about...\""

- Update by title (fuzzy match)
  - "update Code Review Assistant to \"Code Review Pro\"" (title change)
  - "update the content of \"SEO Blog Post Writer\" to \"Use H2 sections...\""

Notes
- On ambiguity (e.g., multiple matches), the assistant asks you to clarify (position or exact title)
- If no recent list was shown in the conversation, you’ll be asked to list first

---

## Error Handling Behavior

- Missing authentication → 401 Unauthorized
- No recent list when using contextual commands → 400 with guidance to list first
- Ambiguous reference (e.g., "delete it" after listing multiple items) → 400 with suggestions
- Invalid ID or bad format → 400 with example of valid usage
- Not found (ID doesn’t exist or already deleted) → 404 with details
- Validation errors (e.g., empty title/content) → 400 with actionable message

All tool operations return metadata containing:
- tool_calls: Array of tool invocations with args, duration, success/error
- tokens_used: 0 (no LLM involvement)
- cost: 0

---

## Troubleshooting

- "delete it" returns ambiguous error
  - Reason: There were multiple prompts in the last list
  - Fix: Use "delete the first one", "delete both", or specify the exact title or ID

- "delete it" returns "Please list your prompts first"
  - Reason: No recent list context in this conversation
  - Fix: Say "Show me all my prompts" first, then retry

- Title match didn’t work
  - Reason: Title was too short/ambiguous (e.g., "it", "one") or no match
  - Fix: Use position reference (first/second) or specify the full title or ID

- I listed prompts, but the context seems gone
  - Reason: Context expires after 10 minutes or you switched conversationId
  - Fix: List prompts again in the same conversation to refresh context

- I got a 429 Rate Limit error
  - Reason: Too many rapid requests
  - Fix: Wait a few seconds and retry; stagger automated tests

---

## Migration Guide (From ID‑only to Contextual)

Before (ID‑only)
- "Delete the prompt N0UEac3fLSGgNmSX34Ht"
- "Update the title of eREG2ROOa6WaXC5sQAq1 to \"New Title\""

After (Contextual)
1) List first: "Show me all my prompts"
2) Use context:
   - "delete the first one"
   - "delete both"
   - "delete Code Review Assistant"
   - "update the title of the first one to \"Beginner Guide\""
   - "update the content of the second one to \"Explain the steps...\""

Tip: You can still use IDs at any time — both styles are supported.

---

## Examples (Full Requests)

- List prompts
```
POST /api/ai/prompt-library-chat
Authorization: Bearer <ID_TOKEN>
Content-Type: application/json

{ "message": "Show me all my prompts", "conversationId": "abc123" }
```

- Contextual delete (first item)
```
{ "message": "delete the first one", "conversationId": "abc123" }
```

- Contextual update (title)
```
{ "message": "update the title of the first one to \"Beginner Guide\"", "conversationId": "abc123" }
```

- Delete by title
```
{ "message": "delete Code Review Assistant", "conversationId": "abc123" }
```

---

## Security & Privacy

- Context is stored in-memory on the server, scoped to your conversationId + userId
- Context expires automatically after 10 minutes
- No context data is persisted to the database
- All operations are authorized to your user scope only

---

## Support

If you encounter issues, collect the response JSON (including metadata.tool_calls) and contact the team with:
- Your conversationId
- The exact message you sent
- Timestamps and any related prompt IDs/titles

