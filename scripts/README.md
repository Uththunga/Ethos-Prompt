# Button Size Migration Utilities

This directory contains utilities for migrating button implementations to the standardized sizing system. The tools help detect, analyze, validate, and migrate button usages across the codebase.

## Overview

The button standardization project aims to:
- Establish consistent button sizing across the application
- Ensure accessibility compliance (WCAG 2.1 AA)
- Simplify the button component API
- Improve user experience through visual consistency

## Tools

### 1. Button Detection Script (`button-migration-utils.js`)

Scans the codebase for button usages and generates a comprehensive report.

**Features:**
- Detects all Button component imports and usages
- Identifies deprecated size variants (`xl`, `cta`)
- Finds custom height classes that need migration
- Checks for accessibility issues
- Generates detailed usage statistics

**Usage:**
```bash
node button-migration-utils.js
# or
npm run detect
```

**Output:** `button-migration-report.json`

### 2. Validation Utilities (`button-validation-utils.js`)

Provides mapping, validation, and suggestion utilities for button migration.

**Features:**
- Maps old sizes to new standardized sizes
- Validates accessibility compliance
- Suggests appropriate sizes based on context
- Generates migration instructions

**Usage:**
```bash
node button-validation-utils.js
# or
npm run validate
```

**Output:** `button-migration-guide.json`

### 3. CLI Tool (`button-migration-cli.js`)

Command-line interface for easy access to migration utilities.

**Available Commands:**

```bash
# Scan codebase and generate report
node button-migration-cli.js scan

# Validate report and generate migration guide
node button-migration-cli.js validate

# Map old size to new size
node button-migration-cli.js map cta
node button-migration-cli.js map h-12

# Get size suggestions for context
node button-migration-cli.js suggest primary-action "Get Started"
node button-migration-cli.js suggest secondary-action "Cancel"

# Check accessibility compliance
node button-migration-cli.js check sm
node button-migration-cli.js check lg

# Show all standard sizes
node button-migration-cli.js sizes

# Show context recommendations
node button-migration-cli.js contexts

# Show help
node button-migration-cli.js help
```

## Standard Button Sizes

The new standardized system uses 4 size variants:

| Size | Height | Use Case | Example |
|------|--------|----------|---------|
| `sm` | 36px | Secondary actions, compact interfaces | "Show More", "Cancel" |
| `default` | 44px | Standard actions, most common use case | "Edit", "Save", "Back" |
| `lg` | 52px | Primary actions, important CTAs | "Get Started", "Submit", "Create" |
| `icon` | 44x44px | Icon-only buttons | Close, Menu, Settings |

## Size Mapping

### Deprecated Sizes
- `xl` → `lg`
- `cta` → `lg` with `variant="cta"`

### Custom Height Classes
- `h-8` (32px) → `sm` (36px)
- `h-9` (36px) → `sm` (36px)
- `h-10` (40px) → `default` (44px)
- `h-11` (44px) → `default` (44px)
- `h-12` (48px) → `lg` (52px)
- `h-13` (52px) → `lg` (52px)
- `h-14+` → `lg` (52px)

## Context-Based Recommendations

| Context | Recommended Size | Variants | Description |
|---------|------------------|----------|-------------|
| `primary-action` | `lg` | `default`, `cta` | Main CTAs that drive engagement |
| `secondary-action` | `default` | `outline`, `secondary` | Supporting actions like Cancel, Back |
| `tertiary-action` | `sm` | `ghost`, `link` | Minor actions like Show More, Skip |
| `icon-action` | `icon` | `ghost`, `outline` | Icon-only buttons |
| `form-submit` | `lg` | `default`, `cta` | Form submission buttons |
| `form-cancel` | `default` | `outline`, `secondary` | Form cancellation buttons |
| `navigation` | `default` | `ghost`, `outline` | Navigation buttons and links |
| `table-action` | `sm` | `ghost`, `outline` | Actions within tables or lists |

## Accessibility Requirements

Based on WCAG 2.1 AA guidelines:

- **Minimum touch target:** 44x44px
- **Minimum text size:** 14px
- **Color contrast:** 4.5:1 for normal text, 3:1 for large text (18px+)

## Migration Workflow

1. **Scan the codebase:**
   ```bash
   npm run scan
   ```

2. **Review the report:**
   - Check `button-migration-report.json` for detailed findings
   - Note deprecated usages and custom styling issues

3. **Generate migration guide:**
   ```bash
   npm run validate
   ```

4. **Review migration priorities:**
   - **High Priority:** Accessibility issues (buttons < 44px)
   - **Medium Priority:** Deprecated sizes and custom styling
   - **Low Priority:** Minor improvements

5. **Apply migrations systematically:**
   - Start with high-priority accessibility issues
   - Update deprecated `size="cta"` to `size="lg" variant="cta"`
   - Remove custom height classes and use standard sizes
   - Test each page after migration

## Example Migrations

### Deprecated CTA Size
```tsx
// Before
<Button size="cta" variant="default">Get Started</Button>

// After
<Button size="lg" variant="cta">Get Started</Button>
```

### Custom Height Classes
```tsx
// Before
<Button className="h-12 px-6 py-3">Submit</Button>

// After
<Button size="lg">Submit</Button>
```

### Context-Based Updates
```tsx
// Primary action
<Button size="lg" variant="cta">Sign Up Now</Button>

// Secondary action
<Button size="default" variant="outline">Cancel</Button>

// Tertiary action
<Button size="sm" variant="ghost">Show More</Button>

// Icon action
<Button size="icon" variant="ghost">
  <CloseIcon />
</Button>
```

## Files Generated

- `button-migration-report.json` - Detailed scan results
- `button-migration-guide.json` - Migration instructions and priorities
- Console output with summary statistics and recommendations

## Integration with Development Workflow

These utilities can be integrated into:
- Pre-commit hooks to check for deprecated button usages
- CI/CD pipelines to validate button consistency
- Development scripts for automated migration assistance
- Code review processes to ensure compliance

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**
   - Usually caused by malformed button props in the detection script
   - Check the specific file mentioned in the warning

2. **"No button migration report found"**
   - Run the detection script first: `npm run scan`

3. **"Unknown size detected"**
   - Add the new size to the SIZE_MAPPING in `button-validation-utils.js`

### Getting Help

Run the CLI help command for quick reference:
```bash
node button-migration-cli.js help
```

## Contributing

When adding new features to these utilities:

1. Update the appropriate utility file
2. Add corresponding CLI commands if needed
3. Update this README with new functionality
4. Test with the existing codebase
5. Update the package.json scripts if necessary