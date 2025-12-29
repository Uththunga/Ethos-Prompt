import React, { useState } from 'react';
import {
  ShareIcon,
  XMarkIcon,
  LinkIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { Button } from '../marketing/ui/button';

interface SharePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  workspaceId?: string;
  onShared?: (shareData: { success: boolean; shareUrl?: string; shareId?: string }) => void;
}

interface ShareSettings {
  scope: 'private' | 'workspace' | 'public' | 'link';
  permission: 'view' | 'comment' | 'edit' | 'admin';
  allow_comments: boolean;
  allow_downloads: boolean;
  allow_forks: boolean;
  password_protected: boolean;
  require_approval: boolean;
}

const SharePromptModal: React.FC<SharePromptModalProps> = ({
  isOpen,
  onClose,
  promptId,
  workspaceId,
  onShared,
}) => {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ShareSettings>({
    scope: workspaceId ? 'workspace' : 'private',
    permission: 'view',
    allow_comments: true,
    allow_downloads: true,
    allow_forks: true,
    password_protected: false,
    require_approval: false,
  });

  const scopeOptions = [
    {
      id: 'private',
      name: 'Private',
      description: 'Only you can access this prompt',
      icon: LockClosedIcon,
      color: 'text-gray-600',
    },
    {
      id: 'workspace',
      name: 'Workspace',
      description: 'Members of your workspace can access',
      icon: UserGroupIcon,
      color: 'text-ethos-purple',
      disabled: !workspaceId,
    },
    {
      id: 'link',
      name: 'Anyone with link',
      description: 'Anyone with the link can access',
      icon: LinkIcon,
      color: 'text-green-600',
    },
    {
      id: 'public',
      name: 'Public',
      description: 'Anyone can find and access this prompt',
      icon: GlobeAltIcon,
      color: 'text-purple-600',
    },
  ];

  const permissionOptions = [
    {
      id: 'view',
      name: 'View only',
      description: 'Can view and execute the prompt',
    },
    {
      id: 'comment',
      name: 'Comment',
      description: 'Can view, execute, and comment',
    },
    {
      id: 'edit',
      name: 'Edit',
      description: 'Can view, execute, comment, and edit',
    },
  ];

  const handleShare = async () => {
    try {
      setSharing(true);
      const sharePrompt = httpsCallable(functions, 'share_prompt');

      const result = await sharePrompt({
        prompt_id: promptId,
        workspace_id: workspaceId,
        settings: settings,
      });

      const data = result.data as { success: boolean; shareUrl?: string; shareId?: string };

      if (data.success) {
        setShareUrl(data.share_url);
        if (onShared) {
          onShared(data);
        }
      } else {
        throw new Error(data.error || 'Failed to share prompt');
      }
    } catch (error) {
      console.error('Error sharing prompt:', error);
      alert('Failed to share prompt. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-ethos-purple/10">
                  <ShareIcon className="h-6 w-6 text-ethos-purple" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Share Prompt</h3>
                  <p className="text-sm text-gray-500">
                    Control who can access and what they can do
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={sharing}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Share URL Display */}
            {shareUrl && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">
                      Prompt shared successfully!
                    </p>
                    <p className="text-sm text-green-600 truncate">{shareUrl}</p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="ml-3 inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {copied ? (
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
            )}

            {/* Sharing Scope */}
            <div className="flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Who can access</h4>
                <div className="flex flex-col gap-2">
                  {scopeOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() =>
                        !option.disabled &&
                        setSettings({
                          ...settings,
                          scope: option.id as 'private' | 'workspace' | 'public' | 'link',
                        })
                      }
                      className={`relative cursor-pointer rounded-lg border p-3 transition-all ${
                        option.disabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : settings.scope === option.id
                          ? 'border-ethos-purple bg-ethos-purple/10 ring-2 ring-ethos-purple'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <option.icon className={`h-5 w-5 mt-0.5 ${option.color}`} />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{option.name}</h5>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        {settings.scope === option.id && (
                          <CheckIcon className="h-5 w-5 text-ethos-purple" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Level */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Permission level</h4>
                <select
                  value={settings.permission}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      permission: e.target.value as 'view' | 'comment' | 'edit' | 'admin',
                    })
                  }
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                >
                  {permissionOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Settings */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Additional settings</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allow_comments}
                      onChange={(e) =>
                        setSettings({ ...settings, allow_comments: e.target.checked })
                      }
                      className="h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow comments</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allow_downloads}
                      onChange={(e) =>
                        setSettings({ ...settings, allow_downloads: e.target.checked })
                      }
                      className="h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow downloads</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allow_forks}
                      onChange={(e) => setSettings({ ...settings, allow_forks: e.target.checked })}
                      className="h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Allow forking (creating copies)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.require_approval}
                      onChange={(e) =>
                        setSettings({ ...settings, require_approval: e.target.checked })
                      }
                      className="h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Require approval for access</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {!shareUrl ? (
              <Button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="w-full sm:ml-3 sm:w-auto"
                size="default"
              >
                {sharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sharing...
                  </>
                ) : (
                  'Share Prompt'
                )}
              </Button>
            ) : (
              <button
                type="button"
                onClick={copyToClipboard}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={sharing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {shareUrl ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePromptModal;
