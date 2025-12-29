import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
    Contact,
    ContactStatus,
    ContactSource,
    ContactActivity,
    EmailTemplate,
    EmailSequence,
    EmailJob,
} from '@/types';
import { contactsAdminService } from '@/services/contactsAdminService';
import { contactActivitiesAdminService } from '@/services/contactActivitiesAdminService';
import { emailTemplatesAdminService } from '@/services/emailTemplatesAdminService';
import { emailSequencesAdminService } from '@/services/emailSequencesAdminService';

type TabKey = 'activity' | 'details' | 'followup';
type FollowUpOption = 'none' | 'tomorrow' | 'three_days' | 'one_week' | 'custom';

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
        // fall through to other strategies
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

const toInputDateTimeLocal = (value: any): string => {
  const d = toDateValue(value);
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromInputDateTimeLocal = (value: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseVariables = (raw: string): Record<string, string> => {
  const vars: Record<string, string> = {};
  if (!raw) return vars;
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) {
      vars[key] = value;
    }
  }
  return vars;
};

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('activity');
  const [saving, setSaving] = useState(false);

  const [editStatus, setEditStatus] = useState<ContactStatus | ''>('');
  const [editNextFollowUp, setEditNextFollowUp] = useState<string>('');
  const [editNotesSummary, setEditNotesSummary] = useState<string>('');
  const [editOwnerUserId, setEditOwnerUserId] = useState<string>('');
  const [editTeam, setEditTeam] = useState<string>('');

  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [newCallDirection, setNewCallDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [newCallSummary, setNewCallSummary] = useState('');
  const [creatingCall, setCreatingCall] = useState(false);
  const [newMeetingSummary, setNewMeetingSummary] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [newCallFollowUpOption, setNewCallFollowUpOption] = useState<FollowUpOption>('none');
  const [newCallFollowUpCustom, setNewCallFollowUpCustom] = useState('');
  const [newMeetingFollowUpOption, setNewMeetingFollowUpOption] = useState<FollowUpOption>('none');
  const [newMeetingFollowUpCustom, setNewMeetingFollowUpCustom] = useState('');
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [emailSubjectOverride, setEmailSubjectOverride] = useState('');
  const [emailBodyHtmlOverride, setEmailBodyHtmlOverride] = useState('');
  const [emailVariablesText, setEmailVariablesText] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'email'>('all');
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loadingSequences, setLoadingSequences] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  const [schedulingSequence, setSchedulingSequence] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);
  const [emailJobs, setEmailJobs] = useState<EmailJob[]>([]);
  const [emailJobsLoading, setEmailJobsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchContact = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await contactsAdminService.getContact(id);
        if (!mounted) return;
        setContact(res.contact);
        setEditStatus(res.contact.status);
        setEditNextFollowUp(toInputDateTimeLocal(res.contact.nextFollowUpAt));
        setEditNotesSummary(res.contact.notesSummary || '');
        setEditOwnerUserId(res.contact.ownerUserId || '');
        setEditTeam(res.contact.team || '');
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load contact');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetchContact();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const fetchEmailJobs = async () => {
      if (!id) return;
      setEmailJobsLoading(true);
      try {
        const res = await contactsAdminService.listContactEmailJobs(id, { limit: 100 });
        if (!mounted) return;
        setEmailJobs(res.jobs || []);
      } catch (e: any) {
        if (!mounted) return;
        setError((prev) => prev || e?.message || 'Failed to load email statuses');
      } finally {
        if (mounted) setEmailJobsLoading(false);
      }
    };

    void fetchEmailJobs();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const fetchSequences = async () => {
      if (!id || activeTab !== 'followup') return;
      setLoadingSequences(true);
      setError(null);
      try {
        const res = await emailSequencesAdminService.listSequences({ onlyActive: true });
        if (!mounted) return;
        setSequences(res.sequences || []);
        if (res.sequences && res.sequences.length > 0 && !selectedSequenceId) {
          setSelectedSequenceId(res.sequences[0].id);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError((prev) => prev || e?.message || 'Failed to load email sequences');
      } finally {
        if (mounted) setLoadingSequences(false);
      }
    };

    if (activeTab === 'followup' && !loadingSequences && sequences.length === 0) {
      void fetchSequences();
    }

    return () => {
      mounted = false;
    };
  }, [id, activeTab]);

  useEffect(() => {
    let mounted = true;
    const fetchActivities = async () => {
      if (!id) return;
      setActivitiesLoading(true);
      try {
        const res = await contactActivitiesAdminService.listActivities(id, 50);
        if (!mounted) return;
        setActivities(res.activities || []);
      } catch (e: any) {
        // Reuse error surface but don't block the whole page
        if (!mounted) return;
        setError((prev) => prev || e?.message || 'Failed to load activities');
      } finally {
        if (mounted) setActivitiesLoading(false);
      }
    };

    void fetchActivities();
    return () => {
      mounted = false;
    };
  }, [id]);

  const sourceLabel = useMemo(() => {
    if (!contact) return '';
    return contact.source?.replace('_', ' ') || '';
  }, [contact]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return emailTemplates.find((t) => t.id === selectedTemplateId) || null;
  }, [emailTemplates, selectedTemplateId]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'email') {
      return activities.filter(
        (a) => a.type === 'email' || a.type === 'system_email',
      );
    }
    return activities;
  }, [activities, activityFilter]);

  const emailJobsById = useMemo(() => {
    const map: Record<string, EmailJob> = {};
    emailJobs.forEach((job) => {
      if (job && job.id) {
        map[job.id] = job;
      }
    });
    return map;
  }, [emailJobs]);

  const selectedSequence = useMemo(() => {
    if (!selectedSequenceId) return null;
    return sequences.find((s) => s.id === selectedSequenceId) || null;
  }, [sequences, selectedSequenceId]);

  const upcomingSteps = useMemo(() => {
    if (!selectedSequence) return [] as { stepNumber: number; waitDays: number; date: Date }[];
    const steps = [...selectedSequence.steps].sort((a, b) => a.stepNumber - b.stepNumber);
    const base = new Date();
    let cumulativeDays = 0;
    return steps.map((step) => {
      const waitDays =
        typeof step.waitDays === 'number' && step.waitDays >= 0 ? step.waitDays : 0;
      cumulativeDays += waitDays;
      const date = new Date(base.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);
      return {
        stepNumber: step.stepNumber,
        waitDays,
        date,
      };
    });
  }, [selectedSequence]);

  const computeNextFollowUpDate = (
    option: FollowUpOption,
    customValue: string,
  ): Date | undefined => {
    if (option === 'none') return undefined;
    if (option === 'custom') {
      const d = fromInputDateTimeLocal(customValue);
      return d ?? undefined;
    }
    const now = new Date();
    const d = new Date(now.getTime());
    if (option === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (option === 'three_days') {
      d.setDate(d.getDate() + 3);
      return d;
    }
    if (option === 'one_week') {
      d.setDate(d.getDate() + 7);
      return d;
    }
    return undefined;
  };

  const handleSaveDetails = async () => {
    if (!contact || !id) return;
    setSaving(true);
    setError(null);
    try {
      const nextDate = fromInputDateTimeLocal(editNextFollowUp);
      const updates: Partial<Contact> = {
        status: editStatus || contact.status,
        nextFollowUpAt: nextDate || null,
        notesSummary: editNotesSummary,
        ownerUserId: editOwnerUserId || null,
        team: editTeam || null,
      };
      const res = await contactsAdminService.updateContact(id, updates);
      setContact(res.contact);
      setEditStatus(res.contact.status);
      setEditNextFollowUp(toInputDateTimeLocal(res.contact.nextFollowUpAt));
      setEditNotesSummary(res.contact.notesSummary || '');
      setEditOwnerUserId(res.contact.ownerUserId || '');
      setEditTeam(res.contact.team || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNote = async () => {
    if (!id || !newNote.trim()) return;
    setCreatingNote(true);
    setError(null);
    try {
      const res = await contactActivitiesAdminService.createNote(id, newNote.trim());
      setNewNote('');
      // Prepend new activity for immediate feedback
      setActivities((prev) => [res.activity, ...prev]);
    } catch (e: any) {
      setError(e?.message || 'Failed to add note');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleCreateCall = async () => {
    if (!id || !newCallSummary.trim()) return;
    setCreatingCall(true);
    setError(null);
    try {
      const nextFollow = computeNextFollowUpDate(
        newCallFollowUpOption,
        newCallFollowUpCustom,
      );
      const metadata: Record<string, unknown> = {};
      if (nextFollow) {
        metadata.nextFollowUpAt = nextFollow.toISOString();
      }
      const res = await contactActivitiesAdminService.createCall(id, {
        direction: newCallDirection,
        summary: newCallSummary.trim(),
        metadata: Object.keys(metadata).length ? metadata : undefined,
      });
      setNewCallSummary('');
      setActivities((prev) => [res.activity, ...prev]);
      if (nextFollow && contact) {
        try {
          const updateRes = await contactsAdminService.updateContact(id, {
            nextFollowUpAt: nextFollow,
          });
          setContact(updateRes.contact);
          setEditNextFollowUp(toInputDateTimeLocal(updateRes.contact.nextFollowUpAt));
        } catch (updateError: any) {
          console.warn('Failed to update next follow-up after call activity', updateError);
        }
      }
      setNewCallFollowUpOption('none');
      setNewCallFollowUpCustom('');
    } catch (e: any) {
      setError(e?.message || 'Failed to log call');
    } finally {
      setCreatingCall(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!id || !newMeetingSummary.trim()) return;
    setCreatingMeeting(true);
    setError(null);
    try {
      const nextFollow = computeNextFollowUpDate(
        newMeetingFollowUpOption,
        newMeetingFollowUpCustom,
      );
      const metadata: Record<string, unknown> = {};
      if (nextFollow) {
        metadata.nextFollowUpAt = nextFollow.toISOString();
      }
      const res = await contactActivitiesAdminService.createMeeting(
        id,
        newMeetingSummary.trim(),
        Object.keys(metadata).length ? metadata : undefined,
      );
      setNewMeetingSummary('');
      setActivities((prev) => [res.activity, ...prev]);
      if (nextFollow && contact) {
        try {
          const updateRes = await contactsAdminService.updateContact(id, {
            nextFollowUpAt: nextFollow,
          });
          setContact(updateRes.contact);
          setEditNextFollowUp(toInputDateTimeLocal(updateRes.contact.nextFollowUpAt));
        } catch (updateError: any) {
          console.warn('Failed to update next follow-up after meeting activity', updateError);
        }
      }
      setNewMeetingFollowUpOption('none');
      setNewMeetingFollowUpCustom('');
    } catch (e: any) {
      setError(e?.message || 'Failed to log meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const ensureTemplatesLoaded = async () => {
    if (loadingTemplates || emailTemplates.length > 0) return;
    setLoadingTemplates(true);
    setError(null);
    try {
      const res = await emailTemplatesAdminService.listTemplates({ onlyActive: true });
      setEmailTemplates(res.templates || []);
      if (res.templates && res.templates.length > 0) {
        const first = res.templates[0];
        setSelectedTemplateId(first.id);
        setEmailSubjectOverride(first.subject || '');
        setEmailBodyHtmlOverride(first.bodyHtml || '');
        setEmailVariablesText((first.variables || []).join('\n'));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load email templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenSendEmail = async () => {
    setSendEmailOpen(true);
    await ensureTemplatesLoaded();
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = emailTemplates.find((t) => t.id === templateId);
    if (tmpl) {
      setEmailSubjectOverride(tmpl.subject || '');
      setEmailBodyHtmlOverride(tmpl.bodyHtml || '');
      setEmailVariablesText((tmpl.variables || []).join('\n'));
    }
  };

  const handleSendEmail = async () => {
    if (!id || !selectedTemplateId || !contact) return;
    setSendingEmail(true);
    setError(null);
    try {
      const variables = parseVariables(emailVariablesText);
      const res = await contactsAdminService.sendEmail(id, {
        templateId: selectedTemplateId,
        subjectOverride: emailSubjectOverride.trim() || undefined,
        bodyHtmlOverride: emailBodyHtmlOverride.trim() || undefined,
        variables,
      });

      if (res.activity) {
        const activity = res.activity as ContactActivity;
        setActivities((prev) => [activity, ...prev]);
      }

      setSendEmailOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleScheduleSequence = async () => {
    if (!id || !selectedSequenceId) return;
    setSchedulingSequence(true);
    setError(null);
    try {
      const res = await contactsAdminService.scheduleSequence(id, selectedSequenceId);
      setScheduledJobs(res.jobs || []);

      try {
        const refreshed = await contactsAdminService.getContact(id);
        setContact(refreshed.contact);
        setEditNextFollowUp(toInputDateTimeLocal(refreshed.contact.nextFollowUpAt));
      } catch (refreshErr: any) {
        console.warn(
          '[followup] Failed to refresh contact after scheduling sequence',
          refreshErr,
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to schedule follow-up sequence');
    } finally {
      setSchedulingSequence(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !contact) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-ethos-purple hover:underline"
        >
          ← Back to contacts
        </button>
        <div className="mt-4 text-sm text-gray-500">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-ethos-purple hover:underline"
        >
          ← Back to contacts
        </button>
        <div className="mt-4 text-sm text-gray-500">Contact not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm text-ethos-purple hover:underline"
      >
        ← Back to contacts
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ethos-navy">{contact.name || 'Untitled contact'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <a href={`mailto:${contact.email}`} className="text-ethos-purple hover:underline">
              {contact.email}
            </a>
            {contact.company && <span>• {contact.company}</span>}
            {sourceLabel && <span>• Source: {sourceLabel}</span>}
            <span>• Status: {contact.status.replace('_', ' ')}</span>
            {typeof contact.ownerUserId === 'string' && contact.ownerUserId && (
              <span>• Owner: {contact.ownerUserId}</span>
            )}
            {typeof contact.team === 'string' && contact.team && (
              <span>• Team: {contact.team}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {contact.tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-ethos-purple/5 px-2.5 py-1 text-xs font-medium text-ethos-purple"
            >
              {tag}
            </span>
          ))}
          {contact.tags && contact.tags.length > 4 && (
            <span className="text-xs text-gray-400">+{contact.tags.length - 4} more</span>
          )}
          <button
            type="button"
            onClick={handleOpenSendEmail}
            className="inline-flex items-center rounded-md border border-ethos-purple bg-white px-3 py-1.5 text-xs font-medium text-ethos-purple shadow-sm hover:bg-ethos-purple/5"
          >
            Send email
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <div className="border-b border-gray-200 flex gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'activity'
                ? 'border-ethos-purple text-ethos-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'details'
                ? 'border-ethos-purple text-ethos-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`py-2 px-1 border-b-2 font-medium ${
              activeTab === 'followup'
                ? 'border-ethos-purple text-ethos-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Follow-Up
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'activity' && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Add Note</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Use notes to capture call summaries, next steps, or context for this contact.
                </p>
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="Add an internal note about this contact..."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateNote}
                      disabled={creatingNote || !newNote.trim()}
                      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                        creatingNote || !newNote.trim()
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                      }`}
                    >
                      {creatingNote ? 'Saving...' : 'Save note'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Log Call</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Record quick notes about phone or video calls with this contact.
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="font-medium">Direction</span>
                    <div className="inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewCallDirection('outbound')}
                        className={`px-2 py-1 rounded-md min-w-[72px] text-center ${
                          newCallDirection === 'outbound'
                            ? 'bg-ethos-purple text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Outbound
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCallDirection('inbound')}
                        className={`px-2 py-1 rounded-md min-w-[72px] text-center ${
                          newCallDirection === 'inbound'
                            ? 'bg-ethos-purple text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Inbound
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="font-medium">Next follow-up</span>
                    <select
                      value={newCallFollowUpOption}
                      onChange={(e) => setNewCallFollowUpOption(e.target.value as FollowUpOption)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                    >
                      <option value="none">No change</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="three_days">In 3 days</option>
                      <option value="one_week">In 1 week</option>
                      <option value="custom">Pick date/time…</option>
                    </select>
                    {newCallFollowUpOption === 'custom' && (
                      <input
                        type="datetime-local"
                        value={newCallFollowUpCustom}
                        onChange={(e) => setNewCallFollowUpCustom(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                      />
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={newCallSummary}
                    onChange={(e) => setNewCallSummary(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="What was discussed, next steps, and any commitments."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateCall}
                      disabled={creatingCall || !newCallSummary.trim()}
                      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                        creatingCall || !newCallSummary.trim()
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                      }`}
                    >
                      {creatingCall ? 'Saving...' : 'Save call'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Log Meeting</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Capture key points from demos, discovery calls, or in-person meetings.
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="font-medium">Next follow-up</span>
                    <select
                      value={newMeetingFollowUpOption}
                      onChange={(e) =>
                        setNewMeetingFollowUpOption(e.target.value as FollowUpOption)
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                    >
                      <option value="none">No change</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="three_days">In 3 days</option>
                      <option value="one_week">In 1 week</option>
                      <option value="custom">Pick date/time…</option>
                    </select>
                    {newMeetingFollowUpOption === 'custom' && (
                      <input
                        type="datetime-local"
                        value={newMeetingFollowUpCustom}
                        onChange={(e) => setNewMeetingFollowUpCustom(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-ethos-purple focus:border-ethos-purple"
                      />
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={newMeetingSummary}
                    onChange={(e) => setNewMeetingSummary(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="What happened in the meeting and what happens next."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateMeeting}
                      disabled={creatingMeeting || !newMeetingSummary.trim()}
                      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                        creatingMeeting || !newMeetingSummary.trim()
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                      }`}
                    >
                      {creatingMeeting ? 'Saving...' : 'Save meeting'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Activity timeline</h2>
                <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-gray-500">
                  <span className="hidden sm:inline">Filter:</span>
                  <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setActivityFilter('all')}
                      className={`px-2 py-0.5 rounded-full ${
                        activityFilter === 'all'
                          ? 'bg-ethos-purple text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityFilter('email')}
                      className={`px-2 py-0.5 rounded-full ${
                        activityFilter === 'email'
                          ? 'bg-ethos-purple text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      Emails
                    </button>
                  </div>
                </div>
                {activitiesLoading && activities.length === 0 ? (
                  <div className="mt-3 text-xs text-gray-500">Loading activities...</div>
                ) : filteredActivities.length === 0 ? (
                  <div className="mt-3 text-xs text-gray-500">
                    {activityFilter === 'email'
                      ? 'No email activity yet for this contact.'
                      : 'No activity yet for this contact.'}
                  </div>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {filteredActivities.map((activity) => {
                      const metadata: any = (activity as any).metadata || {};
                      const jobId = typeof metadata.emailJobId === 'string' ? metadata.emailJobId : null;
                      const job = jobId ? emailJobsById[jobId] : undefined;

                      let statusLabel: string | null = null;
                      let statusClass = 'bg-gray-100 text-gray-600';

                      if (job) {
                        const status = job.status as any;
                        const hasBounced = (job as any).bouncedAt;
                        const hasClicked = (job as any).clickedAt;
                        const hasOpened = (job as any).openedAt;

                        if (hasBounced || status === 'failed') {
                          statusLabel = hasBounced ? 'Bounced' : 'Failed';
                          statusClass = 'bg-red-50 text-red-700';
                        } else if (hasClicked) {
                          statusLabel = 'Clicked';
                          statusClass = 'bg-emerald-50 text-emerald-700';
                        } else if (hasOpened) {
                          statusLabel = 'Opened';
                          statusClass = 'bg-emerald-50 text-emerald-700';
                        } else if (status === 'sent') {
                          statusLabel = 'Sent';
                          statusClass = 'bg-blue-50 text-blue-700';
                        } else if (status === 'sending') {
                          statusLabel = 'Sending';
                          statusClass = 'bg-blue-50 text-blue-700';
                        } else if (status === 'scheduled') {
                          statusLabel = 'Scheduled';
                          statusClass = 'bg-amber-50 text-amber-700';
                        } else if (status === 'cancelled') {
                          statusLabel = 'Cancelled';
                          statusClass = 'bg-gray-100 text-gray-500';
                        }
                      }

                      return (
                        <li key={activity.id} className="flex items-start gap-3 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-ethos-purple" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-ethos-purple uppercase">
                                {activity.type}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTime(activity.timestamp as any)}
                              </span>
                              {activity.direction && (
                                <span className="text-[11px] rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                  {activity.direction}
                                </span>
                              )}
                              {job && statusLabel && (
                                <span
                                  className={`text-[11px] rounded-full px-2 py-0.5 ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              )}
                              {emailJobsLoading && !jobId && activity.type === 'email' && (
                                <span className="text-[11px] text-gray-400">Loading status…</span>
                              )}
                            </div>
                            {activity.subject && (
                              <div className="mt-1 text-sm font-medium text-gray-900 truncate">
                                {activity.subject}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-600 whitespace-pre-line">
                              {activity.content || activity.snippet}
                            </div>
                            {(activity as any).metadata?.nextFollowUpAt && (
                              <div className="mt-1 text-[11px] text-emerald-600">
                                Next follow-up set to{' '}
                                {formatDateTime((activity as any).metadata.nextFollowUpAt)}
                              </div>
                            )}
                            {activity.createdByName && (
                              <div className="mt-1 text-[11px] text-gray-400">
                                Logged by {activity.createdByName}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <div className="text-sm text-gray-900">{contact.name || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-ethos-purple hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                  <div className="text-sm text-gray-900">{contact.company || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
                  <div className="text-sm text-gray-900">{contact.jobTitle || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <div className="text-sm text-gray-900">{contact.phone || '-'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={editStatus || ''}
                    onChange={(e) => setEditStatus(e.target.value as ContactStatus)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                  <select
                    value={contact.source}
                    disabled
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Owner (user ID)</label>
                  <input
                    type="text"
                    value={editOwnerUserId}
                    onChange={(e) => setEditOwnerUserId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="Unassigned"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Set which internal user owns this contact. Used for My Contacts filtering.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Team</label>
                  <input
                    type="text"
                    value={editTeam}
                    onChange={(e) => setEditTeam(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder="Optional team label"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last Contacted</label>
                  <div className="text-sm text-gray-900">
                    {formatDateTime(contact.lastContactedAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Next Follow-Up</label>
                  <input
                    type="datetime-local"
                    value={editNextFollowUp}
                    onChange={(e) => setEditNextFollowUp(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Set when you plan to contact this lead next. Used for My Contacts highlighting.
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  rows={4}
                  value={editNotesSummary}
                  onChange={(e) => setEditNotesSummary(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder="Summary of key information, context, or next steps for this contact."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDetails}
                  className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                    saving
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Follow-Up Overview</h2>
                <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Current Status</dt>
                    <dd className="text-gray-900 capitalize">{contact.status.replace('_', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Next Follow-Up</dt>
                    <dd className="text-gray-900">{formatDateTime(contact.nextFollowUpAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Last Contacted</dt>
                    <dd className="text-gray-900">{formatDateTime(contact.lastContactedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Primary Source</dt>
                    <dd className="text-gray-900">{sourceLabel || '-'}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-ethos-navy">Automated Sequences</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Schedule a predefined email sequence to keep this contact warm without manual
                  follow-ups.
                </p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Sequence
                      </label>
                      <select
                        value={selectedSequenceId}
                        onChange={(e) => setSelectedSequenceId(e.target.value)}
                        disabled={loadingSequences || sequences.length === 0}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                      >
                        {loadingSequences && <option>Loading sequences…</option>}
                        {!loadingSequences && sequences.length === 0 && (
                          <option value="">No active sequences</option>
                        )}
                        {!loadingSequences &&
                          sequences.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div className="font-medium text-gray-600">Next automated follow-up</div>
                      <div className="text-gray-900 mt-0.5">
                        {upcomingSteps.length > 0
                          ? formatDateTime(upcomingSteps[0].date)
                          : contact.nextFollowUpAt
                          ? formatDateTime(contact.nextFollowUpAt)
                          : 'Not scheduled'}
                      </div>
                    </div>
                  </div>

                  {selectedSequence && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <div className="text-[11px] font-medium text-gray-500 mb-1">
                        Sequence steps
                      </div>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {upcomingSteps.map((step) => (
                          <li key={step.stepNumber} className="flex items-center justify-between">
                            <span>Step {step.stepNumber}</span>
                            <span className="text-gray-500">
                              {step.waitDays === 0
                                ? 'Immediately'
                                : `+${step.waitDays} day${step.waitDays === 1 ? '' : 's'}`}{' '}
                              • {formatDateTime(step.date)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheduledJobs.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-2">
                      <div className="text-[11px] font-medium text-gray-500 mb-1">
                        Recently scheduled emails
                      </div>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {scheduledJobs.map((job) => (
                          <li key={job.id} className="flex items-center justify-between">
                            <span>Step {job.stepNumber ?? '—'}</span>
                            <span className="text-gray-500">
                              {formatDateTime((job as any).scheduledAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleScheduleSequence}
                      disabled={
                        schedulingSequence ||
                        loadingSequences ||
                        !selectedSequenceId ||
                        sequences.length === 0
                      }
                      className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                        schedulingSequence || loadingSequences || !selectedSequenceId || sequences.length === 0
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                      }`}
                    >
                      {schedulingSequence ? 'Scheduling…' : 'Schedule sequence'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {sendEmailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border border-gray-200 p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ethos-navy">Send Email</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Choose a template and optional variables. Email will be sent via Resend and logged as an
                  activity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendEmailOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    disabled={loadingTemplates || emailTemplates.length === 0}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    {loadingTemplates && <option>Loading templates…</option>}
                    {!loadingTemplates && emailTemplates.length === 0 && (
                      <option value="">No active templates</option>
                    )}
                    {!loadingTemplates &&
                      emailTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <div className="text-sm text-gray-900">{contact.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubjectOverride}
                  onChange={(e) => setEmailSubjectOverride(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder={selectedTemplate ? selectedTemplate.subject : ''}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">HTML body</label>
                <textarea
                  rows={6}
                  value={emailBodyHtmlOverride}
                  onChange={(e) => setEmailBodyHtmlOverride(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  placeholder={selectedTemplate ? selectedTemplate.bodyHtml : ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Variables</label>
                  <textarea
                    rows={4}
                    value={emailVariablesText}
                    onChange={(e) => setEmailVariablesText(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                    placeholder={
                      selectedTemplate && selectedTemplate.variables?.length
                        ? selectedTemplate.variables
                            .map((v) => `${v}=...`)
                            .join('\n')
                        : 'one=value\nother=value'
                    }
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    One variable per line in the format <code>key=value</code>. Use these in templates as
                    <code className="ml-1">{"{{key}}"}</code>.
                  </p>
                </div>
                {selectedTemplate && selectedTemplate.variables?.length ? (
                  <div className="text-[11px] text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                    <div className="font-semibold text-gray-700 mb-1">Available placeholders</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {selectedTemplate.variables.map((v) => (
                        <li key={v}>
                          <code>{`{{${v}}}`}</code>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2">
                      You can also use <code>{"{{contact.name}}"}</code>,{' '}
                      <code>{"{{contact.email}}"}</code>, <code>{"{{contact.company}}"}</code>, etc.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSendEmailOpen(false)}
                  disabled={sendingEmail}
                  className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                    sendingEmail
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={
                    sendingEmail ||
                    loadingTemplates ||
                    !selectedTemplateId ||
                    !emailSubjectOverride.trim() ||
                    !emailBodyHtmlOverride.trim()
                  }
                  className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                    sendingEmail ||
                    loadingTemplates ||
                    !selectedTemplateId ||
                    !emailSubjectOverride.trim() ||
                    !emailBodyHtmlOverride.trim()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-ethos-purple bg-ethos-purple text-white hover:bg-ethos-purple/90'
                  }`}
                >
                  {sendingEmail ? 'Sending…' : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetailPage;
