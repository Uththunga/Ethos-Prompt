"""
Marketing KB Modules Package
Provides lazy loading for marketing knowledge base content to optimize cold start.

Usage:
    from kb_modules import get_all_kb_content
    content = get_all_kb_content()  # Loads all modules

Or for partial loading:
    from kb_modules.kb_foundation import get_foundation_content
    foundation = get_foundation_content()
"""

from typing import Dict, Any

# Lazy imports - only load when needed
_kb_cache: Dict[str, Any] = {}


def get_foundation_content() -> Dict[str, Any]:
    """Get foundation tier content (company, brand, audience)."""
    if 'foundation' not in _kb_cache:
        from .kb_foundation import KB_FOUNDATION
        _kb_cache['foundation'] = KB_FOUNDATION
    return _kb_cache['foundation']


def get_offerings_content() -> Dict[str, Any]:
    """Get offerings tier content (services, routing)."""
    if 'offerings' not in _kb_cache:
        from .kb_offerings import KB_OFFERINGS
        _kb_cache['offerings'] = KB_OFFERINGS
    return _kb_cache['offerings']


def get_differentiation_content() -> Dict[str, Any]:
    """Get differentiation tier content (USPs, proof, industries)."""
    if 'differentiation' not in _kb_cache:
        from .kb_differentiation import KB_DIFFERENTIATION
        _kb_cache['differentiation'] = KB_DIFFERENTIATION
    return _kb_cache['differentiation']


def get_engagement_content() -> Dict[str, Any]:
    """Get engagement tier content (pricing, onboarding, ROI)."""
    if 'engagement' not in _kb_cache:
        from .kb_engagement import KB_ENGAGEMENT
        _kb_cache['engagement'] = KB_ENGAGEMENT
    return _kb_cache['engagement']


def get_support_content() -> Dict[str, Any]:
    """Get support tier content (FAQs, objections, industries)."""
    if 'support' not in _kb_cache:
        from .kb_support import KB_SUPPORT
        _kb_cache['support'] = KB_SUPPORT
    return _kb_cache['support']


def get_all_kb_content() -> Dict[str, Any]:
    """
    Get all KB content merged into single dictionary.
    This loads all modules - use individual getters for partial loading.
    """
    content = {}
    content.update(get_foundation_content())
    content.update(get_offerings_content())
    content.update(get_differentiation_content())
    content.update(get_engagement_content())
    content.update(get_support_content())
    return content


def clear_cache() -> None:
    """Clear the KB content cache (useful for testing)."""
    global _kb_cache
    _kb_cache = {}
