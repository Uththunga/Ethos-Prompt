# ROI API Documentation

## Endpoint: Capture ROI Lead

**URL:** `/api/leads/capture-roi`
**Method:** `POST`
**Content-Type:** `application/json`

### Description

Captures lead information when a user submits their email to receive ROI calculation results. Stores the ROI snapshot data for follow-up and analytics.

---

## Request Schema

```typescript
interface CaptureROILeadRequest {
  // Required fields
  email: string;           // User's email address
  service: string;         // Service type (e.g., "digital-solutions", "smart-assistant")
  source: string;          // Calculator source (e.g., "unified_roi_calculator", "gated_roi_calculator")

  // Optional fields
  name?: string;           // User's name
  meta?: {
    roiSnapshot?: {
      inputs: {
        currentPlatform: string;
        monthlyVisitors: number;
        conversionRate: number;
        orderValue: number;
        maintenanceCosts: number;
        businessType: string;
      };
      results: {
        monthlyCostSavings: number;
        monthlyRevenueGrowth: number;
        totalMonthlyBenefit: number;
        annualBenefit: number;
        threeYearBenefit: number;
        implementationCost: number;
        paybackPeriodMonths: number;
        paybackPeriodFormatted: string;
        threeYearROI: number;
        breakEvenDate: string;
        currentMonthlyRevenue: number;
        improvedMonthlyRevenue: number;
      };
      service: string;
      timestamp: string;    // ISO 8601 format
    };
    leadMagnet?: string;    // Lead magnet description
  };
  metadata?: {
    userAgent?: string;
    referrerUrl?: string;
    utmParams?: Record<string, string>;
  };
}
```

---

## Response Schema

### Success Response

**Status Code:** `200 OK`

```typescript
interface CaptureROILeadResponse {
  success: true;
  contactId: string;        // Unique contact ID for tracking
  message?: string;
}
```

### Error Response

**Status Codes:** `400 Bad Request`, `500 Internal Server Error`

```typescript
interface CaptureROILeadErrorResponse {
  success: false;
  error: string;
  message?: string;
}
```

---

## Example Request

```json
{
  "email": "jane.smith@example.com",
  "name": "Jane Smith",
  "service": "digital-solutions",
  "source": "unified_roi_calculator",
  "meta": {
    "roiSnapshot": {
      "inputs": {
        "currentPlatform": "WordPress",
        "monthlyVisitors": 5000,
        "conversionRate": 2.0,
        "orderValue": 125,
        "maintenanceCosts": 1500,
        "businessType": "E-commerce"
      },
      "results": {
        "monthlyCostSavings": 900,
        "monthlyRevenueGrowth": 6250,
        "totalMonthlyBenefit": 7150,
        "annualBenefit": 85800,
        "threeYearBenefit": 257400,
        "implementationCost": 15000,
        "paybackPeriodMonths": 2.1,
        "paybackPeriodFormatted": "3 months",
        "threeYearROI": 1616,
        "breakEvenDate": "March 2026",
        "currentMonthlyRevenue": 12500,
        "improvedMonthlyRevenue": 18750
      },
      "service": "digital-solutions",
      "timestamp": "2025-12-21T08:30:00.000Z"
    },
    "leadMagnet": "Get Your Complete Digital Transformation ROI Report + Custom Roadmap"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "referrerUrl": "https://ethosprompt.com/intelligent-applications",
    "utmParams": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "roi-calculator"
    }
  }
}
```

---

## Example Response

```json
{
  "success": true,
  "contactId": "lead_abc123xyz"
}
```

---

## Validation Rules

| Field | Validation |
|-------|------------|
| `email` | Required, valid email format |
| `service` | Required, non-empty string |
| `source` | Required, non-empty string |
| `name` | Optional, max 100 characters |
| `meta.roiSnapshot.inputs.conversionRate` | 0-100 (percentage) |
| `meta.roiSnapshot.inputs.monthlyVisitors` | >= 0 |

---

## Usage Notes

1. **Email Validation**: The endpoint validates email format but does not verify email deliverability
2. **Duplicate Handling**: Existing contacts are updated rather than duplicated
3. **Analytics Integration**: ROI snapshots are stored for conversion analysis
4. **GDPR Compliance**: Data processing follows Australian Privacy Principles

---

## Related Endpoints

- `POST /api/leads/capture` - Generic lead capture
- `POST /api/quotation/submit` - Full quotation request
- `GET /api/leads/:id` - Retrieve lead details (authenticated)
