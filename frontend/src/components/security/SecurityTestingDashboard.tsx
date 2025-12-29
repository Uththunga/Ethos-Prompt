import {
    BugAntIcon,
    ChartBarIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    FireIcon,
    PlayIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SecurityDashboardData {
  recent_tests: Array<{
    id: string;
    test_type: string;
    target: string;
    started_at: Date | { toDate?: () => Date } | number | string;
    completed_at?: Date | { toDate?: () => Date } | number | string;
    status: string;
    vulnerabilities_found: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
  }>;
  open_vulnerabilities: Array<{
    id: string;
    vulnerability_type: string;
    severity: string;
    title: string;
    description: string;
    affected_component: string;
    discovered_at: Date | { toDate?: () => Date } | number | string;
    status: string;
  }>;
  active_incidents: Array<{
    id: string;
    incident_type: string;
    severity: string;
    description: string;
    detected_at: Date | { toDate?: () => Date } | number | string;
    status: string;
  }>;
  security_metrics: {
    total_open_vulnerabilities: number;
    severity_breakdown: Record<string, number>;
    security_score: number;
    risk_level: string;
  };
  recommendations: string[];
  generated_at: string;
}

interface VulnerabilityReport {
  vulnerabilities: Array<{
    id: string;
    vulnerability_type: string;
    severity: string;
    title: string;
    description: string;
    affected_component: string;
    proof_of_concept?: string;
    remediation: string;
    cvss_score?: number;
    discovered_at: Date | { toDate?: () => Date } | number | string;
    status: string;
  }>;
  total_count: number;
  severity_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  generated_at: string;
}

const SecurityTestingDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [vulnerabilityReport, setVulnerabilityReport] = useState<VulnerabilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanTarget, setScanTarget] = useState('');
  const [scanType, setScanType] = useState('comprehensive');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    type: '',
    severity: 'medium',
    description: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadSecurityDashboard();
      loadVulnerabilityReport();
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

  const loadVulnerabilityReport = async () => {
    try {
      const getVulnerabilityReport = httpsCallable(functions, 'get_vulnerability_report');
      const result = await getVulnerabilityReport({ limit: 50 });
      const data = result.data as unknown as { success?: boolean; data?: VulnerabilityReport; error?: string };

      if (data.success) {
        setVulnerabilityReport(data.data);
      }
    } catch (error) {
      console.error('Error loading vulnerability report:', error);
    }
  };

  const runSecurityScan = async () => {
    try {
      const runAutomatedSecurityScan = httpsCallable(functions, 'run_automated_security_scan');
      const result = await runAutomatedSecurityScan({
        target_url: scanTarget,
        scan_type: scanType
      });
      const data = result.data as unknown as { success?: boolean; test_id?: string; error?: string };

      if (data.success) {
        setShowScanModal(false);
        setScanTarget('');
        alert(`Security scan started successfully! Test ID: ${data.test_id}`);
        loadSecurityDashboard(); // Reload to show new test
      } else {
        alert(`Failed to start security scan: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running security scan:', error);
      alert('Failed to start security scan. Please try again.');
    }
  };

  const createIncident = async () => {
    try {
      const createIncidentResponse = httpsCallable(functions, 'create_incident_response');
      const result = await createIncidentResponse({
        incident_type: incidentForm.type,
        severity: incidentForm.severity,
        description: incidentForm.description,
        reported_by: currentUser?.uid
      });
      const data = result.data as unknown as { success?: boolean; error?: string };

      if (data.success) {
        setShowIncidentModal(false);
        setIncidentForm({ type: '', severity: 'medium', description: '' });
        alert('Security incident created successfully!');
        loadSecurityDashboard(); // Reload to show new incident
      } else {
        alert(`Failed to create incident: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Failed to create incident. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'text-red-800 bg-red-200',
      high: 'text-red-600 bg-red-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-blue-600 bg-blue-100',
      info: 'text-gray-600 bg-gray-100'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      running: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      open: 'text-red-600 bg-red-100',
      investigating: 'text-yellow-600 bg-yellow-100',
      contained: 'text-blue-600 bg-blue-100',
      resolved: 'text-green-600 bg-green-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[riskLevel as keyof typeof colors] || 'text-gray-600';
  };

  const formatTimestamp = (timestamp: Date | { toDate?: () => Date } | number | string): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatVulnerabilityType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading security dashboard...</span>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Testing</h1>
          <p className="text-sm text-gray-500">
            Automated security scanning and vulnerability management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIncidentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FireIcon className="h-4 w-4 mr-2" />
            Report Incident
          </button>
          <button
            onClick={() => setShowScanModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Run Security Scan
          </button>
        </div>
      </div>

      {/* Security Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BugAntIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Open Vulnerabilities
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.security_metrics.total_open_vulnerabilities}
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
                  <ChartBarIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Security Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.security_metrics.security_score}/100
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
                  <ShieldExclamationIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Risk Level
                    </dt>
                    <dd className={`text-lg font-medium capitalize ${getRiskLevelColor(dashboardData.security_metrics.risk_level)}`}>
                      {dashboardData.security_metrics.risk_level}
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
                  <FireIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Incidents
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.active_incidents.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Severity Breakdown */}
      {dashboardData && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vulnerability Severity Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(dashboardData.security_metrics.severity_breakdown).map(([severity, count]) => (
                <div key={severity} className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor(severity).split(' ')[0]}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{severity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Tests */}
      {dashboardData && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Security Tests</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.recent_tests.length === 0 ? (
              <div className="p-6 text-center">
                <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No security tests found</p>
              </div>
            ) : (
              dashboardData.recent_tests.map((test) => (
                <div key={test.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatVulnerabilityType(test.test_type)} - {test.target}
                      </p>
                      <p className="text-sm text-gray-600">
                        Started: {formatTimestamp(test.started_at)}
                        {test.completed_at && ` • Completed: ${formatTimestamp(test.completed_at)}`}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Vulnerabilities: {test.vulnerabilities_found}
                        </span>
                        {test.critical_count > 0 && (
                          <span className="text-red-600">Critical: {test.critical_count}</span>
                        )}
                        {test.high_count > 0 && (
                          <span className="text-red-500">High: {test.high_count}</span>
                        )}
                        {test.medium_count > 0 && (
                          <span className="text-yellow-600">Medium: {test.medium_count}</span>
                        )}
                        {test.low_count > 0 && (
                          <span className="text-blue-600">Low: {test.low_count}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Open Vulnerabilities */}
      {vulnerabilityReport && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Open Vulnerabilities</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {vulnerabilityReport.vulnerabilities.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm text-gray-500">No open vulnerabilities</p>
              </div>
            ) : (
              vulnerabilityReport.vulnerabilities.slice(0, 10).map((vuln) => (
                <div key={vuln.id} className="p-6">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className={`h-5 w-5 mt-1 ${
                      vuln.severity === 'critical' ? 'text-red-800' :
                      vuln.severity === 'high' ? 'text-red-600' :
                      vuln.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{vuln.title}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{vuln.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Type: {formatVulnerabilityType(vuln.vulnerability_type)}</span>
                        <span className="mx-2">•</span>
                        <span>Component: {vuln.affected_component}</span>
                        <span className="mx-2">•</span>
                        <span>Discovered: {formatTimestamp(vuln.discovered_at)}</span>
                        {vuln.cvss_score && (
                          <>
                            <span className="mx-2">•</span>
                            <span>CVSS: {vuln.cvss_score}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-700">
                          <strong>Remediation:</strong> {vuln.remediation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Security Recommendations */}
      {dashboardData && dashboardData.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <ShieldExclamationIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Security Recommendations</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside">
                  {dashboardData.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Run Security Scan</h3>

              <div >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={scanTarget}
                    onChange={(e) => setScanTarget(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scan Type
                  </label>
                  <select
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="comprehensive">Comprehensive Scan</option>
                    <option value="quick">Quick Scan</option>
                    <option value="headers_only">Security Headers Only</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={runSecurityScan}
                  disabled={!scanTarget}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Security Incident</h3>

              <div >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Incident Type
                  </label>
                  <input
                    type="text"
                    value={incidentForm.type}
                    onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Data Breach, Unauthorized Access"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the security incident..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={createIncident}
                  disabled={!incidentForm.type || !incidentForm.description}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Report Incident
                </button>
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

export default SecurityTestingDashboard;
