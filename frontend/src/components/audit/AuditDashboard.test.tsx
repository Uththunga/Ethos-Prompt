import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditDashboard from './AuditDashboard';

// Mock AuthContext
const stableAuth = { currentUser: { uid: 'test-user' } };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => stableAuth,
}));

// Mock firebase config and httpsCallable
vi.mock('../../config/firebase', () => ({
  functions: {},
}));

vi.mock('firebase/functions', async () => {
  return {
    httpsCallable: vi.fn((_, name: string) => vi.fn(async () => {
      if (name === 'get_audit_dashboard') {
        return { data: { success: true, data: {
          time_range: '30d',
          summary: { total_events: 0, critical_events: 0, violation_rate: 0, most_common_action: null },
          action_breakdown: {},
          level_breakdown: {},
          daily_trends: [],
          recent_critical_events: [],
          compliance_status: { gdpr_events: 0, soc2_events: 0, iso27001_events: 0, total_compliance_events: 0 },
          generated_at: new Date().toISOString(),
        }}};
      }
      if (name === 'get_audit_trail') {
        return { data: { success: true, data: {
          events: [], total_count: 0, limit: 50, offset: 0, has_more: false
        }}};
      }
      if (name === 'export_audit_data') {
        return { data: { success: true, data: '{}' } };
      }
      if (name === 'generate_compliance_report') {
        return { data: { success: true } };
      }
      return { data: { success: true, data: {} } };
    })),
  } as { httpsCallable: typeof httpsCallable };
});

describe('AuditDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and basic structure', async () => {
    render(<AuditDashboard />);

    // Wait for any primary control to appear
    const exportBtn = await screen.findByRole('button', { name: /Export Data/i });
    expect(exportBtn).toBeInTheDocument();
  });
});

