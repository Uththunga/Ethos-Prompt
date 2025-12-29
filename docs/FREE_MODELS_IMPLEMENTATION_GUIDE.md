# Free Models Implementation Guide

## RAG Prompt Library - Zero-Cost AI Integration

**Date**: January 2025
**Status**: Implementation Ready
**Objective**: Complete guide for implementing free-model-first approach

---

## Overview

This guide provides step-by-step instructions for implementing the free-model-first approach in the RAG Prompt Library. The implementation ensures that the application uses **only free models by default**, with zero cost to the application and users.

---

## Implementation Phases

### ✅ Phase 1: Research & Configuration (COMPLETE)

**Completed Tasks**:

- [x] Research available free models on OpenRouter.ai
- [x] Create comprehensive free models configuration
- [x] Document model specifications and capabilities

**Deliverables**:

- `docs/FREE_MODELS_RESEARCH.md` - Comprehensive research document
- `functions/src/llm/free_models_config.py` - Free models configuration module

**Key Findings**:

- **10 free models** identified and configured
- **5 primary models** recommended for default use
- **Default model**: `x-ai/grok-4-fast:free` (2M context, fast, versatile)

---

### 🔄 Phase 2: Backend Integration (IN PROGRESS)

#### Task 0.5: Update Model Config for Free-First Approach

**File**: `functions/src/llm/model_config.py`

**Changes Required**:

1. Import free models configuration
2. Add `is_free` flag to all model definitions
3. Separate free models from paid models
4. Update model selection logic to prioritize free models
5. Add validation for paid model access (requires custom API key)

**Implementation**:

```python
# functions/src/llm/model_config.py

from .free_models_config import (
    ALL_FREE_MODELS,
    FREE_MODELS_BY_ID,
    get_default_model,
    get_model_by_id as get_free_model_by_id,
    get_model_metadata
)

# Separate free and paid models
FREE_MODEL_IDS = [model.model_id for model in ALL_FREE_MODELS]

# Paid models (require custom API key)
PAID_MODELS = {
    "openai/gpt-4-turbo": {
        "display_name": "GPT-4 Turbo",
        "provider": "OpenAI",
        "is_free": False,
        "requires_custom_key": True,
        "cost_per_million": {"input": 10.0, "output": 30.0}
    },
    "anthropic/claude-3.5-sonnet": {
        "display_name": "Claude 3.5 Sonnet",
        "provider": "Anthropic",
        "is_free": False,
        "requires_custom_key": True,
        "cost_per_million": {"input": 3.0, "output": 15.0}
    },
    # Add more paid models as needed
}

def get_model_config(model_id: str, user_has_custom_key: bool = False):
    """Get model configuration with access validation"""

    # Check if it's a free model
    if model_id in FREE_MODEL_IDS:
        return get_model_metadata(model_id)

    # Check if it's a paid model
    if model_id in PAID_MODELS:
        if not user_has_custom_key:
            raise ValueError(f"Model {model_id} requires a custom API key")
        return PAID_MODELS[model_id]

    raise ValueError(f"Unknown model: {model_id}")

def get_default_model_id() -> str:
    """Get default model ID"""
    return get_default_model().model_id
```

---

#### Task 0.6: Implement Custom API Key Support

**File**: `functions/src/llm/openrouter_client.py`

**Changes Required**:

1. Add support for user-provided API keys
2. Store user API keys securely in Firestore (encrypted)
3. Validate API keys before use
4. Use application API key for free models, user API key for paid models

**Implementation**:

```python
# functions/src/llm/openrouter_client.py

import os
from typing import Optional
from firebase_admin import firestore
from cryptography.fernet import Fernet

# Application API key (for free models only)
APP_OPENROUTER_KEY = os.environ.get('OPENROUTER_API_KEY', '')

# Encryption key for user API keys
ENCRYPTION_KEY = os.environ.get('API_KEY_ENCRYPTION_KEY', Fernet.generate_key())
cipher = Fernet(ENCRYPTION_KEY)

class OpenRouterClient:
    def __init__(self, user_id: Optional[str] = None):
        self.user_id = user_id
        self.db = firestore.client()

    async def get_api_key(self, model_id: str) -> str:
        """Get appropriate API key for model"""
        from .free_models_config import FREE_MODEL_IDS

        # Free models use application API key
        if model_id in FREE_MODEL_IDS:
            return APP_OPENROUTER_KEY

        # Paid models require user's custom API key
        if not self.user_id:
            raise ValueError("User authentication required for paid models")

        user_key = await self._get_user_api_key()
        if not user_key:
            raise ValueError("Custom API key required for paid models")

        return user_key

    async def _get_user_api_key(self) -> Optional[str]:
        """Retrieve and decrypt user's API key from Firestore"""
        doc = self.db.collection('users').document(self.user_id).get()
        if not doc.exists:
            return None

        data = doc.to_dict()
        encrypted_key = data.get('encrypted_openrouter_key')
        if not encrypted_key:
            return None

        # Decrypt API key
        decrypted_key = cipher.decrypt(encrypted_key.encode()).decode()
        return decrypted_key

    async def save_user_api_key(self, api_key: str) -> bool:
        """Encrypt and save user's API key"""
        if not self.user_id:
            raise ValueError("User authentication required")

        # Validate API key first
        is_valid = await self.validate_api_key(api_key)
        if not is_valid:
            raise ValueError("Invalid API key")

        # Encrypt API key
        encrypted_key = cipher.encrypt(api_key.encode()).decode()

        # Save to Firestore
        self.db.collection('users').document(self.user_id).set({
            'encrypted_openrouter_key': encrypted_key,
            'has_custom_api_key': True,
            'updated_at': firestore.SERVER_TIMESTAMP
        }, merge=True)

        return True

    async def validate_api_key(self, api_key: str) -> bool:
        """Validate API key by making a test request"""
        try:
            response = await self._make_request(
                api_key=api_key,
                model="openai/gpt-3.5-turbo",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5
            )
            return response.status_code == 200
        except Exception:
            return False

    async def execute_prompt(
        self,
        model_id: str,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False
    ):
        """Execute prompt with appropriate API key"""
        api_key = await self.get_api_key(model_id)

        return await self._make_request(
            api_key=api_key,
            model=model_id,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )
```

**New Cloud Function** - `functions/src/api/api_key_endpoints.py`:

```python
# functions/src/api/api_key_endpoints.py

from firebase_functions import https_fn
from firebase_admin import auth
from ..llm.openrouter_client import OpenRouterClient

@https_fn.on_call()
async def save_custom_api_key(req: https_fn.CallableRequest):
    """Save user's custom OpenRouter API key"""

    # Authenticate user
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    user_id = req.auth.uid
    api_key = req.data.get('api_key')

    if not api_key:
        raise https_fn.HttpsError('invalid-argument', 'API key is required')

    try:
        client = OpenRouterClient(user_id=user_id)
        success = await client.save_user_api_key(api_key)

        return {'success': success, 'message': 'API key saved successfully'}
    except ValueError as e:
        raise https_fn.HttpsError('invalid-argument', str(e))
    except Exception as e:
        raise https_fn.HttpsError('internal', f'Failed to save API key: {str(e)}')

@https_fn.on_call()
async def validate_custom_api_key(req: https_fn.CallableRequest):
    """Validate user's custom OpenRouter API key"""

    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    api_key = req.data.get('api_key')

    if not api_key:
        raise https_fn.HttpsError('invalid-argument', 'API key is required')

    try:
        client = OpenRouterClient()
        is_valid = await client.validate_api_key(api_key)

        return {'valid': is_valid}
    except Exception as e:
        raise https_fn.HttpsError('internal', f'Validation failed: {str(e)}')

@https_fn.on_call()
async def remove_custom_api_key(req: https_fn.CallableRequest):
    """Remove user's custom OpenRouter API key"""

    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    user_id = req.auth.uid

    try:
        from firebase_admin import firestore
        db = firestore.client()

        db.collection('users').document(user_id).update({
            'encrypted_openrouter_key': firestore.DELETE_FIELD,
            'has_custom_api_key': False,
            'updated_at': firestore.SERVER_TIMESTAMP
        })

        return {'success': True, 'message': 'API key removed successfully'}
    except Exception as e:
        raise https_fn.HttpsError('internal', f'Failed to remove API key: {str(e)}')
```

---

### 🎨 Phase 3: Frontend Integration (PENDING)

#### Task 0.7: Update Frontend Model Selector

**File**: `frontend/src/components/execution/ModelSelector.tsx`

**Changes Required**:

1. Fetch free models from backend
2. Display "FREE" badge for free models
3. Show "Custom API Key Required" for paid models
4. Implement API key input dialog
5. Group models by tier (Primary, Secondary, Experimental)

**Implementation**:

```typescript
// frontend/src/components/execution/ModelSelector.tsx

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getFreeModels, saveCustomApiKey } from '@/services/api';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedPaidModel, setSelectedPaidModel] = useState<string | null>(null);

  // Fetch free models
  const { data: models, isLoading } = useQuery({
    queryKey: ['free-models'],
    queryFn: getFreeModels,
  });

  const handleModelSelect = (modelId: string, isFree: boolean) => {
    if (isFree) {
      onChange(modelId);
    } else {
      // Paid model - show API key dialog
      setSelectedPaidModel(modelId);
      setShowApiKeyDialog(true);
    }
  };

  if (isLoading) return <div>Loading models...</div>;

  return (
    <div className="space-y-4">
      {/* Primary Models */}
      <div>
        <h3 className="text-sm font-medium mb-2">Recommended (Free)</h3>
        <div className="grid grid-cols-1 gap-2">
          {models?.primary.map((model) => (
            <ModelCard
              key={model.model_id}
              model={model}
              isSelected={value === model.model_id}
              onSelect={() => handleModelSelect(model.model_id, true)}
            />
          ))}
        </div>
      </div>

      {/* Secondary Models */}
      <div>
        <h3 className="text-sm font-medium mb-2">Alternative (Free)</h3>
        <div className="grid grid-cols-1 gap-2">
          {models?.secondary.map((model) => (
            <ModelCard
              key={model.model_id}
              model={model}
              isSelected={value === model.model_id}
              onSelect={() => handleModelSelect(model.model_id, true)}
            />
          ))}
        </div>
      </div>

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        modelId={selectedPaidModel}
        onSuccess={(modelId) => {
          onChange(modelId);
          setShowApiKeyDialog(false);
        }}
      />
    </div>
  );
}

function ModelCard({ model, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`p-3 border rounded-lg text-left transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{model.display_name}</span>
            {model.is_free && (
              <Badge variant="success" className="text-xs">
                FREE
              </Badge>
            )}
            {model.is_default && (
              <Badge variant="default" className="text-xs">
                DEFAULT
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{model.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{model.context_length.toLocaleString()} tokens</span>
            {model.performance?.avg_latency_ms && (
              <span>~{model.performance.avg_latency_ms}ms</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
```

---

## Testing Strategy

### Unit Tests

**Test File**: `functions/tests/test_free_models_config.py`

```python
import pytest
from src.llm.free_models_config import (
    get_default_model,
    get_model_by_id,
    get_models_by_capability,
    ModelCapability
)

def test_default_model():
    model = get_default_model()
    assert model.is_default is True
    assert model.model_id == "x-ai/grok-4-fast:free"

def test_get_model_by_id():
    model = get_model_by_id("deepseek/deepseek-v3:free")
    assert model is not None
    assert model.provider == "DeepSeek"

def test_get_code_models():
    models = get_models_by_capability(ModelCapability.CODE)
    assert len(models) > 0
    assert any(m.model_id == "qwen/qwen3-coder-480b-a35b-instruct:free" for m in models)
```

---

## Deployment Checklist

- [ ] Set environment variables in Firebase:

  ```bash
  firebase functions:config:set openrouter.api_key="YOUR_APP_KEY"
  firebase functions:config:set encryption.key="YOUR_ENCRYPTION_KEY"
  ```

- [ ] Deploy backend functions:

  ```bash
  firebase deploy --only functions
  ```

- [ ] Deploy frontend:

  ```bash
  cd frontend && npm run build
  firebase deploy --only hosting
  ```

- [ ] Test free model execution
- [ ] Test custom API key flow
- [ ] Verify cost tracking shows $0.00

---

## Next Steps

1. Complete Task 0.5: Update Model Config
2. Complete Task 0.6: Implement Custom API Key Support
3. Complete Task 0.7: Update Frontend Model Selector
4. Complete Task 0.8: Update Cost Tracking
5. Complete Task 0.9: Create User Documentation
6. Complete Task 0.10: Integration Testing

---

**Document Version**: 1.0
**Last Updated**: January 2025
