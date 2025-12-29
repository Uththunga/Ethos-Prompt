"""
Marketing KB Content - Engagement Module
Tier 4: Customer Engagement (pricing, onboarding, ROI, quotation)

This module provides engagement-focused content for driving conversions.
"""

from typing import Dict, Any

KB_ENGAGEMENT: Dict[str, Any] = {
    "engagement_pricing": {
        "title": "Pricing Philosophy & Framework",
        "content": """
PRICING PHILOSOPHY:
We don't have fixed price tiers because every business is unique. Our custom quotation approach ensures you only pay for what you actually need.

PRICING APPROACH:
- Custom quotation based on scope, complexity, and timeline
- Transparent breakdown of all costs
- No hidden fees or surprise charges
- Flexible payment options available

WHAT AFFECTS PRICING:
- Number of integrations/systems
- Complexity of workflows
- Data volume and security requirements
- Timeline urgency
- Ongoing support needs

HOW TO GET A QUOTE:
Visit /contact or use our quotation request form for a personalized proposal within 24-48 hours.
""",
        "metadata": {
            "category": "engagement",
            "subcategory": "pricing",
            "tier": 4,
            "priority": "high",
            "page": "pricing",
            "last_updated": "2025-12-21"
        }
    },

    "engagement_onboarding": {
        "title": "Onboarding & Implementation Process",
        "content": """
ONBOARDING PROCESS:

PHASE 1: Discovery (Week 1)
- Initial consultation call
- Requirements gathering
- Current systems assessment
- Success metrics definition

PHASE 2: Planning (Week 2)
- Technical architecture design
- Integration planning
- Timeline and milestones
- Final proposal and agreement

PHASE 3: Development (Weeks 3-8+)
- Iterative development sprints
- Regular progress updates
- Testing and QA
- User acceptance testing

PHASE 4: Launch (Final Week)
- Soft launch with monitoring
- Training and documentation
- Go-live support
- Performance optimization

PHASE 5: Support (Ongoing)
- Monitoring and maintenance
- Issue resolution
- Feature enhancements
- Quarterly reviews
""",
        "metadata": {
            "category": "engagement",
            "subcategory": "onboarding",
            "tier": 4,
            "priority": "medium",
            "page": "process",
            "last_updated": "2025-12-21"
        }
    },

    "engagement_roi_calculator": {
        "title": "ROI Calculator Guidance",
        "content": """
ROI CALCULATOR OVERVIEW:

Our interactive ROI calculators help prospects understand potential value before committing.

AVAILABLE CALCULATORS:
1. Smart Business Assistant ROI - /smart-business-assistant
2. System Integration ROI - /system-integration
3. Custom Application ROI - /intelligent-applications

HOW TO DIRECT USERS:
"Would you like to explore the potential ROI for your specific situation? Our interactive calculator can provide a personalized estimate based on your business metrics."

KEY INPUTS:
- Current team size
- Average hourly rate
- Hours spent on manual tasks
- Number of customer inquiries
- Current response times

TYPICAL RESULTS:
- 200-400% first-year ROI
- 3-6 month payback period
- 40% efficiency gains
""",
        "metadata": {
            "category": "engagement",
            "subcategory": "roi",
            "tier": 4,
            "priority": "high",
            "page": "roi-calculator",
            "last_updated": "2025-12-21"
        }
    },

    "engagement_quotation_system": {
        "title": "Quotation Request System",
        "content": """
QUOTATION SYSTEM OVERVIEW:

Our quotation request form captures detailed requirements for accurate proposals.

HOW TO DIRECT USERS TO QUOTATION:
"Based on what you've shared, I'd recommend requesting a custom quotation. Our team will provide a detailed proposal within 24-48 hours."

QUOTATION FORM CAPTURES:
- Company information (name, industry, size)
- Contact details
- Project scope and goals
- Technical requirements
- Timeline and budget expectations
- Consultation preferences

WHAT HAPPENS AFTER SUBMISSION:
1. Immediate confirmation email with reference number
2. Requirements review by solutions team
3. Custom proposal within 24-48 business hours
4. Optional consultation call to discuss
""",
        "metadata": {
            "category": "engagement",
            "subcategory": "quotation",
            "tier": 4,
            "priority": "high",
            "page": "contact",
            "last_updated": "2025-12-21"
        }
    },
}


def get_engagement_content() -> Dict[str, Any]:
    """Lazy accessor for engagement content."""
    return KB_ENGAGEMENT
