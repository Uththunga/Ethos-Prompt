/**
 * useROICalculator Hook
 * Centralized ROI calculation logic for EthosPrompt digital transformation
 * Uses Australian 2025 economic benchmarks (RBA 3.60%, CPI 3.8%)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ROICalculatorInputs {
  currentPlatform: string;
  monthlyVisitors: number;
  conversionRate: number;
  orderValue: number;
  maintenanceCosts: number;
  businessType: string;
}

export interface ROICalculatorResults {
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
}

export interface ROIConfig {
  maintenanceReductionFactors: Record<string, number>;
  conversionImprovementFactors: Record<string, number>;
  implementationCosts: Record<string, number>;
}

// ============================================================================
// Constants - Australian 2025 Economic Benchmarks
// Sources: RBA, ABS, ATO, Industry Reports
// ============================================================================

/**
 * Platform-specific maintenance reduction factors
 * Represents the percentage of current costs that can be saved by migrating
 */
export const MAINTENANCE_REDUCTION_FACTORS: Record<string, number> = {
  WordPress: 0.6,
  'Custom PHP/Legacy': 0.65,
  Shopify: 0.4,
  'Wix/Squarespace': 0.5,
  Other: 0.6,
};

/**
 * Business-type specific conversion improvement factors
 * Conservative estimates based on Australian 2025 industry benchmarks
 * E-commerce baseline: 2.0% → improved: 3.0% (+50%)
 */
export const CONVERSION_IMPROVEMENT_FACTORS: Record<string, number> = {
  'E-commerce': 1.5,          // +50% improvement (industry avg: 300-500% ROI in 12-18mo)
  'Professional Services': 1.4, // +40% improvement (B2B conversion 2-5%)
  SaaS: 1.5,                   // +50% improvement (high digital optimization potential)
  Healthcare: 1.3,             // +30% improvement (conversion avg: 3-7.4%)
  Education: 1.4,              // +40% improvement (growing online market)
  Manufacturing: 1.25,         // +25% improvement (200-350% ROI in 15-18mo)
  Other: 1.4,                  // +40% improvement (conservative default)
};

/**
 * Platform-specific implementation costs (AUD)
 * Based on Australian web development market rates Dec 2025
 */
export const IMPLEMENTATION_COSTS: Record<string, number> = {
  WordPress: 15000,            // Migration: $10K-$20K avg
  'Custom PHP/Legacy': 35000,  // Migration: $20K-$50K avg
  Shopify: 12000,              // Migration: $8K-$15K avg
  'Wix/Squarespace': 10000,    // Migration: $8K-$12K avg
  Other: 20000,                // Conservative estimate
};

/**
 * Default input values based on Australian averages
 */
export const DEFAULT_ROI_INPUTS: ROICalculatorInputs = {
  currentPlatform: 'WordPress',
  monthlyVisitors: 5000,
  conversionRate: 2.0,   // Australian e-commerce average (range: 1.8%-4%)
  orderValue: 125,       // Australian AOV (range: $66-$161)
  maintenanceCosts: 1500, // Conservative baseline for WordPress sites
  businessType: 'E-commerce',
};

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate ROI based on inputs
 * Pure function for testability
 */
export function calculateROI(
  inputs: ROICalculatorInputs,
  config: ROIConfig = {
    maintenanceReductionFactors: MAINTENANCE_REDUCTION_FACTORS,
    conversionImprovementFactors: CONVERSION_IMPROVEMENT_FACTORS,
    implementationCosts: IMPLEMENTATION_COSTS
  }
): ROICalculatorResults {
  const {
    currentPlatform,
    monthlyVisitors,
    conversionRate,
    orderValue,
    maintenanceCosts,
    businessType,
  } = inputs;

  // Calculate cost savings
  const reductionFactor = config.maintenanceReductionFactors[currentPlatform] || 0.6;
  const modernMaintenanceCost = maintenanceCosts * (1 - reductionFactor);
  const monthlyCostSavings = maintenanceCosts - modernMaintenanceCost;

  // Calculate revenue growth
  const improvementFactor = config.conversionImprovementFactors[businessType] || 1.4;
  const currentConversionRate = conversionRate / 100;
  const currentConversions = monthlyVisitors * currentConversionRate;
  const currentMonthlyRevenue = currentConversions * orderValue;

  const improvedConversionRate = currentConversionRate * improvementFactor;
  const improvedConversions = monthlyVisitors * improvedConversionRate;
  const improvedMonthlyRevenue = improvedConversions * orderValue;
  const monthlyRevenueGrowth = improvedMonthlyRevenue - currentMonthlyRevenue;

  // Calculate total benefits
  const totalMonthlyBenefit = monthlyCostSavings + monthlyRevenueGrowth;
  const annualBenefit = totalMonthlyBenefit * 12;
  const threeYearBenefit = annualBenefit * 3;

  // Calculate implementation cost and ROI
  const implementationCost = config.implementationCosts[currentPlatform] || 15000;
  const paybackPeriodMonths = totalMonthlyBenefit > 0
    ? implementationCost / totalMonthlyBenefit
    : Infinity;
  const paybackPeriodFormatted =
    paybackPeriodMonths < 1 ? '< 1 month' : `${Math.ceil(paybackPeriodMonths)} months`;

  const threeYearROI = totalMonthlyBenefit > 0
    ? ((threeYearBenefit - implementationCost) / implementationCost) * 100
    : 0;

  // Calculate break-even date
  const breakEvenDate = new Date();
  breakEvenDate.setMonth(breakEvenDate.getMonth() + Math.ceil(paybackPeriodMonths));
  const breakEvenFormatted = breakEvenDate.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });

  return {
    monthlyCostSavings,
    monthlyRevenueGrowth,
    totalMonthlyBenefit,
    annualBenefit,
    threeYearBenefit,
    implementationCost,
    paybackPeriodMonths,
    paybackPeriodFormatted,
    threeYearROI,
    breakEvenDate: breakEvenFormatted,
    currentMonthlyRevenue,
    improvedMonthlyRevenue,
  };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format number as Australian currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with locale formatting
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// Hook
// ============================================================================

export interface UseROICalculatorReturn {
  inputs: ROICalculatorInputs;
  results: ROICalculatorResults;
  setInput: <K extends keyof ROICalculatorInputs>(
    key: K,
    value: ROICalculatorInputs[K]
  ) => void;
  setInputs: (inputs: Partial<ROICalculatorInputs>) => void;
  resetInputs: () => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
}

/**
 * useROICalculator Hook
 * Provides centralized ROI calculation logic with Australian 2025 benchmarks
 *
 * @param initialInputs - Optional initial input values
 * @returns Calculator state, results, and utility functions
 *
 * @example
 * ```tsx
 * const { inputs, results, setInput } = useROICalculator();
 *
 * return (
 *   <div>
 *     <input
 *       value={inputs.monthlyVisitors}
 *       onChange={(e) => setInput('monthlyVisitors', Number(e.target.value))}
 *     />
 *     <p>Annual Benefit: {formatCurrency(results.annualBenefit)}</p>
 *   </div>
 * );
 * ```
 */
export function useROICalculator(
  initialInputs: Partial<ROICalculatorInputs> = {}
): UseROICalculatorReturn {
  const [inputs, setInputsState] = useState<ROICalculatorInputs>({
    ...DEFAULT_ROI_INPUTS,
    ...initialInputs,
  });

  const [config, setConfig] = useState<ROIConfig>({
    maintenanceReductionFactors: MAINTENANCE_REDUCTION_FACTORS,
    conversionImprovementFactors: CONVERSION_IMPROVEMENT_FACTORS,
    implementationCosts: IMPLEMENTATION_COSTS
  });

  // Fetch dynamic config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/ai/marketing/roi-config');
        if (response.ok) {
          const data = await response.json();
          // Map API snake_case to CamelCase if needed, or assume matching structure
          // API returns: maintenance_reduction_factors, etc.
          setConfig({
            maintenanceReductionFactors: data.maintenance_reduction_factors || MAINTENANCE_REDUCTION_FACTORS,
            conversionImprovementFactors: data.conversion_improvement_factors || CONVERSION_IMPROVEMENT_FACTORS,
            implementationCosts: data.implementation_costs || IMPLEMENTATION_COSTS
          });
        }
      } catch (err) {
        console.error('Failed to fetch ROI config, using defaults:', err);
      }
    };
    fetchConfig();
  }, []);

  // Memoized results - recalculates only when inputs or config change
  const results = useMemo(() => calculateROI(inputs, config), [inputs, config]);

  // Set a single input value
  const setInput = useCallback(<K extends keyof ROICalculatorInputs>(
    key: K,
    value: ROICalculatorInputs[K]
  ) => {
    setInputsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple input values
  const setInputs = useCallback((newInputs: Partial<ROICalculatorInputs>) => {
    setInputsState((prev) => ({ ...prev, ...newInputs }));
  }, []);

  // Reset to default values
  const resetInputs = useCallback(() => {
    setInputsState(DEFAULT_ROI_INPUTS);
  }, []);

  return {
    inputs,
    results,
    setInput,
    setInputs,
    resetInputs,
    formatCurrency,
    formatNumber,
  };
}

export default useROICalculator;
