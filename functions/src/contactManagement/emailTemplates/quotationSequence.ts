/**
 * Email Templates for Quotation Follow-Up Sequence
 *
 * These templates are used by the email job processor to send follow-up emails
 * to leads who have submitted quotation requests.
 *
 * Variables available (via contact document):
 * - {{contact.name}} - Contact's name
 * - {{contact.company}} - Company name
 * - {{contact.email}} - Contact email
 * - {{contact.meta.service}} - Service requested
 *
 * Note: Reference number is stored in the quotation document and is included
 * in the initial confirmation email sent by submitQuotation.ts
 */

const LOGO_URL = 'https://ethosprompt.com/assets/marketing/images/ethos-logo.png';
const BRAND_COLOR = '#667eea';
const BRAND_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

/**
 * Shared email styles
 */
const sharedStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    background: ${BRAND_GRADIENT};
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 12px 12px 0 0;
  }
  .logo {
    max-width: 180px;
    height: auto;
    margin-bottom: 20px;
  }
  .content {
    background: #ffffff;
    padding: 40px 30px;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .cta-button {
    display: inline-block;
    background: ${BRAND_GRADIENT};
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
  }
  .cta-button:hover {
    opacity: 0.9;
  }
  .highlight-box {
    background: #f8f9ff;
    border-left: 4px solid ${BRAND_COLOR};
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 0 8px 8px 0;
  }
  .footer {
    text-align: center;
    padding: 30px 20px;
    color: #666;
    font-size: 12px;
  }
  .social-links {
    margin: 15px 0;
  }
  .social-links a {
    margin: 0 10px;
    color: ${BRAND_COLOR};
    text-decoration: none;
  }
  h1 { margin: 0; font-size: 24px; }
  h2 { color: ${BRAND_COLOR}; margin-top: 0; }
  p { margin: 16px 0; }
  .text-muted { color: #666; font-size: 14px; }
`;

/**
 * Template 1: Initial Confirmation (Day 0)
 * Note: The main confirmation is sent by submitQuotation.ts
 * This is an additional welcome/onboarding email
 */
export const template1Confirmation = {
  name: 'Quotation Welcome',
  description: 'Welcome email sent same day as quotation submission',
  type: 'initial_followup' as const,
  subject: '🎉 Welcome to EthosPrompt | Your AI Journey Begins',
  variables: ['contact.name', 'contact.company', 'contact.meta.service'],
  bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${sharedStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="EthosPrompt" class="logo">
      <h1>Welcome to EthosPrompt!</h1>
    </div>
    <div class="content">
      <p>Hi {{contact.name}},</p>

      <p>Thank you for reaching out about <strong>{{contact.meta.service}}</strong> for <strong>{{contact.company}}</strong>. We're thrilled to have you!</p>

      <div class="highlight-box">
        <strong>🎯 What sets us apart:</strong><br>
        We don't do cookie-cutter solutions. Every project is custom-built for YOUR unique needs.
      </div>

      <h2>While You Wait...</h2>
      <p>Here are some resources to explore:</p>
      <ul>
        <li><strong>Case Studies</strong> — See how we've helped businesses like yours</li>
        <li><strong>ROI Calculator</strong> — Estimate your potential savings</li>
        <li><strong>FAQ</strong> — Common questions answered</li>
      </ul>

      <p style="text-align: center;">
        <a href="https://ethosprompt.com" class="cta-button">Explore Our Solutions</a>
      </p>

      <p>Best regards,<br>
      <strong>The EthosPrompt Team</strong><br>
      <span class="text-muted">AI Solutions & Digital Transformation</span></p>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://linkedin.com/company/ethosprompt">LinkedIn</a>
        <a href="https://ethosprompt.com">Website</a>
      </div>
      <p>© ${new Date().getFullYear()} EthosPrompt. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  bodyText: `
Hi {{contact.name}},

Thank you for reaching out about {{contact.meta.service}} for {{contact.company}}. We're thrilled to have you!

What sets us apart:
We don't do cookie-cutter solutions. Every project is custom-built for YOUR unique needs.

While You Wait:
• Case Studies — See how we've helped businesses like yours
• ROI Calculator — Estimate your potential savings
• FAQ — Common questions answered

Explore: https://ethosprompt.com

Best regards,
The EthosPrompt Team
AI Solutions & Digital Transformation

---
© ${new Date().getFullYear()} EthosPrompt. All rights reserved.
  `.trim(),
};

/**
 * Template 2: Value Reminder (Day 3)
 * Follow-up to keep engagement and highlight benefits
 */
export const template2ValueReminder = {
  name: 'Value Reminder',
  description: 'Sent 3 days after quotation submission',
  type: 'reminder' as const,
  subject: '🚀 {{contact.name}}, Your Custom Solution Awaits',
  variables: ['contact.name', 'contact.company', 'contact.meta.service'],
  bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${sharedStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="EthosPrompt" class="logo">
      <h1>Your Solution Is Taking Shape</h1>
    </div>
    <div class="content">
      <p>Hi {{contact.name}},</p>

      <p>We're making great progress on your custom <strong>{{contact.meta.service}}</strong> proposal for <strong>{{contact.company}}</strong>.</p>

      <p>In the meantime, here's what businesses like yours are achieving:</p>

      <div class="highlight-box">
        <strong>📈 85%</strong> reduction in manual data entry<br>
        <strong>⚡ 3.5x</strong> faster response times<br>
        <strong>💰 40%</strong> lower operational costs
      </div>

      <h2>Why Businesses Choose EthosPrompt</h2>
      <ul>
        <li><strong>Custom-Built</strong> — Solutions designed for YOUR specific workflow</li>
        <li><strong>AI-Powered</strong> — Leverage the latest in AI automation</li>
        <li><strong>Full Support</strong> — We're with you every step of the way</li>
      </ul>

      <p>Want to discuss your project sooner? Schedule a quick call with our solutions team.</p>

      <p style="text-align: center;">
        <a href="https://ethosprompt.com/contact?source=email-followup" class="cta-button">Schedule a Call</a>
      </p>

      <p>Looking forward to helping {{contact.company}} grow,<br>
      <strong>The EthosPrompt Team</strong></p>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://linkedin.com/company/ethosprompt">LinkedIn</a>
        <a href="https://ethosprompt.com">Website</a>
      </div>
      <p>© ${new Date().getFullYear()} EthosPrompt. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  bodyText: `
Hi {{contact.name}},

We're making great progress on your custom {{contact.meta.service}} proposal for {{contact.company}}.

Here's what businesses like yours are achieving:
• 85% reduction in manual data entry
• 3.5x faster response times
• 40% lower operational costs

Why Businesses Choose EthosPrompt:
• Custom-Built — Solutions designed for YOUR specific workflow
• AI-Powered — Leverage the latest in AI automation
• Full Support — We're with you every step of the way

Schedule a call: https://ethosprompt.com/contact?source=email-followup

Looking forward to helping {{contact.company}} grow,
The EthosPrompt Team

---
© ${new Date().getFullYear()} EthosPrompt. All rights reserved.
  `.trim(),
};

/**
 * Template 3: Final Follow-Up (Day 7)
 * Last touchpoint before going quiet
 */
export const template3FinalFollowUp = {
  name: 'Final Follow-Up',
  description: 'Sent 7 days after quotation submission',
  type: 'reminder' as const,
  subject: '⏰ {{contact.name}}, Your Proposal Is Ready — Let\'s Connect',
  variables: ['contact.name', 'contact.company', 'contact.meta.service'],
  bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${sharedStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="EthosPrompt" class="logo">
      <h1>Your Proposal Is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi {{contact.name}},</p>

      <p>We've finalized your custom <strong>{{contact.meta.service}}</strong> proposal for <strong>{{contact.company}}</strong>. We'd love to walk you through the details and answer any questions.</p>

      <div class="highlight-box">
        <strong>✅ Status:</strong> Proposal Ready for Review
      </div>

      <h2>What's Included</h2>
      <ul>
        <li>Detailed scope and deliverables</li>
        <li>Timeline and milestones</li>
        <li>Investment breakdown</li>
        <li>Support and maintenance options</li>
      </ul>

      <p><strong>Ready to move forward?</strong> Book a 15-minute call and we'll present your custom solution.</p>

      <p style="text-align: center;">
        <a href="https://ethosprompt.com/contact?source=email-final" class="cta-button">Book Your Call Now</a>
      </p>

      <p class="text-muted">Not ready yet? No problem. Reply to this email and let us know if your plans have changed or if you need more time.</p>

      <p>We're here when you're ready,<br>
      <strong>The EthosPrompt Team</strong></p>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://linkedin.com/company/ethosprompt">LinkedIn</a>
        <a href="https://ethosprompt.com">Website</a>
      </div>
      <p>© ${new Date().getFullYear()} EthosPrompt. All rights reserved.</p>
      <p class="text-muted"><a href="mailto:support@ethosprompt.com?subject=Unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  bodyText: `
Hi {{contact.name}},

Great news! We've finalized your custom {{contact.meta.service}} proposal for {{contact.company}}.

Status: Proposal Ready for Review

What's Included:
• Detailed scope and deliverables
• Timeline and milestones
• Investment breakdown
• Support and maintenance options

Ready to move forward? Book a 15-minute call:
https://ethosprompt.com/contact?source=email-final

Not ready yet? No problem. Reply to this email and let us know.

We're here when you're ready,
The EthosPrompt Team

---
© ${new Date().getFullYear()} EthosPrompt. All rights reserved.
To unsubscribe, email support@ethosprompt.com
  `.trim(),
};

/**
 * All templates for the quotation follow-up sequence
 */
export const quotationSequenceTemplates = [
  template1Confirmation,
  template2ValueReminder,
  template3FinalFollowUp,
];

/**
 * Email sequence configuration
 */
export const quotationSequenceConfig = {
  name: 'Quotation Follow-Up Sequence',
  description: 'Automated follow-up emails for quotation requests (Day 0, Day 3, Day 7)',
  isActive: true,
};
