# Unified ROI Calculator Specification

**Date:** November 5, 2025
**Phase:** 1 - Planning & Preparation
**Task:** Design unified ROI calculator logic
**Component:** UnifiedROICalculator

---

## 1. Overview

The Unified ROI Calculator combines the best elements of both existing calculators:
- **IntelligentApplications (Visitor-Based):** Focuses on conversion optimization and revenue growth
- **DigitalTransformation (Cost-Based):** Focuses on maintenance cost reduction and efficiency gains

The new calculator provides a **comprehensive view** of both **cost savings** and **revenue growth** potential from digital transformation.

---

## 2. Input Fields

### 2.1 Current Platform
**Type:** Select dropdown
**Key:** `currentPlatform`
**Options:**
- WordPress
- Custom PHP/Legacy
- Shopify
- Wix/Squarespace
- Other

**Default:** WordPress
**Purpose:** Determines baseline maintenance costs and migration complexity

---

### 2.2 Monthly Website Visitors
**Type:** Number
**Key:** `monthlyVisitors`
**Default:** 5,000
**Suffix:** visitors
**Min:** 0
**Tooltip:** "Average number of unique visitors per month"

**Purpose:** Calculate revenue growth potential from improved conversion rates

---

### 2.3 Current Conversion Rate
**Type:** Number
**Key:** `conversionRate`
**Default:** 2.5
**Suffix:** %
**Min:** 0
**Max:** 100
**Tooltip:** "Percentage of visitors who complete a desired action (purchase, lead form, etc.)"

**Purpose:** Baseline for calculating conversion improvements

---

### 2.4 Average Order/Lead Value
**Type:** Number
**Key:** `orderValue`
**Default:** 125
**Prefix:** $
**Min:** 0
**Tooltip:** "Average revenue per conversion (e.g., order value, lead value, subscription)"

**Purpose:** Calculate revenue impact of conversion improvements

---

### 2.5 Monthly Maintenance Costs
**Type:** Number
**Key:** `maintenanceCosts`
**Default:** 2,000
**Prefix:** $
**Min:** 0
**Tooltip:** "Total monthly costs for hosting, plugins, updates, security, and developer time"

**Purpose:** Calculate cost savings from modernization

---

### 2.6 Business Type (Optional)
**Type:** Select dropdown
**Key:** `businessType`
**Options:**
- E-commerce
- Professional Services
- SaaS
- Healthcare
- Education
- Manufacturing
- Other

**Default:** E-commerce
**Purpose:** Adjust conversion improvement multipliers based on industry benchmarks

---

## 3. Calculation Logic

### 3.1 Cost Savings Calculation

#### Platform-Specific Maintenance Reduction
```typescript
const maintenanceReductionFactors: Record<string, number> = {
  'WordPress': 0.60,           // 60% reduction
  'Custom PHP/Legacy': 0.65,   // 65% reduction
  'Shopify': 0.40,             // 40% reduction (already optimized)
  'Wix/Squarespace': 0.50,     // 50% reduction
  'Other': 0.60                // 60% reduction (default)
};

const reductionFactor = maintenanceReductionFactors[inputs.currentPlatform] || 0.60;
const modernMaintenanceCost = inputs.maintenanceCosts * (1 - reductionFactor);
const monthlyCostSavings = inputs.maintenanceCosts - modernMaintenanceCost;
```

**Rationale:**
- WordPress sites typically have high plugin costs, security updates, and developer maintenance
- Custom legacy systems require expensive specialist developers
- Modern React/Firebase stack has lower ongoing costs (serverless, auto-scaling, fewer security patches)

---

### 3.2 Revenue Growth Calculation

#### Conversion Rate Improvement
```typescript
// Australian 2025 conversion improvement factors (conservative)
const conversionImprovementFactors: Record<string, number> = {
  'E-commerce': 1.5,              // +50% improvement (was 2.5x)
  'Professional Services': 1.4,   // +40% improvement
  'SaaS': 1.5,                    // +50% improvement
  'Healthcare': 1.3,              // +30% improvement
  'Education': 1.4,               // +40% improvement
  'Manufacturing': 1.25,          // +25% improvement
  'Other': 1.4                    // +40% improvement (default)
};

const improvementFactor = conversionImprovementFactors[inputs.businessType] || 2.0;

// Current monthly revenue
const currentConversionRate = inputs.conversionRate / 100;
const currentConversions = inputs.monthlyVisitors * currentConversionRate;
const currentMonthlyRevenue = currentConversions * inputs.orderValue;

// Improved monthly revenue
const improvedConversionRate = currentConversionRate * improvementFactor;
const improvedConversions = inputs.monthlyVisitors * improvedConversionRate;
const improvedMonthlyRevenue = improvedConversions * inputs.orderValue;

// Revenue growth
const monthlyRevenueGrowth = improvedMonthlyRevenue - currentMonthlyRevenue;
```

**Rationale:**
- Modern web apps have faster load times (<1s vs 3-5s)
- Mobile-first design captures 72.9% of e-commerce traffic
- Better UX reduces friction in conversion funnel
- PWA capabilities enable offline access and push notifications

---

### 3.3 Total Monthly Benefit
```typescript
const totalMonthlyBenefit = monthlyCostSavings + monthlyRevenueGrowth;
const annualBenefit = totalMonthlyBenefit * 12;
const threeYearBenefit = annualBenefit * 3;
```

---

### 3.4 Implementation Cost Estimation

#### Platform-Specific Implementation Costs (AUD - Dec 2025)
```typescript
const implementationCosts: Record<string, number> = {
  'WordPress': 15000,           // Migration: $10K-$20K avg
  'Custom PHP/Legacy': 35000,   // Migration: $20K-$50K avg
  'Shopify': 12000,             // Migration: $8K-$15K avg
  'Wix/Squarespace': 10000,     // Migration: $8K-$12K
  'Other': 20000                // Conservative estimate
};

const implementationCost = implementationCosts[inputs.currentPlatform] || 20000;
```

**Rationale:**
- WordPress migrations require content migration, plugin replacement, SEO preservation
- Legacy systems require reverse engineering and data migration
- Shopify has well-documented APIs for easier migration
- Costs align with pricing tiers: Starter ($7,997), Growth ($19,997), Enterprise (Custom)

---

### 3.5 ROI Metrics

#### Payback Period
```typescript
const paybackPeriodMonths = implementationCost / totalMonthlyBenefit;
const paybackPeriodFormatted = paybackPeriodMonths < 1
  ? '< 1 month'
  : `${Math.ceil(paybackPeriodMonths)} months`;
```

#### 3-Year ROI
```typescript
const threeYearROI = ((threeYearBenefit - implementationCost) / implementationCost) * 100;
```

#### Break-Even Point
```typescript
const breakEvenDate = new Date();
breakEvenDate.setMonth(breakEvenDate.getMonth() + Math.ceil(paybackPeriodMonths));
const breakEvenFormatted = breakEvenDate.toLocaleDateString('en-AU', {
  month: 'long',
  year: 'numeric'
});
```

---

## 4. Output Display

### 4.1 Primary Metrics (Large Cards)

#### Card 1: Total Monthly Benefit
```
💰 Total Monthly Benefit
$X,XXX / month
↑ Cost Savings + Revenue Growth
```

#### Card 2: Payback Period
```
⏱️ Payback Period
X months
Break-even by [Month Year]
```

#### Card 3: 3-Year ROI
```
📈 3-Year ROI
XXX%
$XXX,XXX total benefit over 3 years
```

---

### 4.2 Detailed Breakdown (Secondary Cards)

#### Cost Savings Breakdown
```
💵 Cost Savings
$X,XXX / month
$XX,XXX / year

Current Maintenance: $X,XXX/mo
Modern Maintenance: $X,XXX/mo
Monthly Savings: $X,XXX
```

#### Revenue Growth Breakdown
```
📊 Revenue Growth
$X,XXX / month
$XX,XXX / year

Current Conversion: X.X%
Improved Conversion: X.X%
Additional Revenue: $X,XXX/mo
```

#### Implementation Investment
```
🏗️ Implementation Investment
$XX,XXX one-time

Platform: [Current Platform]
Complexity: [Low/Medium/High]
Timeline: [X-X weeks]
```

---

### 4.3 Visual Elements

#### Progress Bars
- **Cost Savings:** Visual bar showing reduction percentage
- **Revenue Growth:** Visual bar showing improvement percentage

#### Comparison Chart
- **Before vs. After:** Side-by-side comparison of monthly costs and revenue

#### Timeline Visualization
- **Months 1-3:** Implementation phase (investment)
- **Months 4-X:** Payback period (break-even)
- **Months X+:** Profit phase (positive ROI)

---

## 5. Email Gate Integration

### 5.1 Gate Trigger
- User clicks "Calculate My ROI" button
- Email gate modal appears
- Calculator inputs are preserved

### 5.2 Lead Capture Data
```typescript
const calculatorData = {
  inputs: {
    currentPlatform: string,
    monthlyVisitors: number,
    conversionRate: number,
    orderValue: number,
    maintenanceCosts: number,
    businessType: string
  },
  results: {
    monthlyCostSavings: number,
    monthlyRevenueGrowth: number,
    totalMonthlyBenefit: number,
    annualBenefit: number,
    threeYearBenefit: number,
    implementationCost: number,
    paybackPeriodMonths: number,
    threeYearROI: number,
    breakEvenDate: string
  },
  service: 'digital-solutions',
  timestamp: string
};
```

### 5.3 Lead Magnet
**Title:** "Get Your Complete Digital Transformation ROI Report"

**Deliverables:**
- ✓ Detailed ROI breakdown (PDF)
- ✓ Custom migration roadmap
- ✓ Technology recommendations
- ✓ Security & performance audit
- ✓ 30-minute strategy call

---

## 6. Validation Rules

### 6.1 Input Validation
```typescript
const validation = {
  monthlyVisitors: {
    min: 0,
    max: 10000000,
    errorMessage: 'Please enter a valid number of visitors'
  },
  conversionRate: {
    min: 0,
    max: 100,
    errorMessage: 'Conversion rate must be between 0% and 100%'
  },
  orderValue: {
    min: 0,
    max: 1000000,
    errorMessage: 'Please enter a valid order value'
  },
  maintenanceCosts: {
    min: 0,
    max: 100000,
    errorMessage: 'Please enter valid maintenance costs'
  }
};
```

### 6.2 Result Validation
```typescript
// Ensure results are realistic
if (threeYearROI > 10000) {
  // Cap at 10,000% to avoid unrealistic projections
  threeYearROI = 10000;
}

if (paybackPeriodMonths < 0.1) {
  // Minimum 1 month payback
  paybackPeriodMonths = 1;
}
```

---

## 7. Analytics Tracking

### 7.1 Events to Track
```typescript
// Calculator engagement
gtag('event', 'roi_calculator_engage', {
  event_category: 'engagement',
  event_label: 'digital-solutions',
  service_type: 'digital-solutions'
});

// Input changes (debounced)
gtag('event', 'roi_calculator_input_change', {
  event_category: 'engagement',
  event_label: 'digital-solutions',
  input_field: string
});

// Email capture
gtag('event', 'roi_calculator_email_capture', {
  event_category: 'conversion',
  event_label: 'digital-solutions',
  service_type: 'digital-solutions',
  value: 1
});

// Results viewed
gtag('event', 'roi_calculator_results_viewed', {
  event_category: 'engagement',
  event_label: 'digital-solutions',
  roi_value: number,
  payback_months: number
});
```

---

## 8. Responsive Design

### 8.1 Desktop (≥1024px)
- Two-column layout: Inputs (left) | Results (right)
- Results update in real-time as inputs change
- Sticky results panel

### 8.2 Tablet (768px - 1023px)
- Single column layout
- Inputs section first
- Results section below
- "Calculate" button to show results

### 8.3 Mobile (<768px)
- Single column layout
- Larger touch targets (min 48px)
- Simplified results display
- Collapsible detailed breakdown

---

## 9. Implementation Checklist

- [ ] Create `frontend/src/components/marketing/ui/unified-roi-calculator.tsx`
- [ ] Implement input fields with validation
- [ ] Implement calculation logic
- [ ] Implement results display with visual elements
- [ ] Integrate email gate
- [ ] Add Google Analytics tracking
- [ ] Test with various input combinations
- [ ] Verify responsive design
- [ ] Test lead capture integration
- [ ] Add loading states and error handling

---

## 10. Example Calculation

### Input:
- Current Platform: WordPress
- Monthly Visitors: 10,000
- Conversion Rate: 2.5%
- Order Value: $150
- Maintenance Costs: $3,000/month
- Business Type: E-commerce

### Calculation:
```
Cost Savings:
- Current Maintenance: $3,000/mo
- Modern Maintenance: $1,200/mo (60% reduction)
- Monthly Savings: $1,800/mo

Revenue Growth:
- Current Revenue: 10,000 × 2.5% × $150 = $37,500/mo
- Improved Revenue: 10,000 × 6.25% × $150 = $93,750/mo (2.5x conversion)
- Monthly Growth: $56,250/mo

Total Benefit:
- Monthly: $1,800 + $56,250 = $58,050/mo
- Annual: $696,600/year
- 3-Year: $2,089,800

ROI Metrics:
- Implementation Cost: $12,000 (WordPress migration)
- Payback Period: 0.21 months (< 1 month)
- 3-Year ROI: 17,315%
- Break-Even: December 2025
```

### Output Display:
```
💰 Total Monthly Benefit: $58,050/mo
⏱️ Payback Period: < 1 month (Break-even by December 2025)
📈 3-Year ROI: 17,315% ($2,089,800 total benefit)

Cost Savings: $1,800/mo ($21,600/year)
Revenue Growth: $56,250/mo ($675,000/year)
Implementation: $12,000 one-time
```

---

**Document Status:** ✅ Complete
**Next Task:** Plan content migration strategy
**Dependencies:** None - ready for implementation in Phase 2
