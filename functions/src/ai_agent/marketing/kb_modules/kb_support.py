"""
Marketing KB Content - Support Module
Tier 5: Support Content (FAQs, objections, industry-specific)

This module provides support content for handling common questions and objections.
"""

from typing import Dict, Any

KB_SUPPORT: Dict[str, Any] = {
    "support_faq_general": {
        "title": "General FAQs",
        "content": """
FREQUENTLY ASKED QUESTIONS:

Q: What is EthosPrompt?
A: EthosPrompt is an intelligent solutions company specializing in AI-powered automation, custom software development, and enterprise system integration. We help businesses grow through smart technology.

Q: What services do you offer?
A: We offer three core services:
1. Smart Business Assistant - AI-powered customer service automation
2. System Integration - Connect and automate your business applications
3. Intelligent Applications - Custom web and mobile app development

Q: How long does a typical project take?
A: It depends on complexity:
- Simple integrations: 2-4 weeks
- Standard AI assistants: 4-8 weeks
- Custom applications: 8-16 weeks

Q: Do I own the solution?
A: Yes! You own your custom solution completely - source code, IP rights, and data. No vendor lock-in.

Q: What makes you different from SaaS solutions?
A: Unlike SaaS platforms that charge recurring fees for generic products, we build custom solutions you own. You get exactly what you need, no recurring licensing fees, and complete flexibility.
""",
        "metadata": {
            "category": "support",
            "subcategory": "faq",
            "tier": 5,
            "priority": "high",
            "page": "faq",
            "last_updated": "2025-12-21"
        }
    },

    "support_faq_pricing": {
        "title": "Pricing FAQs",
        "content": """
PRICING FAQS:

Q: How much does it cost?
A: We provide custom quotations based on your specific needs. Request a quote at /contact for a personalized proposal.

Q: Why custom pricing instead of fixed tiers?
A: Every business is unique. Fixed tiers force you to pay for features you don't need or compromise on what you do need. Custom pricing ensures you get exactly what's valuable for YOUR business.

Q: What's included in the price?
A: Development, testing, deployment, training, documentation, and initial support. Ongoing support is priced separately based on your needs.

Q: Are there payment plans available?
A: Yes! We offer flexible options including milestone-based payments, monthly installments, and annual agreements.

Q: What's the typical ROI?
A: Most clients see significant first-year ROI with payback in 3-6 months. Use our ROI calculators for a personalized estimate.
""",
        "metadata": {
            "category": "support",
            "subcategory": "faq",
            "tier": 5,
            "priority": "high",
            "page": "faq",
            "last_updated": "2025-12-21"
        }
    },

    "support_objections": {
        "title": "Objection Handling Guide",
        "content": """
OBJECTION HANDLING:

OBJECTION: "It's too expensive"
RESPONSE: "I understand budget is important. Let's focus on the ROI - most clients see 200-400% return in the first year. What's the cost of NOT solving this problem? Manual processes, lost leads, slow response times all have a price too. Would you like to explore the ROI calculator to see potential savings?"

OBJECTION: "We can build it ourselves"
RESPONSE: "Many clients consider that route. The question is: what's the opportunity cost of your team spending months building infrastructure vs. focusing on your core business? We bring 10+ years of experience, pre-built components, and lessons learned from similar projects. A consultation can help compare the approaches."

OBJECTION: "I'm not sure it will work for us"
RESPONSE: "That's a valid concern. Every business is unique. That's exactly why we start with a discovery call - to understand your specific situation and only recommend solutions we're confident will work. There's no commitment at that stage. Would you like to schedule a quick exploratory call?"

OBJECTION: "I need to think about it"
RESPONSE: "Of course - it's an important decision. What specific aspects are you weighing? I'm happy to provide more information on any concerns. Also, our ROI calculator can give you concrete numbers to evaluate."

OBJECTION: "I don't have time for implementation"
RESPONSE: "We handle most of the heavy lifting. Our typical ask from clients is 2-4 hours per week for input and feedback. We work around your schedule and handle the technical complexity."
""",
        "metadata": {
            "category": "support",
            "subcategory": "objections",
            "tier": 5,
            "priority": "high",
            "page": "sales-guide",
            "last_updated": "2025-12-21"
        }
    },

    "support_industry_healthcare": {
        "title": "Healthcare Industry Solutions",
        "content": """
HEALTHCARE INDUSTRY OVERVIEW:

COMPLIANCE: HIPAA-ready architecture, PHI protection, audit trails

USE CASES:
- Patient intake automation
- Appointment scheduling AI
- Medical document processing
- EHR/EMR integrations

SECURITY FEATURES:
- End-to-end encryption
- Access logging
- Data residency options
- BAA available
""",
        "metadata": {
            "category": "support",
            "subcategory": "industry",
            "tier": 5,
            "priority": "medium",
            "page": "industries",
            "industry": "healthcare",
            "last_updated": "2025-12-21"
        }
    },

    "support_industry_ecommerce": {
        "title": "E-commerce Industry Solutions",
        "content": """
ECOMMERCE INDUSTRY OVERVIEW:

INTEGRATIONS: Shopify, WooCommerce, Magento, BigCommerce

USE CASES:
- AI customer support
- Order status automation
- Product recommendations
- Inventory management integration

KEY METRICS:
- 14.5% conversion lift
- 87% faster response times
- 35% higher lead conversion
""",
        "metadata": {
            "category": "support",
            "subcategory": "industry",
            "tier": 5,
            "priority": "medium",
            "page": "industries",
            "industry": "ecommerce",
            "last_updated": "2025-12-21"
        }
    },
}


def get_support_content() -> Dict[str, Any]:
    """Lazy accessor for support content."""
    return KB_SUPPORT
