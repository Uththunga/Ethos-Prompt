# Advanced CTA Quotation System

A comprehensive, multi-step quotation request system for collecting detailed user requirements and generating custom quotes.

## 📁 Structure

```
quotation/
├── README.md                          # This file
├── index.ts                           # Main exports
├── types.ts                           # TypeScript types and interfaces
├── validation.ts                      # Zod validation schemas
├── formReducer.ts                     # State management with useReducer
├── serviceConfig.ts                   # Service-specific configurations
├── QuotationRequestModal.tsx          # Main modal component
├── SubmissionConfirmation.tsx         # Success confirmation page
└── steps/
    ├── index.ts                       # Step component exports
    ├── Step1BusinessInfo.tsx          # Business information form
    ├── Step2ProjectScope.tsx          # Project scope and goals
    ├── Step3TechnicalRequirements.tsx # Technical requirements
    ├── Step4TimelineBudget.tsx        # Timeline and budget
    └── Step5ConsultationPreference.tsx # Consultation preferences
```

## 🚀 Usage

### Basic Implementation

```tsx
import { QuotationRequestModal } from '@/components/marketing/quotation';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Get Custom Quote
      </button>

      <QuotationRequestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        serviceContext="intelligent-applications"
        serviceName="Web & Mobile Applications"
      />
    </>
  );
}
```

### With InvestmentSection

```tsx
import { InvestmentSection } from '@/components/marketing/ui/service-layout-components';

<InvestmentSection
  pricing={pricingPlans}
  serviceContext="intelligent-applications"
  serviceName="Web & Mobile Applications"
  title="Get Your Custom Quote"
  description="Submit your requirements and receive a detailed quotation."
/>
```

## 🎯 Service Contexts

The system supports four service contexts, each with specific questions:

### `intelligent-applications`
- **Name**: Web & Mobile Applications
- **Goals**: Increase sales, Improve CX, Automate processes, Scale operations
- **Features**: E-commerce, Customer portal, Mobile app, Admin dashboard, etc.

### `solutions`
- **Name**: AI Solutions
- **Goals**: Reduce costs, Improve efficiency, Better insights, Competitive advantage
- **Features**: AI chatbot, Workflow automation, Data analytics, System integration

### `smart-assistant`
- **Name**: Smart Business Assistant
- **Goals**: 24/7 support, Lead qualification, Task automation, Knowledge management
- **Features**: Multi-channel support, CRM integration, NLP, Learning capabilities

### `system-integration`
- **Name**: System Integration
- **Goals**: Connect systems, Eliminate manual entry, Automate workflows, Centralize data
- **Features**: API integration, Data sync, Workflow automation, Custom connectors

## 📝 Form Steps

### Step 1: Business Information
Collects company details and contact information.

**Fields**:
- Company Name (required)
- Industry (required, dropdown)
- Company Size (required, radio)
- Contact Name (required)
- Contact Email (required, validated)
- Contact Phone (optional, validated if provided)

### Step 2: Project Scope
Collects project description, goals, and desired features.

**Fields**:
- Project Description (required, 20-1000 chars)
- Primary Goals (required, multi-select, 1-4)
- Specific Features (optional, multi-select)

**Special Features**:
- Character counter
- Smart feature recommendations based on goals
- Service-specific options

### Step 3: Technical Requirements
Collects technical environment and integration needs.

**Fields**:
- Existing Systems (optional, add/remove)
- Integration Needs (optional, textarea)
- Data Volume (required, dropdown)
- Security Requirements (optional, multi-select)

**Special Features**:
- Quick-add common systems
- Service-specific help text

### Step 4: Timeline & Budget
Collects timeline expectations and budget range.

**Fields**:
- Desired Timeline (required, radio)
- Budget Range (required, dropdown)
- Flexibility (required, radio)

**Special Features**:
- Pricing model explanation
- "Not sure yet" option for budget

### Step 5: Consultation Preference
Collects consultation preferences.

**Fields**:
- Needs Consultation (required, Yes/No radio)
- Consultation Format (conditional, radio)
- Preferred Time Slots (conditional, multi-select)

**Special Features**:
- Conditional fields based on consultation choice
- "What to Expect" benefits list
- "What Happens Next" timeline

## 🔧 Configuration

### Adding New Service Context

1. **Update types.ts**:
```typescript
export type ServiceContext =
  | 'intelligent-applications'
  | 'solutions'
  | 'smart-assistant'
  | 'system-integration'
  | 'your-new-service'; // Add here

export const SERVICE_CONFIGS: Record<ServiceContext, ServiceQuestionConfig> = {
  // ... existing configs
  'your-new-service': {
    primaryGoals: [
      { value: 'goal-1', label: 'Goal 1' },
      { value: 'goal-2', label: 'Goal 2' },
    ],
    specificFeatures: [
      { value: 'feature-1', label: 'Feature 1' },
      { value: 'feature-2', label: 'Feature 2' },
    ],
  },
};
```

2. **Update serviceConfig.ts**:
```typescript
export const getServiceDisplayName = (serviceContext: ServiceContext): string => {
  const names: Record<ServiceContext, string> = {
    // ... existing names
    'your-new-service': 'Your New Service Name',
  };
  return names[serviceContext];
};

export const getProjectDescriptionPlaceholder = (serviceContext: ServiceContext): string => {
  const placeholders: Record<ServiceContext, string> = {
    // ... existing placeholders
    'your-new-service': 'Example: Your placeholder text...',
  };
  return placeholders[serviceContext];
};
```

### Modifying Validation Rules

Edit `validation.ts`:

```typescript
export const step1Schema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Must be at least 2 characters') // Modify this
    .max(100, 'Must be less than 100 characters'), // Or this
  // ... other fields
});
```

### Adding New Options

Edit `types.ts`:

```typescript
export const INDUSTRY_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce & Retail' },
  { value: 'your-industry', label: 'Your Industry' }, // Add here
  // ... existing options
];
```

## 🎨 Styling

The system uses Tailwind CSS with custom Ethos design tokens:

- **Primary Color**: `ethos-purple`
- **Text Color**: `ethos-navy`
- **Background**: `gray-50` to `white`
- **Borders**: `gray-200` to `gray-300`
- **Errors**: `red-500` to `red-600`
- **Success**: `green-500` to `green-600`

### Custom Styles

All components accept `className` prop for customization:

```tsx
<QuotationRequestModal
  className="custom-modal-class"
  // ... other props
/>
```

## ♿ Accessibility

The system is WCAG 2.1 AA compliant:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels on all interactive elements
- ✅ Focus indicators
- ✅ Screen reader compatible
- ✅ Color contrast compliant
- ✅ Touch targets minimum 44x44px
- ✅ Error messages announced to screen readers

### Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Shift + Tab**: Navigate backwards
- **Enter**: Submit/Select
- **Escape**: Close modal
- **Space**: Toggle checkboxes/radios

## 📱 Mobile Support

Fully responsive design:

- **320px - 768px**: Mobile layout
- **768px - 1024px**: Tablet layout
- **1024px+**: Desktop layout

Touch-friendly controls with minimum 44x44px tap targets.

## 💾 Auto-Save

Form data is automatically saved to localStorage:

- **Trigger**: 2 seconds after last change
- **Storage Key**: `quotation_form_data`
- **Expiry**: 7 days
- **Cleared**: On successful submission

### Manual Control

```typescript
import {
  saveFormDataToStorage,
  loadFormDataFromStorage,
  clearFormDataFromStorage,
} from '@/components/marketing/quotation';

// Save data
saveFormDataToStorage(formData);

// Load data
const savedData = loadFormDataFromStorage();

// Clear data
clearFormDataFromStorage();
```

## 🔒 Security

- **XSS Protection**: All inputs sanitized
- **Email Validation**: Blocks disposable domains
- **Phone Validation**: Format validation
- **Data Encryption**: Ready for HTTPS
- **Privacy**: Clear data usage notices

## 🧪 Testing

### Unit Tests

```bash
npm test quotation
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing

See `QUICK_START.md` for detailed testing instructions.

## 📊 Analytics

Track these events (to be implemented):

- `quotation_modal_opened`
- `quotation_step_completed`
- `quotation_step_abandoned`
- `quotation_submitted`
- `quotation_consultation_requested`

## 🐛 Troubleshooting

### Modal doesn't open
- Check if `isOpen` prop is true
- Verify lazy loading is working
- Check browser console for errors

### Validation not working
- Verify Zod schemas are imported
- Check field names match schema
- Review validation.ts for rules

### Auto-save not working
- Check localStorage is enabled
- Verify browser supports localStorage
- Check for quota exceeded errors

### Styles broken
- Ensure Tailwind CSS is compiled
- Verify all UI components imported
- Check `cn()` utility function

## 📚 API Reference

### QuotationRequestModal

```typescript
interface QuotationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceContext: ServiceContext;
  serviceName: string;
}
```

### SubmissionConfirmation

```typescript
interface SubmissionConfirmationProps {
  referenceNumber: string;
  submittedData: QuotationFormData;
  onClose: () => void;
}
```

### FormStepProps

```typescript
interface FormStepProps {
  formData: QuotationFormData;
  errors: Record<string, string>;
  onChange: (field: keyof QuotationFormData, value: any) => void;
  onClearError: (field: string) => void;
  serviceContext: ServiceContext;
}
```

## 🔄 State Management

Uses `useReducer` for complex form state:

```typescript
type QuotationFormAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_FIELD'; payload: { field: string; value: any } }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_SAVED_DATA'; payload: Partial<QuotationFormData> };
```

## 🚀 Performance

- **Lazy Loading**: Modal loads only when opened
- **Code Splitting**: Separate chunks for each step
- **Throttled Auto-Save**: Saves every 2 seconds
- **Optimized Re-renders**: useCallback for handlers
- **Memoized Components**: React.memo where appropriate

## 📦 Dependencies

- `react`: ^18.0.0
- `react-dom`: ^18.0.0
- `@radix-ui/react-dialog`: For modal
- `@radix-ui/react-select`: For dropdowns
- `@radix-ui/react-radio-group`: For radio buttons
- `@radix-ui/react-checkbox`: For checkboxes
- `@radix-ui/react-accordion`: For collapsible sections
- `zod`: For validation
- `lucide-react`: For icons
- `tailwindcss`: For styling

## 📄 License

Part of the EthosPrompt project.

## 🤝 Contributing

When contributing:

1. Follow existing code style
2. Add TypeScript types
3. Include validation
4. Test on mobile
5. Ensure accessibility
6. Update documentation

## 📞 Support

For issues or questions:

1. Check QUICK_START.md
2. Review IMPLEMENTATION_SUMMARY.md
3. Check browser console
4. Review design.md for expected behavior

---

**Built with ❤️ for EthosPrompt**
