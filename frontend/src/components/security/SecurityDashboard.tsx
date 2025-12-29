import {
    CheckCircleIcon,
    ClockIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    ShieldCheckIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';

interface SecurityDashboardData {
  user_id: string;
  mfa_status: {
    enabled: boolean;
    method: string | null;
    backup_codes_remaining: number;
  };
  recent_events: Array<{
    id: string;
    event_type: string;
    timestamp: Date | { toDate?: () => Date } | number | string;
    ip_address?: string;
    user_agent?: string;
    risk_score: number;
    details: Record<string, unknown>;
  }>;
  active_sessions: Array<{
    session_id: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    last_activity: string;
    is_current: boolean;
  }>;
  api_keys: Array<{
    id: string;
    name: string;
    created_at: Date | { toDate?: () => Date } | number | string;
    last_used?: Date | { toDate?: () => Date } | number | string;
    permissions: string[];
  }>;
  latest_audit: {
    security_level: string;
    risk_score: number;
    findings: Array<{
      category: string;
      severity: string;
      finding: string;
      risk_score: number;
    }>;
    recommendations: string[];
  } | null;
  security_recommendations: string[];
  generated_at: string;
}

const SecurityDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<unknown>(null);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadSecurityDashboard();
    }
  }, [currentUser]);

  const loadSecurityDashboard = async () => {
    try {
      setLoading(true);
      const getSecurityDashboard = httpsCallable(functions, 'get_security_dashboard');
      const result = await getSecurityDashboard();
      const data = result.data as unknown as { success?: boolean; data?: SecurityDashboardData; error?: string };

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error loading security dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async () => {
    try {
      const setupMFA = httpsCallable(functions, 'setup_mfa');
      const result = await setupMFA({ method: 'totp' });
      const data = result.data as unknown as { success?: boolean; data?: SecurityDashboardData; error?: string };

      if (data.success) {
        setMfaSetupData(data);
        setShowMFASetup(true);
      } else {
        alert(`Failed to setup MFA: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting up MFA:', error);
      alert('Failed to setup MFA. Please try again.');
    }
  };

  const verifyMFA = async () => {
    try {
      const verifyMFA = httpsCallable(functions, 'verify_mfa');
      const result = await verifyMFA({
        code: verificationCode,
        enable_if_valid: true
      });
      const data = result.data as unknown as { success?: boolean; data?: SecurityDashboardData; error?: string };

      if (data.success) {
        setShowMFASetup(false);
        setMfaSetupData(null);
        setVerificationCode('');
        loadSecurityDashboard(); // Reload to show updated MFA status
        alert('MFA enabled successfully!');
      } else {
        alert(`MFA verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      alert('MFA verification failed. Please try again.');
    }
  };

  const performSecurityAudit = async () => {
    try {
      const performSecurityAudit = httpsCallable(functions, 'perform_security_audit');
      const result = await performSecurityAudit();
      const data = result.data as unknown as { success?: boolean; data?: SecurityDashboardData; error?: string };

      if (data.success) {
        loadSecurityDashboard(); // Reload to show updated audit results
        alert('Security audit completed successfully!');
      } else {
        alert(`Security audit failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error performing security audit:', error);
      alert('Security audit failed. Please try again.');
    }
  };

  const getSecurityLevelColor = (level: string) => {
    const colors = {
      EXCELLENT: 'text-green-600 bg-green-100',
      GOOD: 'text-ethos-purple bg-ethos-purple/10',
      FAIR: 'text-yellow-600 bg-yellow-100',
      POOR: 'text-red-600 bg-red-100'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      LOW: 'text-green-600 bg-green-100',
      MEDIUM: 'text-yellow-600 bg-yellow-100',
      HIGH: 'text-red-600 bg-red-100',
      CRITICAL: 'text-red-800 bg-red-200'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatEventType = (eventType: string): string => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: Date | { toDate?: () => Date } | number | string): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading security dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No security data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Security dashboard data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-sm text-gray-500">
            Monitor and manage your account security
          </p>
        </div>
        <Button
          onClick={performSecurityAudit}
          size="sm"
          className="inline-flex items-center"
        >
          <ShieldCheckIcon className="h-4 w-4 mr-2" />
          Run Security Audit
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MFA Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Multi-Factor Authentication
                  </dt>
                  <dd className="flex items-center">
                    {dashboardData.mfa_status.enabled ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-red-600">Disabled</span>
                      </>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
            {!dashboardData.mfa_status.enabled && (
              <div className="mt-3">
                <button
                  onClick={setupMFA}
                  className="text-sm text-ethos-purple hover:text-ethos-purple/80"
                >
                  Enable MFA →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Level */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Security Level
                  </dt>
                  <dd>
                    {dashboardData.latest_audit ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSecurityLevelColor(dashboardData.latest_audit.security_level)}`}>
                        {dashboardData.latest_audit.security_level}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No audit available</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.active_sessions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      {dashboardData.security_recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Security Recommendations
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside">
                  {dashboardData.security_recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Audit Results */}
      {dashboardData.latest_audit && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Latest Security Audit</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Security Findings</h4>
                {dashboardData.latest_audit.findings.length === 0 ? (
                  <p className="text-sm text-green-600">No security issues found</p>
                ) : (
                  <div >
                    {dashboardData.latest_audit.findings.map((finding, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{finding.category}</p>
                          <p className="text-sm text-gray-600">{finding.finding}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
                {dashboardData.latest_audit.recommendations.length === 0 ? (
                  <p className="text-sm text-green-600">No recommendations at this time</p>
                ) : (
                  <ul className="text-sm text-gray-600">
                    {dashboardData.latest_audit.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-ethos-purple mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Security Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {dashboardData.recent_events.length === 0 ? (
            <div className="p-6 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent security events</p>
            </div>
          ) : (
            dashboardData.recent_events.map((event) => (
              <div key={event.id} className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    event.risk_score > 30 ? 'bg-red-500' :
                    event.risk_score > 15 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {formatEventType(event.event_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    {event.ip_address && (
                      <p className="text-xs text-gray-500 mt-1">
                        IP: {event.ip_address}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Risk Score:</span>
                      <span className={`text-xs font-medium ${
                        event.risk_score > 30 ? 'text-red-600' :
                        event.risk_score > 15 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {event.risk_score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData.api_keys.length === 0 ? (
            <div className="p-6 text-center">
              <KeyIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No API keys found</p>
            </div>
          ) : (
            dashboardData.api_keys.map((apiKey) => (
              <div key={apiKey.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{apiKey.name}</p>
                    <p className="text-xs text-gray-500">
                      Created: {formatTimestamp(apiKey.created_at)}
                    </p>
                    {apiKey.last_used && (
                      <p className="text-xs text-gray-500">
                        Last used: {formatTimestamp(apiKey.last_used)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {apiKey.permissions.length} permissions
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MFA Setup Modal */}
      {showMFASetup && mfaSetupData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Multi-Factor Authentication</h3>

              <div >
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-500">QR Code would be displayed here</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Manual entry: {mfaSetupData.secret}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 font-medium">Backup Codes</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Save these backup codes in a secure location:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs font-mono">
                    {mfaSetupData.backup_codes.slice(0, 4).map((code: string, index: number) => (
                      <span key={index} className="bg-white px-2 py-1 rounded">{code}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => setShowMFASetup(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={verifyMFA}
                  disabled={verificationCode.length !== 6}
                  size="sm"
                >
                  Verify & Enable
                </Button>
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

export default SecurityDashboard;
