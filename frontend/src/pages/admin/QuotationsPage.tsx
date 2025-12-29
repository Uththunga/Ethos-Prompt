/**
 * QuotationsPage - Admin page for managing quotation requests
 * Lists all quotations with filtering by status, service, and date range
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationAdminService } from '@/services/quotationAdminService';
import { useAuth } from '@/contexts/AuthContext';
import type { QuotationDocument, QuotationStatus } from '@/types/quotation';
import type { ServiceContext } from '@/components/marketing/quotation/types';

// Status options for filtering
const STATUS_OPTIONS: QuotationStatus[] = [
  'pending',
  'reviewed',
  'quoted',
  'converted',
  'declined',
];

// Service options for filtering
const SERVICE_OPTIONS: { value: ServiceContext; label: string }[] = [
  { value: 'smart-assistant', label: 'Smart Assistant' },
  { value: 'system-integration', label: 'System Integration' },
  { value: 'intelligent-applications', label: 'Intelligent Applications' },
  { value: 'solutions', label: 'AI Solutions' },
];

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const PAGE_SIZE = 20;

// Format date for display
const formatDate = (value: any): string => {
  if (!value) return '-';
  try {
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string') return new Date(value).toLocaleDateString();
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
    }
  } catch {
    return String(value);
  }
  return String(value);
};

// Format relative time
const formatRelativeTime = (value: any): string => {
  if (!value) return '-';
  try {
    const date = value instanceof Date ? value :
      typeof value === 'object' && typeof value.toDate === 'function' ? value.toDate() :
      new Date(value);

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(value);
  } catch {
    return '-';
  }
};

// Status badge styling
const badgeClassForStatus = (status: QuotationStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'quoted':
      return 'bg-indigo-100 text-indigo-800';
    case 'converted':
      return 'bg-green-100 text-green-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Service label helper
const getServiceLabel = (serviceContext: ServiceContext): string => {
  const service = SERVICE_OPTIONS.find(s => s.value === serviceContext);
  return service?.label || serviceContext;
};

export const QuotationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceContext | 'all'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch quotations
  useEffect(() => {
    let mounted = true;

    const fetchQuotations = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await quotationAdminService.listQuotations({
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
          serviceContext: serviceFilter === 'all' ? undefined : serviceFilter,
          dateRange: dateRangeFilter,
        });

        if (!mounted) return;
        setQuotations(res.quotations || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load quotations');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (currentUser) {
      void fetchQuotations();
    }

    return () => {
      mounted = false;
    };
  }, [currentUser, page, statusFilter, serviceFilter, dateRangeFilter]);

  // Client-side search filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter((quote) => {
      const company = quote.companyName?.toLowerCase() || '';
      const contact = quote.contactName?.toLowerCase() || '';
      const email = quote.contactEmail?.toLowerCase() || '';
      const ref = quote.referenceNumber?.toLowerCase() || '';
      return company.includes(q) || contact.includes(q) || email.includes(q) || ref.includes(q);
    });
  }, [quotations, search]);

  const canPrev = page > 1;
  const canNext = quotations.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">Quotations</h1>
          <p className="text-sm text-ethos-gray">
            View and manage all quotation requests. Click a row to view details.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="quotations-search">
            Search
          </label>
          <input
            id="quotations-search"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by company, contact, email, or reference"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as QuotationStatus | 'all');
              setPage(1);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value as ServiceContext | 'all');
              setPage(1);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="all">All services</option>
            {SERVICE_OPTIONS.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value as 'today' | '7d' | '30d' | 'all');
              setPage(1);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && quotations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={8}>
                    Loading quotations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={8}>
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/admin/quotations/${encodeURIComponent(quote.id)}`)}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-ethos-purple">{quote.referenceNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {quote.companyName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{quote.contactName || '-'}</div>
                      <div className="text-xs text-gray-500">{quote.contactEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getServiceLabel(quote.serviceContext)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {quote.packageName || quote.packageType || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClassForStatus(quote.status)}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {quote.assignedToName || quote.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatRelativeTime(quote.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Page {page} • {filtered.length} results
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                !canPrev || loading
                  ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                !canNext || loading
                  ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsPage;
