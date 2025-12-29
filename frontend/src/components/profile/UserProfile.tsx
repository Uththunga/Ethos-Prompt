import {
    BuildingOfficeIcon,
    ChartBarIcon,
    CheckIcon,
    ClockIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    PencilIcon,
    UserIcon,
    XMarkIcon,
} from '@/components/icons';
import React, { useEffect, useState } from 'react';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Button } from '../marketing/ui/button';

type Timestampish = { toDate?: () => Date } | { seconds?: number } | number | string | Date;

interface RecentActivity {
  activity_type: string;
  timestamp: Timestampish;
  [key: string]: unknown;
}

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  bio?: string;
  company?: string;
  role?: string;
  location?: string;
  website?: string;
  created_at: Timestampish;
  last_login: Timestampish;
  preferences: Record<string, unknown>;
  stats?: {
    prompts_created?: number;
    total_executions?: number;
    documents_uploaded?: number;
    [key: string]: unknown;
  };
  recent_activity: RecentActivity[];
  workspaces: unknown[];
}

const UserProfile: React.FC = () => {
  const {
    userProfile: appUser,
    loading: profileLoading,
    updateUserProfile,
    refreshProfile,
  } = useUserProfile();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    company: '',
    role: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (appUser) {
      const mapped: UserProfile = {
        user_id: (appUser as any).uid || (appUser as any).id || '',
        email: (appUser as any).email || '',
        display_name: (appUser as any).displayName || (appUser as any).display_name || '',
        photo_url: (appUser as any).photoURL || (appUser as any).photo_url,
        bio: (appUser as any).bio || '',
        company: (appUser as any).company || '',
        role: (appUser as any).role || '',
        location: (appUser as any).location || '',
        website: (appUser as any).website || '',
        created_at: (appUser as any).createdAt || (appUser as any).created_at || '',
        last_login: (appUser as any).lastLoginAt || (appUser as any).last_login || '',
        preferences: (appUser as any).settings || (appUser as any).preferences || {},
        stats: (appUser as any).stats || {},
        recent_activity: (appUser as any).recent_activity || [],
        workspaces: (appUser as any).workspaces || [],
      };
      setProfile(mapped);
      setEditForm({
        display_name: mapped.display_name || '',
        bio: mapped.bio || '',
        company: mapped.company || '',
        role: mapped.role || '',
        location: mapped.location || '',
        website: mapped.website || '',
      });
    } else {
      setProfile(null);
    }
  }, [appUser]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUserProfile({
        displayName: editForm.display_name,
        bio: editForm.bio,
        company: editForm.company,
        role: editForm.role,
        location: editForm.location,
        website: editForm.website,
      });
      await refreshProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      company: profile?.company || '',
      role: profile?.role || '',
      location: profile?.location || '',
      website: profile?.website || '',
    });
    setEditing(false);
  };

  const formatDate = (timestamp: Timestampish) => {
    if (!timestamp) return 'Never';
    const date =
      typeof timestamp === 'object' &&
      'toDate' in timestamp &&
      typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp as string | number | Date);
    return date.toLocaleDateString();
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'prompt_created':
        return <DocumentTextIcon className="h-4 w-4 text-ethos-purple" />;
      case 'workspace_joined':
        return <BuildingOfficeIcon className="h-4 w-4 text-green-500" />;
      case 'login':
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load user profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex items-center justify-end mb-6">
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" size="sm">
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} variant="ethos" size="sm">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button onClick={handleCancel} disabled={saving} variant="outline" size="sm">
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {profile.photo_url ? (
                <img
                  className="h-16 w-16 rounded-full"
                  src={profile.photo_url}
                  alt={profile.display_name}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-ethos-purple focus:outline-none bg-transparent"
                  placeholder="Display Name"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{profile.display_name}</h2>
              )}
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Joined {formatDate(profile.created_at)}</span>
                <span>Last active {formatDate(profile.last_login)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Bio */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-900">{profile.bio || 'No bio provided'}</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Company name"
                />
              ) : (
                <p className="text-gray-900">{profile.company || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Job title"
                />
              ) : (
                <p className="text-gray-900">{profile.role || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="City, Country"
                />
              ) : (
                <p className="text-gray-900">{profile.location || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              {editing ? (
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-gray-900">
                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ethos-purple hover:text-ethos-purple-dark"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-ethos-purple" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Prompts Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.stats?.prompts_created || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.stats?.total_executions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-ethos-purple" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Workspaces</p>
              <p className="text-2xl font-bold text-gray-900">{profile.workspaces?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.stats?.documents_uploaded || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {profile.recent_activity && profile.recent_activity.length > 0 ? (
            profile.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.activity_type
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
