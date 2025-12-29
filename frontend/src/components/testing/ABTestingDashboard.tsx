import {
    BeakerIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
    StopIcon
} from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

type Timestampish = { toDate?: () => Date } | { seconds?: number } | number | string | Date;

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: string;
  variants: Array<{
    id: string;
    name: string;
    type: string;
    prompt_id: string;
    traffic_allocation: number;
  }>;
  metrics: Array<{
    name: string;
    type: string;
    target_improvement: number;
  }>;
  start_date: Timestampish;
  end_date: Timestampish;
  target_sample_size: number;
  confidence_level: number;
  created_at: Timestampish;
  stats: {
    total_assignments: number;
    total_results: number;
    variant_stats: Record<string, unknown>;
  };
}

interface ExperimentSummary {
  total_experiments: number;
  running_experiments: number;
  completed_experiments: number;
  draft_experiments: number;
}

const ABTestingDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [summary, setSummary] = useState<ExperimentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);


  useEffect(() => {
    if (currentUser) {
      loadExperiments();
    }
  }, [currentUser]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const getExperimentDashboard = httpsCallable(functions, 'get_experiment_dashboard');
      const result = await getExperimentDashboard();
      const data = result.data as { success: boolean; experiments: Experiment[]; summary: ExperimentSummary; error?: string };

      if (data.success) {
        setExperiments(data.experiments);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExperiment = async (experimentId: string) => {
    try {
      const startExperiment = httpsCallable(functions, 'start_experiment');
      const result = await startExperiment({ experiment_id: experimentId });
      const data = result.data as { success: boolean; error?: string };

      if (data.success) {
        loadExperiments(); // Reload to get updated status
      } else {
        alert(`Failed to start experiment: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting experiment:', error);
      alert('Failed to start experiment. Please try again.');
    }
  };

  const analyzeExperiment = async (experimentId: string) => {
    try {
      const analyzeExperiment = httpsCallable(functions, 'analyze_experiment');
      const result = await analyzeExperiment({ experiment_id: experimentId });
      const data = result.data as { success: boolean; [key: string]: unknown; error?: string };

      if (data.success) {
        // For now, just log the results; future enhancement: show modal with details
        console.log('Experiment analysis:', data);
      } else {
        alert(`Failed to analyze experiment: ${data.error}`);
      }
    } catch (error) {
      console.error('Error analyzing experiment:', error);
      alert('Failed to analyze experiment. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'text-gray-600 bg-gray-100',
      running: 'text-blue-600 bg-blue-100',
      paused: 'text-yellow-600 bg-yellow-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-4 w-4" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <StopIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: Date | { toDate?: () => Date } | number | string): string => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const calculateProgress = (experiment: Experiment): number => {
    const totalResults = experiment.stats?.total_results || 0;
    const targetSize = experiment.target_sample_size || 1;
    return Math.min((totalResults / targetSize) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading experiments...</span>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
          <p className="text-sm text-gray-500">
            Test prompt variations and measure performance improvements
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Experiment
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Experiments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.total_experiments}
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
                  <PlayIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Running
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.running_experiments}
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
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.completed_experiments}
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
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Draft
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.draft_experiments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Experiments</h3>
        </div>

        {experiments.length === 0 ? (
          <div className="p-6 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No experiments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first A/B test to compare prompt variations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {experiments.map((experiment) => (
              <div key={experiment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-medium text-gray-900">{experiment.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                        {getStatusIcon(experiment.status)}
                        <span className="ml-1 capitalize">{experiment.status}</span>
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">{experiment.description}</p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Variants:</span> {experiment.variants.length}
                      </div>
                      <div>
                        <span className="font-medium">Metrics:</span> {experiment.metrics.length}
                      </div>
                      <div>
                        <span className="font-medium">Started:</span> {formatDate(experiment.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">Participants:</span> {experiment.stats?.total_results || 0}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {experiment.status === 'running' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-gray-900">{calculateProgress(experiment).toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${calculateProgress(experiment)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Variants */}
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Variants:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {experiment.variants.map((variant) => (
                          <span
                            key={variant.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              variant.type === 'control'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {variant.name} ({(variant.traffic_allocation * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {experiment.status === 'draft' && (
                      <button
                        onClick={() => startExperiment(experiment.id)}
                        className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start
                      </button>
                    )}

                    {(experiment.status === 'running' || experiment.status === 'completed') && (
                      <button
                        onClick={() => analyzeExperiment(experiment.id)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Analyze
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Experiment Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Experiment</h3>

              <div >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experiment Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Email Response Optimization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what you're testing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Control Prompt
                  </label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select control prompt...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Treatment Prompt
                  </label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select treatment prompt...</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle form submission
                    setShowCreateForm(false);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Experiment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABTestingDashboard;
