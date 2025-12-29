"""
ROI Calculator Logic
Centralized logic for ROI calculations using Australian 2025 economic benchmarks.
Mirrors the frontend implementation in `frontend/src/hooks/useROICalculator.ts`.

MAINTAINER NOTE:
Any changes to benchmarks or logic here MUST be synchronized with:
`frontend/src/hooks/useROICalculator.ts`
"""

from typing import Dict, Any

# ============================================================================
# Constants - Australian 2025 Economic Benchmarks
# Sources: RBA, ABS, ATO, Industry Reports
# ============================================================================

# Platform-specific maintenance reduction factors
MAINTENANCE_REDUCTION_FACTORS = {
    "WordPress": 0.6,
    "Custom PHP/Legacy": 0.65,
    "Custom PHP": 0.65,  # Alias
    "Shopify": 0.4,
    "Wix/Squarespace": 0.5,
    "Wix": 0.5,  # Alias
    "Other": 0.6,
}

# Business-type specific conversion improvement factors
CONVERSION_IMPROVEMENT_FACTORS = {
    "E-commerce": 1.5,        # +50% improvement
    "Professional Services": 1.4,  # +40%
    "SaaS": 1.5,              # +50%
    "Healthcare": 1.3,        # +30%
    "Education": 1.4,         # +40%
    "Manufacturing": 1.25,    # +25%
    "Other": 1.4,             # +40%
}

# Platform-specific implementation costs (AUD)
IMPLEMENTATION_COSTS = {
    "WordPress": 15000,
    "Custom PHP/Legacy": 35000,
    "Custom PHP": 35000,  # Alias
    "Shopify": 12000,
    "Wix/Squarespace": 10000,
    "Wix": 10000,  # Alias
    "Other": 20000,
}


def calculate_roi(
    business_type: str = "E-commerce",
    monthly_visitors: int = 5000,
    conversion_rate: float = 2.0,
    order_value: float = 125.0,
    maintenance_costs: float = 1500.0,
    current_platform: str = "WordPress"
) -> Dict[str, Any]:
    """
    Calculate ROI based on inputs.

    Args:
        business_type: Industry type (E-commerce, SaaS, etc.)
        monthly_visitors: Number of monthly site visitors
        conversion_rate: Current conversion rate (%)
        order_value: Average Order Value ($)
        maintenance_costs: Current monthly maintenance costs ($)
        current_platform: Current CMS/Platform

    Returns:
        Dictionary containing calculated ROI metrics
    """
    # Calculate cost savings
    reduction_factor = MAINTENANCE_REDUCTION_FACTORS.get(current_platform, 0.6)
    modern_maintenance_cost = maintenance_costs * (1 - reduction_factor)
    monthly_cost_savings = maintenance_costs - modern_maintenance_cost

    # Calculate revenue growth
    improvement_factor = CONVERSION_IMPROVEMENT_FACTORS.get(business_type, 1.4)
    current_conversion_rate = conversion_rate / 100.0
    current_conversions = monthly_visitors * current_conversion_rate
    current_monthly_revenue = current_conversions * order_value

    improved_conversion_rate = current_conversion_rate * improvement_factor
    improved_conversions = monthly_visitors * improved_conversion_rate
    improved_monthly_revenue = improved_conversions * order_value
    monthly_revenue_growth = improved_monthly_revenue - current_monthly_revenue

    # Calculate total benefits
    total_monthly_benefit = monthly_cost_savings + monthly_revenue_growth
    annual_benefit = total_monthly_benefit * 12
    three_year_benefit = annual_benefit * 3

    # Calculate implementation cost and ROI
    implementation_cost = IMPLEMENTATION_COSTS.get(current_platform, 15000)

    if total_monthly_benefit > 0:
        payback_months = implementation_cost / total_monthly_benefit
        payback_formatted = f"{payback_months:.1f} months" if payback_months >= 1 else "< 1 month"
        three_year_roi = ((three_year_benefit - implementation_cost) / implementation_cost) * 100
    else:
        payback_months = float('inf')
        payback_formatted = "N/A"
        three_year_roi = 0

    return {
        "monthly_cost_savings": monthly_cost_savings,
        "monthly_revenue_growth": monthly_revenue_growth,
        "total_monthly_benefit": total_monthly_benefit,
        "annual_benefit": annual_benefit,
        "three_year_benefit": three_year_benefit,
        "implementation_cost": implementation_cost,
        "payback_months": payback_months,
        "payback_formatted": payback_formatted,
        "three_year_roi": three_year_roi,
    }
