"""
Unit tests for Prompt Library Tool Schemas
Tests Pydantic validation for all tool input/output models
"""

import pytest
from pydantic import ValidationError
from datetime import datetime

from src.ai_agent.prompt_library.tool_schemas import (
    # Input schemas
    CreatePromptInput,
    ExecutePromptInput,
    SearchPromptsInput,
    GetExecutionHistoryInput,
    AnalyzePromptPerformanceInput,
    SuggestImprovementsInput,
    # Output schemas
    CreatePromptOutput,
    ExecutePromptOutput,
    SearchPromptsOutput,
    GetExecutionHistoryOutput,
    AnalyzePromptPerformanceOutput,
    SuggestImprovementsOutput,
    # Enums
    PromptCategory,
    ExecutionStatus,
)


class TestCreatePromptInput:
    """Tests for CreatePromptInput schema"""

    def test_valid_input(self):
        """Test valid prompt creation input"""
        data = {
            "title": "Test Prompt",
            "content": "This is a test prompt with {{variable}}",
            "category": "general",
            "tags": ["test", "example"]
        }
        schema = CreatePromptInput(**data)
        assert schema.title == "Test Prompt"
        assert schema.category == PromptCategory.GENERAL
        assert len(schema.tags) == 2

    def test_missing_required_fields(self):
        """Test validation fails with missing required fields"""
        with pytest.raises(ValidationError):
            CreatePromptInput(title="Test")  # Missing content

    def test_empty_title(self):
        """Test validation fails with empty title"""
        with pytest.raises(ValidationError):
            CreatePromptInput(title="", content="Test content")

    def test_title_too_long(self):
        """Test validation fails with title > 200 chars"""
        with pytest.raises(ValidationError):
            CreatePromptInput(title="x" * 201, content="Test")

    def test_content_too_long(self):
        """Test validation fails with content > 10000 chars"""
        with pytest.raises(ValidationError):
            CreatePromptInput(title="Test", content="x" * 10001)

    def test_invalid_category(self):
        """Test validation fails with invalid category"""
        with pytest.raises(ValidationError):
            CreatePromptInput(
                title="Test",
                content="Test",
                category="invalid_category"
            )

    def test_tags_validation(self):
        """Test tags validation (max 10 tags, each max 30 chars)"""
        # Valid tags
        schema = CreatePromptInput(
            title="Test",
            content="Test content for validation",
            tags=["tag1", "tag2", "tag3"]
        )
        assert len(schema.tags) == 3

        # Too many tags
        with pytest.raises(ValidationError):
            CreatePromptInput(
                title="Test",
                content="Test",
                tags=[f"tag{i}" for i in range(11)]
            )

        # Tag too long
        with pytest.raises(ValidationError):
            CreatePromptInput(
                title="Test",
                content="Test",
                tags=["x" * 31]
            )


class TestExecutePromptInput:
    """Tests for ExecutePromptInput schema"""

    def test_valid_input(self):
        """Test valid execution input"""
        data = {
            "prompt_id": "prompt-123",
            "variables": {"name": "John", "topic": "AI"}
        }
        schema = ExecutePromptInput(**data)
        assert schema.prompt_id == "prompt-123"
        assert schema.variables["name"] == "John"

    def test_missing_prompt_id(self):
        """Test validation fails without prompt_id"""
        with pytest.raises(ValidationError):
            ExecutePromptInput(variables={})

    def test_empty_prompt_id(self):
        """Test validation fails with empty prompt_id"""
        with pytest.raises(ValidationError):
            ExecutePromptInput(prompt_id="", variables={})

    def test_optional_model_params(self):
        """Test optional model parameters"""
        schema = ExecutePromptInput(
            prompt_id="prompt-123",
            variables={},
            model="gpt-4",
            temperature=0.5,
            max_tokens=1000
        )
        assert schema.model == "gpt-4"
        assert schema.temperature == 0.5
        assert schema.max_tokens == 1000

    def test_temperature_validation(self):
        """Test temperature must be between 0 and 2"""
        # Valid
        ExecutePromptInput(prompt_id="test-prompt-123", variables={}, temperature=0.0)
        ExecutePromptInput(prompt_id="test-prompt-123", variables={}, temperature=2.0)

        # Invalid
        with pytest.raises(ValidationError):
            ExecutePromptInput(prompt_id="test-prompt-123", variables={}, temperature=-0.1)
        with pytest.raises(ValidationError):
            ExecutePromptInput(prompt_id="test-prompt-123", variables={}, temperature=2.1)

    def test_max_tokens_validation(self):
        """Test max_tokens must be between 1 and 4000"""
        # Valid
        ExecutePromptInput(prompt_id="test-prompt-123", variables={}, max_tokens=1)
        ExecutePromptInput(prompt_id="test-prompt-123", variables={}, max_tokens=8000)

        # Invalid
        with pytest.raises(ValidationError):
            ExecutePromptInput(prompt_id="test-prompt-123", variables={}, max_tokens=0)
        with pytest.raises(ValidationError):
            ExecutePromptInput(prompt_id="test-prompt-123", variables={}, max_tokens=8001)


class TestSearchPromptsInput:
    """Tests for SearchPromptsInput schema"""

    def test_valid_input(self):
        """Test valid search input"""
        schema = SearchPromptsInput(query="test query")
        assert schema.query == "test query"
        assert schema.limit == 5  # Default

    def test_empty_query(self):
        """Test validation fails with empty query"""
        with pytest.raises(ValidationError):
            SearchPromptsInput(query="")

    def test_limit_validation(self):
        """Test limit must be between 1 and 50"""
        # Valid
        SearchPromptsInput(query="test", limit=1)
        SearchPromptsInput(query="test", limit=20)

        # Invalid
        with pytest.raises(ValidationError):
            SearchPromptsInput(query="test", limit=0)
        with pytest.raises(ValidationError):
            SearchPromptsInput(query="test", limit=51)

    def test_optional_filters(self):
        """Test optional category and tags filters"""
        schema = SearchPromptsInput(
            query="test",
            category="technical",
            tags=["python", "api"]
        )
        assert schema.category == PromptCategory.TECHNICAL
        assert len(schema.tags) == 2


class TestGetExecutionHistoryInput:
    """Tests for GetExecutionHistoryInput schema"""

    def test_default_values(self):
        """Test default values"""
        schema = GetExecutionHistoryInput()
        assert schema.limit == 10
        assert schema.errors_only is False

    def test_optional_filters(self):
        """Test optional filters"""
        schema = GetExecutionHistoryInput(
            prompt_id="prompt-123",
            status="success",
            errors_only=True,
            limit=50
        )
        assert schema.prompt_id == "prompt-123"
        assert schema.status == ExecutionStatus.SUCCESS
        assert schema.errors_only is True
        assert schema.limit == 50

    def test_limit_validation(self):
        """Test limit must be between 1 and 100"""
        # Valid
        GetExecutionHistoryInput(limit=1)
        GetExecutionHistoryInput(limit=50)

        # Invalid
        with pytest.raises(ValidationError):
            GetExecutionHistoryInput(limit=0)
        with pytest.raises(ValidationError):
            GetExecutionHistoryInput(limit=101)


class TestAnalyzePromptPerformanceInput:
    """Tests for AnalyzePromptPerformanceInput schema"""

    def test_valid_input(self):
        """Test valid analysis input"""
        schema = AnalyzePromptPerformanceInput(prompt_id="prompt-123")
        assert schema.prompt_id == "prompt-123"

    def test_missing_prompt_id(self):
        """Test validation fails without prompt_id"""
        with pytest.raises(ValidationError):
            AnalyzePromptPerformanceInput()

    def test_empty_prompt_id(self):
        """Test validation fails with empty prompt_id"""
        with pytest.raises(ValidationError):
            AnalyzePromptPerformanceInput(prompt_id="")


class TestSuggestImprovementsInput:
    """Tests for SuggestImprovementsInput schema"""

    def test_valid_input(self):
        """Test valid improvement suggestion input"""
        schema = SuggestImprovementsInput(prompt_id="prompt-123")
        assert schema.prompt_id == "prompt-123"

    def test_missing_prompt_id(self):
        """Test validation fails without prompt_id"""
        with pytest.raises(ValidationError):
            SuggestImprovementsInput()


class TestOutputSchemas:
    """Tests for output schemas"""

    def test_create_prompt_output(self):
        """Test CreatePromptOutput"""
        output = CreatePromptOutput(
            success=True,
            prompt_id="prompt-123",
            message="Prompt created successfully"
        )
        assert output.success is True
        assert output.prompt_id == "prompt-123"

    def test_execute_prompt_output(self):
        """Test ExecutePromptOutput"""
        output = ExecutePromptOutput(
            success=True,
            execution_id="exec-123",
            output="Test output",
            tokens_used=100,
            cost=0.001,
            model="gpt-4",
            status=ExecutionStatus.SUCCESS
        )
        assert output.success is True
        assert output.tokens_used == 100
        assert output.cost == 0.001

    def test_search_prompts_output(self):
        """Test SearchPromptsOutput"""
        output = SearchPromptsOutput(
            success=True,
            results=[
                {
                    "id": "prompt-1",
                    "title": "Test Prompt",
                    "content": "Test content body",
                    "category": "technical",
                    "tags": ["tag1"],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            ],
            total_count=1,
            message="1 result"
        )
        assert output.success is True
        assert len(output.results) == 1
        assert output.total_count == 1


class TestEnums:
    """Tests for enum types"""

    def test_prompt_category_enum(self):
        """Test PromptCategory enum values"""
        assert PromptCategory.GENERAL == "general"
        assert PromptCategory.TECHNICAL == "technical"
        assert PromptCategory.CREATIVE == "creative"
        assert PromptCategory.BUSINESS == "business"
        assert PromptCategory.EDUCATION == "education"

    def test_execution_status_enum(self):
        """Test ExecutionStatus enum values"""
        assert ExecutionStatus.SUCCESS == "success"
        assert ExecutionStatus.ERROR == "error"
        assert ExecutionStatus.PENDING == "pending"
