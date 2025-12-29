/**
 * Tests for useROICalculator hook
 */
import { act, renderHook } from '@testing-library/react';
import {
    calculateROI,
    CONVERSION_IMPROVEMENT_FACTORS,
    DEFAULT_ROI_INPUTS,
    formatCurrency,
    formatNumber,
    IMPLEMENTATION_COSTS,
    MAINTENANCE_REDUCTION_FACTORS,
    useROICalculator,
} from '../useROICalculator';

describe('useROICalculator Hook', () => {
  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useROICalculator());

      expect(result.current.inputs).toEqual(DEFAULT_ROI_INPUTS);
    });

    it('should accept initial input overrides', () => {
      const { result } = renderHook(() =>
        useROICalculator({ monthlyVisitors: 10000 })
      );

      expect(result.current.inputs.monthlyVisitors).toBe(10000);
      expect(result.current.inputs.currentPlatform).toBe('WordPress');
    });
  });

  describe('Input Updates', () => {
    it('should update single input via setInput', () => {
      const { result } = renderHook(() => useROICalculator());

      act(() => {
        result.current.setInput('monthlyVisitors', 8000);
      });

      expect(result.current.inputs.monthlyVisitors).toBe(8000);
    });

    it('should update multiple inputs via setInputs', () => {
      const { result } = renderHook(() => useROICalculator());

      act(() => {
        result.current.setInputs({
          monthlyVisitors: 12000,
          conversionRate: 3.5,
        });
      });

      expect(result.current.inputs.monthlyVisitors).toBe(12000);
      expect(result.current.inputs.conversionRate).toBe(3.5);
    });

    it('should reset to defaults', () => {
      const { result } = renderHook(() => useROICalculator());

      act(() => {
        result.current.setInputs({
          monthlyVisitors: 20000,
          orderValue: 500,
        });
      });

      act(() => {
        result.current.resetInputs();
      });

      expect(result.current.inputs).toEqual(DEFAULT_ROI_INPUTS);
    });
  });

  describe('Results Calculation', () => {
    it('should calculate results based on inputs', () => {
      const { result } = renderHook(() => useROICalculator());

      // With default E-commerce values
      expect(result.current.results.monthlyCostSavings).toBe(900); // 60% of 1500
      expect(result.current.results.monthlyRevenueGrowth).toBe(6250);
      expect(result.current.results.totalMonthlyBenefit).toBe(7150);
    });

    it('should recalculate when inputs change', () => {
      const { result } = renderHook(() => useROICalculator());

      const initialBenefit = result.current.results.totalMonthlyBenefit;

      act(() => {
        result.current.setInput('monthlyVisitors', 10000);
      });

      expect(result.current.results.totalMonthlyBenefit).toBeGreaterThan(
        initialBenefit
      );
    });
  });
});

describe('calculateROI Function', () => {
  it('should calculate WordPress E-commerce correctly', () => {
    const result = calculateROI(DEFAULT_ROI_INPUTS);

    // WordPress: 60% reduction on $1500 = $900 savings
    expect(result.monthlyCostSavings).toBe(900);

    // E-commerce: 1.5x improvement on 5000 * 0.02 * 125 = $6,250 growth
    expect(result.monthlyRevenueGrowth).toBe(6250);

    // Total monthly benefit
    expect(result.totalMonthlyBenefit).toBe(7150);
    expect(result.annualBenefit).toBe(85800);
    expect(result.threeYearBenefit).toBe(257400);

    // Implementation cost for WordPress
    expect(result.implementationCost).toBe(15000);

    // Payback period
    expect(result.paybackPeriodMonths).toBeCloseTo(2.1, 1);
    expect(result.paybackPeriodFormatted).toBe('3 months');

    // 3-year ROI
    expect(Math.round(result.threeYearROI)).toBe(1616);
  });

  it('should handle Shopify with lower reduction factor', () => {
    const result = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      currentPlatform: 'Shopify',
    });

    // Shopify: 40% reduction on $1500 = $600 savings
    expect(result.monthlyCostSavings).toBe(600);
    expect(result.implementationCost).toBe(12000);
  });

  it('should handle Custom PHP with higher costs', () => {
    const result = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      currentPlatform: 'Custom PHP/Legacy',
    });

    // Custom PHP: 65% reduction
    expect(result.monthlyCostSavings).toBe(975);
    expect(result.implementationCost).toBe(35000);
  });

  it('should handle zero visitors', () => {
    const result = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      monthlyVisitors: 0,
    });

    expect(result.monthlyRevenueGrowth).toBe(0);
    expect(result.monthlyCostSavings).toBe(900); // Still has cost savings
  });

  it('should handle zero maintenance costs', () => {
    const result = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      maintenanceCosts: 0,
    });

    expect(result.monthlyCostSavings).toBe(0);
    expect(result.monthlyRevenueGrowth).toBe(6250); // Still has revenue growth
  });

  it('should use correct business type factors', () => {
    const ecommerce = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      businessType: 'E-commerce',
    });

    const healthcare = calculateROI({
      ...DEFAULT_ROI_INPUTS,
      businessType: 'Healthcare',
    });

    // Healthcare has lower improvement factor (1.3 vs 1.5)
    expect(healthcare.monthlyRevenueGrowth).toBeLessThan(
      ecommerce.monthlyRevenueGrowth
    );
  });
});

describe('Formatting Functions', () => {
  describe('formatCurrency', () => {
    it('should format as Australian currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(12500)).toBe('$12,500');
      expect(formatCurrency(85800)).toBe('$85,800');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should round to whole numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });
  });

  describe('formatNumber', () => {
    it('should format with locale grouping', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1616)).toBe('1,616');
    });
  });
});

describe('Constants', () => {
  it('should have correct maintenance reduction factors', () => {
    expect(MAINTENANCE_REDUCTION_FACTORS.WordPress).toBe(0.6);
    expect(MAINTENANCE_REDUCTION_FACTORS['Custom PHP/Legacy']).toBe(0.65);
    expect(MAINTENANCE_REDUCTION_FACTORS.Shopify).toBe(0.4);
    expect(MAINTENANCE_REDUCTION_FACTORS['Wix/Squarespace']).toBe(0.5);
  });

  it('should have correct conversion improvement factors', () => {
    expect(CONVERSION_IMPROVEMENT_FACTORS['E-commerce']).toBe(1.5);
    expect(CONVERSION_IMPROVEMENT_FACTORS.Healthcare).toBe(1.3);
    expect(CONVERSION_IMPROVEMENT_FACTORS.Manufacturing).toBe(1.25);
  });

  it('should have correct implementation costs', () => {
    expect(IMPLEMENTATION_COSTS.WordPress).toBe(15000);
    expect(IMPLEMENTATION_COSTS['Custom PHP/Legacy']).toBe(35000);
    expect(IMPLEMENTATION_COSTS.Shopify).toBe(12000);
  });
});
