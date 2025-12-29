import React, { useState, useEffect } from 'react';
import {
    Bot,
    User,
    Building2,
    ShoppingCart,
    Briefcase,
    Factory,
    DollarSign,
    Home,
} from 'lucide-react';

// Industry-specific data based on research
interface Industry {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  painPoint: string;
  timeSavings: string;
  costReduction: string;
  scenario: ConversationScenario;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  options?: string[];
  metadata?: {
    action?: string;
    highlight?: string;
  };
}

interface ConversationScenario {
  title: string;
  initialMessage: string;
  flow: { [key: string]: Message };
}

const industries: Industry[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Patient scheduling & care coordination',
    painPoint: "Administrative tasks consume 34% of healthcare workers' time",
    timeSavings: '12 hours per week',
    costReduction: '67% reduction in scheduling costs',
    scenario: {
      title: 'Patient Appointment Management',
      initialMessage:
        "Good morning! I'm your healthcare assistant. I can help you schedule appointments, check insurance coverage, refill prescriptions, or answer questions about your care. How may I assist you today?",
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            "Good morning! I'm your healthcare assistant. I can help you schedule appointments, check insurance coverage, refill prescriptions, or answer questions about your care. How may I assist you today?",
          options: [
            'I need to see a cardiologist soon',
            'Check my upcoming appointments',
            'I need a prescription refill',
          ],
        },
        schedule: {
          id: 'schedule',
          type: 'assistant',
          content:
            "I understand you need to see a cardiologist. I'm pulling up your medical history and insurance information now.\n\nI see you were referred by Dr. Sarah Johnson for a follow-up consultation regarding your blood pressure management. Your insurance (Blue Cross PPO) covers cardiology visits with a $40 copay.\n\nDr. Martinez specializes in hypertension and preventive cardiology. She has excellent availability this week. I can also check Dr. Patel if you prefer a different specialist. Which would you prefer?",
          metadata: { action: 'checking_records', highlight: 'Insurance verified in real-time' },
          options: [
            'Dr. Martinez sounds perfect',
            'Tell me about Dr. Patel',
            'Show me both doctors availability',
          ],
        },
        availability: {
          id: 'availability',
          type: 'assistant',
          content:
            "Excellent choice! Dr. Martinez has a 4.9-star patient rating and 15 years of experience in cardiovascular care.\n\nI've checked her schedule and found these available consultation slots for this week:\n\n• Tuesday, Oct 1 at 2:00 PM (30-min consultation)\n• Wednesday, Oct 2 at 10:30 AM (30-min consultation)\n• Thursday, Oct 3 at 3:45 PM (30-min consultation)\n• Friday, Oct 4 at 9:15 AM (extended 45-min consultation)\n\nThe Friday slot allows extra time if you have multiple concerns to discuss. Which time works best for you?",
          metadata: { action: 'checking_calendar', highlight: 'Smart scheduling with context' },
          options: ['Tuesday 2:00 PM', 'Wednesday 10:30 AM', 'Friday 9:15 AM (extended)'],
        },
        confirm: {
          id: 'confirm',
          type: 'assistant',
          content:
            "Perfect! I've scheduled your cardiology consultation with Dr. Martinez for Tuesday, October 1st at 2:00 PM.\n\n📋 Here's what I've done for you:\n✅ Appointment confirmed and added to your calendar\n✅ Insurance pre-authorized ($40 copay)\n✅ Sent your medical records to Dr. Martinez for review\n✅ Pre-visit questionnaire sent to your patient portal\n✅ Parking validation code will be texted 1 hour before\n\n📍 Location: Riverside Medical Center, 3rd Floor, Suite 302\n⏰ Please arrive 10 minutes early for check-in\n\nYou'll receive appointment reminders via text and email 24 hours and 2 hours before your visit. Is there anything specific you'd like Dr. Martinez to know before your appointment?",
          metadata: {
            action: 'appointment_confirmed',
            highlight: 'HIPAA-compliant end-to-end automation',
          },
          options: [
            'Add notes about my symptoms',
            'Request test results from my last visit',
            "No, that's everything. Thank you!",
          ],
        },
        notes: {
          id: 'notes',
          type: 'assistant',
          content:
            "I've added a note to your appointment record for Dr. Martinez to review before your consultation. She'll have this information along with your complete medical history.\n\nI've also sent you a secure message confirmation with all appointment details and a link to complete your health questionnaire. Completing this before your visit helps maximize your consultation time.\n\nIs there anything else I can help you with today? I can also schedule follow-up lab work or answer questions about your current medications.",
          metadata: { action: 'notes_added', highlight: 'Personalized care coordination' },
        },
      },
    },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: <ShoppingCart className="w-5 h-5" />,
    description: 'Order management & customer support',
    painPoint: 'Customer service costs $6 per interaction, 80% are routine inquiries',
    timeSavings: '87% faster response times',
    costReduction: '80% reduction in support costs',
    scenario: {
      title: 'Order Support & Recommendations',
      initialMessage:
        'Hi there! Welcome back to TechStore. I can help you track orders, process returns, answer product questions, or recommend items based on your interests. What brings you in today?',
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            'Hi there! Welcome back to TechStore. I can help you track orders, process returns, answer product questions, or recommend items based on your interests. What brings you in today?',
          options: ['Track my recent order', 'I want to return something', 'Help me find a gift'],
        },
        track: {
          id: 'track',
          type: 'assistant',
          content:
            "Let me pull up your order history right away.\n\nI found your most recent order #ORD-2024-5847 - Sony WH-1000XM5 Wireless Headphones (Black) ordered on September 28th.\n\n📦 Shipping Status: In Transit\n📍 Current Location: Distribution center in your city\n⏰ Estimated Delivery: Tomorrow (October 1st) by 6:00 PM\n🚚 Carrier: FedEx Express - Tracking #785493021\n\nI noticed this order was delayed by 2 days from the original estimate. I sincerely apologize for that inconvenience. To make it right, I've automatically applied a 10% discount code (SORRY10) to your account - you'll see it at checkout on your next purchase.\n\nWould you like me to set up delivery notifications so you know exactly when your package arrives?",
          metadata: {
            action: 'order_tracking',
            highlight: 'Proactive customer retention with compensation',
          },
          options: [
            'Yes, send me text notifications',
            'Can I change the delivery address?',
            'Show me similar products',
          ],
        },
        notifications: {
          id: 'notifications',
          type: 'assistant',
          content:
            "Perfect! I've activated SMS delivery notifications for you.\n\n📱 You'll receive text updates at +1 (555) 0123 for:\n• When your package is out for delivery (morning of delivery)\n• When it's 10 stops away\n• When it's been delivered with photo confirmation\n\nSince you purchased premium headphones, I thought you might be interested in our new arrivals:\n\n🎧 Sony WF-1000XM5 Earbuds - Companion to your headphones\n   • Same noise-canceling technology in earbud form\n   • Currently 25% off ($198 instead of $264)\n   • Perfect for gym or commuting\n\n🎵 Premium Headphone Case - Custom-fit for WH-1000XM5\n   • Hard-shell protection\n   • 15% off when bundled ($42)\n\nYour account also has 2,450 reward points - that's $24.50 toward your next purchase! Would you like me to apply your discount code and points to one of these items?",
          metadata: {
            action: 'notifications_set',
            highlight: 'Intelligent product recommendations + loyalty integration',
          },
          options: [
            'Add the earbuds to cart with discount',
            'Just the case, please',
            "No thanks, I'm all set",
          ],
        },
        complete: {
          id: 'complete',
          type: 'assistant',
          content:
            "You're all set! Your headphones will arrive tomorrow, and you'll get real-time text updates.\n\nQuick recap of your benefits:\n✅ 10% discount code: SORRY10 (valid for 30 days)\n✅ 2,450 reward points = $24.50 credit\n✅ Free shipping on your next order (as a valued customer)\n\nIf you have any questions about your headphones when they arrive - setup, pairing, features - just message me here anytime. I'm available 24/7.\n\nIs there anything else I can help you with today?",
          metadata: {
            action: 'support_complete',
            highlight: '24/7 post-purchase support commitment',
          },
        },
      },
    },
  },
  {
    id: 'professional',
    name: 'Professional Services',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Client intake & project management',
    painPoint: 'Professionals spend 12 hours per week on administrative tasks',
    timeSavings: '12 hours per week saved',
    costReduction: '45% reduction in client onboarding time',
    scenario: {
      title: 'Legal Client Consultation',
      initialMessage:
        "Good afternoon. I'm the client services assistant at Martinez & Associates. I understand that legal matters can be stressful, so I'm here to make this process as smooth as possible. I can help you schedule consultations, answer general questions, or guide you through our services. Before we begin, please know that everything we discuss is confidential. How may I help you today?",
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            "Good afternoon. I'm the client services assistant at Martinez & Associates. I understand that legal matters can be stressful, so I'm here to make this process as smooth as possible. I can help you schedule consultations, answer general questions, or guide you through our services. Before we begin, please know that everything we discuss is confidential. How may I help you today?",
          options: [
            'I need legal advice about a workplace issue',
            'Just browsing your services',
            'I have an urgent matter',
          ],
        },
        consult: {
          id: 'consult',
          type: 'assistant',
          content:
            "I understand workplace issues can be difficult and emotionally challenging. Thank you for reaching out to us.\n\nTo connect you with the right attorney, may I ask a few brief questions? You can choose to share only what you're comfortable with:\n\n• Is this related to wrongful termination, discrimination, harassment, or contract disputes?\n• When did this situation begin?\n• Have you documented any incidents?\n\nBased on your initial description, I believe Attorney Sarah Chen would be an excellent match. She specializes in employment law with 12 years of experience and has a 95% client satisfaction rating. She's known for her compassionate approach and has successfully handled over 300 similar cases.\n\nWould you like me to tell you more about her approach, or would you prefer to schedule a confidential consultation first?",
          metadata: {
            action: 'empathetic_intake',
            highlight: 'Ethical client intake with consent',
          },
          options: [
            'Schedule consultation with Attorney Chen',
            'Tell me more about her first',
            'Are there other attorneys available?',
          ],
        },
        details: {
          id: 'details',
          type: 'assistant',
          content:
            "Of course! Here's more about Attorney Sarah Chen:\n\n👩‍⚖️ **Background**\n• 12 years specializing in employment law\n• Former labor rights advocate\n• Speaks English, Mandarin, and Spanish\n• Clients describe her as \"thorough, empathetic, and fierce when needed\"\n\n💼 **Her Approach**\n• Free 30-minute initial consultation to understand your situation\n• Clear explanation of your options and realistic outcomes\n• Transparent fee structure (no hidden costs)\n• She'll tell you honestly if you have a strong case or if there are better solutions\n\n📅 **Availability This Week**\n• Thursday, Oct 3 at 9:00 AM (in-person or video)\n• Friday, Oct 4 at 2:30 PM (in-person or video)\n• Monday, Oct 7 at 11:00 AM (in-person or video)\n\nThe consultation is completely confidential, and there's no obligation to proceed after meeting with her. Which time works best for you?",
          metadata: { action: 'attorney_details', highlight: 'Transparency and informed choice' },
          options: [
            'Thursday 9:00 AM - Video call',
            'Friday 2:30 PM - In person',
            'Monday 11:00 AM - Video call',
          ],
        },
        scheduled: {
          id: 'scheduled',
          type: 'assistant',
          content:
            "Perfect! I've scheduled your confidential consultation with Attorney Sarah Chen for Thursday, October 3rd at 9:00 AM via video call.\n\n📋 **What Happens Next:**\n✅ Confirmation email sent to your secure inbox\n✅ Video call link (works on any device, no software needed)\n✅ Optional: Secure portal to upload documents (completely encrypted)\n✅ Pre-consultation questionnaire (optional, but helps Attorney Chen prepare)\n\n📝 **Before Your Consultation:**\nTo make the most of your time, consider gathering:\n• Any relevant documents or emails (employment contract, termination letter, etc.)\n• Timeline of events\n• Names of witnesses, if applicable\n\n🔒 **Your Privacy:** All communications are protected by attorney-client privilege and encrypted end-to-end.\n\n⏰ **Reminder:** You'll receive a reminder 24 hours before, and again 1 hour before your appointment.\n\nIf anything urgent comes up before Thursday, or if you need to reschedule, just reply to the confirmation email or call our office directly at (555) 0123. We're here Monday-Friday, 8 AM - 6 PM.\n\nIs there anything else you'd like to know before your consultation?",
          metadata: {
            action: 'consultation_booked',
            highlight: 'Comprehensive, caring client onboarding',
          },
          options: [
            'What should I expect in the consultation?',
            'Can I bring someone with me?',
            "No, I'm all set. Thank you!",
          ],
        },
        expectations: {
          id: 'expectations',
          type: 'assistant',
          content:
            "Great question! Here's what to expect in your consultation with Attorney Chen:\n\n**First 10 minutes:** She'll listen to your story without interruption. She wants to understand not just the legal facts, but how this has affected you.\n\n**Next 15 minutes:** She'll ask clarifying questions, explain the relevant laws, and discuss your legal options. She'll be honest about the strengths and challenges of your case.\n\n**Final 5 minutes:** She'll outline next steps if you choose to proceed, explain her fee structure, and answer any questions you have.\n\n**Important:** There's absolutely no pressure to hire her after the consultation. She'll give you her honest professional opinion about whether legal action is your best path forward.\n\nYou're also welcome to bring a trusted friend or family member for emotional support. Just let us know so we can send them the video call link as well.\n\nYou've got this. We'll see you Thursday at 9:00 AM.",
          metadata: { action: 'setting_expectations', highlight: 'Human-centered communication' },
        },
      },
    },
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: <Factory className="w-5 h-5" />,
    description: 'Supply chain & operations management',
    painPoint: 'Supply chain disruptions cost manufacturers 35% in efficiency losses',
    timeSavings: '6 hours daily on logistics coordination',
    costReduction: '28% reduction in supply chain costs',
    scenario: {
      title: 'Supply Chain Coordination',
      initialMessage:
        "Good morning! I'm your supply chain operations assistant. I monitor shipments in real-time, coordinate with vendors, and help prevent production disruptions. I can also generate reports and alert you to potential issues before they impact your operations. What can I help you with today?",
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            "Good morning! I'm your supply chain operations assistant. I monitor shipments in real-time, coordinate with vendors, and help prevent production disruptions. I can also generate reports and alert you to potential issues before they impact your operations. What can I help you with today?",
          options: [
            'Track critical component delivery',
            "Review today's production schedule",
            'Check for supply chain risks',
          ],
        },
        delivery: {
          id: 'delivery',
          type: 'assistant',
          content:
            "Let me check your critical components right away.\n\n📦 **Order #SC-2024-891 - High-Grade Steel Components**\nStatus: In Transit ✅\n\n🚚 **Current Location:** Left supplier facility (SteelCraft Industries) this morning at 6:15 AM\n📍 **Route:** Currently 45 miles from your facility\n⏰ **Estimated Arrival:** Tomorrow, October 1st at 10:30 AM\n🎯 **Delivery Dock:** Bay 3 (I've already notified your receiving team)\n\n📊 **Production Impact Analysis:**\nGood news! I've reviewed your production schedule:\n• Line B: Scheduled to receive these components - ready to go\n• Line A: Has sufficient inventory to continue until Thursday\n• Overall efficiency target: 98% - ON TRACK ✅\n\n⚠️ **Proactive Alert:** I noticed the weather forecast shows rain tomorrow morning. I've contacted the carrier to confirm they'll use weather-protected transport. Your components will arrive safe and dry.\n\nWould you like me to update your production schedule, prepare a backup plan, or generate a detailed logistics report?",
          metadata: {
            action: 'logistics_coordination',
            highlight: 'Proactive supply chain management with risk mitigation',
          },
          options: [
            'Update Line B production schedule',
            'What if delivery is delayed?',
            'Show me backup suppliers',
          ],
        },
        production: {
          id: 'production',
          type: 'assistant',
          content:
            "I've updated Line B's production schedule with the confirmed delivery time. Here's what I've coordinated:\n\n✅ **Line B Schedule Updated:**\n• Components arrive: 10:30 AM tomorrow\n• Quality inspection: 11:00 AM - 11:30 AM (QC Team notified)\n• Production start: 12:00 PM (gives 30-min buffer)\n• Expected output: 850 units by end of shift\n\n📈 **Production Continuity Plan:**\n• Line A: Continues current production with existing inventory (good until Thursday)\n• Line C: No impact, running as scheduled\n• Overall facility efficiency: Projected 98.2% ✅\n\n👥 **Team Notifications Sent:**\n✉️ Operations Manager - Detailed schedule update\n✉️ Receiving Team - Delivery details & dock assignment\n✉️ QC Team - Inspection scheduling\n✉️ Line B Supervisor - Production start time\n\n📊 **Risk Assessment:**\nI'm monitoring:\n• Carrier GPS (real-time tracking)\n• Weather conditions along route\n• Backup supplier availability (just in case)\n\nYour operations manager will receive a full report in 5 minutes. I'll continue monitoring the shipment and alert you immediately if anything changes.\n\nIs there anything else you'd like me to track or prepare?",
          metadata: {
            action: 'production_optimized',
            highlight: 'Comprehensive coordination with human oversight',
          },
          options: [
            'Send me real-time tracking updates',
            'What are the backup supplier options?',
            "That's perfect, thank you",
          ],
        },
        backup: {
          id: 'backup',
          type: 'assistant',
          content:
            "I've identified 3 backup suppliers for high-grade steel components, ranked by reliability and delivery time:\n\n🥇 **MetalWorks Pro** (Preferred Backup)\n• Distance: 85 miles from your facility\n• Delivery time: 6-8 hours from order\n• Pricing: 8% premium over current supplier\n• Quality rating: 4.8/5 (certified ISO 9001)\n• Relationship: You've used them twice before with excellent results\n\n🥈 **Industrial Steel Solutions**\n• Distance: 120 miles\n• Delivery time: Same-day if ordered before noon\n• Pricing: 12% premium\n• Quality rating: 4.6/5\n• Note: Requires 24-hour notice for quality certification\n\n🥉 **Regional Steel Depot**\n• Distance: 200 miles\n• Delivery time: Next-day delivery\n• Pricing: On par with current supplier\n• Quality rating: 4.5/5\n• Trade-off: Longer delivery but better pricing\n\n💡 **My Recommendation:** I'll keep these suppliers on standby alert. If there's any delay with tomorrow's delivery, I can immediately contact MetalWorks Pro to ensure zero production downtime.\n\nWould you like me to pre-authorize a contingency order (we can cancel if not needed) or just keep them on standby?",
          metadata: {
            action: 'backup_planning',
            highlight: 'Intelligent contingency planning',
          },
        },
      },
    },
  },
  {
    id: 'financial',
    name: 'Financial Services',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Account management & compliance',
    painPoint: 'Financial institutions spend 60% of operational costs on compliance',
    timeSavings: '8 hours per week on regulatory tasks',
    costReduction: '52% reduction in compliance costs',
    scenario: {
      title: 'Account Services & Compliance',
      initialMessage:
        "Welcome to SecureBank. I'm your secure banking assistant, and I'm here to help with your financial needs while protecting your privacy and ensuring full regulatory compliance. All our communications are encrypted and monitored for your security. How may I assist you today?",
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            "Welcome to SecureBank. I'm your secure banking assistant, and I'm here to help with your financial needs while protecting your privacy and ensuring full regulatory compliance. All our communications are encrypted and monitored for your security. How may I assist you today?",
          options: [
            'Check my mortgage application status',
            'I have questions about my savings account',
            'Help me understand my investment options',
          ],
        },
        loan: {
          id: 'loan',
          type: 'assistant',
          content:
            "I'll help you with your mortgage application. Let me securely access your file.\n\n🔒 **Verifying your identity...**\nConfirmed. Welcome back, valued customer.\n\n📋 **Mortgage Application #LA-2024-3456**\nApplication Type: 30-Year Fixed Rate Mortgage\nProperty: 1234 Oak Street, Riverside\nLoan Amount: $385,000\nStatus: **In Progress** - Awaiting Documents\n\n✅ **Completed Steps:**\n• Credit verification (Score: 740 - Excellent!)\n• Income verification\n• Initial approval from underwriting team\n• Interest rate locked: 6.25% (valid until Oct 15th)\n\n📄 **Outstanding Requirements:**\nWe need just two more items to move forward:\n1. **Recent Pay Stubs** - Last 2 months (to verify current employment)\n2. **Property Appraisal** - Scheduled by our certified appraiser\n\n💡 **Good News:** You're only 2-3 days away from final approval once we receive these documents!\n\n**Important:** I want to be transparent with you - all document handling follows federal regulations (SOX, GLBA compliance), and everything is encrypted end-to-end. Your information is completely secure.\n\nWould you like me to schedule the property appraisal, or would you prefer to upload your pay stubs first?",
          metadata: {
            action: 'compliance_check',
            highlight: 'Transparent, secure document handling',
          },
          options: [
            'Schedule the property appraisal',
            'How do I upload pay stubs securely?',
            'Can I speak with my loan officer?',
          ],
        },
        appraisal: {
          id: 'appraisal',
          type: 'assistant',
          content:
            "Excellent! Let me schedule your property appraisal.\n\n📅 **Available Appraisal Slots:**\nI've checked with our certified appraisers. Here are your options:\n\n• **Tuesday, Oct 1 at 2:00 PM** - James Wilson (15 yrs experience)\n• **Wednesday, Oct 2 at 10:00 AM** - Sarah Martinez (12 yrs experience)\n• **Thursday, Oct 3 at 3:30 PM** - Michael Chen (18 yrs experience)\n\nAll appraisers are state-certified and follow USPAP standards. The appraisal typically takes 30-45 minutes.\n\n📝 **What to Expect:**\n1. The appraiser will assess the property's condition, size, and comparable sales\n2. You can be present or provide access (your choice)\n3. Report delivered within 48 hours\n4. Cost: $450 (added to closing costs, not due today)\n\n🔒 **Privacy Note:** The appraiser will only share the report with you and our underwriting team. Your personal information remains confidential.\n\nWhich time works best for you?",
          metadata: {
            action: 'appraisal_scheduling',
            highlight: 'Customer choice with full transparency',
          },
          options: ['Tuesday at 2:00 PM', 'Wednesday at 10:00 AM', 'Thursday at 3:30 PM'],
        },
        scheduled: {
          id: 'scheduled',
          type: 'assistant',
          content:
            "Perfect! Your property appraisal is scheduled for Tuesday, October 1st at 2:00 PM with James Wilson.\n\n✅ **Confirmation Details:**\n📧 Confirmation email sent to your secure inbox\n📞 Appraiser will call you 1 day before to confirm\n📍 Property: 1234 Oak Street, Riverside\n⏱️ Duration: 30-45 minutes\n💰 Fee: $450 (included in closing costs)\n\n📋 **Prepare Your Home:**\n• Ensure all areas are accessible (including attic/basement)\n• Have recent renovation receipts available (if any)\n• List of recent home improvements (optional but helpful)\n\n📱 **You'll Receive:**\n• SMS reminder 24 hours before\n• SMS when appraiser is 30 minutes away\n• Appraisal report within 48 hours\n\n🎯 **Next Steps After Appraisal:**\n1. Once we receive your pay stubs (upload anytime via secure portal)\n2. Appraisal report is reviewed (48 hours)\n3. Final underwriting approval (1-2 days)\n4. Closing scheduled! 🎉\n\n**Estimated Timeline:** You could be at the closing table within 7-10 days!\n\nDo you have any questions about the appraisal process, or would you like help uploading your pay stubs now?",
          metadata: {
            action: 'appraisal_confirmed',
            highlight: 'Clear timeline with empowering information',
          },
          options: [
            'Help me upload pay stubs',
            'What happens at closing?',
            "I'm all set, thank you!",
          ],
        },
        upload: {
          id: 'upload',
          type: 'assistant',
          content:
            "I'll guide you through the secure document upload process. It's quick and completely safe.\n\n🔒 **Secure Upload Process:**\n\n**Option 1: Mobile Upload (Easiest)**\n1. I'll text you a secure link\n2. Take photos of your pay stubs with your phone\n3. Upload directly - takes 2 minutes!\n\n**Option 2: Desktop Upload**\n1. Check your email for the secure portal link\n2. Drag and drop your files\n3. PDF, JPG, or PNG formats accepted\n\n🛡️ **Your Security:**\n• 256-bit encryption (bank-level security)\n• Files automatically deleted after processing\n• Only your loan officer can access\n• Compliant with federal privacy regulations\n\n**What We Need:**\n✓ Last 2 pay stubs (showing year-to-date earnings)\n✓ Clear, legible photos or scans\n✓ Full name and employer visible\n\nOnce uploaded, I'll notify your loan officer immediately, and they'll review within 4 business hours.\n\n📱 Would you like me to text you the mobile upload link, or email the desktop portal link?",
          metadata: { action: 'secure_upload_guide', highlight: 'Security-first with user choice' },
        },
      },
    },
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    icon: <Home className="w-5 h-5" />,
    description: 'Lead qualification & property management',
    painPoint: 'Agents spend 30% of time on administrative tasks vs. client interaction',
    timeSavings: '25% boost in lead conversions',
    costReduction: '30% reduction in administrative overhead',
    scenario: {
      title: 'Property Inquiry & Qualification',
      initialMessage:
        "Hi there! I'm your real estate assistant, here to help make your home search easier and less stressful. Whether you're a first-time buyer or an experienced homeowner, I can help you find properties, schedule viewings, understand market trends, and connect you with our expert agents. No pressure, just helpful information. What would you like to explore today?",
      flow: {
        start: {
          id: 'start',
          type: 'assistant',
          content:
            "Hi there! I'm your real estate assistant, here to help make your home search easier and less stressful. Whether you're a first-time buyer or an experienced homeowner, I can help you find properties, schedule viewings, understand market trends, and connect you with our expert agents. No pressure, just helpful information. What would you like to explore today?",
          options: [
            "I'm looking for a family home",
            "Just browsing to see what's available",
            'I want to understand the local market first',
          ],
        },
        search: {
          id: 'search',
          type: 'assistant',
          content:
            "Wonderful! Finding the right family home is such an important decision. Let me help you narrow down your search.\n\nTo find homes that truly fit your family's needs, may I ask a few questions? (Feel free to skip any you're not comfortable answering)\n\n🏡 **Your Preferences:**\n• What's your comfortable budget range? (This helps me show realistic options)\n• How many bedrooms do you need?\n• Preferred neighborhoods or school districts?\n• Any must-haves? (yard, garage, updated kitchen, etc.)\n\nBased on typical family home searches in this area, I'm seeing:\n📊 **Current Market Snapshot:**\n• Average 3-4 bedroom homes: $420,000 - $480,000\n• Hot neighborhoods: Riverside, Oak Hills, Meadowbrook\n• Market pace: Homes selling in 12-18 days on average\n• Inventory: 47 active family homes in your area\n\n💡 **Honest Advice:** The market is competitive right now, but that doesn't mean you should feel rushed. We'll help you find the right home at the right time for YOU.\n\nWould you like me to show you homes in a specific budget range, or would you prefer to start with a virtual neighborhood tour to get a feel for different areas?",
          metadata: {
            action: 'personalized_search',
            highlight: 'Consultative, pressure-free approach',
          },
          options: [
            'Show me homes around $450,000',
            'Tell me about the best family neighborhoods',
            'How competitive is the market?',
          ],
        },
        matches: {
          id: 'matches',
          type: 'assistant',
          content:
            "Great! I've found 12 properties in the $420K-$480K range that match family home criteria. Let me show you the top 3 that really stand out:\n\n🏠 **Property 1: 1247 Maple Drive, Riverside**\n• Price: $449,000\n• 4 bed, 2.5 bath, 2,200 sq ft\n• Built: 2018 (like-new condition!)\n• Highlights: Large backyard, excellent school district (9/10 rating), quiet cul-de-sac\n• Listed: 5 days ago\n• My Note: This one won't last long - similar homes sold in under 2 weeks\n\n🏠 **Property 2: 892 Oak Street, Meadowbrook**\n• Price: $435,000\n• 3 bed, 2 bath, 1,850 sq ft\n• Built: 2005 (well-maintained)\n• Highlights: Recently renovated kitchen, finished basement (could be 4th bedroom), walk to elementary school\n• Listed: 12 days ago\n• My Note: Price reduced $10K this week - motivated seller!\n\n🏠 **Property 3: 3156 Sunset Boulevard, Oak Hills**\n• Price: $465,000\n• 4 bed, 3 bath, 2,400 sq ft\n• Built: 2020 (modern everything!)\n• Highlights: Open floor plan, home office, 2-car garage, community pool\n• Listed: 3 days ago\n• My Note: Premium location, priced fairly for the area\n\n📸 I can email you full photo galleries, virtual tours, and detailed info for any of these.\n\n**Next Steps (Your Choice):**\nWould you like to schedule in-person viewings, take virtual tours first, or have me find a few more options?",
          metadata: { action: 'curated_matches', highlight: 'Detailed, honest property insights' },
          options: [
            'Schedule viewings for all 3',
            'Send me virtual tours first',
            'Show me a few more options',
          ],
        },
        viewing: {
          id: 'viewing',
          type: 'assistant',
          content:
            "Excellent choice! Let me coordinate viewings for all three properties.\n\n📅 **Scheduling Your Viewings:**\n\nI've checked with the listing agents, and here's what I can arrange for you:\n\n**Option A: Today (If you're available)**\n• 2:00 PM - 1247 Maple Drive\n• 3:30 PM - 892 Oak Street\n• 5:00 PM - 3156 Sunset Boulevard\n\n**Option B: This Weekend**\n• Saturday morning: 9:00 AM, 10:30 AM, 12:00 PM\n• Sunday afternoon: 1:00 PM, 2:30 PM, 4:00 PM\n\n👥 **Your Agent:** Maria Rodriguez will personally show you each property. She's fantastic - 12 years of experience, knows these neighborhoods inside and out, and most importantly, she listens to what families actually need (not just what sells).\n\n📱 **What You'll Get:**\n• Maria's direct cell number\n• Detailed property info sheets\n• Neighborhood guides\n• Comparable sales data\n• School district information\n\n💰 **Financial Preparation:**\nI see you haven't been pre-approved for a mortgage yet. No worries! I can connect you with our trusted lender partners who can:\n• Pre-approve you in 24-48 hours\n• Explain all your financing options\n• No obligation or hard credit check until you're ready\n\n**Being pre-approved strengthens your offer significantly in this market.**\n\nWhich viewing schedule works better for you, and would you like me to arrange that mortgage pre-approval introduction?",
          metadata: {
            action: 'viewing_coordination',
            highlight: 'Comprehensive support with options',
          },
          options: [
            "Today's schedule works perfect",
            'Weekend viewings would be better',
            'Yes, connect me with a lender',
          ],
        },
        confirmed: {
          id: 'confirmed',
          type: 'assistant',
          content:
            "Perfect! Everything is confirmed. Here's your home viewing itinerary:\n\n✅ **Your Viewings - Today:**\n📍 2:00 PM - 1247 Maple Drive, Riverside\n📍 3:30 PM - 892 Oak Street, Meadowbrook  \n📍 5:00 PM - 3156 Sunset Boulevard, Oak Hills\n\n👤 **Your Agent: Maria Rodriguez**\n📞 Direct: (555) 0198\n📧 maria@premierrealty.com\n⭐ \"Maria is wonderful! She helped us find our dream home without any pressure.\" - Recent Client\n\n📱 **You'll Receive:**\n✉️ Confirmation email with all property details\n✉️ Text from Maria 1 hour before first viewing\n✉️ Neighborhood guides for each area\n✉️ Financial worksheet (optional - to help you evaluate)\n\n💡 **Tips for Your Viewings:**\n• Take photos/videos (totally okay!)\n• Ask Maria anything - she's there to help\n• Test water pressure, check outlets, open cabinets\n• Imagine your family living there\n• No rush - this is YOUR decision\n\n🏦 **Lender Introduction:**\nI've also sent you contact info for two excellent mortgage professionals. They'll reach out tomorrow (unless you prefer I hold off).\n\n**Remember:** You're in control of this process. Whether you make an offer today, next month, or decide to keep looking - we're here to support you, not pressure you.\n\nHave a great time at your viewings! Is there anything else you'd like to know before you go see these homes?",
          metadata: {
            action: 'viewing_confirmed',
            highlight: 'Customer-first, empowering experience',
          },
          options: [
            'What should I look for during viewings?',
            'How do I make a competitive offer?',
            "I'm all set, thank you so much!",
          ],
        },
        tips: {
          id: 'tips',
          type: 'assistant',
          content:
            "Great question! Here are my honest tips for evaluating homes:\n\n🔍 **What To Look For:**\n\n**The Basics:**\n✓ Signs of water damage (ceilings, basements)\n✓ Condition of major systems (HVAC, water heater, roof age)\n✓ Electrical outlets work (bring phone charger!)\n✓ Natural light throughout the day\n\n**Family-Specific:**\n✓ Is the layout practical for daily life?\n✓ Enough storage for your stuff?\n✓ Safe neighborhood for kids?\n✓ Proximity to schools, parks, groceries\n\n**The \"Gut Check\":**\n✓ Can you imagine your family here?\n✓ Does it feel like home?\n✓ Are you excited or just settling?\n\n**Red Flags:**\n🚩 Strange odors (could indicate hidden issues)\n🚩 Fresh paint everywhere (what are they covering?)\n🚩 Neighbors with poorly maintained properties\n🚩 You feel pressured to decide quickly\n\n💭 **Maria's Advice:** Trust your instincts. If something feels off, it probably is. And remember, no home is perfect - the question is whether the imperfections are deal-breakers or minor fixes.\n\nYou've got this! Enjoy your viewings and don't hesitate to reach out if you have questions.",
          metadata: { action: 'expert_guidance', highlight: 'Honest, practical advice' },
        },
      },
    },
  },
];

/**
 * SmartAssistantDemoInteractive - Enhanced Interactive Industry Demo
 * Research-based, industry-specific scenarios with interactive conversation flows
 * - Mobile-first responsive design with Ethos colors
 * - Real industry data and terminology
 * - Accessible semantics and keyboard navigation
 * - Performance optimized with lazy loading
 */
export const SmartAssistantDemoInteractive: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize conversation when industry changes
  useEffect(() => {
    setConversationHistory([]);
    setIsTyping(true);

    // Simulate typing delay for initial message
    const timer = setTimeout(() => {
      const initialMessage: Message = {
        id: 'initial',
        type: 'assistant',
        content: selectedIndustry.scenario.initialMessage,
        options: selectedIndustry.scenario.flow.start.options,
      };
      setConversationHistory([initialMessage]);
      setIsTyping(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [selectedIndustry]);

  const handleUserChoice = (choice: string, nextStep: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: choice,
    };

    setConversationHistory((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const nextMessage = selectedIndustry.scenario.flow[nextStep];
      if (nextMessage) {
        setConversationHistory((prev) => [...prev, nextMessage]);
      }
      setIsTyping(false);
    }, 1500);
  };

  const resetDemo = () => {
    setConversationHistory([]);
    setIsTyping(true);

    setTimeout(() => {
      const initialMessage: Message = {
        id: 'initial-reset',
        type: 'assistant',
        content: selectedIndustry.scenario.initialMessage,
        options: selectedIndustry.scenario.flow.start.options,
      };
      setConversationHistory([initialMessage]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <section
      aria-labelledby="sba-demo-heading"
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f0f5 25%, #e8e6f0 50%, #f5f4fa 75%, #faf9ff 100%)',
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <header className="text-center mb-12 sm:mb-16">
          <h2
            id="sba-demo-heading"
            className="heading-section font-medium leading-tight tracking-[-0.02em] mb-6"
          >
            <span className="text-ethos-navy">See It </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
            >
              in Action
            </span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ethos-gray max-w-3xl mx-auto">
            Experience real-world scenarios tailored to your industry. Choose your sector below to see how AI transforms your daily operations.
          </p>
        </header>

        {/* Industry Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedIndustry.id === industry.id
                    ? 'text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-[0.98]'
                    : 'bg-white/80 backdrop-blur-sm text-ethos-gray hover:bg-white hover:text-ethos-navy hover:shadow-md border border-gray-200/50'
                }`}
                style={selectedIndustry.id === industry.id ? { background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' } : undefined}
                aria-pressed={selectedIndustry.id === industry.id}
              >
                {industry.icon}
                <span className="hidden sm:inline">{industry.name}</span>
                <span className="sm:hidden">{industry.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Industry Stats */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl p-4 inline-block" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div>
                <span className="text-xl font-bold text-ethos-purple">
                  {selectedIndustry.timeSavings}
                </span>
                <span className="text-xs text-ethos-gray ml-1">saved</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div>
                <span className="text-xl font-bold text-ethos-purple">
                  {selectedIndustry.costReduction}
                </span>
                <span className="text-xs text-ethos-gray ml-1">lower costs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chat Interface */}
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
            {/* Chat Header - Modern Gradient */}
            <div
              className="px-4 py-3 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' }}
            >
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border-2 border-white shadow-sm"></span>
                    </span>
                  </div>
                  <div className="text-white">
                    <p className="text-sm font-semibold">Smart Business Assistant</p>
                    <p className="text-xs opacity-90">{selectedIndustry.scenario.title}</p>
                  </div>
                </div>
                <button
                  onClick={resetDemo}
                  className="text-white/90 hover:text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
                  aria-label="Reset demo conversation"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              role="log"
              aria-live="polite"
              className="h-80 sm:h-96 overflow-y-auto p-4 bg-gray-50"
            >
              {conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.type === 'user'
                        ? 'text-white'
                        : 'bg-white text-ethos-navy border border-gray-100'
                    }`}
                    style={message.type === 'user' ? { background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' } : undefined}
                  >
                    <div className="flex gap-2 items-start">
                      {message.type === 'assistant' && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' }}>
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {message.type === 'user' && (
                        <User className="w-4 h-4 mt-0.5 text-white/90 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                        {message.metadata?.highlight && (
                          <div className="mt-2 text-xs px-2 py-1 rounded-full inline-block text-white font-medium" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)' }}>
                            ✓ {message.metadata.highlight}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' }}>
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' }}></div>
                        <div
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)', animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)', animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-xs text-ethos-gray font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Options */}
            <div className="border-t border-gray-200 p-4 bg-white">
              {conversationHistory.length > 0 &&
                conversationHistory[conversationHistory.length - 1]?.options &&
                !isTyping && (
                  <div>
                    <p className="text-xs text-ethos-gray mb-3">Choose your response:</p>
                    <div className="grid gap-2">
                      {conversationHistory[conversationHistory.length - 1].options!.map(
                        (option, index) => {
                          // Determine next step based on current message and option index
                          const currentStep = conversationHistory[conversationHistory.length - 1];
                          let nextStep = '';

                          // Healthcare flow
                          if (selectedIndustry.id === 'healthcare') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'schedule';
                            else if (currentStep.id === 'schedule') nextStep = 'availability';
                            else if (currentStep.id === 'availability') nextStep = 'confirm';
                            else if (currentStep.id === 'confirm')
                              nextStep = ['notes', 'notes', 'notes'][index];
                            else if (currentStep.id === 'notes') nextStep = 'notes';
                          }

                          // E-commerce flow
                          if (selectedIndustry.id === 'ecommerce') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'track';
                            else if (currentStep.id === 'track') nextStep = 'notifications';
                            else if (currentStep.id === 'notifications') nextStep = 'complete';
                          }

                          // Professional Services flow
                          if (selectedIndustry.id === 'professional') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'consult';
                            else if (currentStep.id === 'consult')
                              nextStep = ['scheduled', 'details', 'details'][index];
                            else if (currentStep.id === 'details') nextStep = 'scheduled';
                            else if (currentStep.id === 'scheduled')
                              nextStep = ['expectations', 'expectations', 'expectations'][index];
                            else if (currentStep.id === 'expectations') nextStep = 'expectations';
                          }

                          // Manufacturing flow
                          if (selectedIndustry.id === 'manufacturing') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'delivery';
                            else if (currentStep.id === 'delivery')
                              nextStep = ['production', 'production', 'backup'][index];
                            else if (currentStep.id === 'production')
                              nextStep = ['production', 'backup', 'production'][index];
                            else if (currentStep.id === 'backup') nextStep = 'backup';
                          }

                          // Financial Services flow
                          if (selectedIndustry.id === 'financial') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'loan';
                            else if (currentStep.id === 'loan')
                              nextStep = ['appraisal', 'upload', 'loan'][index];
                            else if (currentStep.id === 'appraisal') nextStep = 'scheduled';
                            else if (currentStep.id === 'scheduled')
                              nextStep = ['upload', 'scheduled', 'scheduled'][index];
                            else if (currentStep.id === 'upload') nextStep = 'upload';
                          }

                          // Real Estate flow
                          if (selectedIndustry.id === 'realestate') {
                            if (currentStep.id === 'initial' || currentStep.id === 'start')
                              nextStep = 'search';
                            else if (currentStep.id === 'search')
                              nextStep = ['matches', 'matches', 'matches'][index];
                            else if (currentStep.id === 'matches') nextStep = 'viewing';
                            else if (currentStep.id === 'viewing')
                              nextStep = ['confirmed', 'confirmed', 'confirmed'][index];
                            else if (currentStep.id === 'confirmed')
                              nextStep = ['tips', 'tips', 'tips'][index];
                            else if (currentStep.id === 'tips') nextStep = 'tips';
                          }

                          if (!nextStep) nextStep = 'confirm';

                          return (
                            <button
                              key={`${option}-${index}`}
                              onClick={() => handleUserChoice(option, nextStep)}
                              className="text-left p-3 rounded-lg border border-gray-200 bg-white hover:text-white hover:border-transparent hover:shadow-md active:scale-[0.98] transition-all duration-300 text-sm text-ethos-navy"
                              style={{ background: 'white' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              {option}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {conversationHistory.length > 0 &&
                !conversationHistory[conversationHistory.length - 1]?.options &&
                !isTyping && (
                  <div className="text-center">
                    <p className="text-sm text-ethos-gray mb-3">
                      Conversation complete! This is how your AI assistant handles{' '}
                      {selectedIndustry.name.toLowerCase()} workflows.
                    </p>
                    <button
                      onClick={resetDemo}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-[0.98] transition-all duration-300"
                      style={{ background: 'linear-gradient(135deg, #9C43FE 0%, #4CC2E9 100%)' }}
                    >
                      Try another scenario →
                    </button>
                  </div>
                )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SmartAssistantDemoInteractive;
