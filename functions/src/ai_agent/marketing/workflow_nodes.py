"""
Marketing Agent Workflow Nodes
Individual node functions for StateGraph workflow
"""

import logging
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from .agent_state import MarketingAgentState
from .config import MarketingAgentConfig

logger = logging.getLogger(__name__)


async def llm_node(state: MarketingAgentState, llm: Any = None) -> Dict[str, Any]:
    """
    LLM reasoning node - generates response or requests tool calls

    Args:
        state: Current agent state
        llm: Injected LLM instance

    Returns:
        State updates with new messages and next action
    """
    if not llm:
        raise ValueError("LLM instance not provided to llm_node")

    # Invoke LLM with conversation history
    messages = state["messages"]
    response = await llm.ainvoke(messages)

    # Check if LLM requested tool calls
    if hasattr(response, 'tool_calls') and response.tool_calls:
        logger.info(f"LLM requested {len(response.tool_calls)} tool calls: {[tc['name'] for tc in response.tool_calls]}")
        return {
            "messages": [response],
            "tool_calls_pending": response.tool_calls,
            "next_action": "tools",
            "iteration_count": state.get("iteration_count", 0) + 1
        }
    else:
        # Final response - move to reflection for quality check
        logger.info("LLM generated final response, moving to reflection")
        return {
            "messages": [response],
            "next_action": "reflect",
            "iteration_count": state.get("iteration_count", 0) + 1
        }


async def tool_executor_node(state: MarketingAgentState, tools: Any = None) -> Dict[str, Any]:
    """
    Execute pending tool calls

    Args:
        state: Current agent state with pending tool calls
        tools: Injected list of tools

    Returns:
        State updates with tool results
    """
    tool_calls = state.get("tool_calls_pending", [])

    if not tools:
        logger.error("Tools not provided to tool_executor_node")
        return {"next_action": "llm"}

    if not tool_calls:
        logger.warning("tool_executor_node called with no pending tool calls")
        return {"next_action": "llm"}

    results = []
    for tool_call in tool_calls:
        tool_name = tool_call.get("name")
        tool_args = tool_call.get("args", {})
        tool_id = tool_call.get("id", "unknown")

        # Find matching tool
        tool = next((t for t in tools if t.name == tool_name), None)

        if tool:
            try:
                # Execute tool (async)
                result = await tool.ainvoke(tool_args)
                results.append(ToolMessage(
                    content=str(result),
                    tool_call_id=tool_id
                ))
                logger.info(f"✓ Executed tool: {tool_name}")
            except Exception as e:
                logger.error(f"✗ Tool {tool_name} failed: {e}", exc_info=True)
                results.append(ToolMessage(
                    content=f"Error executing tool: {str(e)}",
                    tool_call_id=tool_id
                ))
        else:
            logger.error(f"✗ Tool not found: {tool_name}")
            results.append(ToolMessage(
                content=f"Tool '{tool_name}' not found",
                tool_call_id=tool_id
            ))

    # Record tool execution
    tool_execution_record = {
        "calls": tool_calls,
        "results": [{"content": r.content, "tool_call_id": r.tool_call_id} for r in results]
    }

    return {
        "messages": results,
        "tools_output": state.get("tools_output", []) + [tool_execution_record],
        "tool_calls_pending": [],
        "next_action": "llm"  # Return to LLM with tool results
    }



async def verify_claims(response_text: str, context: str, llm: Any) -> List[str]:
    """
    Verify claims in response against context using LLM
    """
    if not context or not llm:
        return []

    verification_prompt = f"""
    Verify if the following response is fully supported by the provided context.

    Context:
    {context[:4000]}  # Limit context length

    Response:
    {response_text}

    Identify any claims in the response that are NOT supported by the context.
    If all claims are supported, return "SUPPORTED".
    If there are unsupported claims, list them as bullet points.
    """

    try:
        verification_response = await llm.ainvoke([HumanMessage(content=verification_prompt)])
        content = verification_response.content if hasattr(verification_response, 'content') else str(verification_response)

        if "SUPPORTED" in content:
            return []

        # Extract bullet points
        issues = [line.strip('- ').strip() for line in content.split('\n') if line.strip().startswith('-')]
        return [f"Unsupported claim: {issue}" for issue in issues]
    except Exception as e:
        logger.warning(f"Claim verification failed: {e}")
        return []


async def reflection_node(state: MarketingAgentState, llm: Any = None, config: Optional[MarketingAgentConfig] = None) -> Dict[str, Any]:
    """
    Quality validation & self-correction node

    Checks response quality and triggers regeneration if issues found.

    Args:
        state: Current agent state with final response
        llm: Injected LLM instance for verification
        config: Configuration with validation limits

    Returns:
        State updates with validation results
    """
    # Load config if not provided
    if config is None:
        from .config import get_config
        config = get_config()

    # Extract final response
    response_message = state["messages"][-1]
    response_text = response_message.content if hasattr(response_message, 'content') else str(response_message)
    if not isinstance(response_text, str):
        response_text = str(response_text)

    # Validation checks
    issues = []

    # Check 1: Response not empty or too short
    if not response_text or len(response_text.strip()) < config.min_response_length:
        issues.append(f"Response too short (min: {config.min_response_length} chars)")

    # Check 2: Contains follow-up questions (per system prompt requirement)
    # Make conditional - skip for simple greetings and short queries
    original_message = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, 'type') and msg.type == 'human':
            original_message = msg.content if hasattr(msg, 'content') else str(msg)
            break

    # Only require follow-ups for substantive queries
    word_count = len(original_message.split()) if original_message else 0
    if word_count > config.min_word_count_for_followup and "might also want to know" not in response_text.lower():
        # Softer warning - don't block on this
        logger.info("Response missing follow-up questions for complex query (non-blocking)")


    # Check 3: Not overly long (should be concise per system prompt)
    if len(response_text) > config.max_response_length:
        issues.append(f"Response too long (max: {config.max_response_length} chars) - should be concise (<3 paragraphs)")

    # Check 4: No obvious hallucinations
    # Look for references to old content that was removed
    tools_output_str = str(state.get("tools_output", [])).lower()

    for term in config.hallucination_terms:
        if term in response_text.lower() and term not in tools_output_str:
            issues.append(f"Possible hallucination: mentioned '{term}' not in retrieved content")

    # Check 5: Advanced Hallucination Detection (Prices)
    import re
    prices_in_response = re.findall(config.price_regex_pattern, response_text)
    if prices_in_response:
        for price in prices_in_response:
            # Check if price exists in tools output (ignoring formatting)
            if price not in tools_output_str and price.replace(',', '') not in tools_output_str:
                 issues.append(f"Potential hallucination: Price '{price}' not found in retrieved content")

    # Check 6: Brand Voice (Forbidden words)
    for word in config.forbidden_words:
        if word in response_text.lower():
             issues.append(f"Brand voice violation: Avoid using '{word}'")

    # Check 7: Completeness (Call to Action)
    # If discussing pricing or services, should suggest consultation
    if any(k in response_text.lower() for k in config.pricing_keywords):
        if not any(k in response_text.lower() for k in config.cta_keywords):
             issues.append("Missing Call to Action: Suggest a consultation when discussing pricing")

    # Check 9: Formatting & Structure
    # Ensure use of bullet points for readability
    if len(response_text) > config.long_response_threshold and not any(line.strip().startswith(('-', '*', '1.')) for line in response_text.split('\n')):
        issues.append("Formatting issue: Use bullet points for long responses to improve readability")

    # Ensure concise paragraphs
    paragraphs = response_text.split('\n\n')
    for p in paragraphs:
        if len(p) > config.max_paragraph_length:
            issues.append(f"Formatting issue: Paragraph too long (max: {config.max_paragraph_length} chars), please split into smaller chunks")
            break

    # Check 8: LLM-based Claim Verification
    if llm and tools_output_str:
        unsupported_claims = await verify_claims(response_text, tools_output_str, llm)
        if unsupported_claims:
            issues.extend(unsupported_claims)

    # Track reflection metrics
    if issues:
        logger.info(f"Reflection metrics: issues_count={len(issues)}, issues={issues}")


    # Validation result
    if issues:
        # Failed validation - request regeneration
        logger.warning(f"❌ Reflection FAILED: {issues}")

        # Don't endlessly loop - limit retries
        if state.get("iteration_count", 0) >= config.max_reflection_iterations:
            logger.warning("Max reflection iterations reached, accepting response despite issues")
            return {
                "validation_passed": False,
                "confidence_score": 0.5,
                "reflection_feedback": f"Issues noted (max retries): {', '.join(issues)}",
                "next_action": "end"
            }

        feedback_message = f"""Your previous response had the following quality issues:
{chr(10).join(f'- {issue}' for issue in issues)}

Please generate a corrected response that addresses these specific issues.
- Maintain the helpful, professional EthosPrompt brand voice.
- Ensure all information is supported by the context.
- Do not apologize excessively, just provide the corrected information."""

        return {
            "reflection_feedback": feedback_message,
            "validation_passed": False,
            "confidence_score": 0.3,
            "messages": [HumanMessage(content=feedback_message)],
            "next_action": "llm"  # Re-generate with feedback
        }
    else:
        # Passed validation
        logger.info("✓ Reflection PASSED - response valid")
        return {
            "validation_passed": True,
            "confidence_score": 0.9,
            "reflection_feedback": None,
            "next_action": "end"
        }
