from typing import Any, Callable, Dict, List, Optional, Tuple, TypedDict, Union

"""
Marketing Knowledge Base Content - UPDATED WITH CURRENT DATA
Comprehensive marketing content for EthosPrompt AI agent
"""

class KbMetadata(TypedDict):
    category: str
    page: str

class KbEntry(TypedDict):
    title: str
    content: str
    metadata: KbMetadata

MARKETING_KB_CONTENT: Dict[str, KbEntry] = {
    "company_overview": {
        "title": "EthosPrompt - AI-Powered Business Transformation",
        "content": """
EthosPrompt is a modern AI solutions company specializing in enterprise-grade AI transformation powered by IBM Granite 4.0 H-Small technology.

Our Mission:
We transform businesses through intelligent automation, custom AI solutions, and enterprise-grade system integration. We don't just implement AI – we build solutions that deliver measurable ROI and sustainable competitive advantages.

Core Technology:
- IBM Granite 4.0 H-Small AI models
- Enterprise-grade RAG (Retrieval-Augmented Generation) technology
- ISO 42001 certified AI systems
- Bank-level security and compliance

What Makes Us Different:
- Enterprise Quality: ISO 42001 certified, same technology trusted by Fortune 500 companies
- Proven Results: Average 40% efficiency gain in first 90 days
- Full-Service: From strategy through deployment and ongoing optimization
- Your Asset: Custom solutions you own, not software you rent

Industries We Serve:
E-commerce, healthcare, finance, manufacturing, professional services, SaaS, education, and more.
""",
        "metadata": {"category": "company", "page": "overview"}
    },

    "smart_business_assistant": {
        "title": "Smart Business Assistant - 24/7 AI Team Member",
        "content": """
Think of it as a team member who never sleeps. It handles customer questions, qualifies leads, and takes care of the busywork, so you can focus on growing your business.

KEY BENEFITS:
- Answers 80% of customer questions instantly
- Turns your 9-5 business into 24/7 operation
- Response times under 30 seconds vs hours
- Cost reduction: $8.50 per interaction → $0.70 (12x savings)
- Annual savings: $180K+ for most businesses
- 35% higher conversion rates

PROVEN RESULTS:
- 87% faster response times (under 30 seconds)
- 12x cost savings per interaction ($8.50 → $0.70)
- 35% increase in conversion rate
- 100% consistent quality, no bad days

HOW IT WORKS:
1. Answers customer questions instantly, 24/7
2. Qualifies leads and books meetings automatically
3. Automates scheduling, data entry, order lookups
4. Knows when to escalate to human team
5. Connects to your existing tools seamlessly
6. Bank-level security for data protection

PRICING:
- Starter Custom AI: Custom Quotation
  Perfect for small businesses implementing their first AI solution
  Includes: Business analysis, custom AI model, system integration, 30 days support

- Professional Custom AI: Custom Quotation (Most Popular)
  Complete AI development for growing businesses
  Includes: Advanced AI architecture, multi-modal capabilities, API development, 3 months premium support

- Enterprise Custom AI: Custom Quotation
  Full-scale AI transformation for large organizations
  Includes: Executive strategy, enterprise architecture, custom LLM training, 24/7 dedicated support

SETUP TIME: 2-4 weeks typically
ROI TIMELINE: Most businesses see positive ROI within 3-6 months
""",
        "metadata": {"category": "services", "page": "smart_assistant"}
    },

    "system_integration": {
        "title": "System Integration - Connect Everything",
        "content": """
Your team spends 20% of their day copying data between apps. We connect your tools so information flows automatically. No more manual entry, no more errors.

THE PROBLEM WE SOLVE:
- Manual data entry costs $15,000 per employee yearly
- 20% of workday wasted (one full day per week on copy-paste)
- Data silos mean missed opportunities
- Human errors cost real money
- Security vulnerabilities from managing too many logins

THE SOLUTION:
- Connect 600+ business applications
- Data flows automatically between systems
- Eliminate 85% of manual data entry
- 95% reduction in data errors
- 99.9% data accuracy with real-time sync
- 60% faster business processes
- One dashboard for entire business view

**PROVEN RESULTS:**
- 85% reduction in manual data work
- 95% fewer data entry errors
- 60% faster process completion
- 99.9% uptime with bank-level security
- Setup in days, not months

POPULAR INTEGRATIONS:
- CRM ↔ Email Marketing ↔ Sales Tools
- E-commerce ↔ Inventory ↔ Accounting
- Support Tickets ↔ Customer Data ↔ Communication
- 600+ apps supported (Salesforce, HubSpot, Shopify, QuickBooks, and more)

**PRICING:**
- Essential: Custom Quotation
  Perfect for small teams getting started
  Up to 10 app integrations, basic automation, standard support

- Professional: Custom Quotation (Most Popular)
  Ideal for growing businesses with complex workflows
  Up to 50 integrations, advanced automation, custom APIs, priority support, dedicated specialist

- Enterprise: Custom Quotation
  Custom solutions for large organizations
  Unlimited integrations, 24/7 support, SLA guarantees, on-premise options

SETUP TIME: Simple integrations 1-2 weeks, complex enterprise 4-8 weeks
ROI: 80% efficiency gain means savings exceed costs in 3-6 months
""",
        "metadata": {"category": "services", "page": "system_integration"}
    },

    "intelligent_applications": {
        "title": "Custom Web & Mobile Applications",
        "content": """
Custom software built exactly how your business works, not the other way around. E-commerce, customer portals, mobile apps, management systems – built from scratch, tailored to you.

WHAT WE BUILD:
- Custom Web Applications (e-commerce, portals, dashboards)
- iOS and Android Native Mobile Apps
- Progressive Web Apps (works everywhere)
- Business Management Systems
- Cross-platform solutions (phone, tablet, desktop)

WHY CUSTOM VS OFF-THE-SHELF:
- One size fits none – your business is unique
- Stop paying for 80% features you don't need
- Own your asset, don't rent software forever
- Mobile matters: 73% of e-commerce on phones
- Speed wins: <1 second load times

PROVEN RESULTS:
- 3.5x higher conversion rates on mobile
- 70% of user time spent on mobile devices
- $4.9T mobile commerce market (72.9% of e-commerce)
- 95% retention with fast load times (<1 second)
- 350% average mobile ROI increase
- 62% higher engagement on mobile

KEY FEATURES:
- Custom design & development from scratch
- Responsive mobile-first layouts
- Bank-level security built-in
- Scales from 100 to 100,000+ users
- Modern technology stack (React, React Native, Node.js, Python, AWS)
- Fast loading (<1 second)
- App store submission handled for mobile apps

**PRICING (Quotation-Based):**
All pricing is custom based on your specific requirements. Submit your requirements to receive detailed quotation.

- Web Application: Get Quotation
  Custom web apps, responsive mobile, authentication, database, admin dashboard, hosting, deployment

- Mobile Application: Get Quotation (Popular)
  iOS + Android native apps, custom UI/UX, push notifications, offline mode, app store submission, backend API

- Enterprise Application: Get Quotation
  Fully custom development, advanced features, scalable cloud, security/compliance, dedicated team, white-label options

TIMELINE: Simple sites 2-4 weeks, complex web apps 8-16 weeks, mobile apps 12-20 weeks
SUPPORT: 3-12 months support included depending on package, ongoing maintenance available
""",
        "metadata": {"category": "services", "page": "intelligent_applications"}
    },

    "digital_transformation": {
        "title": "Modern Business Upgrade - Digital Transformation",
        "content": """
Transform traditional operations with smart automation. Create engaging digital experiences for customers. Future-proof your business with cutting-edge technology.

WHAT WE DO:
- Transform manual processes with AI automation
- Modernize legacy systems and outdated technology
- Cloud migration and infrastructure modernization
- Security and compliance upgrades
- Digital customer experiences
- Business process re-engineering with AI

TRANSFORMATION AREAS:
- Legacy System Modernization: Update outdated software to modern cloud platforms
- Process Automation: AI-powered automation for manual workflows
- Cloud Migration: Move to scalable, cost-effective cloud infrastructure
- Data Modernization: Transform data silos into unified, accessible systems
- Security Upgrades: Enterprise-grade security and compliance (ISO 42001)
- Digital Customer Experience: Modern interfaces and AI-powered interactions

PROVEN IMPACT:
- 40% efficiency gain in first 90 days
- 60% faster business processes
- 85% reduction in manual work
- Bank-level security and ISO 42001 certification
- Scalable infrastructure that grows with your business

TYPICAL ENGAGEMENT: Custom pricing based on scope
TIMELINE: 8-24 weeks depending on complexity
ROI: Most businesses see 2-3x ROI within first year
""",
        "metadata": {"category": "services", "page": "digital_transformation"}
    },

    "prompt_library_platform": {
        "title": "EthosPrompt Prompt Library Platform",
        "content": """
A comprehensive platform for managing AI prompts with intelligent RAG technology, powered by IBM Granite AI.

KEY FEATURES:

1. Prompt Management
- Create, organize, and version control AI prompts
- Build reusable template library
- Template variables for dynamic content
- Collaborative workspace

2. Document Intelligence (RAG)
- Upload documents (PDF, DOCX, TXT, MD) up to 10MB
- Documents become searchable context for AI
- Automatic processing and intelligent indexing
- Hybrid search: 70% semantic + 30% BM25 keyword

3. Advanced AI Capabilities
- IBM Granite 4.0 H-Small integration
- Multi-model support via OpenRouter
- OpenAI (GPT-4), Anthropic (Claude), Google (Gemini)
- Intelligent model routing for cost optimization

4. Collaboration & Analytics
- Team workspaces and real-time collaboration
- Usage analytics and performance tracking
- Cost monitoring and optimization insights
- Access control and permissions

5. Enterprise-Grade Security
- Firebase Authentication
- Role-based access control (RBAC)
- Encryption at rest and in transit
- ISO 42001 compliance
- Bank-level security standards

TECHNICAL STACK:
- Frontend: React 18 with TypeScript, Vite, Tailwind CSS
- Backend: Firebase Cloud Functions (Python 3.11+), Firestore
- AI: IBM Granite 4.0 H-Small, OpenRouter integration
- RAG: Google text-embedding-004, hybrid search
- Performance: <2s simple queries, <5s RAG queries

AUTHENTICATION: Email/password and Google OAuth
PRICING: Contact for enterprise licensing
""",
        "metadata": {"category": "product", "page": "prompt_library"}
    },

    "pricing_summary": {
        "title": "EthosPrompt Pricing Overview",
        "content": """
SMART BUSINESS ASSISTANT:
- Starter Custom AI: $1,997/month
- Professional Custom AI: $4,997/month (Most Popular)
- Enterprise Custom AI: Custom Pricing

SYSTEM INTEGRATION:
- Essential: $1,497/month (up to 10 integrations)
- Professional: $2,997/month (up to 50 integrations) (Most Popular)
- Enterprise: Custom Pricing (unlimited integrations)

INTELLIGENT APPLICATIONS:
- Quotation-Based Pricing
- Web Applications: Get Custom Quote
- Mobile Applications: Get Custom Quote
- Enterprise Applications: Get Custom Quote

DIGITAL TRANSFORMATION:
- Custom pricing based on scope and requirements
- Typical engagements: $25K-$250K+
- Includes: Strategy, implementation, training, support

ALL PLANS INCLUDE:
- Initial consultation and requirements analysis
- Project management and regular updates
- Quality assurance and testing
- Deployment and launch support
- Training and documentation
- Guaranteed ROI projections

PAYMENT OPTIONS:
- Monthly subscription (Smart Assistant, System Integration)
- Project-based payment milestones (Applications)
- Enterprise annual contracts available

FREE RESOURCES:
- Free consultation and needs assessment
- Free ROI calculator and projections
- Free integration audit (System Integration)
- Free mobile optimization audit (Applications)
- Free security scan (Digital Transformation)
""",
        "metadata": {"category": "pricing", "page": "pricing_overview"}
    },

    "roi_and_results": {
        "title": "Proven ROI and Business Results",
        "content": """
SMART BUSINESS ASSISTANT RESULTS:
- 87% faster response times (hours → under 30 seconds)
- 12x cost savings ($8.50 → $0.70 per interaction)
- $180K+ annual savings for typical business
- 35% higher conversion rates
- 24/7 availability vs 9-5

SYSTEM INTEGRATION RESULTS:
- 85% reduction in manual data entry
- 95% fewer data errors (99.9% accuracy)
- 60% faster business processes
- 21% of workday reclaimed
- $15K saved per employee annually

INTELLIGENT APPLICATIONS RESULTS:
- 3.5x higher mobile conversion rates
- 350% average mobile ROI
- 70% of users prefer mobile experience
- 62% higher engagement on mobile
- <1 second load times = 95% retention
- $4.9T mobile commerce market opportunity

DIGITAL TRANSFORMATION RESULTS:
- 40% efficiency gain in first 90 days
- 2-3x ROI within first year
- 60% faster processes after modernization
- 85% reduction in manual work
- Enterprise-grade security (ISO 42001)

TYPICAL ROI TIMELINES:
- Smart Assistant: 3-6 months to positive ROI
- System Integration: 3-6 months to positive ROI
- Applications: 6-12 months to positive ROI
- Digital Transformation: 12-18 months to 2-3x ROI

AVERAGE PAYBACK PERIODS:
- Smart Assistant: 2-4 months
- System Integration: 3-5 months
- Mobile Applications: 4-8 months

WHY CLIENTS CHOOSE US:
1. Proven Results - Data-backed performance improvements
2. Enterprise Quality - ISO 42001 certified, Fortune 500 technology
3. Full-Service Implementation - Strategy through ongoing optimization
4. Your Asset - You own the technology, not rent it
""",
        "metadata": {"category": "proof", "page": "roi_results"}
    },

    "getting_started": {
        "title": "Getting Started with EthosPrompt",
        "content": """
HOW TO GET STARTED:

Step 1: Free Consultation (30-45 Minutes)
- Schedule via website contact form
- Discuss your business challenges and goals
- Assess current systems and opportunities
- Receive custom recommendations

Step 2: Custom Proposal
- Detailed solution design tailored to your needs
- ROI projections and timeline estimates
- Transparent pricing breakdown
- Technology architecture review

Step 3: Discovery & Planning (1-2 Weeks)
- Comprehensive business process analysis
- Requirements gathering and documentation
- Technical architecture design
- Project roadmap and milestones

Step 4: Implementation
Smart Assistant: 2-4 weeks
System Integration: 1-8 weeks (depending on complexity)
Web Applications: 2-16 weeks
Mobile Applications: 12-20 weeks
Digital Transformation: 8-24 weeks

Step 5: Testing & Deployment
- Quality assurance and testing
- User acceptance testing
- Staging environment validation
- Production deployment
- Team training

Step 6: Support & Optimization
- Post-deployment support (30 days to 12 months included)
- Performance monitoring
- Continuous optimization
- Ongoing maintenance plans available

**WHAT TO PREPARE FOR CONSULTATION:**
- Your current tech stack (if applicable)
- Key business metrics you want to improve
- Pain points and challenges
- Growth goals and timeline
- Budget range awareness

CONTACT OPTIONS:
- Website: https://rag-prompt-library.web.app
- Contact Form: /contact
- Ask molē: AI chat assistant on website

FREE RESOURCES BEFORE YOUR CALL:
- ROI Calculator for your service area
- Integration audit tool
- Mobile optimization assessment
- Performance benchmarking
- Implementation roadmap templates
""",
        "metadata": {"category": "onboarding", "page": "getting_started"}
    },

    "technology_and_security": {
        "title": "Technology Stack and Security",
        "content": """
AI TECHNOLOGY:
- IBM Granite 4.0 H-Small (32B parameters, 9B active)
- Hybrid Mixture-of-Experts architecture
- ISO 42001 certified AI systems
- 70% memory reduction vs traditional 32B models
- 40% energy savings
- Linear context scaling (no quadratic bottleneck)

RAG (RETRIEVAL-AUGMENTED GENERATION):
- Advanced document processing (PDF, DOCX, TXT, MD)
- Google text-embedding-004 for embeddings
- Hybrid search: 70% semantic + 30% BM25
- Intelligent chunking strategies
- Real-time context retrieval
- Response synthesis and validation

FRONTEND TECHNOLOGY:
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for responsive design
- Progressive Web App capabilities
- Modern, accessible UI components

BACKEND INFRASTRUCTURE:
- Firebase Cloud Functions (Python 3.11+)
- Firestore NoSQL database
- Firebase Storage for file management
- Firebase Authentication
- Cloud-native, serverless architecture

MOBILE DEVELOPMENT:
- React Native for cross-platform
- Native iOS (Swift) and Android (Kotlin) when needed
- Push notifications and offline functionality
- App store submission managed

CLOUD & SCALING:
- Multi-cloud support (GCP, AWS)
- Auto-scaling based on demand
- Global CDN for fast content delivery
- Serverless architecture for cost efficiency
- 99.9% uptime SLA

SECURITY FEATURES:
- Bank-level encryption (at rest and in transit)
- Firebase Authentication with multi-factor
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting and DDoS protection
- ISO 42001 compliance for AI systems
- SOC 2 Type II certified processes
- Data protection regulation compliance (GDPR, CCPA)
- Regular security  audits
- Penetration testing

PERFORMANCE:
- <1 second load times for applications
- <2 seconds for simple AI queries
- <5 seconds for RAG-enhanced queries
- 95%+ performance scores
- Optimized for mobile networks

MONITORING & ANALYTICS:
- Real-time performance monitoring
- Usage analytics and insights
- Cost tracking and optimization
- Error tracking with Sentry
- Custom dashboards and reports
- 24/7 system health monitoring
""",
        "metadata": {"category": "technical", "page": "technology_security"}
    },

    "competitive_advantages": {
        "title": "Why Choose EthosPrompt Over Competitors",
        "content": """
1. IBM GRANITE 4.0 TECHNOLOGY ADVANTAGE:
- Same enterprise AI trusted by Fortune 500 companies
- Superior tool calling and agentic workflows
- 70% less memory required (runs efficiently)
- ISO 42001 certified (only certified AI platform)
- Linear scaling for long conversations
- Cryptographically signed and auditable

2. PROVEN ROI, NOT JUST PROMISES:
- Average 40% efficiency gain in first 90 days
- Documented case results: 12x cost savings, 3.5x conversions
- Transparent ROI calculators for every service
- Money-back satisfaction guarantee
- Typical payback: 3-6 months

3. FULL-SERVICE, NOT JUST SOFTWARE:
- Strategy consulting included
- Custom development, not templates
- White-glove implementation
- Comprehensive training
- Ongoing optimization (not "set and forget")
- Dedicated success manager for enterprise

4. YOU OWN IT:
- Custom solutions are your intellectual property
- No vendor lock-in
- Source code ownership
- Data sovereignty (your data never leaves your systems)
- Can self-host if needed

5. ENTERPRISE SECURITY FOR ALL:
- Bank-level security regardless of plan size
- ISO 42001 certified AI (no other platform has this)
- SOC 2 Type II processes
- Compliance-ready (GDPR, HIPAA-ready, CCPA)
- Regular third-party security audits

6. SPEED TO VALUE:
- Fastest implementation in industry
- System Integration: 1-2 weeks for simple, 4-8 weeks complex
- Smart Assistant: 2-4 weeks to launch
- Applications: 2-20 weeks vs 6-12 months competitors

7. COST EFFICIENCY:
- 40-60% lower than enterprise competitors
- No hidden fees or surprise costs
- Transparent project-based or monthly pricing
- Multiple payment options
- Free audit and ROI projections

8. TECHNOLOGY EXPERTISE:
- Specialists in IBM Granite AI (cutting-edge)
- RAG technology experts
- Modern tech stack (React, Python, cloud-native)
- 600+ integration capabilities
- Custom architecture, not one-size-fits-all

9. CUSTOMER SUCCESS FOCUS:
- 95%+ customer satisfaction
- Dedicated support included
- Proactive optimization recommendations
- Regular performance reviews
- Community and knowledge base

10. FLEXIBILITY & SCALABILITY:
- Start small, grow unlimited
- Scales from 10 to 1,000,000+ users
- Works for $1M and $100M+ businesses
- Month-to-month or annual contracts
- Easy to add services as you grow

WHAT COMPETITORS CAN'T MATCH:
❌ Competitors: Template solutions, generic AI, long implementations, vendor lock-in
✅ EthosPrompt: Custom-built, IBM Granite 4.0, rapid deployment, you own it

❌ Competitors: "AI-powered" buzzwords, no ROI proof, slow support
✅ EthosPrompt: ISO 42001 certified AI, documented ROI, dedicated success team

❌ Competitors: One solution for everyone, high costs, annual contracts only
✅ EthosPrompt: Tailored to your workflow, cost-efficient, flexible terms
""",
        "metadata": {"category": "competitive", "page": "advantages"}
    },

    "faq": {
        "title": "Frequently Asked Questions",
        "content": """
GENERAL:

Q: What is EthosPrompt?
A: EthosPrompt is an AI solutions company specializing in enterprise-grade automation, custom application development, and system integration using IBM Granite 4.0 AI technology.

Q: What makes EthosPrompt different?
A: ISO 42001 certified AI (only provider), IBM Granite 4.0 technology, you own the solution, proven ROI (40% efficiency gains documented), full-service implementation, and bank-level security for all customers.

Q: What industries do you serve?
A: All industries including e-commerce, healthcare, finance, manufacturing, professional services, SaaS, education, retail, and more. We customize solutions for each industry's unique needs.

PRICING & ROI:

Q: How much does it cost?
A: Smart Assistant: $1,997-4,997/month. System Integration: $1,497-2,997/month. Applications: Custom quotes. Digital Transformation: Custom pricing. Free consultation provides detailed pricing for your needs.

Q: What's the typical ROI?
A: Most clients see positive ROI in 3-6 months. Average results: 40% efficiency gain, 12x cost savings (AI assistant), 85% manual work reduction (Integration), 50% conversion improvement (Applications).

 Q: Do you offer payment plans?
A: Yes. Monthly subscriptions for Assistant and Integration. Project milestones for Applications. Annual contracts available with discounts.

IMPLEMENTATION:

Q: How long does implementation take?
A: Smart Assistant: 2-4 weeks. System Integration: 1-8 weeks (varies). Web Apps: 2-16 weeks. Mobile Apps: 12-20 weeks. Digital Transformation: 8-24 weeks.

Q: Do we need technical expertise?
A: No. We handle everything from strategy to deployment to training. Your team just needs to know your business processes.

Q: What kind of support is included?
A: All projects include post-deployment support (30 days to 12 months depending on service). Ongoing support and optimization plans available. Enterprise gets 24/7 dedicated support.

Q:  Can you work with our existing systems?
A: Absolutely. We specialize in integrating with existing CRMs, databases, ERPs, and custom systems. 600+ app integrations supported.

TECHNOLOGY:

Q: What is IBM Granite 4.0 H-Small?
A: Enterprise-grade AI model (32B parameters) with hybrid architecture, ISO 42001 certification, superior tool calling, and 70% less memory vs traditional models. Same technology Fortune 500 uses.

Q: Is my data secure?
A: Yes. Bank-level encryption, ISO 42001 certified AI, SOC 2 Type II processes, GDPR/CCPA compliant, regular security audits. Your data never leaves your approved systems.

Q: What is RAG technology?
A: Retrieval-Augmented Generation connects AI to your live business data. AI retrieves relevant information from your documents and uses it for accurate, context-aware responses.

Q: What technologies do you use?
A: Frontend: React, TypeScript, Tailwind. Backend: Python, Node.js, Firebase. Mobile: React Native, native iOS/Android. Cloud: GCP, AWS. AI: IBM Granite 4.0. Modern, proven technology stack.

SPECIFIC SERVICES:

Q: Does the Smart Assistant sound like a robot?
A: No. We customize the personality to match your brand voice—professional, friendly, or casual. Most customers don't realize it's AI.

Q: What happens if the AI doesn't know an answer?
A: It never guesses. If uncertain, it instantly escalates to your team via email/SMS with full conversation history for seamless human handoff.

Q: Can the Assistant book appointments?
A: Yes. Integrates with Calendly, Google Calendar, Outlook. It qualifies leads, checks availability, and books  meetings automatically.

Q: How many apps can you integrate?
A: 600+ apps supported including Salesforce, HubSpot, Shopify, QuickBooks, Slack, and custom APIs. Enterprise plan has unlimited integrations.

Q: Do you build iOS and Android apps?
A: Yes. Native iOS and Android development, or cross-platform with React Native. We handle app store submission and approval process.

Q: Do you provide ongoing maintenance?
A: Yes. All projects include support period (3-12 months). Ongoing maintenance plans available for updates, security patches, and new features.

GETTING STARTED:

Q: How do I get started?
A: Schedule a free consultation via our website (https://rag-prompt-library.web.app/contact). We assess your needs, provide recommendations, and deliver custom proposal with ROI projections.

Q: Is there a free trial?
A: We offer free consultations, ROI calculators, integration audits, and security scans. No free trial of services, but satisfaction guaranteed.

Q: What should I prepare for consultation?
A: Your current tech stack (if any), business metrics you want to improve, pain points, growth goals, and budget range awareness.

Q: Can I start small and scale up?
A: Absolutely. Many clients start with one service (often Smart Assistant or  Integration) and expand. All solutions scale as your business grows.
""",
        "metadata": {"category": "faq", "page": "faq"}
    }
}

def get_all_kb_documents() -> List[Dict[str, Any]]:
    """
    Get all knowledge base documents as a list for indexing.

    Returns:
        List of dicts with title, content, and metadata
    """
    return [
        {
            "id": key,
            "title": doc["title"],
            "content": doc["content"],
            "metadata": doc["metadata"]
        }
        for key, doc in MARKETING_KB_CONTENT.items()
    ]

def get_kb_document_by_id(doc_id: str) -> Optional[KbEntry]:
    """Get a specific KB document by ID"""
    return MARKETING_KB_CONTENT.get(doc_id)

def get_kb_documents_by_category(category: str) -> List[Dict[str, Any]]:
    """Get all KB documents in a specific category"""
    return [
        {
            "id": key,
            "title": doc["title"],
            "content": doc["content"],
            "metadata": doc["metadata"]
        }
        for key, doc in MARKETING_KB_CONTENT.items()
        if isinstance(doc.get("metadata"), dict) and doc["metadata"].get("category") == category
    ]
