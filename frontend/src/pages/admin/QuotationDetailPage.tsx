/**
 * QuotationDetailPage - View and manage individual quotation
 * Shows full quotation data, allows status updates and assignment
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationAdminService } from '@/services/quotationAdminService';
import { useAuth } from '@/contexts/AuthContext';
import type { QuotationDocument, QuotationStatus } from '@/types/quotation';
import { ArrowLeft, Calendar, User, Tag, FileText, Globe, DollarSign, Settings } from 'lucide-react';

// Status options
const STATUS_OPTIONS: { value: QuotationStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  { value: 'quoted', label: 'Quoted', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-800' },
];

// Format date helper
const formatDate = (value: any): string => {
  if (!value) return '-';
  try {
    const date = value instanceof Date ? value :
      typeof value === 'object' && typeof value.toDate === 'function' ? value.toDate() :
      new Date(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
};

// Section component for organized display
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children
}) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
      {icon}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Field display component
const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2">
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
  </div>
);

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [quotation, setQuotation] = useState<QuotationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState<QuotationStatus | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Fetch quotation
  useEffect(() => {
    if (!id || !currentUser) return;

    const fetchQuotation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await quotationAdminService.getQuotation(id);
        setQuotation(res.quotation);
        setEditStatus(res.quotation.status);
        setEditNotes(res.quotation.internalNotes || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    };

    void fetchQuotation();
  }, [id, currentUser]);

  // Save changes
  const handleSave = async () => {
    if (!id || !quotation) return;

    setSaving(true);
    try {
      const updates: any = {};
      if (editStatus !== quotation.status) updates.status = editStatus;
      if (editNotes !== (quotation.internalNotes || '')) updates.internalNotes = editNotes;

      if (Object.keys(updates).length > 0) {
        const res = await quotationAdminService.updateQuotation(id, updates);
        setQuotation(res.quotation);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading quotation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/quotations')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotations
        </button>
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-12 text-gray-500">
        Quotation not found
      </div>
    );
  }

  const formData = quotation.formData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/quotations')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </button>
          <h1 className="text-2xl font-bold text-ethos-navy">
            {quotation.referenceNumber}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {quotation.companyName} • {quotation.serviceName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={editStatus || quotation.status}
            onChange={(e) => setEditStatus(e.target.value as QuotationStatus)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ethos-purple"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-ethos-purple text-white rounded-md text-sm font-medium hover:bg-ethos-purple/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Section title="Contact Information" icon={<User className="w-4 h-4 text-gray-500" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={quotation.contactName} />
            <Field label="Company" value={quotation.companyName} />
            <Field label="Email" value={
              <a href={`mailto:${quotation.contactEmail}`} className="text-ethos-purple hover:underline">
                {quotation.contactEmail}
              </a>
            } />
            <Field label="Phone" value={quotation.contactPhone} />
            <Field label="Industry" value={formData.industry} />
            <Field label="Company Size" value={formData.companySize} />
          </div>
        </Section>

        {/* Service Details */}
        <Section title="Service Details" icon={<Tag className="w-4 h-4 text-gray-500" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service" value={quotation.serviceName} />
            <Field label="Package" value={quotation.packageName || quotation.packageType || '-'} />
            <Field label="Submitted" value={formatDate(quotation.createdAt)} />
            <Field label="Status" value={
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                STATUS_OPTIONS.find(s => s.value === quotation.status)?.color || 'bg-gray-100'
              }`}>
                {quotation.status}
              </span>
            } />
          </div>
        </Section>

        {/* Project Scope */}
        <Section title="Project Scope" icon={<FileText className="w-4 h-4 text-gray-500" />}>
          <Field label="Description" value={formData.projectDescription} />
          <Field label="Primary Goals" value={
            formData.primaryGoals?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {formData.primaryGoals.map((goal: string) => (
                  <span key={goal} className="px-2 py-0.5 bg-ethos-purple/10 text-ethos-purple rounded text-xs">
                    {goal}
                  </span>
                ))}
              </div>
            ) : '-'
          } />
          <Field label="Features" value={
            formData.specificFeatures?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {formData.specificFeatures.map((feat: string) => (
                  <span key={feat} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {feat}
                  </span>
                ))}
              </div>
            ) : '-'
          } />
        </Section>

        {/* Technical Requirements */}
        <Section title="Technical Requirements" icon={<Settings className="w-4 h-4 text-gray-500" />}>
          <Field label="Existing Systems" value={
            formData.existingSystems?.length > 0 ? formData.existingSystems.join(', ') : '-'
          } />
          <Field label="Integration Needs" value={formData.integrationNeeds} />
          <Field label="Data Volume" value={formData.dataVolume} />
          <Field label="Security Requirements" value={
            formData.securityRequirements?.length > 0 ? formData.securityRequirements.join(', ') : '-'
          } />
        </Section>

        {/* Timeline & Budget */}
        <Section title="Timeline & Budget" icon={<DollarSign className="w-4 h-4 text-gray-500" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timeline" value={formData.desiredTimeline} />
            <Field label="Budget Range" value={formData.budgetRange} />
            <Field label="Flexibility" value={formData.flexibility} />
          </div>
        </Section>

        {/* Consultation Preference */}
        <Section title="Consultation" icon={<Calendar className="w-4 h-4 text-gray-500" />}>
          <Field label="Wants Consultation" value={formData.needsConsultation ? 'Yes' : 'No'} />
          {formData.needsConsultation && (
            <>
              <Field label="Format" value={formData.consultationFormat} />
              <Field label="Preferred Times" value={
                formData.preferredTimeSlots?.length > 0 ? formData.preferredTimeSlots.join(', ') : '-'
              } />
              <Field label="Timezone" value={formData.timezone} />
            </>
          )}
        </Section>
      </div>

      {/* Service-Specific Config */}
      {(formData.aiAssistantConfig || formData.integrationConfig || formData.applicationConfig) && (
        <Section title="Service-Specific Details" icon={<Globe className="w-4 h-4 text-gray-500" />}>
          {formData.aiAssistantConfig && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Monthly Interactions" value={formData.aiAssistantConfig.expectedMonthlyInteractions} />
              <Field label="Channels" value={formData.aiAssistantConfig.deploymentChannels?.join(', ')} />
              <Field label="Languages" value={formData.aiAssistantConfig.languages?.join(', ')} />
              <Field label="Human Handoff" value={formData.aiAssistantConfig.humanHandoffRequired ? 'Yes' : 'No'} />
            </div>
          )}
          {formData.integrationConfig && (
            <div>
              <Field label="Integrations" value={
                formData.integrationConfig.integrations?.map((int: any, i: number) => (
                  <div key={i} className="text-xs bg-gray-50 p-2 rounded mb-1">
                    {int.sourceSystem} → {int.targetSystem} ({int.direction}, {int.syncFrequency})
                  </div>
                ))
              } />
            </div>
          )}
          {formData.applicationConfig && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="App Type" value={formData.applicationConfig.applicationType} />
              <Field label="Dev Approach" value={formData.applicationConfig.developmentApproach} />
              <Field label="Offline" value={formData.applicationConfig.offlineRequired ? 'Yes' : 'No'} />
              <Field label="App Store" value={formData.applicationConfig.appStoreSubmission ? 'Yes' : 'No'} />
            </div>
          )}
        </Section>
      )}

      {/* ROI Snapshot */}
      {quotation.roiSnapshot && (
        <Section title="ROI Calculator Data" icon={<DollarSign className="w-4 h-4 text-gray-500" />}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Service Type" value={quotation.roiSnapshot.serviceType} />
            <Field label="Monthly Savings" value={`$${quotation.roiSnapshot.monthlySavings?.toLocaleString()}`} />
            <Field label="Annual Savings" value={`$${quotation.roiSnapshot.annualSavings?.toLocaleString()}`} />
            <Field label="Calculated" value={formatDate(quotation.roiSnapshot.calculatedAt)} />
          </div>
        </Section>
      )}

      {/* Internal Notes */}
      <Section title="Internal Notes" icon={<FileText className="w-4 h-4 text-gray-500" />}>
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Add internal notes about this quotation..."
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
        />
      </Section>
    </div>
  );
};

export default QuotationDetailPage;
