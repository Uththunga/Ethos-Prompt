import React, { useEffect, useState } from 'react';
import type { EmailTemplate, EmailTemplateType } from '@/types';
import { emailTemplatesAdminService } from '@/services/emailTemplatesAdminService';

const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  'initial_followup',
  'reminder',
  'nps',
  'custom',
];

const toDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  return null;
};

const formatDateTime = (value: any): string => {
  const d = toDateValue(value);
  return d ? d.toLocaleString() : '-';
};

type FormMode = 'none' | 'create' | 'edit';

export const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<EmailTemplateType>('custom');
  const [formSubject, setFormSubject] = useState('');
  const [formBodyHtml, setFormBodyHtml] = useState('');
  const [formBodyText, setFormBodyText] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVariablesText, setFormVariablesText] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await emailTemplatesAdminService.listTemplates();
        setTemplates(res.templates || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load email templates');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormType('custom');
    setFormSubject('');
    setFormBodyHtml('');
    setFormBodyText('');
    setFormDescription('');
    setFormVariablesText('');
    setFormIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormMode('create');
  };

  const openEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setFormName(template.name);
    setFormType(template.type);
    setFormSubject(template.subject);
    setFormBodyHtml(template.bodyHtml);
    setFormBodyText(template.bodyText || '');
    setFormDescription(template.description || '');
    setFormVariablesText((template.variables || []).join(', '));
    setFormIsActive(template.isActive);
    setFormMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSubject.trim() || !formBodyHtml.trim()) {
      setError('Name, subject, and HTML body are required');
      return;
    }
    setSaving(true);
    setError(null);
    const variables = formVariablesText
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    try {
      if (formMode === 'create') {
        const res = await emailTemplatesAdminService.createTemplate({
          name: formName.trim(),
          type: formType,
          subject: formSubject,
          bodyHtml: formBodyHtml,
          description: formDescription.trim() || undefined,
          bodyText: formBodyText.trim() || undefined,
          variables,
          isActive: formIsActive,
        });
        setTemplates((prev) => [res.template, ...prev]);
      } else if (formMode === 'edit' && editingId) {
        const res = await emailTemplatesAdminService.updateTemplate(editingId, {
          name: formName.trim(),
          type: formType,
          subject: formSubject,
          bodyHtml: formBodyHtml,
          description: formDescription.trim() || undefined,
          bodyText: formBodyText.trim() || undefined,
          variables,
          isActive: formIsActive,
        });
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? res.template : t)),
        );
      }
      setFormMode('none');
      resetForm();
    } catch (e: any) {
      setError(e?.message || 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    const ok = window.confirm(`Delete template "${template.name}"?`);
    if (!ok) return;
    try {
      await emailTemplatesAdminService.deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete email template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">Email Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage reusable email templates used for manual follow-ups via Resend.
          </p>
        </div>
        <div className="flex gap-2">
          {formMode === 'none' ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center rounded-md border border-ethos-purple bg-ethos-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-ethos-purple/90"
            >
              New template
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFormMode('none');
                resetForm();
              }}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {formMode !== 'none' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-ethos-navy">
            {formMode === 'create' ? 'Create template' : 'Edit template'}
          </h2>
          <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as EmailTemplateType)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                >
                  {EMAIL_TEMPLATE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="Short internal description of when to use this template"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="Subject line (you can use {{contact.name}} and variables)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">HTML body</label>
                <textarea
                  rows={6}
                  value={formBodyHtml}
                  onChange={(e) => setFormBodyHtml(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Main email body (HTML or plain text). Use {{contact.email}} or {{firstName}} style placeholders."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Text body (optional)</label>
                <textarea
                  rows={6}
                  value={formBodyText}
                  onChange={(e) => setFormBodyText(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Plain-text version for clients that do not render HTML"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Variables</label>
                <input
                  type="text"
                  value={formVariablesText}
                  onChange={(e) => setFormVariablesText(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Comma separated, e.g. firstName, company, bookingLink"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="email-template-active"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 text-ethos-purple border-gray-300 rounded"
                />
                <label htmlFor="email-template-active" className="text-xs text-gray-700">
                  Active (available in Send Email modal)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setFormMode('none');
                  resetForm();
                }}
                className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                  saving
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                  saving
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                }`}
              >
                {saving ? 'Saving...' : formMode === 'create' ? 'Create template' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ethos-navy">Existing templates</h2>
          {loading && <span className="text-xs text-gray-400">Loading…</span>}
        </div>
        {templates.length === 0 && !loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No email templates yet. Use the New template button to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Subject</th>
                  <th className="px-4 py-2 text-left font-medium">Active</th>
                  <th className="px-4 py-2 text-left font-medium">Updated</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {template.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-gray-600 capitalize">
                      {template.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-gray-700">
                      <div className="line-clamp-2">{template.subject}</div>
                    </td>
                    <td className="px-4 py-2 align-top text-xs">
                      <span
                        className={
                          template.isActive
                            ? 'inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                            : 'inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500'
                        }
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-gray-500">
                      {formatDateTime(template.updatedAt as any)}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-xs">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(template)}
                          className="text-ethos-purple hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
