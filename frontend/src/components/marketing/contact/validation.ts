import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone || phone.trim() === '') return true;
      const phoneRegex = /^[\d\s\-+()]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    { message: 'Please enter a valid phone number' }
  );

export const contactStep1Schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: phoneSchema,
  service: z.string().min(1, 'Please select a service'),
  message: z
    .string()
    .min(1, 'Please provide a brief message')
    .min(10, 'Please provide at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

// Optional Step 2 (Qualification)
export const contactStep2Schema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
});

// Optional Step 3 (Scheduling preferences)
export const contactStep3Schema = z.object({
  preferredContact: z.enum(['email', 'phone', 'video']).optional(),
  timezone: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactStep1Schema>;
export type ContactFormAllValues = z.infer<
  typeof contactStep1Schema
> & z.infer<typeof contactStep2Schema> & z.infer<typeof contactStep3Schema>;

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};
