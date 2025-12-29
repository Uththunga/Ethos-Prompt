# Firestore Index Strategy

This document explains the composite indexes required by our current query patterns and why they exist.

## Collections and Queries

- rag_documents
  - getUserDocuments: where uploadedBy == <uid> orderBy uploadedAt desc
    - Index: uploadedBy (ASC), uploadedAt (DESC)
  - getDocumentsByStatus: where uploadedBy == <uid> and status == <status> orderBy uploadedAt desc
    - Index: uploadedBy (ASC), status (ASC), uploadedAt (DESC)
- prompts
  - Various list/search: createdBy + createdAt; tags + createdAt; category + createdAt; isPublic + createdAt
- executions (subcollection under users/{uid}/prompts/{pid})
  - orderBy timestamp desc + limit
  - Covered by single-field indexes; no composite index needed
- execution_ratings
  - userId + timestamp; executionId + timestamp; promptId + rating; modelUsed + rating

## Current index definitions

See firestore.indexes.json. Added/updated entries:

- rag_documents composite indexes
  - uploadedBy + uploadedAt (DESC)
  - uploadedBy + status + uploadedAt (DESC)

## Rationale

Firestore requires composite indexes for queries that combine equality filters on one or more fields with ordering on a different field. Our document list screens filter by owner (and optionally status) and sort by latest uploads; without these indexes, Firestore will emit a missing index error and perform poorly.

## Deployment

To deploy indexes to a specific project (staging or prod):

- Staging:
  - npx firebase deploy --only firestore:indexes --project <STAGING_PROJECT_ID>
- Production:
  - npx firebase deploy --only firestore:indexes --project <PRODUCTION_PROJECT_ID>

Monitor index build status in Firebase Console > Firestore > Indexes.

## Maintenance

- Keep this doc aligned with any new query pattern that combines filters and ordering.
- When you see a Firestore missing index error in logs or the console, capture the suggested index, confirm the query’s importance, and add it here and to firestore.indexes.json.

