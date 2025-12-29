import {
    BoltIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    PlusIcon,
    TrashIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  workspace_id?: string;
  is_active: boolean;
  created_at: Date | { toDate?: () => Date } | number | string;
  updated_at: Date | { toDate?: () => Date } | number | string;
  delivery_stats: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    last_delivery: Date | { toDate?: () => Date } | number | string;
  };
}

const WebhookManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    url: '',
    events: [] as string[],
    workspace_id: '',
    secret: ''
  });

  const availableEvents = [
    { id: 'prompt.executed', name: 'Prompt Executed', description: 'When a prompt is executed' },
    { id: 'prompt.created', name: 'Prompt Created', description: 'When a new prompt is created' },
    { id: 'prompt.updated', name: 'Prompt Updated', description: 'When a prompt is modified' },
    { id: 'prompt.shared', name: 'Prompt Shared', description: 'When a prompt is shared' },
    { id: 'document.uploaded', name: 'Document Uploaded', description: 'When a document is uploaded' },
    { id: 'document.processed', name: 'Document Processed', description: 'When document processing completes' },
    { id: 'workspace.member_added', name: 'Member Added', description: 'When a member joins a workspace' },
    { id: 'workspace.member_removed', name: 'Member Removed', description: 'When a member leaves a workspace' },
    { id: 'comment.added', name: 'Comment Added', description: 'When a comment is added to a prompt' }
  ];

  useEffect(() => {
    if (currentUser) {
      loadWebhooks();
    }
  }, [currentUser]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const getUserWebhooks = httpsCallable(functions, 'get_user_webhooks');
      const result = await getUserWebhooks();
      const data = result.data as unknown as { success?: boolean; webhooks?: Webhook[]; error?: string; secret?: string };

      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!createForm.url.trim() || createForm.events.length === 0) return;

    try {
      setCreating(true);
      const registerWebhook = httpsCallable(functions, 'register_webhook');

      const requestData: { url: string; events: string[]; workspace_id?: string; secret?: string } = {
        url: createForm.url,
        events: createForm.events
      };

      if (createForm.workspace_id) {
        requestData.workspace_id = createForm.workspace_id;
      }

      if (createForm.secret) {
        requestData.secret = createForm.secret;
      }

      const result = await registerWebhook(requestData);
      const data = result.data as unknown as { success?: boolean; webhooks?: Webhook[]; error?: string; secret?: string };

      if (data.success) {
        setCreateForm({
          url: '',
          events: [],
          workspace_id: '',
          secret: ''
        });
        setShowCreateForm(false);
        loadWebhooks(); // Reload the list

        // Show success message with secret
        if (data.secret) {
          alert(`Webhook created successfully!\n\nWebhook Secret: ${data.secret}\n\nPlease save this secret - you won't be able to see it again!`);
        }
      } else {
        throw new Error(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    try {
      const deleteWebhook = httpsCallable(functions, 'delete_webhook');
      const result = await deleteWebhook({ webhook_id: webhookId });
      const data = result.data as unknown as { success?: boolean; error?: string };

      if (data.success) {
        loadWebhooks(); // Reload the list
      } else {
        throw new Error(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Failed to delete webhook. Please try again.');
    }
  };

  const handleEventToggle = (eventId: string) => {
    if (createForm.events.includes(eventId)) {
      setCreateForm({
        ...createForm,
        events: createForm.events.filter(e => e !== eventId)
      });
    } else {
      setCreateForm({
        ...createForm,
        events: [...createForm.events, eventId]
      });
    }
  };

  const formatDate = (timestamp: Date | { toDate?: () => Date } | number | string) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (webhook: Webhook) => {
    if (!webhook.is_active) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }

    const stats = webhook.delivery_stats;
    if (stats.total_deliveries === 0) {
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }

    const successRate = stats.successful_deliveries / stats.total_deliveries;
    if (successRate >= 0.95) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (successRate >= 0.8) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getSuccessRate = (webhook: Webhook) => {
    const stats = webhook.delivery_stats;
    if (stats.total_deliveries === 0) return 'No deliveries';

    const rate = (stats.successful_deliveries / stats.total_deliveries * 100).toFixed(1);
    return `${rate}% success rate`;
  };

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
          <p className="text-sm text-gray-500">
            Receive real-time notifications about events in your RAG Prompt Library
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Webhook
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Webhook</h3>

          <div >
            <div>
              <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700">
                Webhook URL *
              </label>
              <input
                type="url"
                id="webhook-url"
                value={createForm.url}
                onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://your-app.com/webhooks/rag-prompt-library"
              />
              <p className="mt-1 text-xs text-gray-500">
                The URL where webhook events will be sent
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Events to Subscribe *
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {availableEvents.map((event) => (
                  <label key={event.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={createForm.events.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      <div className="text-xs text-gray-500">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select the events you want to receive notifications for
              </p>
            </div>

            <div>
              <label htmlFor="webhook-secret" className="block text-sm font-medium text-gray-700">
                Webhook Secret (Optional)
              </label>
              <input
                type="text"
                id="webhook-secret"
                value={createForm.secret}
                onChange={(e) => setCreateForm({ ...createForm, secret: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty to auto-generate"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used to verify webhook authenticity. If empty, one will be generated for you.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWebhook}
              disabled={!createForm.url.trim() || createForm.events.length === 0 || creating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Creating...
                </>
              ) : (
                'Create Webhook'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Webhooks</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-6 text-center">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No webhooks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first webhook to receive real-time notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(webhook)}
                      <div>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 break-all">
                            {webhook.url}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {webhook.is_active ? 'Active' : 'Inactive'} • {getSuccessRate(webhook)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Events:</span> {webhook.events.join(', ')}
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(webhook.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Last delivery:</span> {formatDate(webhook.delivery_stats.last_delivery)}
                        </div>
                        <div>
                          <span className="font-medium">Total deliveries:</span> {webhook.delivery_stats.total_deliveries}
                        </div>
                      </div>

                      {webhook.delivery_stats.total_deliveries > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Success rate:</span> {' '}
                          {webhook.delivery_stats.successful_deliveries}/{webhook.delivery_stats.total_deliveries} deliveries
                          {webhook.delivery_stats.failed_deliveries > 0 && (
                            <span className="text-red-600 ml-2">
                              ({webhook.delivery_stats.failed_deliveries} failed)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Webhook Documentation</h4>
        <div className="text-sm text-blue-800">
          <p>• Webhooks are sent as POST requests with JSON payload</p>
          <p>• Each request includes an X-Webhook-Signature header for verification</p>
          <p>• Your endpoint should respond with 2xx status code for successful delivery</p>
          <p>• Failed deliveries are retried up to 5 times with exponential backoff</p>
          <p>• Test deliveries are sent when you create a new webhook</p>
        </div>
      </div>
    </div>
  );
};

export default WebhookManager;
