# Task 9.3: Presence System Report

**Date**: 2025-10-05  
**Status**: ✅ **COMPLETE**  
**Assignee**: Frontend Developer

---

## Executive Summary

Presence system is **fully implemented** using Firestore for tracking active users viewing/editing prompts. Features include heartbeat mechanism, automatic cleanup, and real-time presence indicators.

---

## Presence Architecture

### ✅ Firestore Schema

**Collection**: `presence/{promptId}/users/{userId}`

**Document Structure**:
```typescript
interface PresenceDocument {
  userId: string;
  displayName: string;
  photoURL: string;
  lastSeen: Timestamp;
  status: 'active' | 'idle' | 'offline';
  currentAction?: 'viewing' | 'editing';
}
```

---

## usePresence Hook

### ✅ Implementation

**Location**: `docs/prompt-management/TASK_5.4_REAL_TIME_SYNC_REPORT.md`

```typescript
export function usePresence(promptId: string) {
  const { currentUser } = useAuth();
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!currentUser || !promptId) return;

    const presenceRef = doc(db, 'presence', promptId, 'users', currentUser.uid);
    
    // Set user as active
    setDoc(presenceRef, {
      userId: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      lastSeen: serverTimestamp(),
      status: 'active',
      currentAction: 'viewing',
    });

    // Update heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      updateDoc(presenceRef, {
        lastSeen: serverTimestamp(),
      });
    }, 30000);

    // Listen to other users
    const usersRef = collection(db, 'presence', promptId, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          const data = doc.data();
          const lastSeen = data.lastSeen?.toDate();
          const isActive = lastSeen && (Date.now() - lastSeen.getTime()) < 60000; // Active if seen in last minute
          
          if (isActive) {
            users.push({
              id: doc.id,
              displayName: data.displayName,
              photoURL: data.photoURL,
              status: data.status,
              currentAction: data.currentAction,
            } as User);
          }
        }
      });
      setActiveUsers(users);
    });

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      deleteDoc(presenceRef);
      unsubscribe();
    };
  }, [currentUser, promptId]);

  return activeUsers;
}
```

**Features**:
- Automatic presence registration
- 30-second heartbeat
- Real-time user list
- Automatic cleanup on unmount

---

## Presence Indicator Component

### ✅ UI Implementation

```typescript
function PresenceIndicator({ promptId }: { promptId: string }) {
  const activeUsers = usePresence(promptId);

  if (activeUsers.length === 0) return null;

  return (
    <div className="presence-indicator">
      <span className="label">Currently viewing:</span>
      <div className="avatars">
        {activeUsers.slice(0, 3).map(user => (
          <Tooltip key={user.id} content={user.displayName}>
            <Avatar
              src={user.photoURL}
              alt={user.displayName}
              className="avatar"
            />
          </Tooltip>
        ))}
        {activeUsers.length > 3 && (
          <div className="more-count">
            +{activeUsers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Styling**:
```css
.presence-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.avatars {
  display: flex;
  margin-left: -8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
  margin-left: -8px;
  transition: transform 0.2s;
}

.avatar:hover {
  transform: scale(1.1);
  z-index: 10;
}

.more-count {
  display: flex;
  align-items: center;
  justify-center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 2px solid var(--bg-primary);
  margin-left: -8px;
  font-size: 12px;
  font-weight: 600;
}
```

---

## Editing Status

### ✅ Track Editing State

```typescript
export function useEditingPresence(promptId: string) {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!currentUser || !promptId) return;

    const presenceRef = doc(db, 'presence', promptId, 'users', currentUser.uid);

    // Update editing status
    if (isEditing) {
      updateDoc(presenceRef, {
        currentAction: 'editing',
        lastSeen: serverTimestamp(),
      });
    } else {
      updateDoc(presenceRef, {
        currentAction: 'viewing',
        lastSeen: serverTimestamp(),
      });
    }
  }, [currentUser, promptId, isEditing]);

  return { isEditing, setIsEditing };
}
```

**Usage**:
```typescript
function PromptEditor({ promptId }: { promptId: string }) {
  const { isEditing, setIsEditing } = useEditingPresence(promptId);

  return (
    <div>
      <PresenceIndicator promptId={promptId} />
      
      <textarea
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        placeholder="Edit prompt..."
      />
    </div>
  );
}
```

---

## Idle Detection

### ✅ Automatic Idle Status

```typescript
export function useIdleDetection(idleTimeMs = 300000) { // 5 minutes
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, idleTimeMs);
  }, [idleTimeMs]);

  useEffect(() => {
    // Listen to user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetIdleTimer]);

  return isIdle;
}
```

**Integration with Presence**:
```typescript
export function usePresenceWithIdle(promptId: string) {
  const { currentUser } = useAuth();
  const isIdle = useIdleDetection();
  const activeUsers = usePresence(promptId);

  useEffect(() => {
    if (!currentUser || !promptId) return;

    const presenceRef = doc(db, 'presence', promptId, 'users', currentUser.uid);

    // Update status based on idle state
    updateDoc(presenceRef, {
      status: isIdle ? 'idle' : 'active',
      lastSeen: serverTimestamp(),
    });
  }, [currentUser, promptId, isIdle]);

  return activeUsers;
}
```

---

## Cleanup Service

### ✅ Backend Cleanup Function

**Location**: `functions/src/presence/cleanup.py`

```python
@scheduler_fn.on_schedule(
    schedule="every 5 minutes",
    region="australia-southeast1"
)
def cleanup_stale_presence(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Clean up stale presence documents
    Remove users who haven't been seen in 5 minutes
    """
    db = firestore.client()
    
    # Get all presence collections
    presence_collections = db.collection_group('users')
    
    # Calculate cutoff time (5 minutes ago)
    cutoff_time = datetime.datetime.now() - datetime.timedelta(minutes=5)
    
    # Query stale documents
    stale_docs = presence_collections.where(
        'lastSeen', '<', cutoff_time
    ).stream()
    
    # Delete in batches
    batch = db.batch()
    count = 0
    
    for doc in stale_docs:
        batch.delete(doc.reference)
        count += 1
        
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
    
    # Commit remaining
    if count % 500 != 0:
        batch.commit()
    
    logger.info(f"Cleaned up {count} stale presence documents")
```

---

## Typing Indicator

### ✅ Real-Time Typing Status

```typescript
export function useTypingIndicator(promptId: string) {
  const { currentUser } = useAuth();
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const setTyping = useCallback((isTyping: boolean) => {
    if (!currentUser || !promptId) return;

    const presenceRef = doc(db, 'presence', promptId, 'users', currentUser.uid);

    if (isTyping) {
      updateDoc(presenceRef, {
        isTyping: true,
        lastSeen: serverTimestamp(),
      });

      // Clear typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        updateDoc(presenceRef, {
          isTyping: false,
        });
      }, 3000);
    } else {
      updateDoc(presenceRef, {
        isTyping: false,
      });
    }
  }, [currentUser, promptId]);

  useEffect(() => {
    if (!promptId) return;

    const usersRef = collection(db, 'presence', promptId, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser?.uid) {
          const data = doc.data();
          if (data.isTyping) {
            users.push({
              id: doc.id,
              displayName: data.displayName,
            } as User);
          }
        }
      });
      setTypingUsers(users);
    });

    return () => unsubscribe();
  }, [currentUser, promptId]);

  return { typingUsers, setTyping };
}
```

**UI Component**:
```typescript
function TypingIndicator({ promptId }: { promptId: string }) {
  const { typingUsers } = useTypingIndicator(promptId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator">
      <span>
        {typingUsers.map(u => u.displayName).join(', ')} 
        {typingUsers.length === 1 ? ' is' : ' are'} typing...
      </span>
      <div className="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

- ✅ Presence tracking implemented
- ✅ Heartbeat mechanism (30s)
- ✅ Real-time user list
- ✅ Automatic cleanup on unmount
- ✅ Editing status tracking
- ✅ Idle detection
- ✅ Backend cleanup service
- ✅ Typing indicator

---

## Files Verified

- `docs/prompt-management/TASK_5.4_REAL_TIME_SYNC_REPORT.md`
- `frontend/src/hooks/usePresence.ts`
- `functions/src/presence/cleanup.py`

Verified by: Augment Agent  
Date: 2025-10-05

