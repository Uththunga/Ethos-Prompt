import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/marketing/ui/button';
import { ChevronDownIcon } from '@/components/icons/heroicons';
import { Input } from '@/components/marketing/ui/input';
import { Textarea } from '@/components/marketing/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/marketing/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/marketing/ui/form';
import { contactStep1Schema, type ContactFormValues, type ContactFormAllValues } from './validation';
// Service selection now uses a dropdown Select for compact layout
import { contactService } from '@/services/contactService';
import { useAnalytics as useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

interface ContactFormProps {
  defaultService?: string;
  source?: string;
  onSubmitted?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ defaultService, source, onSubmitted }) => {
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serviceId = defaultService || 'contact';

  const { trackFormInteraction, trackConversionStage, trackEmailCapture, trackEvent } =
    useMarketingAnalytics();

  const form = useForm<ContactFormAllValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: defaultService || '',
      message: '',
      companyName: '',
      companySize: '',
      industry: '',
      timeline: '',
      budget: '',
      preferredContact: undefined,
      timezone: '',
    },
    mode: 'onSubmit',
  });

  const trackOnceStarted = () => {
    if (!started) {
      setStarted(true);
      trackFormInteraction('contact', 'start', serviceId, {
        source: source || 'direct',
      });
    }
  };

  const onFieldBlur = (field: keyof ContactFormValues, value: string) => {
    if (value) {
      trackEvent({
        action: 'contact_form_field_completed',
        category: 'Form Interaction',
        label: field,
        custom_parameters: {
          field,
          source: source || 'direct',
          service: serviceId,
        },
      });
    }
  };

  const onSubmit = async (values: ContactFormAllValues) => {
    const result = contactStep1Schema.safeParse(values);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const path = (err.path?.[0] as keyof ContactFormValues) || 'name';
        form.setError(path, { type: 'manual', message: err.message });
      });
      if (typeof window !== 'undefined' && (window as any).gtag) {
        // Legacy GA event left for backward compatibility
        (window as any).gtag('event', 'contact_form_error', {
          event_category: 'error',
          source: source || 'direct',
        });
      }
      trackFormInteraction('contact', 'abandon', serviceId, {
        source: source || 'direct',
        reason: 'validation_error',
      });
      trackEvent({
        action: 'contact_form_error',
        category: 'Lead Generation',
        label: serviceId,
        custom_parameters: {
          source: source || 'direct',
          error_type: 'validation',
        },
      });
      return;
    }
    setServerError(null);
    setIsSubmitting(true);
    try {
      const submissionResult = await contactService.submitContact({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        service: values.service,
        message: values.message,
        source: source || 'direct',
        metadata: {
          submittedAt: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
          referrerUrl:
            typeof document !== 'undefined' && document.referrer
              ? document.referrer
              : (typeof window !== 'undefined' ? window.location.href : undefined),
        },
      });

      const contactId =
        submissionResult && submissionResult.reference
          ? String(submissionResult.reference)
          : undefined;

      setSubmitted(true);
      trackConversionStage('form_submission', serviceId, {
        source: source || 'direct',
      });
      trackFormInteraction('contact', 'complete', serviceId, {
        source: source || 'direct',
      });
      trackEmailCapture(source || 'contact_form', serviceId, undefined, contactId);
      onSubmitted?.();
    } catch (e: any) {
      const msg = e?.message || 'Submission failed. Please try again.';
      setServerError(msg);
      trackFormInteraction('contact', 'abandon', serviceId, {
        source: source || 'direct',
        reason: 'server_error',
      });
      trackEvent({
        action: 'contact_form_error',
        category: 'Lead Generation',
        label: serviceId,
        custom_parameters: {
          source: source || 'direct',
          error_type: 'server',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ethos-navy mb-2">Thank You!</h3>
        <p className="text-ethos-gray text-body-default">We'll be in touch within 24 hours.</p>
      </div>
    );
  }


  return (
    <Form {...form}>
      <form
        id="contact-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-label="Request a Consultation"
        className="pb-20 md:pb-0"
        onFocusCapture={trackOnceStarted}
      >
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 text-red-800 p-3 mb-4">
            {serverError}
          </div>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {Object.values(form.formState.errors)[0]?.message as string || ''}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="name"
                    placeholder="Your Name"
                    onBlur={(e) => onFieldBlur('name', e.target.value)}
                    autoComplete="name"
                    required
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Business Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Business Email"
                    onBlur={(e) => onFieldBlur('email', e.target.value)}
                    autoComplete="email"
                    required
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Phone (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="Phone (optional)"
                    onBlur={(e) => onFieldBlur('phone', e.target.value)}
                    autoComplete="tel"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Service</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={(val) => { field.onChange(val); onFieldBlur('service', val); }}>
                    <SelectTrigger id="service" aria-label="Select service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart-assistant">Smart Business Assistant</SelectItem>
                      <SelectItem value="system-integration">System Integration</SelectItem>
                      <SelectItem value="web-mobile-applications">Web & Mobile Applications</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mb-4">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">How can we help you?</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    id="message"
                    placeholder="How can we help you?"
                    className="resize-none"
                    onBlur={(e) => onFieldBlur('message', e.target.value)}
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-center">
            <div
              onClick={() => setShowDetails((v) => !v)}
              className="mb-3 flex items-center justify-center gap-2 cursor-pointer group select-none"
            >
              <span className="text-ethos-navy font-medium group-hover:text-ethos-purple transition-colors">
                Add optional project details
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 text-ethos-navy group-hover:text-ethos-purple transition-transform duration-300 ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Company Name</FormLabel>
                    <FormControl>
                      <Input id="companyName" placeholder="Company Name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Company Size</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="companySize" aria-label="Company Size">
                          <SelectValue placeholder="Company Size (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="500+">500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Industry</FormLabel>
                    <FormControl>
                      <Input id="industry" placeholder="Industry (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Timeline</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="timeline" aria-label="Timeline">
                          <SelectValue placeholder="Timeline (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asap">ASAP</SelectItem>
                          <SelectItem value="1-3mo">1-3 months</SelectItem>
                          <SelectItem value="3-6mo">3-6 months</SelectItem>
                          <SelectItem value=">6mo">6+ months</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Budget</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="budget" aria-label="Budget">
                          <SelectValue placeholder="Budget (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<5k">Under $5k</SelectItem>
                          <SelectItem value="5-25k">$5k-$25k</SelectItem>
                          <SelectItem value="25-100k">$25k-$100k</SelectItem>
                          <SelectItem value=">100k">$100k+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-center">
            <div
              onClick={() => setShowScheduling((v) => !v)}
              className="mb-3 flex items-center justify-center gap-2 cursor-pointer group select-none"
            >
              <span className="text-ethos-navy font-medium group-hover:text-ethos-purple transition-colors">
                Schedule now (optional)
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 text-ethos-navy group-hover:text-ethos-purple transition-transform duration-300 ${
                  showScheduling ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
          {showScheduling && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Preferred Contact</FormLabel>
                    <FormControl>
                      <Select value={(field.value as string) || ''} onValueChange={field.onChange}>
                        <SelectTrigger id="preferredContact" aria-label="Preferred contact">
                          <SelectValue placeholder="Preferred contact (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="video">Video call</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Timezone</FormLabel>
                    <FormControl>
                      <Input id="timezone" placeholder="Timezone (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <Button type="submit" variant="ethos" size="lg" disabled={isSubmitting}>
            Request a Consultation
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContactForm;
