# 🏗️ Architecture Guide - React Prompt Library

**Version:** 3.0  
**Last Updated:** January 27, 2025  
**Team Readiness Score:** 9.1/10 → Target: 9.5/10

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [State Management Strategy](#state-management-strategy)
5. [Firebase Integration Patterns](#firebase-integration-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Security Implementation](#security-implementation)
8. [Build & Deployment Architecture](#build--deployment-architecture)
9. [Development Workflow](#development-workflow)
10. [Architecture Decision Records](#architecture-decision-records)

---

## 🎯 System Overview

The React Prompt Library is a modern, enterprise-grade platform built with a **React frontend** and **Firebase backend** architecture. The system follows **microservices patterns** with **serverless functions**, providing scalable AI prompt management with integrated RAG capabilities.

### Core Architecture Principles

- **🔄 Real-time First**: Firebase Firestore provides live data synchronization
- **⚡ Performance Optimized**: Lazy loading, code splitting, and caching strategies
- **🔒 Security by Design**: Firebase Auth, security rules, and type-safe APIs
- **📱 Mobile-First**: Responsive design with progressive web app features
- **🧪 Test-Driven**: 80%+ test coverage with comprehensive testing strategies
- **♿ Accessible**: WCAG 2.1 AA compliance throughout the application

### Technology Stack Summary

```
Frontend:  React 18.3.1 + TypeScript 5.8.3 + Vite 5.3.5 + Tailwind CSS 4.1.11
Backend:   Firebase Cloud Functions (Node.js 18) + Python RAG Pipeline
Database:  Cloud Firestore + FAISS Vector Store
Auth:      Firebase Authentication + Google OAuth
Hosting:   Firebase Hosting + CDN
Monitoring: Firebase Analytics + Custom Performance Monitoring
```

---

## 🎨 Frontend Architecture

### Component Architecture Pattern

The frontend follows a **hierarchical component architecture** with clear separation of concerns:

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Base components (Button, Modal, etc.)
│   ├── marketing/       # Marketing-specific components
│   │   └── ui/         # shadcn/ui component library
│   ├── layout/         # Layout components (Sidebar, Header)
│   ├── auth/           # Authentication components
│   ├── prompts/        # Prompt management components
│   ├── documents/      # Document handling components
│   └── analytics/      # Analytics and monitoring
├── pages/              # Route-level page components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### Component Design Patterns

#### 1. **Compound Components Pattern**
Used for complex UI components like forms and modals:

```tsx
// Example: Modal compound component
<Modal>
  <Modal.Header>
    <Modal.Title>Create New Prompt</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <PromptForm onSubmit={handleSubmit} />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="outline" onClick={onCancel}>Cancel</Button>
    <Button type="submit">Create Prompt</Button>
  </Modal.Footer>
</Modal>
```

#### 2. **Render Props Pattern**
For data fetching and state management:

```tsx
// Example: Data fetching with render props
<PromptLoader promptId={id}>
  {({ prompt, loading, error }) => (
    loading ? <LoadingSpinner /> : 
    error ? <ErrorMessage error={error} /> :
    <PromptEditor prompt={prompt} />
  )}
</PromptLoader>
```

#### 3. **Higher-Order Components (HOCs)**
For cross-cutting concerns like authentication:

```tsx
// Example: Authentication HOC
const withAuth = (Component) => {
  return (props) => {
    const { currentUser, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!currentUser) return <Navigate to="/auth" />;
    
    return <Component {...props} user={currentUser} />;
  };
};
```

### Routing Architecture

**React Router v6.28.0** with nested routing and lazy loading:

```tsx
// App.tsx routing structure
<Routes>
  {/* Public marketing routes */}
  <Route path="/" element={<MarketingHome />} />
  <Route path="/auth" element={<AuthPage />} />
  
  {/* Protected dashboard routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    <Route index element={<Dashboard />} />
    <Route path="prompts" element={<Prompts />} />
    <Route path="prompts/:promptId/execute" element={<ExecutePrompt />} />
    <Route path="documents" element={<Documents />} />
    <Route path="executions" element={<Executions />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="workspaces" element={<Workspaces />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### Performance Optimization Patterns

#### 1. **Code Splitting & Lazy Loading**
```tsx
// Lazy load heavy components
const ExecutePrompt = lazy(() => 
  import('./pages/ExecutePrompt').then(m => ({ default: m.ExecutePrompt }))
);

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <ExecutePrompt />
</Suspense>
```

#### 2. **Memoization Strategy**
```tsx
// Component memoization
const PromptCard = React.memo(({ prompt, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{prompt.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{prompt.description}</p>
      </CardContent>
    </Card>
  );
});

// Hook memoization
const usePromptData = (promptId) => {
  return useMemo(() => {
    // Expensive computation
    return processPromptData(promptId);
  }, [promptId]);
};
```

---

## 🔧 Backend Architecture

### Firebase Cloud Functions Architecture

The backend uses **Firebase Cloud Functions** with a **hybrid approach**:
- **Node.js functions** for API endpoints and Firebase integrations
- **Python functions** for AI/ML processing and RAG pipeline

```
functions/
├── index.js              # Node.js function entry point
├── main.py              # Python function entry point
├── src/                 # Python source code
│   ├── ai_service.py    # AI service orchestration
│   ├── rag/            # RAG pipeline components
│   ├── llm/            # LLM provider management
│   ├── analytics/      # Analytics collection
│   ├── auth/           # Authentication middleware
│   └── cache/          # Caching layer
└── package.json        # Node.js dependencies
```

### Function Architecture Patterns

#### 1. **HTTP API Functions**
RESTful API endpoints with proper error handling:

```python
# Example: Prompt execution function
@functions_framework.http
def execute_prompt(request):
    try:
        # Authentication
        user = authenticate_request(request)
        
        # Input validation
        data = validate_prompt_data(request.json)
        
        # Business logic
        result = ai_service.execute_prompt(
            prompt=data['prompt'],
            context=data.get('context'),
            user_id=user['uid']
        )
        
        # Response formatting
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AuthenticationError as e:
        return jsonify({'error': 'Unauthorized'}), 401
    except Exception as e:
        logger.error(f"Execution error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
```

#### 2. **Firestore Triggers**
Event-driven functions for data processing:

```python
# Example: Document processing trigger
@firestore_fn.on_document_created(document="documents/{documentId}")
def process_document(cloud_event):
    document_data = cloud_event.data.value.fields
    document_id = cloud_event.data.name.split('/')[-1]
    
    try:
        # Extract text content
        content = extract_document_content(document_data)
        
        # Generate embeddings
        embeddings = embedding_service.generate_embeddings(content)
        
        # Store in vector database
        vector_store.store_embeddings(document_id, embeddings)
        
        # Update document status
        firestore_client.collection('documents').document(document_id).update({
            'status': 'processed',
            'processed_at': firestore.SERVER_TIMESTAMP
        })
        
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        # Update with error status
        firestore_client.collection('documents').document(document_id).update({
            'status': 'error',
            'error_message': str(e)
        })
```

### RAG Pipeline Architecture

Advanced **Retrieval-Augmented Generation** pipeline with multiple components:

```python
# RAG Pipeline Components
class AdvancedRAGPipeline:
    def __init__(self):
        self.retriever = HybridRetriever()      # BM25 + Semantic search
        self.chunker = AdaptiveChunker()        # Intelligent chunking
        self.reranker = CrossEncoderReranker()  # Result reranking
        self.synthesizer = ResponseSynthesizer() # Response generation

    async def process_query(self, query: str, context: Dict) -> Dict:
        # 1. Query preprocessing
        processed_query = self.preprocess_query(query)

        # 2. Hybrid retrieval
        candidates = await self.retriever.retrieve(
            query=processed_query,
            top_k=20
        )

        # 3. Reranking
        ranked_results = self.reranker.rerank(
            query=processed_query,
            candidates=candidates,
            top_k=5
        )

        # 4. Response synthesis
        response = await self.synthesizer.synthesize(
            query=processed_query,
            context=ranked_results,
            user_context=context
        )

        return {
            'response': response,
            'sources': ranked_results,
            'metadata': {
                'query_processed': processed_query,
                'retrieval_time': self.retrieval_time,
                'synthesis_time': self.synthesis_time
            }
        }
```

---

## 📊 State Management Strategy

### React Query + Context Pattern

The application uses **TanStack React Query** for server state and **React Context** for global UI state:

#### 1. **Server State Management (React Query)**

```tsx
// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      cacheTime: 10 * 60 * 1000,       // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Custom hooks for data fetching
export const usePrompts = (filters?: PromptFilters) => {
  return useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => promptService.getPrompts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for frequently updated data
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promptService.createPrompt,
    onSuccess: (newPrompt) => {
      // Optimistic updates
      queryClient.setQueryData(['prompts'], (old: Prompt[]) =>
        old ? [...old, newPrompt] : [newPrompt]
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'prompts'] });
    },
    onError: (error) => {
      toast.error(`Failed to create prompt: ${error.message}`);
    },
  });
};
```

#### 2. **Global UI State (React Context)**

```tsx
// Authentication Context
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    loading,
    signup: (email: string, password: string) =>
      createUserWithEmailAndPassword(auth, email, password),
    login: (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => signInWithPopup(auth, googleProvider),
    logout: () => signOut(auth)
  }), [currentUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### State Management Best Practices

1. **Server State vs Client State Separation**
   - Use React Query for all server-related state
   - Use React Context only for global UI state
   - Keep component state local when possible

2. **Optimistic Updates**
   - Implement optimistic updates for better UX
   - Always handle rollback scenarios
   - Show loading states during mutations

3. **Cache Management**
   - Configure appropriate stale times based on data volatility
   - Use query invalidation strategically
   - Implement background refetching for critical data

4. **Error Handling**
   - Global error boundaries for React errors
   - Query error handling with user-friendly messages
   - Retry mechanisms with exponential backoff

---

## 🔥 Firebase Integration Patterns

### Firestore Data Architecture

**Collection Structure** following best practices for scalability:

```
/users/{userId}                    # User profiles and settings
/workspaces/{workspaceId}          # Workspace metadata
/workspaces/{workspaceId}/prompts/{promptId}    # Workspace prompts
/workspaces/{workspaceId}/documents/{docId}     # Workspace documents
/workspaces/{workspaceId}/executions/{execId}   # Execution history
/workspaces/{workspaceId}/members/{userId}      # Workspace members
/analytics/{date}/metrics/{metricId}            # Time-series analytics
/system/config                     # System configuration
```

### Real-time Data Patterns

#### 1. **Real-time Subscriptions**
```tsx
// Custom hook for real-time prompt updates
export const useRealtimePrompts = (workspaceId: string) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    const q = query(
      collection(db, `workspaces/${workspaceId}/prompts`),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prompt[];

      setPrompts(promptsData);
      setLoading(false);
    }, (error) => {
      console.error('Real-time subscription error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [workspaceId]);

  return { prompts, loading };
};
```

#### 2. **Optimistic Updates with Rollback**
```tsx
// Optimistic update pattern
export const useOptimisticPromptUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ promptId, updates }: { promptId: string; updates: Partial<Prompt> }) => {
      // Optimistic update
      const previousPrompts = queryClient.getQueryData(['prompts']);

      queryClient.setQueryData(['prompts'], (old: Prompt[]) =>
        old?.map(prompt =>
          prompt.id === promptId
            ? { ...prompt, ...updates, updatedAt: new Date() }
            : prompt
        )
      );

      try {
        // Actual update
        const result = await promptService.updatePrompt(promptId, updates);
        return result;
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(['prompts'], previousPrompts);
        throw error;
      }
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });
};
```

### Firebase Security Rules

**Comprehensive security rules** for multi-tenant architecture:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Workspace access control
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));

      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role in ['admin', 'owner'];

      // Workspace prompts
      match /prompts/{promptId} {
        allow read: if request.auth != null &&
          exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));

        allow create, update: if request.auth != null &&
          exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)) &&
          request.auth.uid == resource.data.createdBy;

        allow delete: if request.auth != null &&
          (request.auth.uid == resource.data.createdBy ||
           get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role in ['admin', 'owner']);
      }

      // Workspace members
      match /members/{userId} {
        allow read: if request.auth != null &&
          exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));

        allow write: if request.auth != null &&
          get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role in ['admin', 'owner'];
      }
    }

    // Analytics (read-only for members, write for system)
    match /analytics/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only system functions can write
    }
  }
}
```

### Firebase Storage Patterns

**Secure file upload** with proper access control:

```tsx
// Secure file upload service
export class SecureFileUploadService {
  private storage = getStorage();

  async uploadDocument(
    file: File,
    workspaceId: string,
    userId: string
  ): Promise<{ url: string; path: string }> {
    // Generate secure file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `workspaces/${workspaceId}/documents/${userId}/${fileName}`;

    // Create storage reference
    const storageRef = ref(this.storage, filePath);

    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        workspaceId: workspaceId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    };

    try {
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, metadata);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create Firestore document
      await addDoc(collection(db, `workspaces/${workspaceId}/documents`), {
        name: file.name,
        type: file.type,
        size: file.size,
        storagePath: filePath,
        downloadURL,
        uploadedBy: userId,
        uploadedAt: serverTimestamp(),
        status: 'uploaded',
      });

      return {
        url: downloadURL,
        path: filePath,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async deleteDocument(filePath: string, workspaceId: string, userId: string): Promise<void> {
    try {
      // Delete from storage
      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);

      // Update Firestore document
      const documentsRef = collection(db, `workspaces/${workspaceId}/documents`);
      const q = query(documentsRef, where('storagePath', '==', filePath));
      const snapshot = await getDocs(q);

      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          status: 'deleted',
          deletedBy: userId,
          deletedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}
```

---

## ⚡ Performance Optimization

### Frontend Performance Strategies

#### 1. **Code Splitting & Bundle Optimization**

**Vite Configuration** for optimal bundling:

```typescript
// vite.config.ts - Performance optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],

          // Feature chunks
          'analytics': ['recharts', 'src/components/analytics'],
          'documents': ['src/components/documents', 'src/services/documentService'],
          'prompts': ['src/components/prompts', 'src/services/promptService'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Inline small assets
    assetsInlineLimit: 4096,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
    exclude: [
      // Large libraries loaded on demand
      '@heroicons/react/24/outline',
      'recharts',
    ],
  },
});
```

#### 2. **React Performance Patterns**

**Memoization and optimization strategies**:

```tsx
// Performance-optimized component patterns
import { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// 1. Memoized components
const PromptCard = memo<PromptCardProps>(({ prompt, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => onEdit(prompt.id), [prompt.id, onEdit]);
  const handleDelete = useCallback(() => onDelete(prompt.id), [prompt.id, onDelete]);

  const formattedDate = useMemo(() =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(prompt.updatedAt))
  , [prompt.updatedAt]);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle>{prompt.title}</CardTitle>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">
          {prompt.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
});

// 2. Virtualized lists for large datasets
import { FixedSizeList as List } from 'react-window';

const VirtualizedPromptList = ({ prompts }: { prompts: Prompt[] }) => {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <PromptCard
        prompt={prompts[index]}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  ), [prompts]);

  return (
    <List
      height={600}
      itemCount={prompts.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};

// 3. Lazy loading with error boundaries
const LazyAnalytics = lazy(() =>
  import('./Analytics').catch(() => ({ default: () => <div>Failed to load analytics</div> }))
);

const AnalyticsPage = () => (
  <ErrorBoundary fallback={<div>Something went wrong</div>}>
    <Suspense fallback={<AnalyticsLoadingSkeleton />}>
      <LazyAnalytics />
    </Suspense>
  </ErrorBoundary>
);
```

#### 3. **Caching Strategies**

**Multi-layer caching** for optimal performance:

```tsx
// Memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Service worker caching for static assets
const CACHE_NAME = 'prompt-library-v1';
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

### Backend Performance Optimization

#### 1. **Firebase Function Optimization**

```python
# Optimized Cloud Function with caching
import functools
from google.cloud import firestore
from firebase_functions import https_fn
import redis

# Redis cache for expensive operations
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cache_result(ttl=300):
    """Decorator for caching function results"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try to get from cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)

            # Execute function and cache result
            result = func(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator

@https_fn.on_request()
@cache_result(ttl=600)  # Cache for 10 minutes
def get_analytics_data(req):
    """Optimized analytics endpoint with caching"""
    try:
        workspace_id = req.args.get('workspace_id')
        date_range = req.args.get('date_range', '7d')

        # Batch Firestore queries for efficiency
        db = firestore.Client()
        batch_queries = []

        # Query prompts count
        prompts_query = db.collection(f'workspaces/{workspace_id}/prompts').count()
        batch_queries.append(('prompts_count', prompts_query))

        # Query executions count
        executions_query = db.collection(f'workspaces/{workspace_id}/executions').count()
        batch_queries.append(('executions_count', executions_query))

        # Execute batch queries
        results = {}
        for name, query in batch_queries:
            results[name] = query.get()[0][0].value

        return {
            'success': True,
            'data': results,
            'cached_at': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return {'error': 'Internal server error'}, 500
```

---

## 🔒 Security Implementation

### Authentication & Authorization

#### 1. **Firebase Auth Integration**

```tsx
// Secure authentication service
export class AuthService {
  private auth = getAuth();

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    try {
      const result = await signInWithPopup(this.auth, provider);

      // Create user profile if first time
      await this.createUserProfile(result.user);

      // Log security event
      await this.logSecurityEvent('google_signin', result.user.uid);

      return result;
    } catch (error) {
      await this.logSecurityEvent('signin_failed', null, error.message);
      throw error;
    }
  }

  private async createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        securitySettings: {
          mfaEnabled: false,
          loginNotifications: true,
          sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        },
      });
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
    }
  }

  private async logSecurityEvent(
    event: string,
    userId: string | null,
    details?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'security_logs'), {
        event,
        userId,
        details,
        timestamp: serverTimestamp(),
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
```

#### 2. **API Security Middleware**

```python
# Secure API middleware for Cloud Functions
import jwt
from functools import wraps
from firebase_admin import auth
import logging

def require_auth(f):
    """Decorator to require Firebase authentication"""
    @wraps(f)
    def decorated_function(request):
        try:
            # Get authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return {'error': 'Missing or invalid authorization header'}, 401

            # Extract token
            token = auth_header.split('Bearer ')[1]

            # Verify Firebase token
            decoded_token = auth.verify_id_token(token)
            user_id = decoded_token['uid']

            # Add user info to request
            request.user = {
                'uid': user_id,
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False)
            }

            # Log access
            logging.info(f"Authenticated request from user: {user_id}")

            return f(request)

        except auth.InvalidIdTokenError:
            logging.warning(f"Invalid token attempt from IP: {request.remote_addr}")
            return {'error': 'Invalid authentication token'}, 401
        except Exception as e:
            logging.error(f"Authentication error: {e}")
            return {'error': 'Authentication failed'}, 500

    return decorated_function

def require_workspace_access(workspace_id_param='workspace_id'):
    """Decorator to require workspace access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(request):
            try:
                workspace_id = request.args.get(workspace_id_param) or request.json.get(workspace_id_param)
                if not workspace_id:
                    return {'error': 'Workspace ID required'}, 400

                # Check workspace membership
                db = firestore.Client()
                member_ref = db.collection(f'workspaces/{workspace_id}/members').document(request.user['uid'])
                member_doc = member_ref.get()

                if not member_doc.exists:
                    logging.warning(f"Unauthorized workspace access attempt: {request.user['uid']} -> {workspace_id}")
                    return {'error': 'Access denied'}, 403

                # Add workspace info to request
                request.workspace = {
                    'id': workspace_id,
                    'role': member_doc.to_dict().get('role', 'member')
                }

                return f(request)

            except Exception as e:
                logging.error(f"Workspace access check error: {e}")
                return {'error': 'Access verification failed'}, 500

        return decorated_function
    return decorator
```

#### 3. **Content Security Policy**

```javascript
// firebase.json - Security headers
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://apis.google.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss: https://*.googleapis.com https://*.firebase.com https://*.firebaseapp.com https://*.cloudfunctions.net; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  }
}
```

### Data Protection & Privacy

#### 1. **Input Validation & Sanitization**

```typescript
// Comprehensive input validation
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schema definitions
const PromptSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().default(false),
  category: z.enum(['general', 'coding', 'writing', 'analysis', 'creative']),
});

export class InputValidator {
  static validatePrompt(data: unknown): z.infer<typeof PromptSchema> {
    try {
      // Parse and validate
      const validated = PromptSchema.parse(data);

      // Sanitize HTML content
      validated.content = DOMPurify.sanitize(validated.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
      });

      if (validated.description) {
        validated.description = DOMPurify.sanitize(validated.description, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });
      }

      return validated;
    } catch (error) {
      throw new ValidationError(`Invalid prompt data: ${error.message}`);
    }
  }

  static sanitizeUserInput(input: string): string {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
}
```

---

## 🚀 Build & Deployment Architecture

### CI/CD Pipeline

**GitHub Actions** workflow for automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm run test:ci

      - name: Run linting
        run: |
          cd frontend
          npm run lint

      - name: Type checking
        run: |
          cd frontend
          npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build application
        run: |
          cd frontend
          npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: '${{ secrets.FIREBASE_PROJECT_ID }}'
          channelId: live
```

### Environment Configuration

**Multi-environment setup** with proper secret management:

```typescript
// Environment configuration
interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    analytics: boolean;
    debugging: boolean;
    performanceMonitoring: boolean;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    },
    api: {
      baseUrl: 'http://localhost:5001',
      timeout: 10000,
    },
    features: {
      analytics: false,
      debugging: true,
      performanceMonitoring: true,
    },
  },
  production: {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    },
    api: {
      baseUrl: 'https://australia-southeast1-rag-prompt-library.cloudfunctions.net',
      timeout: 30000,
    },
    features: {
      analytics: true,
      debugging: false,
      performanceMonitoring: true,
    },
  },
};

export const config = environments[import.meta.env.MODE] || environments.development;
```

---

## 📚 Architecture Decision Records

### ADR-001: Frontend Framework Selection

**Status:** Accepted
**Date:** 2024-12-15

**Context:** Need to choose a frontend framework for the prompt library application.

**Decision:** Use React 18.3.1 with TypeScript and Vite.

**Rationale:**
- React provides excellent ecosystem and community support
- TypeScript ensures type safety and better developer experience
- Vite offers fast development and optimized builds
- Strong integration with Firebase SDK

**Consequences:**
- Positive: Fast development, excellent tooling, large talent pool
- Negative: Bundle size considerations, learning curve for new developers

### ADR-002: State Management Strategy

**Status:** Accepted
**Date:** 2024-12-20

**Context:** Need to manage both server state and client state effectively.

**Decision:** Use TanStack React Query for server state and React Context for global UI state.

**Rationale:**
- React Query excels at server state management with caching and synchronization
- React Context is sufficient for global UI state without additional complexity
- Avoids over-engineering with Redux for this use case

**Consequences:**
- Positive: Optimal performance, clear separation of concerns
- Negative: Two different state management patterns to learn

### ADR-003: Backend Architecture

**Status:** Accepted
**Date:** 2025-01-10

**Context:** Need scalable backend architecture for AI processing and data management.

**Decision:** Use Firebase Cloud Functions with hybrid Node.js/Python approach.

**Rationale:**
- Firebase provides seamless integration with frontend
- Node.js for API endpoints and Firebase integrations
- Python for AI/ML processing and RAG pipeline
- Serverless scaling and cost efficiency

**Consequences:**
- Positive: Scalable, cost-effective, integrated ecosystem
- Negative: Vendor lock-in, cold start latency

---

*This Architecture Guide provides comprehensive documentation for the React Prompt Library system. For specific implementation details, refer to the individual component documentation and API references.*
```
