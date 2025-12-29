"""
ROI Configuration API
Exposes the centralized ROI calculation benchmarks and constants.
This endpoint serves as the source of truth for the frontend calculator.
"""
from fastapi import APIRouter
from src.ai_agent.marketing.roi_calculator import (
    MAINTENANCE_REDUCTION_FACTORS,
    CONVERSION_IMPROVEMENT_FACTORS,
    IMPLEMENTATION_COSTS
)

router = APIRouter(prefix="/api/ai/marketing/roi-config", tags=["roi-config"])

@router.get("/")
async def get_roi_configuration():
    """
    Get the current configuration constants for ROI calculations.
    Includes maintenance reduction factors, conversion improvement factors, and implementation costs.
    """
    return {
        "maintenance_reduction_factors": MAINTENANCE_REDUCTION_FACTORS,
        "conversion_improvement_factors": CONVERSION_IMPROVEMENT_FACTORS,
        "implementation_costs": IMPLEMENTATION_COSTS,
        "metadata": {
            "version": "2025.1.0",
            "source": "Australian 2025 Economic Benchmarks",
            "currency": "AUD"
        }
    }
