import React, { useEffect, useState } from 'react';
import { Button } from '../../components/marketing/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface BetaApplication {
  _id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  experience?: string;
  expectations?: string;
  teamSize?: string;
  timeline?: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

interface BetaUser {
  _id: string;
  userId: string;
  name: string;
  email: string;
  company: string;
  approvedAt: string;
  features: {
    advancedRAG: boolean;
    prioritySupport: boolean;
    betaFeatures: boolean;
    increasedLimits: boolean;
  };
  limits: {
    monthlyExecutions: number;
    monthlyTokens: number;
    maxDocuments: number;
    maxWorkspaces: number;
  };
  usage: {
    currentMonthExecutions: number;
    currentMonthTokens: number;
    totalExecutions: number;
    totalTokens: number;
  };
  isActive: boolean;
}

const BetaManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  const [applications, setApplications] = useState<BetaApplication[]>([]);
  const [betaUsers, setBetaUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<BetaApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/beta/admin/applications', {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch {
      showToast('Failed to fetch beta applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.accessToken, showToast]);

  const fetchBetaUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/beta/admin/users', {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBetaUsers(data.betaUsers);
      }
    } catch {
      showToast('Failed to fetch beta users', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.accessToken, showToast]);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    } else {
      fetchBetaUsers();
    }
  }, [activeTab, fetchApplications, fetchBetaUsers]);

  const reviewApplication = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(`/api/beta/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify({
          status,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        showToast(`Application ${status} successfully`, 'success');
        setSelectedApplication(null);
        setReviewNotes('');
        fetchApplications();
      } else {
        throw new Error('Failed to review application');
      }
    } catch {
      showToast('Failed to review application', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      waitlisted: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Beta Program Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage beta applications and user access
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Beta Users ({betaUsers.length})
          </button>
        </nav>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((application) => (
                    <tr key={application._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {application.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {application.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {application.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(application.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Beta Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usage This Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Approved
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {betaUsers.map((betaUser) => (
                    <tr key={betaUser._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {betaUser.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {betaUser.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {betaUser.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          {betaUser.usage.currentMonthExecutions.toLocaleString()} executions
                        </div>
                        <div className="text-xs text-gray-500">
                          {betaUser.usage.currentMonthTokens.toLocaleString()} tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{betaUser.usage.totalExecutions.toLocaleString()} executions</div>
                        <div className="text-xs text-gray-500">
                          {betaUser.usage.totalTokens.toLocaleString()} tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            betaUser.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {betaUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(betaUser.approvedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Application Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Review Application: {selectedApplication.name}
              </h3>

              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use Case
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {selectedApplication.useCase}
                  </p>
                </div>

                {selectedApplication.experience && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Experience
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {selectedApplication.experience}
                    </p>
                  </div>
                )}

                <div className="mb-4 last:mb-0">
                  <label
                    htmlFor="reviewNotes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Review Notes
                  </label>
                  <textarea
                    id="reviewNotes"
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add notes about your decision..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => setSelectedApplication(null)}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => reviewApplication(selectedApplication._id, 'rejected')}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => reviewApplication(selectedApplication._id, 'waitlisted')}
                  className="bg-yellow-600 text-white hover:bg-yellow-700"
                >
                  Waitlist
                </Button>
                <Button
                  variant="ethos"
                  size="lg"
                  onClick={() => reviewApplication(selectedApplication._id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaManagement;
