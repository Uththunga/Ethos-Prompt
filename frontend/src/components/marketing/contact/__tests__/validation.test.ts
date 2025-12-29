import { describe, it, expect } from 'vitest';
import { contactStep1Schema } from '../../contact/validation';

describe('contactStep1Schema', () => {
  it('accepts a valid minimal payload', () => {
    const valid = {
      name: 'Alice',
      email: 'alice@example.com',
      phone: '',
      service: 'smart-assistant',
      message: 'We need help with automation.'
    };
    const res = contactStep1Schema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects missing email and short message', () => {
    const invalid = {
      name: 'Bob',
      email: '',
      phone: '',
      service: 'system-integration',
      message: 'short'
    } as any;
    const res = contactStep1Schema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = res.error.errors.map(e => e.path[0]);
      expect(fields).toContain('email');
      expect(fields).toContain('message');
    }
  });

  it('rejects invalid phone when provided', () => {
    const invalid = {
      name: 'Carol',
      email: 'carol@example.com',
      phone: 'abc',
      service: 'web-mobile-applications',
      message: 'We want a new app.'
    };
    const res = contactStep1Schema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
