/**
 * Service-Specific Email Templates
 * Provides customized email content based on service context
 */


// Service contexts
export type ServiceContext =
  | 'smart-assistant'
  | 'system-integration'
  | 'intelligent-applications'
  | 'solutions';

interface ServiceEmailConfig {
  serviceName: string;
  tagline: string;
  benefits: string[];
  nextSteps: string[];
  color: string; // Primary gradient color
  icon: string; // Emoji icon
}

// Service-specific configurations
const SERVICE_EMAIL_CONFIGS: Record<ServiceContext, ServiceEmailConfig> = {
  'smart-assistant': {
    serviceName: 'Smart Business Assistant',
    tagline: 'AI-powered customer service that works 24/7',
    benefits: [
      'Respond to customers instantly, around the clock',
      'Qualify leads automatically while you sleep',
      'Reduce support costs while improving satisfaction',
    ],
    nextSteps: [
      'We\'ll analyze your current customer service workflow',
      'Design AI conversation flows tailored to your business',
      'Show you how the assistant integrates with your existing tools',
    ],
    color: '#667eea',
    icon: '🤖',
  },
  'system-integration': {
    serviceName: 'System Integration & Automation',
    tagline: 'Connect your apps and eliminate manual data entry',
    benefits: [
      'Stop copying data between apps manually',
      'Reduce errors with automated data sync',
      'Free your team for strategic work',
    ],
    nextSteps: [
      'We\'ll map your current systems and data flows',
      'Identify the highest-impact integration opportunities',
      'Create a phased implementation plan',
    ],
    color: '#10b981',
    icon: '🔗',
  },
  'intelligent-applications': {
    serviceName: 'Custom Web & Mobile Applications',
    tagline: 'Software built exactly how your business works',
    benefits: [
      'Own your software completely - no vendor lock-in',
      'Get exactly what you need, nothing you don\'t',
      'Scale without recurring licensing fees',
    ],
    nextSteps: [
      'We\'ll dive deep into your unique requirements',
      'Propose the optimal architecture and technology stack',
      'Create wireframes and user experience designs',
    ],
    color: '#8b5cf6',
    icon: '📱',
  },
  'solutions': {
    serviceName: 'AI Solutions',
    tagline: 'Enterprise-grade AI for growing businesses',
    benefits: [
      'Leverage the same AI technology used by Fortune 500',
      'Achieve measurable ROI within 3-6 months',
      'Own your solution completely',
    ],
    nextSteps: [
      'We\'ll understand your specific business challenges',
      'Identify where AI can deliver the most value',
      'Prepare a customized solution proposal',
    ],
    color: '#ec4899',
    icon: '⚡',
  },
};

/**
 * Get service configuration for email customization
 */
export function getServiceConfig(serviceContext: string): ServiceEmailConfig {
  const context = serviceContext as ServiceContext;
  return SERVICE_EMAIL_CONFIGS[context] || SERVICE_EMAIL_CONFIGS['solutions'];
}

/**
 * Generate service-specific benefits section HTML
 */
function generateBenefitsHtml(benefits: string[], color: string): string {
  return benefits.map(benefit =>
    `<li style="margin-bottom: 8px; padding-left: 8px; border-left: 3px solid ${color};">${benefit}</li>`
  ).join('\n');
}

/**
 * Generate service-specific next steps HTML
 */
function generateNextStepsHtml(nextSteps: string[], color: string): string {
  return nextSteps.map((step, index) =>
    `<li style="margin-bottom: 12px;"><strong style="color: ${color};">${index + 1}.</strong> ${step}</li>`
  ).join('\n');
}

interface EmailTemplateData {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate service-specific confirmation email
 */
export function generateServiceSpecificEmail(
  email: string,
  referenceNumber: string,
  data: {
    serviceContext: string;
    serviceName: string;
    formData: {
      contactName?: string;
      companyName?: string;
      industry?: string;
      desiredTimeline?: string;
      budgetRange?: string;
      needsConsultation?: boolean;
    };
  }
): EmailTemplateData {
  const config = getServiceConfig(data.serviceContext);
  const contactName = data.formData.contactName || 'there';
  const companyName = data.formData.companyName || 'your company';

  const subject = `${config.icon} Your ${config.serviceName} Quote Request - ${referenceNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; font-size: 16px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .ref-box { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; }
        .ref-number { font-size: 22px; font-weight: bold; color: ${config.color}; margin: 8px 0; }
        .section { margin: 28px 0; }
        .section-title { font-size: 18px; font-weight: 600; color: ${config.color}; margin-bottom: 12px; display: flex; align-items: center; }
        .benefits-list { list-style: none; padding: 0; margin: 0; }
        .steps-list { list-style: none; padding: 0; margin: 0; }
        .summary-table { width: 100%; border-collapse: collapse; }
        .summary-table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .summary-table td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
        .cta-button { display: inline-block; background: ${config.color}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.icon} ${config.serviceName}</h1>
          <p>${config.tagline}</p>
        </div>
        <div class="content">
          <p>Hi ${contactName},</p>

          <p>Thank you for your interest in <strong>${config.serviceName}</strong> for <strong>${companyName}</strong>. We're excited to help transform your business!</p>

          <div class="ref-box">
            <div style="font-size: 14px; color: #6b7280;">Your Reference Number</div>
            <div class="ref-number">${referenceNumber}</div>
            <div style="font-size: 12px; color: #9ca3af;">Keep this for your records</div>
          </div>

          <div class="section">
            <div class="section-title">✨ What You'll Get</div>
            <ul class="benefits-list">
              ${generateBenefitsHtml(config.benefits, config.color)}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">📋 Next Steps (24-48 hours)</div>
            <ol class="steps-list">
              ${generateNextStepsHtml(config.nextSteps, config.color)}
              <li style="margin-bottom: 12px;"><strong style="color: ${config.color};">4.</strong> ${data.formData.needsConsultation ? 'Schedule your consultation call as requested' : 'Send you a detailed proposal'}</li>
            </ol>
          </div>

          <div class="section">
            <div class="section-title">📝 Your Request Summary</div>
            <table class="summary-table">
              <tr><td>Service</td><td>${data.serviceName}</td></tr>
              <tr><td>Industry</td><td>${data.formData.industry || 'Not specified'}</td></tr>
              <tr><td>Timeline</td><td>${data.formData.desiredTimeline || 'Not specified'}</td></tr>
              <tr><td>Budget Range</td><td>${data.formData.budgetRange || 'Custom quote requested'}</td></tr>
            </table>
          </div>

          <p>Questions? Just reply to this email with your reference number and we'll help you out.</p>

          <p>Looking forward to working with you!</p>

          <p><strong>The EthosPrompt Team</strong><br>
          <span style="color: #6b7280;">AI Solutions & Digital Transformation</span></p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation. Please keep your reference number for future correspondence.</p>
          <p>© ${new Date().getFullYear()} EthosPrompt. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${config.icon} ${config.serviceName}
${config.tagline}

Hi ${contactName},

Thank you for your interest in ${config.serviceName} for ${companyName}. We're excited to help transform your business!

📋 Reference Number: ${referenceNumber}
(Keep this for your records)

✨ What You'll Get:
${config.benefits.map(b => `• ${b}`).join('\n')}

📋 Next Steps (24-48 hours):
${config.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${config.nextSteps.length + 1}. ${data.formData.needsConsultation ? 'Schedule your consultation call as requested' : 'Send you a detailed proposal'}

📝 Your Request Summary:
• Service: ${data.serviceName}
• Industry: ${data.formData.industry || 'Not specified'}
• Timeline: ${data.formData.desiredTimeline || 'Not specified'}
• Budget Range: ${data.formData.budgetRange || 'Custom quote requested'}

Questions? Just reply to this email with your reference number.

Looking forward to working with you!

The EthosPrompt Team
AI Solutions & Digital Transformation

© ${new Date().getFullYear()} EthosPrompt. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
