import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contact, ContactSource, ContactStatus } from '@/types';
import { contactsAdminService } from '@/services/contactsAdminService';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS: ContactStatus[] = [
  'new',
  'in_progress',
  'responded',
  'qualified',
  'closed_won',
  'closed_lost',
];

const SOURCE_OPTIONS: ContactSource[] = [
  'roi_calculator',
  'quotation',
  'contact_form',
  'exit_intent',
  'manual',
  'import',
  'other',
];

const PAGE_SIZE = 20;

const formatDate = (value: any): string => {
  if (!value) return '-';
  try {
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'string') return new Date(value).toLocaleString();
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
  } catch {
    return String(value);
  }
  return String(value);
};

const badgeClassForStatus = (status: ContactStatus): string => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'responded':
      return 'bg-emerald-100 text-emerald-800';
    case 'qualified':
      return 'bg-indigo-100 text-indigo-800';
    case 'closed_won':
      return 'bg-green-100 text-green-800';
    case 'closed_lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ContactsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ContactSource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await contactsAdminService.listContacts({
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
          source: sourceFilter === 'all' ? undefined : sourceFilter,
        });
        if (!mounted) return;
        setContacts(res.contacts || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load contacts');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (currentUser) {
      void fetchContacts();
    }
    return () => {
      mounted = false;
    };
  }, [currentUser, page, statusFilter, sourceFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = c.name?.toLowerCase() || '';
      const email = c.email?.toLowerCase() || '';
      const company = c.company?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || company.includes(q);
    });
  }, [contacts, search]);

  const canPrev = page > 1;
  const canNext = contacts.length === PAGE_SIZE; // heuristic

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">Contacts</h1>
          <p className="text-sm text-ethos-gray">
            View and manage all leads unified from ROI calculators, contact forms, quotations, and exit-intent.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="contacts-search">
            Search
          </label>
          <input
            id="contacts-search"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or company"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContactStatus | 'all');
              setPage(1);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as ContactSource | 'all');
              setPage(1);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
          >
            <option value="all">All sources</option>
            {SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>
                {source.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Contacted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Next Follow-Up
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={8}>
                    Loading contacts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={8}>
                    No contacts found.
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/admin/contacts/${encodeURIComponent(contact.id)}`)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{contact.name || '-'}</div>
                      {contact.tags?.length ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-ethos-purple/5 px-2 py-0.5 text-[11px] font-medium text-ethos-purple"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-[11px] text-gray-400">
                              +{contact.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-ethos-purple hover:underline"
                      >
                        {contact.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{contact.company || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                      {contact.source?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClassForStatus(
                          contact.status,
                        )}`}
                      >
                        {contact.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {contact.ownerUserId || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(contact.lastContactedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(contact.nextFollowUpAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Page {page}
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

export default ContactsPage;
