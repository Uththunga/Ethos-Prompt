import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmailJob, EmailJobStatus, EmailEvent } from '@/types';
import { emailJobsAdminService } from '@/services/emailJobsAdminService';

const STATUS_OPTIONS: (EmailJobStatus | 'all')[] = [
  'all',
  'scheduled',
  'sending',
  'sent',
  'failed',
  'cancelled',
];

const toDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    if (typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate();
      } catch {
        // fall through
      }
    }
    const secondsField =
      typeof (value as any).seconds === 'number'
        ? (value as any).seconds
        : typeof (value as any)._seconds === 'number'
        ? (value as any)._seconds
        : null;
    if (secondsField !== null) {
      const nanosField =
        typeof (value as any).nanoseconds === 'number'
          ? (value as any).nanoseconds
          : typeof (value as any)._nanoseconds === 'number'
          ? (value as any)._nanoseconds
          : 0;
      const ms = secondsField * 1000 + Math.floor(nanosField / 1_000_000);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
};

const formatDateTime = (value: any): string => {
  const d = toDateValue(value);
  return d ? d.toLocaleString() : '-';
};

const badgeClassForStatus = (status: EmailJobStatus): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'sending':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'sent':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'failed':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'cancelled':
      return 'bg-gray-50 text-gray-600 border border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
};

export const EmailJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [eventsByJobId, setEventsByJobId] = useState<Record<string, EmailEvent[]>>({});
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingEventsForJob, setLoadingEventsForJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<EmailJobStatus | 'all'>('all');
  const [contactIdFilter, setContactIdFilter] = useState('');
  const [sequenceIdFilter, setSequenceIdFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      setLoadingJobs(true);
      setError(null);
      try {
        const res = await emailJobsAdminService.listJobs({
          status: statusFilter,
          contactId: contactIdFilter.trim() || undefined,
          sequenceId: sequenceIdFilter.trim() || undefined,
          limit: 100,
        });
        if (!mounted) return;
        setJobs(res.jobs || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load email jobs');
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    };
    void fetchJobs();
    return () => {
      mounted = false;
    };
  }, [statusFilter, contactIdFilter, sequenceIdFilter]);

  const handleLoadEvents = async (jobId: string) => {
    if (loadingEventsForJob === jobId) return;
    setLoadingEventsForJob(jobId);
    setError(null);
    try {
      const res = await emailJobsAdminService.listEvents({ emailJobId: jobId, limit: 20 });
      setEventsByJobId((prev) => ({ ...prev, [jobId]: res.events || [] }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load email events');
    } finally {
      setLoadingEventsForJob(null);
    }
  };

  const hasFilters = useMemo(() => {
    return statusFilter !== 'all' || !!contactIdFilter.trim() || !!sequenceIdFilter.trim();
  }, [statusFilter, contactIdFilter, sequenceIdFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">Email Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Operations view of all email jobs and their delivery events across contacts and sequences.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmailJobStatus | 'all')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Contact ID</label>
          <input
            type="text"
            value={contactIdFilter}
            onChange={(e) => setContactIdFilter(e.target.value)}
            placeholder="Filter by contactId"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          />
        </div>
        <div className="min-w-[220px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Sequence ID</label>
          <input
            type="text"
            value={sequenceIdFilter}
            onChange={(e) => setSequenceIdFilter(e.target.value)}
            placeholder="Filter by sequenceId (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setContactIdFilter('');
              setSequenceIdFilter('');
            }}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact / Sequence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Events
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingJobs && jobs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={6}>
                    Loading email jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={6}>
                    No email jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const events = eventsByJobId[job.id] || [];
                  const hasEvents = events.length > 0;

                  return (
                    <tr key={job.id} className="align-top">
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <div className="font-mono text-[11px] text-gray-700">{job.id}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          Created: {formatDateTime((job as any).createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/contacts/${job.contactId}`)}
                          className="font-mono text-[11px] text-ethos-purple hover:underline"
                        >
                          Contact: {job.contactId}
                        </button>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {job.sequenceId ? `Sequence: ${job.sequenceId} (step ${job.stepNumber ?? '-'})` : 'Manual email'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <div className="font-mono text-[11px] text-gray-700">Template: {job.templateId}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          Provider ID: {job.providerMessageId || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <div>Type: {job.scheduleType}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          Scheduled: {formatDateTime((job as any).scheduledAt)}
                        </div>
                        {job.sentAt && (
                          <div className="mt-1 text-[11px] text-gray-500">
                            Sent: {formatDateTime((job as any).sentAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClassForStatus(job.status)}`}>
                          {job.status}
                        </span>
                        {job.lastError && (
                          <div className="mt-1 text-[11px] text-red-600 max-w-xs truncate" title={job.lastError}>
                            {job.lastError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleLoadEvents(job.id)}
                          disabled={loadingEventsForJob === job.id}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          {loadingEventsForJob === job.id ? 'Loading…' : hasEvents ? 'Refresh events' : 'Load events'}
                        </button>
                        {hasEvents && (
                          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                            {events.map((ev) => (
                              <li key={ev.id} className="text-[11px] text-gray-700">
                                <span className="font-medium">{ev.type}</span>
                                <span className="text-gray-400">
                                  {' '}
                                  • {formatDateTime((ev as any).timestamp)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailJobsPage;
