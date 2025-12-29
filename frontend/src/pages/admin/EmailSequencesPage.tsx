import React, { useEffect, useMemo, useState } from 'react';
import type { EmailSequence, EmailSequenceStep } from '@/types';
import { emailSequencesAdminService } from '@/services/emailSequencesAdminService';

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

type FormMode = 'none' | 'create' | 'edit';

export const EmailSequencesPage: React.FC = () => {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSteps, setFormSteps] = useState<EmailSequenceStep[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await emailSequencesAdminService.listSequences();
        setSequences(res.sequences || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load email sequences');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setFormSteps([]);
  };

  const openCreate = () => {
    resetForm();
    setFormMode('create');
  };

  const openEdit = (sequence: EmailSequence) => {
    setEditingId(sequence.id);
    setFormName(sequence.name);
    setFormDescription(sequence.description || '');
    setFormIsActive(sequence.isActive);
    setFormSteps(Array.isArray(sequence.steps) ? sequence.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber) : []);
    setFormMode('edit');
  };

  const addStep = () => {
    setFormSteps((prev) => {
      const nextStepNumber = prev.length > 0 ? Math.max(...prev.map((s) => s.stepNumber || 0)) + 1 : 1;
      return [
        ...prev,
        {
          stepNumber: nextStepNumber,
          templateId: '',
          waitDays: prev.length === 0 ? 0 : 3,
        },
      ];
    });
  };

  const updateStep = (index: number, updates: Partial<EmailSequenceStep>) => {
    setFormSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } as EmailSequenceStep : step)),
    );
  };

  const removeStep = (index: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const sortedSequences = useMemo(
    () => sequences.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [sequences],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Name is required');
      return;
    }
    const cleanedSteps = formSteps
      .map((step) => ({
        ...step,
        stepNumber: Number(step.stepNumber) || 0,
        waitDays: Number(step.waitDays) || 0,
      }))
      .filter((step) => step.templateId && step.templateId.trim().length > 0);
    if (cleanedSteps.length === 0) {
      setError('At least one step with a templateId is required');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (formMode === 'create') {
        const res = await emailSequencesAdminService.createSequence({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          steps: cleanedSteps,
        });
        setSequences((prev) => [res.sequence, ...prev]);
      } else if (formMode === 'edit' && editingId) {
        const res = await emailSequencesAdminService.updateSequence(editingId, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          steps: cleanedSteps,
        } as Partial<EmailSequence>);
        setSequences((prev) => prev.map((s) => (s.id === editingId ? res.sequence : s)));
      }
      setFormMode('none');
      resetForm();
    } catch (e: any) {
      setError(e?.message || 'Failed to save email sequence');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sequence: EmailSequence) => {
    const ok = window.confirm(`Delete sequence "${sequence.name}"?`);
    if (!ok) return;
    try {
      await emailSequencesAdminService.deleteSequence(sequence.id);
      setSequences((prev) => prev.filter((s) => s.id !== sequence.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete email sequence');
    }
  };

  const summarizeSteps = (steps: EmailSequenceStep[]): string => {
    if (!steps || steps.length === 0) return 'No steps';
    const sorted = steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);
    const parts = sorted.map((step) => {
      const day = step.waitDays || 0;
      if (day === 0) return `Day 0 (template ${step.templateId})`;
      return `+${day}d (template ${step.templateId})`;
    });
    return `${sorted.length} steps: ${parts.join(', ')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">Email Sequences</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automated follow-up sequences that schedule email jobs for contacts.
          </p>
        </div>
        <div className="flex gap-2">
          {formMode === 'none' ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center rounded-md border border-ethos-purple bg-ethos-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-ethos-purple/90"
            >
              New sequence
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
            {formMode === 'create' ? 'Create sequence' : 'Edit sequence'}
          </h2>
          <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
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
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <input
                  id="email-sequence-active"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 text-ethos-purple border-gray-300 rounded"
                />
                <label htmlFor="email-sequence-active" className="text-xs text-gray-700">
                  Active (auto scheduling enabled)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                placeholder="Short internal description of when this sequence should be used"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Steps</h3>
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center rounded-md border border-ethos-purple bg-white px-3 py-1 text-xs font-medium text-ethos-purple shadow-sm hover:bg-ethos-purple/5"
                >
                  Add step
                </button>
              </div>
              {formSteps.length === 0 ? (
                <p className="text-xs text-gray-500">No steps yet. Add at least one step.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Step #</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Template ID</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Wait (days)</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Condition (read-only)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formSteps.map((step, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              min={1}
                              value={step.stepNumber}
                              onChange={(e) =>
                                updateStep(index, { stepNumber: Number(e.target.value) || 1 })
                              }
                              className="w-20 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={step.templateId}
                              onChange={(e) =>
                                updateStep(index, { templateId: e.target.value })
                              }
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                              placeholder="Email template ID"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              min={0}
                              value={step.waitDays}
                              onChange={(e) =>
                                updateStep(index, { waitDays: Number(e.target.value) || 0 })
                              }
                              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-[11px] text-gray-500">
                            {step.condition
                              ? `${step.condition.field} ${step.condition.op} ${String(
                                  step.condition.value,
                                )}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                {saving
                  ? 'Saving...'
                  : formMode === 'create'
                  ? 'Create sequence'
                  : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ethos-navy">Existing sequences</h2>
          {loading && <span className="text-xs text-gray-400">Loading…</span>}
        </div>
        {sortedSequences.length === 0 && !loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No email sequences yet. Use the New sequence button to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Active</th>
                  <th className="px-4 py-2 text-left font-medium">Steps</th>
                  <th className="px-4 py-2 text-left font-medium">Updated</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSequences.map((sequence) => (
                  <tr key={sequence.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-gray-900">{sequence.name}</div>
                      {sequence.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {sequence.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs">
                      <span
                        className={
                          sequence.isActive
                            ? 'inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                            : 'inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500'
                        }
                      >
                        {sequence.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-gray-700">
                      {summarizeSteps(sequence.steps || [])}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-gray-500">
                      {formatDateTime((sequence as any).updatedAt)}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-xs">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(sequence)}
                          className="text-ethos-purple hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sequence)}
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

export default EmailSequencesPage;
