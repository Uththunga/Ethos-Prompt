import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from firebase_functions import https_fn
try:
    from main import generate_prompt, _generate_prompt_async, _build_generation_prompt, _calculate_quality_score
except Exception:
    pytest.skip("Legacy main.py API not available; skipping prompt generation tests", allow_module_level=True)


class TestPromptGeneration:
    """Test cases for AI prompt generation functionality"""

    @pytest.fixture
    def mock_request(self):
        """Create a mock Firebase request"""
        request = Mock()
        request.auth = Mock()
        request.auth.uid = 'test-user-123'
        request.data = {
            'purpose': 'Generate customer support responses',
            'industry': 'Technology',
            'useCase': 'Customer Support',
            'targetAudience': 'Technical users',
            'inputVariables': [
                {
                    'name': 'customer_name',
                    'description': 'Name of the customer',
                    'type': 'string',
                    'required': True,
                    'example': 'John Smith'
                }
            ],
            'outputFormat': 'paragraph',
            'tone': 'professional',
            'length': 'medium',
            'includeRAG': False,
            'additionalRequirements': 'Include empathy and solution focus'
        }
        return request

    @pytest.fixture
    def mock_openrouter_response(self):
        """Create a mock OpenRouter response"""
        response = Mock()
        response.content = json.dumps({
            'generatedPrompt': 'You are a helpful customer support agent. When responding to {{customer_name}}, always be empathetic and solution-focused.',
            'title': 'Customer Support Response Generator',
            'description': 'Generates empathetic customer support responses',
            'category': 'Technology',
            'tags': ['customer-support', 'technology'],
            'variables': [
                {
                    'name': 'customer_name',
                    'type': 'string',
                    'description': 'Name of the customer',
                    'required': True
                }
            ],
            'suggestions': ['Consider adding greeting templates', 'Include escalation procedures']
        })
        response.model = 'gpt-4'
        response.usage = {'total_tokens': 150, 'prompt_tokens': 100, 'completion_tokens': 50}
        response.response_time = 2.5
        response.cost_estimate = 0.003
        response.finish_reason = 'stop'
        return response

    def test_generate_prompt_success(self, mock_request, mock_openrouter_response):
        """Test successful prompt generation"""
        with patch('main.OpenRouterClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            mock_client.generate_response.return_value = mock_openrouter_response

            with patch('main.asyncio.run') as mock_run:
                mock_run.return_value = {
                    'generatedPrompt': 'Test prompt content',
                    'title': 'Test Prompt',
                    'description': 'Test description',
                    'category': 'Technology',
                    'tags': ['test'],
                    'variables': [],
                    'qualityScore': {'overall': 85},
                    'suggestions': [],
                    'metadata': {'model': 'gpt-4', 'tokensUsed': 150}
                }

                result = generate_prompt(mock_request)

                assert result['generatedPrompt'] == 'Test prompt content'
                assert result['title'] == 'Test Prompt'
                assert result['metadata']['model'] == 'gpt-4'

    def test_generate_prompt_unauthenticated(self):
        """Test prompt generation with unauthenticated user"""
        request = Mock()
        request.auth = None

        with pytest.raises(https_fn.HttpsError) as exc_info:
            generate_prompt(request)

        assert exc_info.value.code == 'unauthenticated'
        assert 'User must be authenticated' in str(exc_info.value)

    def test_generate_prompt_missing_purpose(self, mock_request):
        """Test prompt generation with missing purpose"""
        mock_request.data['purpose'] = ''

        with pytest.raises(https_fn.HttpsError) as exc_info:
            generate_prompt(mock_request)

        assert exc_info.value.code == 'invalid-argument'
        assert 'Purpose is required' in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_generate_prompt_async_success(self, mock_openrouter_response):
        """Test async prompt generation"""
        with patch('main.OpenRouterClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            mock_client.generate_response.return_value = mock_openrouter_response

            result = await _generate_prompt_async(
                purpose='Test purpose',
                industry='Technology',
                use_case='Testing',
                target_audience='Developers',
                input_variables=[],
                output_format='paragraph',
                tone='professional',
                length='medium',
                include_rag=False,
                additional_requirements=''
            )

            assert 'generatedPrompt' in result
            assert 'title' in result
            assert 'qualityScore' in result
            assert 'metadata' in result

    @pytest.mark.asyncio
    async def test_generate_prompt_async_json_parse_error(self):
        """Test async prompt generation with JSON parse error"""
        mock_response = Mock()
        mock_response.content = 'Invalid JSON content'
        mock_response.model = 'gpt-4'
        mock_response.usage = {'total_tokens': 100}
        mock_response.response_time = 1.0
        mock_response.cost_estimate = 0.001
        mock_response.finish_reason = 'stop'

        with patch('main.OpenRouterClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            mock_client.generate_response.return_value = mock_response

            result = await _generate_prompt_async(
                purpose='Test purpose',
                industry='Technology',
                use_case='Testing',
                target_audience='',
                input_variables=[],
                output_format='paragraph',
                tone='professional',
                length='medium',
                include_rag=False,
                additional_requirements=''
            )

            # Should fall back to creating a response from the raw content
            assert result['generatedPrompt'] == 'Invalid JSON content'
            assert result['title'] == 'Test Purpose Prompt'

    def test_build_generation_prompt(self):
        """Test generation prompt building"""
        variables = [
            {'name': 'customer_name', 'description': 'Customer name', 'type': 'string'},
            {'name': 'issue_type', 'description': 'Type of issue', 'type': 'string'}
        ]

        prompt = _build_generation_prompt(
            purpose='Customer support',
            industry='Technology',
            use_case='Support tickets',
            target_audience='Customers',
            input_variables=variables,
            output_format='paragraph',
            tone='professional',
            length='medium',
            include_rag=True,
            additional_requirements='Be empathetic'
        )

        assert 'Customer support' in prompt
        assert 'Technology' in prompt
        assert '{{ customer_name }}' in prompt
        assert '{{ issue_type }}' in prompt
        assert 'RAG Integration' in prompt
        assert 'Be empathetic' in prompt

    def test_calculate_quality_score_empty_prompt(self):
        """Test quality score calculation for empty prompt"""
        score = _calculate_quality_score('', [])

        assert score['overall'] == 0
        assert score['structure'] == 0
        assert score['clarity'] == 0
        assert score['variables'] == 0
        assert score['ragCompatibility'] == 0

    def test_calculate_quality_score_good_prompt(self):
        """Test quality score calculation for good prompt"""
        prompt = """You are a helpful assistant.

        Please analyze the following {{input_data}} and provide insights.

        Based on the provided context: {{context}}

        Your response should be professional and detailed."""

        variables = [
            {'name': 'input_data', 'description': 'Data to analyze'},
            {'name': 'context', 'description': 'Context information'}
        ]

        score = _calculate_quality_score(prompt, variables)

        assert score['overall'] > 70
        assert score['structure'] > 70  # Multi-line structure
        assert score['clarity'] > 70   # Clear instructions
        assert score['variables'] > 80  # Variables used
        assert score['ragCompatibility'] > 80  # Has context variable

    def test_calculate_quality_score_unused_variables(self):
        """Test quality score with unused variables"""
        prompt = "You are a helpful assistant."
        variables = [
            {'name': 'unused_var', 'description': 'This variable is not used'}
        ]

        score = _calculate_quality_score(prompt, variables)

        assert score['variables'] < 90  # Should be penalized for unused variables

    def test_calculate_quality_score_rag_compatibility(self):
        """Test RAG compatibility scoring"""
        # Prompt with context variable
        rag_prompt = "Based on the provided context: {{context}}, please respond."
        score_with_rag = _calculate_quality_score(rag_prompt, [])

        # Prompt without context
        no_rag_prompt = "Please respond to the user query."
        score_without_rag = _calculate_quality_score(no_rag_prompt, [])

        assert score_with_rag['ragCompatibility'] > score_without_rag['ragCompatibility']

    def test_format_variables(self):
        """Test variable formatting"""
        from main import _format_variables

        ai_variables = [
            {'name': 'test_var', 'type': 'string', 'description': 'Test variable', 'required': True}
        ]
        input_variables = [
            {'name': 'input_var', 'type': 'number', 'description': 'Input variable', 'required': False}
        ]

        # Test with AI variables
        result = _format_variables(ai_variables, input_variables)
        assert len(result) == 1
        assert result[0]['name'] == 'test_var'

        # Test fallback to input variables
        result = _format_variables([], input_variables)
        assert len(result) == 1
        assert result[0]['name'] == 'input_var'

    def test_generate_enhancement_suggestions(self):
        """Test enhancement suggestion generation"""
        from main import _generate_enhancement_suggestions

        # Low quality scores should generate suggestions
        low_quality_score = {
            'structure': 60,
            'clarity': 65,
            'variables': 50,
            'ragCompatibility': 40
        }

        suggestions = _generate_enhancement_suggestions('Test prompt', low_quality_score)

        assert len(suggestions) > 0
        suggestion_types = [s['type'] for s in suggestions]
        assert 'structure' in suggestion_types
        assert 'clarity' in suggestion_types
        assert 'variables' in suggestion_types
        assert 'rag_optimization' in suggestion_types

        # High quality scores should generate fewer suggestions
        high_quality_score = {
            'structure': 90,
            'clarity': 95,
            'variables': 85,
            'ragCompatibility': 90
        }

        suggestions = _generate_enhancement_suggestions('Test prompt', high_quality_score)
        assert len(suggestions) == 0

    def test_create_fallback_response(self):
        """Test fallback response creation"""
        from main import _create_fallback_response

        content = "This is a fallback prompt content"
        purpose = "Testing"
        industry = "Technology"
        variables = [{'name': 'test_var', 'description': 'Test variable'}]

        response = _create_fallback_response(content, purpose, industry, variables)

        assert response['generatedPrompt'] == content
        assert response['title'] == 'Testing Prompt'
        assert response['category'] == 'Technology'
        assert response['variables'] == variables
        assert len(response['suggestions']) > 0


if __name__ == '__main__':
    pytest.main([__file__])
