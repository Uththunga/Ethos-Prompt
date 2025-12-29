#!/usr/bin/env python3
"""
KB Completeness Validation Script
Checks for placeholder content, TODO markers, and minimum content length.
Run before deployment to ensure KB quality.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from ai_agent.marketing.marketing_kb_content import MARKETING_KB_CONTENT
except ImportError:
    # Fallback path for direct execution
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from ai_agent.marketing.marketing_kb_content import MARKETING_KB_CONTENT


def validate_kb_completeness():
    """Validate KB content for completeness and quality."""
    issues = []
    warnings = []

    PLACEHOLDER_MARKERS = ['TODO', 'FIXME', 'PLACEHOLDER', 'TBD']  # XXX removed - used in format patterns
    MIN_CONTENT_WORDS = 50

    for entry_id, entry in MARKETING_KB_CONTENT.items():
        content = entry.get('content', '')
        title = entry.get('title', entry_id)

        # Check for placeholder markers
        content_upper = content.upper()
        for marker in PLACEHOLDER_MARKERS:
            if marker in content_upper:
                issues.append(f"❌ {entry_id}: Contains '{marker}' marker")
                break

        # Check for minimum content length
        word_count = len(content.split())
        if word_count < MIN_CONTENT_WORDS:
            issues.append(f"❌ {entry_id}: Content too short ({word_count} words, min {MIN_CONTENT_WORDS})")

        # Check for missing metadata
        metadata = entry.get('metadata', {})
        required_fields = ['category', 'tier', 'priority']
        for field in required_fields:
            if field not in metadata:
                warnings.append(f"⚠️  {entry_id}: Missing metadata field '{field}'")

        # Check for empty content
        if not content.strip():
            issues.append(f"❌ {entry_id}: Empty content")

    # Print results
    print("=" * 80)
    print("KB COMPLETENESS VALIDATION REPORT")
    print("=" * 80)
    print(f"\nTotal KB Entries: {len(MARKETING_KB_CONTENT)}")
    print(f"Critical Issues: {len(issues)}")
    print(f"Warnings: {len(warnings)}")

    if issues:
        print("\n🔴 CRITICAL ISSUES:")
        for issue in issues:
            print(f"  {issue}")

    if warnings:
        print("\n🟡 WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")

    if not issues and not warnings:
        print("\n✅ KB VALIDATION PASSED - All entries are complete and properly formatted")
        return 0
    elif issues:
        print("\n❌ KB VALIDATION FAILED - Fix critical issues before deployment")
        return 1
    else:
        print("\n⚠️  KB VALIDATION PASSED WITH WARNINGS - Review warnings but safe to deploy")
        return 0


if __name__ == "__main__":
    sys.exit(validate_kb_completeness())
