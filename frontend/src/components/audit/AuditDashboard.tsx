import {
    ArrowDownTrayIcon,
    ChartBarIcon,
    ClockIcon,
    ComputerDesktopIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@/components/icons';
import { httpsCallable } from 'firebase/functions';
import React, { useCallback, useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';

interface AuditDashboardData {
  time_range: string;
  summary: {
    total_events: number;
    critical_events: number;
    violation_rate: number;
    most_common_action: string | null;
  };
  action_breakdown: Record<string, number>;
  level_breakdown: Record<string, number>;
  daily_trends: Array<{
    date: string;
    count: number;
  }>;
  recent_critical_events: Array<{
    id: string;
    timestamp: string | Date | { toDate: () => Date };
    user_id?: string;
    action: string;
    resource_type: string;
    level: string;
    ip_address?: string;
    details: Record<string, unknown>;
  }>;
  compliance_status: {
    gdpr_events: number;
    soc2_events: number;
    iso27001_events: number;
    total_compliance_events: number;
  };
  generated_at: string;
}

interface AuditTrailData {
  events: Array<{
    id: string;
    timestamp: string | Date | { toDate: () => Date };
    user_id?: string;
    workspace_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    level: string;
    ip_address?: string;
    user_agent?: string;
    details: Record<string, unknown>;
  }>;
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface FirebaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const AuditDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<AuditDashboardData | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [searchFilters, setSearchFilters] = useState({
    action: '',
    level: '',
    resource_type: '',
    start_date: '',
    end_date: '',
  });

  const loadAuditDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const getAuditDashboard = httpsCallable(functions, 'get_audit_dashboard');
      const result = await getAuditDashboard({ time_range: timeRange });
      const data = result.data as FirebaseResponse<AuditDashboardData>;

      if (data.success) {
        setDashboardData(data.data!);
      }
    } catch (error) {
      console.error('Error loading audit dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const loadAuditTrail = useCallback(
    async (offset: number = 0) => {
      try {
        const getAuditTrail = httpsCallable(functions, 'get_audit_trail');
        const result = await getAuditTrail({
          limit: 50,
          offset,
          ...searchFilters,
        });
        const data = result.data as FirebaseResponse<AuditTrailData>;

        if (data.success) {
          setAuditTrail(data.data!);
        }
      } catch (error) {
        console.error('Error loading audit trail:', error);
      }
    },
    [searchFilters]
  );

  const exportAuditData = async () => {
    try {
      const exportAuditData = httpsCallable(functions, 'export_audit_data');
      const result = await exportAuditData({
        format: exportFormat,
        start_time: searchFilters.start_date || null,
        end_time: searchFilters.end_date || null,
      });
      const data = result.data as FirebaseResponse<string>;

      if (data.success) {
        // Create download link
        const blob = new Blob([data.data!], {
          type: exportFormat === 'csv' ? 'text/csv' : 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setShowExportModal(false);
        alert('Audit data exported successfully!');
      } else {
        alert(`Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error exporting audit data:', error);
      alert('Export failed. Please try again.');
    }
  };

  const generateComplianceReport = async (standard: string) => {
    try {
      const generateComplianceReport = httpsCallable(functions, 'generate_compliance_report');
      const result = await generateComplianceReport({
        standard,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
      });
      const data = result.data as FirebaseResponse<{ report_url: string }>;

      if (data.success) {
        alert(`${standard.toUpperCase()} compliance report generated successfully!`);
        // In a real app, you might navigate to a report view or download the report
      } else {
        alert(`Report generation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      alert('Report generation failed. Please try again.');
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      info: 'text-ethos-purple bg-ethos-purple-light',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      critical: 'text-red-800 bg-red-200',
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatActionName = (action: string): string => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string | Date | { toDate: () => Date }): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  useEffect(() => {
    if (currentUser) {
      loadAuditDashboard();
      loadAuditTrail();
    }
  }, [currentUser, loadAuditDashboard, loadAuditTrail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ethos-purple"></div>
        <span className="ml-3 text-lg text-gray-600">Loading audit dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
          <p className="text-sm text-gray-500">
            Comprehensive audit logging and compliance monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="1d">Last Day</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            onClick={() => setShowExportModal(true)}
            variant="ethos"
            size="sm"
            className="inline-flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.summary.total_events.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Critical Events</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.summary.critical_events}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Violation Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.summary.violation_rate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Compliance Events
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.compliance_status.total_compliance_events}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">GDPR Compliance</h4>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.compliance_status.gdpr_events || 0} events
                  </p>
                </div>
                <Button
                  onClick={() => generateComplianceReport('gdpr')}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  Generate Report
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">SOC 2 Compliance</h4>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.compliance_status.soc2_events || 0} events
                  </p>
                </div>
                <Button
                  onClick={() => generateComplianceReport('soc2')}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  Generate Report
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">ISO 27001</h4>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.compliance_status.iso27001_events || 0} events
                  </p>
                </div>
                <Button
                  onClick={() => generateComplianceReport('iso27001')}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Critical Events */}
      {dashboardData && dashboardData.recent_critical_events.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Critical Events</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.recent_critical_events.map((event) => (
              <div key={event.id} className="p-6">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {formatActionName(event.action)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(
                          event.level
                        )}`}
                      >
                        {event.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Resource: {event.resource_type}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTimestamp(event.timestamp)}
                      </span>
                      {event.ip_address && (
                        <span className="flex items-center">
                          <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                          {event.ip_address}
                        </span>
                      )}
                      {event.user_id && (
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {event.user_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Audit Trail</h3>
            <Button onClick={() => loadAuditTrail()} variant="ghost" size="sm" className="text-sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Action</label>
              <select
                value={searchFilters.action}
                onChange={(e) => setSearchFilters({ ...searchFilters, action: e.target.value })}
                className="mt-1 block w-full text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Actions</option>
                <option value="user_login">User Login</option>
                <option value="prompt_created">Prompt Created</option>
                <option value="document_uploaded">Document Uploaded</option>
                <option value="api_request">API Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Level</label>
              <select
                value={searchFilters.level}
                onChange={(e) => setSearchFilters({ ...searchFilters, level: e.target.value })}
                className="mt-1 block w-full text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Resource Type</label>
              <input
                type="text"
                value={searchFilters.resource_type}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, resource_type: e.target.value })
                }
                className="mt-1 block w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                placeholder="e.g., prompt, document"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={searchFilters.start_date}
                onChange={(e) => setSearchFilters({ ...searchFilters, start_date: e.target.value })}
                className="mt-1 block w-full text-sm border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => loadAuditTrail()}
                variant="ethos"
                size="sm"
                className="w-full"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Events */}
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {(auditTrail?.events?.length ?? 0) > 0 ? (
            auditTrail.events.map((event) => (
              <div key={event.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                      event.level === 'critical'
                        ? 'bg-red-500'
                        : event.level === 'error'
                        ? 'bg-red-400'
                        : event.level === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {formatActionName(event.action)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(
                          event.level
                        )}`}
                      >
                        {event.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {event.resource_type}{' '}
                      {event.resource_id && `(${event.resource_id.substring(0, 8)}...)`}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatTimestamp(event.timestamp)}</span>
                      {event.ip_address && <span>IP: {event.ip_address}</span>}
                      {event.user_id && <span>User: {event.user_id.substring(0, 8)}...</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No audit events found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {auditTrail?.has_more && (
          <div className="px-6 py-3 border-t border-gray-200">
            <Button
              onClick={() => loadAuditTrail((auditTrail?.offset ?? 0) + (auditTrail?.limit ?? 50))}
              variant="ghost"
              size="sm"
              className="text-sm"
            >
              Load More Events
            </Button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Audit Data</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="xml">XML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Range (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="date"
                      value={searchFilters.start_date}
                      onChange={(e) =>
                        setSearchFilters({ ...searchFilters, start_date: e.target.value })
                      }
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                    />
                    <input
                      type="date"
                      value={searchFilters.end_date}
                      onChange={(e) =>
                        setSearchFilters({ ...searchFilters, end_date: e.target.value })
                      }
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={() => setShowExportModal(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={exportAuditData} variant="ethos" size="sm">
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {dashboardData ? new Date(dashboardData.generated_at).toLocaleString() : ''}
      </div>
    </div>
  );
};

export default AuditDashboard;
