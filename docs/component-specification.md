# Component Specification - Digital Solutions & Modernization Page

**Date:** November 5, 2025  
**Phase:** 1 - Planning & Preparation  
**Task:** Component Architecture Review & Specification

---

## 1. Existing Component Architecture Analysis

### 1.1 Core Template Component

#### **ServicePageTemplate** (`frontend/src/components/marketing/templates/ServicePageTemplate.tsx`)
- **Purpose:** Base template for all service marketing pages
- **Lines:** 391 lines
- **Status:** ✅ **REUSE AS-IS**
- **Key Features:**
  - Hero section with title, subtitle, description, image
  - Problem statement section (grid layout)
  - Solution features section (3-column grid)
  - Proof/evidence section (metrics cards)
  - CTA section (customizable)
  - Additional content slot
  - Navigation and Footer integration
  - Framer Motion animations
  - Responsive design (mobile, tablet, desktop)

**Props Interface:**
```typescript
interface ServicePageTemplateProps {
  heroTitle: React.ReactNode;
  heroSubtitle: string;
  heroDescription: React.ReactNode;
  heroImage?: string | React.ReactNode;
  problemTitle: React.ReactNode;
  problemDescription: string;
  problemPoints: Array<{ icon: React.ReactNode; text: string }>;
  solutionTitle: React.ReactNode;
  solutionDescription: string;
  solutionFeatures: Array<{ title: string; description: string; icon: React.ReactNode; gradient?: string }>;
  proofTitle: React.ReactNode;
  proofDescription: string;
  proofItems: Array<{ title?: string; metric: string; metricLabel?: string; description: string; icon: React.ReactNode; stats?: Array<{ label: string; value: string }> }>;
  ctaTitle?: React.ReactNode;
  ctaDescription?: React.ReactNode;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaSection?: React.ReactNode;
  additionalContent?: React.ReactNode;
}
```

**Usage Pattern:**
- Provides consistent structure across all service pages
- `additionalContent` prop allows insertion of custom sections
- Supports both string and React.ReactNode for flexible content

---

### 1.2 Service-Specific Components

#### **ServiceCTA** (`frontend/src/components/marketing/services/ServiceCTA.tsx`)
- **Purpose:** Final call-to-action section with background image
- **Lines:** 121 lines
- **Status:** ✅ **REUSE AS-IS**
- **Key Features:**
  - Navy background with gradient overlay
  - Background image with hover scale effect
  - ShinyText animation for title part 2
  - Framer Motion animations
  - Responsive padding

**Props:**
```typescript
interface ServiceCTAProps {
  titlePart1: string;
  titlePart2: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}
```

---

#### **ExitIntentPopup** (`frontend/src/components/marketing/ui/exit-intent-popup.tsx`)
- **Purpose:** Capture leads when user attempts to leave page
- **Lines:** 282 lines
- **Status:** 🔧 **MODIFY** (update service config for 'digital-solutions')
- **Key Features:**
  - Mouse leave detection (desktop)
  - Scroll-based detection (mobile)
  - Service-specific messaging
  - Email + name capture form
  - Success state animation
  - Backdrop blur effect

**Service Config:**
```typescript
const serviceConfig: Record<string, {
  icon: React.ReactElement;
  title: string;
  description: string;
  leadMagnet: string;
  buttonText: string;
  bgGradient: string;
}>;
```

**Modification Needed:**
- Add 'digital-solutions' to service type union
- Add service config for 'digital-solutions' with unified messaging

---

#### **GatedROICalculator** (`frontend/src/components/marketing/ui/gated-roi-calculator.tsx`)
- **Purpose:** Interactive ROI calculator with email gate
- **Lines:** 438 lines
- **Status:** 🆕 **CREATE NEW** (UnifiedROICalculator)
- **Key Features:**
  - Dynamic input fields (number, select)
  - Custom calculation function
  - Email gate before showing results
  - Results visualization with metrics
  - Lead capture integration
  - Google Analytics tracking

**Current Implementations:**
- **IntelligentApplications:** Visitor-based (visitors, conversion rate, order value)
- **DigitalTransformation:** Cost-based (IT costs, hours lost, hourly rate)

**New Implementation Needed:**
- **UnifiedROICalculator:** Combine both approaches
  - Inputs: Current platform, monthly visitors, conversion rate, maintenance costs, avg order value
  - Outputs: Cost savings + revenue growth + payback period + 3-year ROI

---

#### **InteractiveFAQ** (`frontend/src/components/marketing/ui/interactive-faq.tsx`)
- **Purpose:** Searchable, categorized FAQ accordion
- **Lines:** 256 lines
- **Status:** 🔧 **MODIFY** (create ConsolidatedFAQ with merged questions)
- **Key Features:**
  - Search functionality
  - Category filtering
  - Accordion expand/collapse
  - Contact CTA
  - Auto-expand first result on search

**Props:**
```typescript
interface InteractiveFAQProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  faqs: FAQItem[];
  categories?: string[];
  showSearch?: boolean;
  showCategories?: boolean;
  contactCTA?: { text: string; link: string };
}
```

---

#### **TrustSignals** (`frontend/src/components/marketing/ui/service-enhancements.tsx`)
- **Purpose:** Display trust badges and credibility indicators
- **Status:** ✅ **REUSE AS-IS**
- **Key Features:**
  - Background image with overlay
  - Trust metrics (years, projects, satisfaction)
  - Responsive grid layout
  - Framer Motion animations

---

#### **InvestmentSection** (`frontend/src/components/marketing/ui/service-layout-components.tsx`)
- **Purpose:** Display pricing tiers with features
- **Lines:** Part of larger file
- **Status:** ✅ **REUSE AS-IS**
- **Key Features:**
  - Three-tier pricing display
  - Feature lists
  - "Popular" badge option
  - Responsive grid layout

**Props:**
```typescript
interface InvestmentSectionProps {
  pricing: Array<{
    title: string;
    description: string;
    startingPrice: string;
    features: string[];
    popular?: boolean;
  }>;
}
```

---

#### **StickyMobileCTA** (`frontend/src/components/marketing/ui/sticky-mobile-cta.tsx`)
- **Purpose:** Sticky bottom CTA bar for mobile devices
- **Status:** ✅ **REUSE AS-IS** (update service to 'digital-solutions')
- **Key Features:**
  - Shows after scroll threshold
  - Expandable options (form, phone)
  - Minimizable
  - Mobile-only (hidden on desktop)
  - Google Analytics tracking

**Props:**
```typescript
interface StickyMobileCTAProps {
  primaryText: string;
  primaryLink: string;
  secondaryText?: string;
  secondaryLink?: string;
  phoneNumber?: string;
  service: 'ai-solutions' | 'system-integration' | 'web-mobile' | 'digital-transformation' | 'smart-assistant';
  showAfterScroll?: number;
}
```

---

#### **SecurityScanner** (`frontend/src/components/marketing/ui/security-scanner.tsx`)
- **Purpose:** Interactive security assessment tool (unique to DigitalTransformation)
- **Status:** ✅ **REUSE AS-IS** (optional integration)
- **Key Features:**
  - URL input for security scan
  - Results display
  - Lead capture integration
  - Unique differentiator

---

### 1.3 Hooks & Utilities

#### **useServiceExitIntent** (`frontend/src/hooks/useServiceExitIntent.ts`)
- **Purpose:** Manage exit intent popup state and lead capture
- **Lines:** 142 lines
- **Status:** 🔧 **MODIFY** (add 'digital-solutions' service)
- **Key Features:**
  - Desktop exit intent detection (mouse leave)
  - Mobile exit intent detection (scroll-based)
  - Google Analytics tracking
  - Lead capture API integration
  - Service-specific lead magnets

**Modification Needed:**
- Add 'digital-solutions' to service type union
- Add lead magnet for 'digital-solutions' in `getLeadMagnetForService()`

---

## 2. New Components to Create

### 2.1 **UnifiedROICalculator**
**File:** `frontend/src/components/marketing/ui/unified-roi-calculator.tsx`

**Purpose:** Comprehensive ROI calculator combining visitor metrics and cost savings

**Inputs:**
1. Current Platform (select): WordPress, Custom, Shopify, Other
2. Monthly Website Visitors (number)
3. Current Conversion Rate (number, %)
4. Monthly Maintenance Costs (number, $)
5. Average Order Value / Lead Value (number, $)

**Calculation Logic:**
```typescript
// Cost Savings (from migration)
const currentMaintenance = inputs.maintenanceCosts;
const modernMaintenance = currentMaintenance * 0.4; // 60% reduction
const monthlyCostSavings = currentMaintenance - modernMaintenance;

// Revenue Growth (from optimization)
const currentRevenue = inputs.visitors * (inputs.conversionRate / 100) * inputs.orderValue;
const improvedConversion = inputs.conversionRate * 2.5; // 150% increase
const improvedRevenue = inputs.visitors * (improvedConversion / 100) * inputs.orderValue;
const monthlyRevenueGrowth = improvedRevenue - currentRevenue;

// Total Monthly Benefit
const totalMonthlyBenefit = monthlyCostSavings + monthlyRevenueGrowth;
const annualBenefit = totalMonthlyBenefit * 12;

// ROI Calculation
const implementationCost = 15000; // Average of $7,997 and $19,997
const paybackPeriod = implementationCost / totalMonthlyBenefit;
const threeYearROI = ((annualBenefit * 3) - implementationCost) / implementationCost * 100;
```

**Outputs:**
- Monthly Cost Savings
- Monthly Revenue Growth
- Total Monthly Benefit
- Annual Benefit
- Payback Period (months)
- 3-Year ROI (%)

**Design:**
- Similar structure to existing GatedROICalculator
- Email gate before showing results
- Visual breakdown of savings vs. growth
- Responsive design

---

### 2.2 **ThreePillarSection**
**File:** `frontend/src/components/marketing/ui/three-pillar-section.tsx`

**Purpose:** Showcase the three-pillar transformation approach

**Content:**
1. **Modernize**
   - Icon: RefreshCw or Zap
   - Metric: 60% cost reduction
   - Description: Migrate from legacy systems, zero-downtime process
   
2. **Optimize**
   - Icon: TrendingUp or Gauge
   - Metric: 3x performance improvement
   - Description: <1s load times, mobile-first, PWA capabilities
   
3. **Innovate**
   - Icon: Sparkles or Rocket
   - Metrics: 150% engagement ↑, 3.5x conversion
   - Description: AI-powered features, intelligent automation

**Design:**
- Three-column layout (desktop)
- Single column (mobile)
- Icon + metric + description cards
- Gradient backgrounds
- Hover effects
- Framer Motion animations

---

### 2.3 **TransformationProcess**
**File:** `frontend/src/components/marketing/ui/transformation-process.tsx`

**Purpose:** Visualize the 4-step transformation process

**Steps:**
1. **ASSESS** (Week 1-2)
   - Comprehensive audit
   - Migration roadmap
   - ROI analysis
   
2. **PLAN** (Week 2-4)
   - Detailed project plan
   - Architecture design
   - Timeline and milestones
   
3. **TRANSFORM** (Week 4-16)
   - Zero-downtime migration
   - Modern development
   - Rigorous testing
   
4. **OPTIMIZE** (Ongoing)
   - Performance monitoring
   - Continuous improvements
   - Support and maintenance

**Design:**
- Horizontal timeline (desktop)
- Vertical timeline (mobile)
- Step numbers with connecting lines
- Icon for each step
- Expandable details
- Progress indicator visual

---

### 2.4 **ChallengeSection**
**File:** `frontend/src/components/marketing/ui/challenge-section.tsx`

**Purpose:** Two-column problem framing with KPMG statistics

**Layout:**
- **Column 1: Legacy System Challenges**
  - Slow, outdated platforms
  - High maintenance costs
  - Security vulnerabilities
  - Poor mobile experience
  - Limited scalability

- **Column 2: Digital Capability Gaps**
  - No mobile app presence
  - Losing to competitors
  - Manual processes
  - Poor user experience
  - Missing AI opportunities

**Statistics:**
- "53% of Australian business leaders cite digital transformation as their #1 challenge in 2025" (KPMG)
- "42% are concerned about cyber risks"
- "39% need to reduce costs while improving capabilities"

**Design:**
- Two-column grid (desktop)
- Stacked columns (mobile)
- Icon bullets for each point
- Statistics callout box
- Gradient background

---

### 2.5 **TechnologyStack**
**File:** `frontend/src/components/marketing/ui/technology-stack.tsx`

**Purpose:** Showcase modern tech stack

**Technologies:**
- React 18
- TypeScript
- Tailwind CSS
- Firebase
- PWA
- AI Integration (OpenRouter, LangGraph)

**Design:**
- Icon grid (3x2 on desktop, 2x3 on mobile)
- Technology name + icon + brief description
- Hover effects
- Gradient backgrounds
- Responsive layout

---

### 2.6 **CaseStudies**
**File:** `frontend/src/components/marketing/ui/case-studies.tsx`

**Purpose:** Display Australian business success stories

**Case Study 1: Retail Transformation**
- Challenge: Slow WordPress site, no mobile presence
- Solution: React migration + PWA
- Results: 60% cost reduction, 3.5x conversion increase

**Case Study 2: Professional Services Modernization**
- Challenge: Outdated platform, security concerns
- Solution: Complete modernization + AI integration
- Results: 3x performance, 150% engagement increase

**Design:**
- Card layout (2 cards side-by-side on desktop)
- Before/after metrics
- Industry icon
- Quote or testimonial
- Responsive grid

---

### 2.7 **UnifiedLeadMagnet**
**File:** `frontend/src/components/marketing/ui/unified-lead-magnet.tsx`

**Purpose:** Comprehensive digital transformation assessment form

**Deliverables:**
- ✓ Security & Performance Audit
- ✓ Mobile Optimization Analysis
- ✓ Migration Roadmap (if applicable)
- ✓ Cost Savings Analysis
- ✓ Revenue Growth Projections
- ✓ Technology Recommendations
- ✓ 30-Minute Strategy Call

**Form Fields:**
- Name (required)
- Email (required)
- Company (required)
- Current Platform (dropdown)
- Primary Challenge (dropdown)
- Phone (optional)

**Design:**
- Prominent section with gradient background
- Checkmark list of deliverables
- Form with validation
- Submit button with loading state
- Success message
- Firestore integration

---

### 2.8 **ConsolidatedFAQ**
**File:** `frontend/src/components/marketing/ui/consolidated-faq.tsx`

**Purpose:** Merged FAQ from both pages

**Categories:**
1. **Migration & Timeline**
   - How long does migration take?
   - Will there be downtime?
   - What happens to my SEO?

2. **Technology & Features**
   - Why React over WordPress?
   - What is a PWA?
   - Can you integrate with my existing systems?

3. **Pricing & Support**
   - What's included in each package?
   - Do you offer payment plans?
   - What ongoing support do you provide?

4. **Process & Quality**
   - How do you ensure quality?
   - Can I see progress during development?
   - What if I need changes after launch?

**Design:**
- Extends InteractiveFAQ component
- Search functionality
- Category filtering
- Accordion expand/collapse
- Contact CTA at bottom

---

## 3. Component Reusability Matrix

| Component | Status | Action | File Location |
|-----------|--------|--------|---------------|
| ServicePageTemplate | ✅ Reuse | None | `templates/ServicePageTemplate.tsx` |
| ServiceCTA | ✅ Reuse | None | `services/ServiceCTA.tsx` |
| ExitIntentPopup | 🔧 Modify | Add 'digital-solutions' config | `ui/exit-intent-popup.tsx` |
| GatedROICalculator | 🆕 New | Create UnifiedROICalculator | `ui/unified-roi-calculator.tsx` |
| InteractiveFAQ | 🔧 Modify | Create ConsolidatedFAQ | `ui/consolidated-faq.tsx` |
| TrustSignals | ✅ Reuse | None | `ui/service-enhancements.tsx` |
| InvestmentSection | ✅ Reuse | None | `ui/service-layout-components.tsx` |
| StickyMobileCTA | ✅ Reuse | Update service prop | `ui/sticky-mobile-cta.tsx` |
| SecurityScanner | ✅ Reuse | Optional integration | `ui/security-scanner.tsx` |
| useServiceExitIntent | 🔧 Modify | Add 'digital-solutions' | `hooks/useServiceExitIntent.ts` |
| ThreePillarSection | 🆕 New | Create new | `ui/three-pillar-section.tsx` |
| TransformationProcess | 🆕 New | Create new | `ui/transformation-process.tsx` |
| ChallengeSection | 🆕 New | Create new | `ui/challenge-section.tsx` |
| TechnologyStack | 🆕 New | Create new | `ui/technology-stack.tsx` |
| CaseStudies | 🆕 New | Create new | `ui/case-studies.tsx` |
| UnifiedLeadMagnet | 🆕 New | Create new | `ui/unified-lead-magnet.tsx` |

**Summary:**
- ✅ **Reuse As-Is:** 6 components
- 🔧 **Modify:** 3 components
- 🆕 **Create New:** 8 components

---

## 4. Styling Patterns

### 4.1 CSS Variables
```css
--ethos-navy: #030823
--ethos-navy-light: (lighter variant)
--ethos-gray: (gray text)
--ethos-gray-light: (lighter gray)
--ethos-purple: (brand purple)
--ethos-purple-gradient-start: (gradient start)
--ethos-purple-gradient-end: (gradient end)
--ethos-light-gray: (background)
```

### 4.2 Typography
- **Hero Titles:** `font-poppins` (Poppins font family)
- **Body Text:** Default sans-serif
- **Headings:** Various sizes with `font-semibold` or `font-bold`

### 4.3 Gradients
```css
/* Navy to Gray */
background: linear-gradient(to right, var(--ethos-navy-light), var(--ethos-gray-light));

/* Purple Gradient */
background: linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end));
```

### 4.4 Shadows
```css
box-shadow: 0 15px 35px -5px rgba(128, 128, 128, 0.25);
```

### 4.5 Animations
- **Framer Motion:** Used for scroll-triggered animations
- **Hover Effects:** `hover:-translate-y-1`, `hover:shadow-lg`
- **Transitions:** `transition-all duration-300`

---

## 5. Implementation Priority

### Phase 2A: Core Components (Week 1)
1. UnifiedROICalculator
2. ThreePillarSection
3. TransformationProcess
4. ChallengeSection

### Phase 2B: Supporting Components (Week 1-2)
5. TechnologyStack
6. CaseStudies
7. UnifiedLeadMagnet
8. ConsolidatedFAQ

### Phase 2C: Modifications (Week 2)
9. Update ExitIntentPopup
10. Update useServiceExitIntent
11. Test all components in isolation

---

**Document Status:** ✅ Complete  
**Next Task:** Design unified ROI calculator logic  
**Dependencies:** None - ready to proceed

