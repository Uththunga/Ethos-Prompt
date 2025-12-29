import {
    AcademicCapIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    MegaphoneIcon,
    UserIcon,
} from '@/components/icons';
import React, { useState } from 'react';
import { Button } from '../marketing/ui/button';

interface BetaApplication {
  email: string;
  name: string;
  company: string;
  role: string;
  useCase: string;
  experience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  referralSource: string;
  agreedToTerms: boolean;
}

export const BetaApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<BetaApplication>({
    email: '',
    name: '',
    company: '',
    role: '',
    useCase: '',
    experience: 'Intermediate',
    referralSource: '',
    agreedToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<BetaApplication>>({});

  const experienceLevels = [
    { value: 'Beginner', label: 'Beginner - New to AI/ML' },
    { value: 'Intermediate', label: 'Intermediate - Some experience with AI tools' },
    { value: 'Advanced', label: 'Advanced - Regular AI/ML user' },
    { value: 'Expert', label: 'Expert - AI/ML professional' },
  ];

  const referralSources = [
    { value: 'social_media', label: 'Social Media (Twitter, LinkedIn, etc.)' },
    { value: 'search_engine', label: 'Search Engine (Google, Bing)' },
    { value: 'community_forums', label: 'Community Forums (Reddit, Discord)' },
    { value: 'professional_networks', label: 'Professional Networks' },
    { value: 'referrals', label: 'Friend/Colleague Referral' },
    { value: 'newsletter', label: 'Newsletter/Email' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<BetaApplication> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.useCase) newErrors.useCase = 'Use case description is required';
    if (!formData.referralSource)
      newErrors.referralSource = 'Please tell us how you heard about us';
    if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // In production, this would submit to your backend
      const response = await fetch('/api/beta-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          applicationDate: new Date().toISOString(),
          status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BetaApplication, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in the RAG Prompt Library Beta program. We'll review your
            application and get back to you within 2-3 business days.
          </p>
          <div className="bg-ethos-purple-light border border-ethos-purple-light rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-ethos-purple-dark mb-2">What's Next?</h3>
            <ul className="text-sm text-ethos-purple-dark">
              <li>• We'll review your application within 2-3 business days</li>
              <li>• If accepted, you'll receive a welcome email with access details</li>
              <li>• Join our beta community Discord for updates and discussions</li>
              <li>• Follow us on social media for the latest news</li>
            </ul>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-ethos-purple text-white px-6 py-2 rounded-md hover:bg-ethos-purple-light transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Join the RAG Prompt Library Beta</h1>
        <p className="text-gray-600">
          Be among the first 100 users to experience the future of AI-powered content creation. Help
          us build something amazing together!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <EnvelopeIcon className="inline h-4 w-4 mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your.email@company.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserIcon className="inline h-4 w-4 mr-1" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
            Company/Organization
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple"
            placeholder="Acme Corp"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BriefcaseIcon className="inline h-4 w-4 mr-1" />
            Job Title/Role *
          </label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple ${
              errors.role ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Content Manager, Developer, Researcher, etc."
          />
          {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
        </div>

        {/* Use Case */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            How do you plan to use RAG Prompt Library? *
          </label>
          <textarea
            value={formData.useCase}
            onChange={(e) => handleInputChange('useCase', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple ${
              errors.useCase ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your specific use case, goals, and how you plan to integrate this into your workflow..."
          />
          {errors.useCase && <p className="text-red-500 text-sm mt-1">{errors.useCase}</p>}
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AcademicCapIcon className="inline h-4 w-4 mr-1" />
            AI/ML Experience Level *
          </label>
          <select
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple"
          >
            {experienceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Referral Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MegaphoneIcon className="inline h-4 w-4 mr-1" />
            How did you hear about us? *
          </label>
          <select
            value={formData.referralSource}
            onChange={(e) => handleInputChange('referralSource', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ethos-purple ${
              errors.referralSource ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select an option</option>
            {referralSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          {errors.referralSource && (
            <p className="text-red-500 text-sm mt-1">{errors.referralSource}</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.agreedToTerms}
              onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
              className="mt-1 h-4 w-4 text-ethos-purple focus:ring-ethos-purple border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-ethos-purple hover:text-ethos-purple-light">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-ethos-purple hover:text-ethos-purple-light">
                Privacy Policy
              </a>
              . I understand this is a beta program and agree to provide feedback to help improve
              the platform.
            </span>
          </label>
          {errors.agreedToTerms && (
            <p className="text-red-500 text-sm mt-1">{errors.agreedToTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="ethos"
            size="default"
            className="w-full"
          >
            {isSubmitting ? 'Submitting Application...' : 'Submit Beta Application'}
          </Button>
        </div>
      </form>

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
        <ul className="text-sm text-gray-600">
          <li>• Limited to 100 beta users for personalized support</li>
          <li>• Free access to all premium features during beta</li>
          <li>• Direct influence on product development</li>
          <li>• Weekly feedback sessions and surveys</li>
          <li>• Exclusive beta community access</li>
          <li>• Lifetime discount on future plans</li>
        </ul>
      </div>
    </div>
  );
};
