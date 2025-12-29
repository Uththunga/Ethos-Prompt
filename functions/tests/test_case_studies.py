"""
Unit Tests for Marketing KB Case Studies

Tests for case study retrieval helper functions and KB content verification.
"""
import pytest
import sys
import os

# Add the parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestCaseStudyRetrieval:
    """Tests for case study retrieval helper functions"""

    def test_get_all_case_studies(self):
        """Test fetching all case studies returns expected count"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        # Should have 7 case studies
        assert len(studies) == 7

        # Each study should have an id
        for study in studies:
            assert "id" in study
            assert study["id"].startswith("case_study_")

    def test_get_all_case_studies_has_required_fields(self):
        """Test all case studies have required metadata fields"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        required_metadata = ["category", "subcategory", "tier", "priority",
                            "page", "industry", "service_primary", "company_size"]

        for study in studies:
            metadata = study.get("metadata", {})
            for field in required_metadata:
                assert field in metadata, f"Missing {field} in {study['id']}"

            # Subcategory should always be "case_study"
            assert metadata["subcategory"] == "case_study"

    def test_get_case_studies_by_industry_healthcare(self):
        """Test filtering case studies by healthcare industry"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_industry

        studies = get_case_studies_by_industry("healthcare")

        assert len(studies) == 1
        assert studies[0]["id"] == "case_study_healthcare_001"
        assert "66% AI-Handled" in studies[0]["title"]

    def test_get_case_studies_by_industry_case_insensitive(self):
        """Test industry filter is case-insensitive"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_industry

        # Try different cases
        studies_lower = get_case_studies_by_industry("healthcare")
        studies_upper = get_case_studies_by_industry("HEALTHCARE")
        studies_mixed = get_case_studies_by_industry("Healthcare")

        assert len(studies_lower) == len(studies_upper) == len(studies_mixed) == 1

    def test_get_case_studies_by_industry_no_match(self):
        """Test industry filter returns empty for non-existent industry"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_industry

        studies = get_case_studies_by_industry("automotive")

        assert len(studies) == 0

    def test_get_case_studies_by_service_smart_assistant(self):
        """Test filtering by Smart Business Assistant service"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_service

        studies = get_case_studies_by_service("smart_business_assistant")

        # Should have 3 case studies for this service
        assert len(studies) == 3

        # Verify industries covered
        industries = [s["metadata"]["industry"] for s in studies]
        assert "healthcare" in industries
        assert "ecommerce" in industries
        assert "education" in industries

    def test_get_case_studies_by_service_intelligent_apps(self):
        """Test filtering by Intelligent Applications service"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_service

        studies = get_case_studies_by_service("intelligent_applications")

        # Should have 3 case studies for this service
        assert len(studies) == 3

        # Verify industries covered
        industries = [s["metadata"]["industry"] for s in studies]
        assert "professional_services" in industries
        assert "manufacturing" in industries
        assert "fintech" in industries

    def test_get_case_studies_by_service_integration(self):
        """Test filtering by System Integration service"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_service

        studies = get_case_studies_by_service("system_integration")

        # Should have 1 case study for this service
        assert len(studies) == 1
        assert studies[0]["metadata"]["industry"] == "retail"

    def test_get_case_studies_by_service_case_insensitive(self):
        """Test service filter is case-insensitive"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_service

        studies_lower = get_case_studies_by_service("system_integration")
        studies_upper = get_case_studies_by_service("SYSTEM_INTEGRATION")

        assert len(studies_lower) == len(studies_upper)


class TestCaseStudyContent:
    """Tests for case study content quality"""

    def test_all_case_studies_have_roi_metrics(self):
        """Verify all case studies include ROI information"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        for study in studies:
            content = study.get("content", "")
            # Check for ROI mention
            assert "ROI" in content, f"Missing ROI in {study['id']}"
            # Check for payback period
            assert "Payback" in content or "payback" in content, f"Missing Payback in {study['id']}"

    def test_all_case_studies_have_results_table(self):
        """Verify all case studies include a results table"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        for study in studies:
            content = study.get("content", "")
            # Check for table header indicators
            assert "| Metric |" in content or "| Before |" in content, \
                f"Missing results table in {study['id']}"

    def test_all_case_studies_have_client_quote(self):
        """Verify all case studies include a client quote"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        for study in studies:
            content = study.get("content", "")
            assert "Client Quote" in content or ">" in content, \
                f"Missing client quote in {study['id']}"

    def test_service_coverage_balance(self):
        """Verify services are covered by at least 1 case study each"""
        from src.ai_agent.marketing.marketing_kb_content import get_case_studies_by_service

        services = [
            "smart_business_assistant",
            "system_integration",
            "intelligent_applications"
        ]

        for service in services:
            studies = get_case_studies_by_service(service)
            assert len(studies) >= 1, f"No case studies for {service}"


class TestKBDocumentStructure:
    """Tests for KB document structure consistency"""

    def test_case_study_metadata_schema(self):
        """Test all case studies follow consistent metadata schema"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        expected_fields = {
            "category": str,
            "subcategory": str,
            "tier": int,
            "priority": str,
            "page": str,
            "industry": str,
            "service_primary": str,
            "company_size": str,
            "last_updated": str
        }

        for study in studies:
            metadata = study.get("metadata", {})
            for field, field_type in expected_fields.items():
                assert field in metadata, f"Missing {field} in {study['id']}"
                assert isinstance(metadata[field], field_type), \
                    f"Wrong type for {field} in {study['id']}"

    def test_all_case_studies_are_tier_3(self):
        """Verify all case studies are tier 3 (differentiation)"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        for study in studies:
            assert study["metadata"]["tier"] == 3

    def test_all_case_studies_are_critical_priority(self):
        """Verify all case studies have critical priority"""
        from src.ai_agent.marketing.marketing_kb_content import get_all_case_studies

        studies = get_all_case_studies()

        for study in studies:
            assert study["metadata"]["priority"] == "critical"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
