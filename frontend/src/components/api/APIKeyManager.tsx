import React, { useState, useEffect } from 'react';
import {
    KeyIcon,
    PlusIcon,
    ClipboardIcon,
    TrashIcon,
    CheckIcon,
    ExclamationTriangleIcon,
} from '@/components/icons';
import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';

interface APIKey {
  id: string;
  name: string;
  key?: string;
  tier: string;
  status: string;
  created_at: string | Date;
  last_used: string | Date | null;
  expires_at: string | Date | null;
  permissions: string[];
  usage_stats: {
    total_requests: number;
    requests_today: number;
  };
}

interface FirebaseResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

interface GetAPIKeysResponse extends FirebaseResponse {
  api_keys: APIKey[];
}

interface CreateAPIKeyResponse extends FirebaseResponse {
  api_key: APIKey;
}

const APIKeyManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    tier: 'free',
    expires_in_days: '',
    permissions: ['read', 'write'],
  });

  useEffect(() => {
    if (currentUser) {
      loadAPIKeys();
    }
  }, [currentUser]);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const getUserAPIKeys = httpsCallable(functions, 'get_user_api_keys');
      const result = await getUserAPIKeys();
      const data = result.data as GetAPIKeysResponse;

      if (data.success) {
        setApiKeys(data.api_keys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async () => {
    if (!createForm.name.trim()) return;

    try {
      setCreating(true);
      const generateAPIKey = httpsCallable(functions, 'generate_api_key');

      const requestData: {
        name: string;
        tier: string;
        permissions: string[];
      } = {
        name: createForm.name,
        tier: createForm.tier,
        permissions: createForm.permissions,
      };

      if (createForm.expires_in_days) {
        requestData.expires_in_days = parseInt(createForm.expires_in_days);
      }

      const result = await generateAPIKey(requestData);
      const data = result.data as CreateAPIKeyResponse;

      if (data.success) {
        setNewKeyData(data.api_key);
        setCreateForm({
          name: '',
          tier: 'free',
          expires_in_days: '',
          permissions: ['read', 'write'],
        });
        setShowCreateForm(false);
        loadAPIKeys(); // Reload the list
      } else {
        throw new Error(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const revokeAPIKey = httpsCallable(functions, 'revoke_api_key');
      const result = await revokeAPIKey({ key_id: keyId });
      const data = result.data as FirebaseResponse;

      if (data.success) {
        loadAPIKeys(); // Reload the list
      } else {
        throw new Error(data.error || 'Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key. Please try again.');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(keyId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatDate = (timestamp: string | Date | { toDate: () => Date } | null) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getTierColor = (tier: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-ethos-purple-light text-white',
      enterprise: 'bg-ethos-purple text-white',
    };
    return colors[tier as keyof typeof colors] || colors.free;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      revoked: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-500">
            Manage your API keys for programmatic access to the RAG Prompt Library
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="ethos"
          size="default"
          className="inline-flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* New API Key Display */}
      {newKeyData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">API Key Created Successfully</h3>
              <div className="mt-2">
                <p className="text-sm text-green-700 mb-2">
                  Please copy your API key now. You won't be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-gray-900 break-all">
                    {newKeyData}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyData, 'new-key')}
                    className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {copied === 'new-key' ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewKeyData(null)}
                className="mt-3 text-sm text-green-600 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New API Key</h3>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="key-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="e.g., Production API, Mobile App"
              />
            </div>

            <div>
              <label htmlFor="key-tier" className="block text-sm font-medium text-gray-700">
                Tier
              </label>
              <select
                id="key-tier"
                value={createForm.tier}
                onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
              >
                <option value="free">Free (60 req/min)</option>
                <option value="pro">Pro (300 req/min)</option>
                <option value="enterprise">Enterprise (1000 req/min)</option>
              </select>
            </div>

            <div>
              <label htmlFor="expires-in" className="block text-sm font-medium text-gray-700">
                Expires in (days, optional)
              </label>
              <input
                type="number"
                id="expires-in"
                value={createForm.expires_in_days}
                onChange={(e) => setCreateForm({ ...createForm, expires_in_days: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="Leave empty for no expiration"
                min="1"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="flex flex-col gap-2">
                {['read', 'write', 'delete'].map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCreateForm({
                            ...createForm,
                            permissions: [...createForm.permissions, permission],
                          });
                        } else {
                          setCreateForm({
                            ...createForm,
                            permissions: createForm.permissions.filter((p) => p !== permission),
                          });
                        }
                      }}
                      className="h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
              variant="outline"
              size="default"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAPIKey}
              disabled={!createForm.name.trim() || creating}
              variant="ethos"
              size="default"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Creating...
                </>
              ) : (
                'Create API Key'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethos-purple mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center">
            <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first API key to get started with programmatic access.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-medium text-gray-900">{apiKey.name}</h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                          apiKey.tier
                        )}`}
                      >
                        {apiKey.tier}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          apiKey.status
                        )}`}
                      >
                        {apiKey.status}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDate(apiKey.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Last used:</span>{' '}
                        {formatDate(apiKey.last_used)}
                      </div>
                      <div>
                        <span className="font-medium">Requests:</span>{' '}
                        {apiKey.usage_stats?.total_requests || 0} total
                      </div>
                    </div>

                    {apiKey.expires_at && (
                      <div className="mt-1 text-sm text-yellow-600">
                        <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                        Expires: {formatDate(apiKey.expires_at)}
                      </div>
                    )}

                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Permissions: </span>
                      <span className="text-sm text-gray-700">
                        {apiKey.permissions?.join(', ') || 'read, write'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {apiKey.status === 'active' && (
                      <button
                        onClick={() => handleRevokeAPIKey(apiKey.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeyManager;
