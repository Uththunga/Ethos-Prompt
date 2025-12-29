import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    TrashIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacyDashboardResponse {
  success: boolean;
  data?: PrivacyDashboardData;
  error?: string;
}

interface PrivacyDashboardData {
  user_id: string;
  consents: Record<string, {
    granted: boolean;
    timestamp: string | number | Date;
    version: string;
  }>;
  export_requests: Array<{
    id: string;
    requested_at: string | number | Date;
    status: string;
    export_url?: string;
    expires_at?: string | number | Date;
    file_size?: number;
  }>;
  deletion_requests: Array<{
    id: string;
    requested_at: string | Date;
    status: string;
    deletion_type: string;
    completed_at?: string | Date;
  }>;
  data_summary: Record<string, number>;
  data_mapping: Array<{
    data_type: string;
    category: string;
    collection: string;
    retention_period: number;
    legal_basis: string;
    purpose: string;
    is_sensitive: boolean;
  }>;
  generated_at: string;
}

const PrivacyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<PrivacyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDataMapping, setShowDataMapping] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionType, setDeletionType] = useState('partial');

  useEffect(() => {
    if (currentUser) {
      loadPrivacyDashboard();
    }
  }, [currentUser]);

  const loadPrivacyDashboard = async () => {
    try {
      setLoading(true);
      const getPrivacyDashboard = httpsCallable(functions, 'get_privacy_dashboard');
      const result = await getPrivacyDashboard();
      const data = result.data as PrivacyDashboardResponse;

      if (data.success && data.data) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error loading privacy dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: string, granted: boolean) => {
    try {
      const recordConsent = httpsCallable(functions, 'record_consent');
      const result = await recordConsent({
        consent_type: consentType,
        granted: granted,
        version: '1.0'
      });
      const data = result.data as { success?: boolean; error?: string };

      if (data.success) {
        loadPrivacyDashboard(); // Reload to show updated consent
      } else {
        alert(`Failed to update consent: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Failed to update consent. Please try again.');
    }
  };

  const requestDataExport = async () => {
    try {
      const requestDataExport = httpsCallable(functions, 'request_data_export');
      const result = await requestDataExport();
      const data = result.data as { success?: boolean; error?: string };

      if (data.success) {
        alert('Data export request submitted successfully! You will receive an email when your data is ready for download.');
        loadPrivacyDashboard(); // Reload to show new request
      } else {
        alert(`Failed to request data export: ${data.error}`);
      }
    } catch (error) {
      console.error('Error requesting data export:', error);
      alert('Failed to request data export. Please try again.');
    }
  };

  const requestDataDeletion = async () => {
    try {
      const requestDataDeletion = httpsCallable(functions, 'request_data_deletion');
      const result = await requestDataDeletion({
        deletion_type: deletionType
      });
      const data = result.data as { success?: boolean; error?: string };

      if (data.success) {
        alert('Data deletion request submitted successfully! Please check your email for verification instructions.');
        setShowDeletionModal(false);
        loadPrivacyDashboard(); // Reload to show new request
      } else {
        alert(`Failed to request data deletion: ${data.error}`);
      }
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      alert('Failed to request data deletion. Please try again.');
    }
  };

  const getConsentLabel = (consentType: string): string => {
    const labels = {
      essential: 'Essential Services',
      analytics: 'Usage Analytics',
      marketing: 'Marketing Communications',
      personalization: 'Personalized Experience',
      third_party: 'Third-party Integrations'
    };
    return labels[consentType as keyof typeof labels] || consentType;
  };

  const getConsentDescription = (consentType: string): string => {
    const descriptions = {
      essential: 'Required for basic platform functionality and security',
      analytics: 'Help us improve the platform by analyzing usage patterns',
      marketing: 'Receive updates about new features and platform news',
      personalization: 'Customize your experience based on your preferences',
      third_party: 'Enable integrations with external services and tools'
    };
    return descriptions[consentType as keyof typeof descriptions] || '';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-ethos-purple bg-ethos-purple-light',
      completed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  type TimestampLike = { toDate?: () => Date } | string | number | Date | null | undefined;
  const formatTimestamp = (timestamp: TimestampLike): string => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'object' && timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp as string | number | Date);
    return date.toLocaleDateString();
  };

  const formatRetentionPeriod = (days: number): string => {
    if (days === -1) return 'Indefinite (with consent)';
    if (days === 0) return 'Immediate deletion';
    if (days < 365) return `${days} days`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading privacy dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No privacy data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Privacy dashboard data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Data Control</h1>
          <p className="text-sm text-gray-500">
            Manage your data privacy settings and exercise your rights
          </p>
        </div>
        <button
          onClick={() => setShowDataMapping(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          View Data Mapping
        </button>
      </div>

      {/* Data Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Data Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.data_summary).map(([dataType, count]) => (
              <div key={dataType} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {dataType.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consent Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Consent Management</h3>
          <p className="text-sm text-gray-500">Control how your data is used</p>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(dashboardData.consents).map(([consentType, consent]) => (
            <div key={consentType} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getConsentLabel(consentType)}
                    </h4>
                    {consentType === 'essential' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getConsentDescription(consentType)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatTimestamp(consent.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {consent.granted ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  {consentType !== 'essential' && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.granted}
                        onChange={(e) => updateConsent(consentType, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ethos-purple rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ethos-purple"></div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Rights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Export */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Data Export</h3>
            <p className="text-sm text-gray-500">Download a copy of your data</p>
          </div>
          <div className="p-6">
            <button
              onClick={requestDataExport}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ethos-purple hover:bg-ethos-purple-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Request Data Export
            </button>

            {dashboardData.export_requests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Requests</h4>
                <div >
                  {dashboardData.export_requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {formatTimestamp(request.requested_at)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Deletion */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Data Deletion</h3>
            <p className="text-sm text-gray-500">Request deletion of your data</p>
          </div>
          <div className="p-6">
            <button
              onClick={() => setShowDeletionModal(true)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Request Data Deletion
            </button>

            {dashboardData.deletion_requests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Requests</h4>
                <div >
                  {dashboardData.deletion_requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {formatTimestamp(request.requested_at)} ({request.deletion_type})
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Mapping Modal */}
      {showDataMapping && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Processing Information</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Legal Basis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retention
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.data_mapping.map((mapping, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {mapping.data_type.replace('_', ' ')}
                          {mapping.is_sensitive && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Sensitive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {mapping.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {mapping.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mapping.legal_basis}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRetentionPeriod(mapping.retention_period)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDataMapping(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Deletion Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center gap-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900">Request Data Deletion</h3>
              </div>

              <div >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deletion Type
                  </label>
                  <select
                    value={deletionType}
                    onChange={(e) => setDeletionType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    <option value="partial">Partial Deletion</option>
                    <option value="complete">Complete Account Deletion</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        {deletionType === 'complete'
                          ? 'This will permanently delete your account and most associated data. Some data may be retained for legal compliance.'
                          : 'This will delete non-essential data while preserving your account and core content.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeletionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={requestDataDeletion}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Request Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date(dashboardData.generated_at).toLocaleString()}
      </div>
    </div>
  );
};

export default PrivacyDashboard;
