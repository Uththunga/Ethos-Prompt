"""
Fine-Tuning Data Generator for IBM Granite 4.0 H-Small
Phase 3 Recommendation #1: LoRA Fine-Tuning Preparation

Generates training data in watsonx.ai JSONL format from knowledge base
and example conversations.
"""

import json
import logging
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from pathlib import Path

logger = logging.getLogger(__name__)


def create_training_example(
    system_prompt: str,
    user_query: str,
    assistant_response: str,
    include_follow_ups: bool = True
) -> Dict[str, List[Dict[str, str]]]:
    """
    Create a single training example in watsonx.ai format.

    Args:
        system_prompt: System instruction
        user_query: User message
        assistant_response: Expected assistant response
        include_follow_ups: Whether response includes follow-up questions

    Returns:
        Training example dict with messages array
    """
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": assistant_response}
        ]
    }


def generate_kb_based_examples() -> List[Dict]:
    """
    Generate training examples from knowledge base content.

    Returns:
        List of training examples
    """
    # Import here to avoid circular dependencies
    from .marketing_kb_content import MARKETING_KB_CONTENT

    examples = []

    # Base system prompt for fine-tuning (shorter than runtime prompt)
    system_prompt = "You are molē, EthosPrompt's AI assistant. Provide concise, helpful responses (100-150 words) ending with 3 follow-up questions prefixed 'You might also want to know:'."

    # Generate examples from KB categories
    kb_examples = [
        # Company Overview
        {
            "query": "What is EthosPrompt?",
            "response": """EthosPrompt is an AI solutions company specializing in enterprise-grade automation and custom applications using IBM Granite 4.0 technology. We transform businesses through intelligent automation, system integration, and custom AI solutions with proven ROI.

Our services include Smart Business Assistants (24/7 AI support), System Integration (connecting 600+ apps), and Custom Web & Mobile Applications. We deliver measurable results with 40% efficiency gains in the first 90 days.

You might also want to know:
1. What makes EthosPrompt different from competitors?
2. What industries do you serve?
3. How long does implementation typically take?"""
        },
        # Pricing
        {
            "query": "How much does the Smart Business Assistant cost?",
            "response": """Our Smart Business Assistant has three pricing tiers:

**Starter:** $1,997/month - Perfect for small businesses, includes business analysis, custom AI model, system integration, and 30 days support.

**Professional:** $4,997/month (Most Popular) - Complete AI development with advanced architecture, multi-modal capabilities, API development, and 3 months premium support.

**Enterprise:** Custom pricing for large organizations with full-scale transformation, executive strategy, and 24/7 dedicated support.

Most clients see positive ROI within 3-6 months with 12x cost savings per interaction.

You might also want to know:
1. What's included in each plan?
2. Do you offer payment plans or annual discounts?
3. What's the typical ROI timeline?"""
        },
        # Services - System Integration
        {
            "query": "Can you integrate my existing business apps?",
            "response": """Absolutely! We specialize in System Integration, connecting 600+ business applications automatically. Your data flows seamlessly between CRM, email marketing, e-commerce, inventory, accounting, and more.

**Results:** 85% reduction in manual data entry, 95% fewer errors, 60% faster processes. Setup takes 1-2 weeks for simple integrations, 4-8 weeks for complex enterprise systems.

**Pricing:** Essential ($1,497/month for 10 integrations), Professional ($2,997/month for 50 integrations), or Enterprise (unlimited integrations, custom pricing).

You might also want to know:
1. What apps do you integrate with?
2. How secure is the data transfer?
3. Can I start with a few integrations and add more later?"""
        },
        # Getting Started
        {
            "query": "How do I get started with EthosPrompt?",
            "response": """Getting started is simple:

**Step 1:** Schedule a free 30-45 minute consultation via our website. We'll discuss your challenges, assess current systems, and provide custom recommendations.

**Step 2:** Receive a detailed proposal with ROI projections, timeline estimates, and transparent pricing.

**Step 3:** Implementation begins (2-4 weeks for Smart Assistant, 1-8 weeks for Integration, 2-20 weeks for Applications depending on complexity).

You'll have dedicated support throughout the process and post-deployment assistance.

You might also want to know:
1. What should I prepare for the consultation?
2. Do I need technical expertise to implement this?
3. What kind of ongoing support do you provide?"""
        },
        # Technical
        {
            "query": "Is my data secure with EthosPrompt?",
            "response": """Yes, we provide bank-level security for all customers regardless of plan size:

**Security Features:** 256-bit encryption (at rest and in transit), ISO 42001 certified AI systems, SOC 2 Type II processes, role-based access control (RBAC), and regular third-party security audits.

**Compliance:** GDPR, CCPA, and HIPAA-ready. Your data never leaves your approved systems, and we offer on-premise deployment options for maximum data sovereignty.

**Technology:** IBM Granite 4.0 H-Small (enterprise-grade AI), Firebase authentication, multi-factor authentication available, and 99.9% uptime SLA.

You might also want to know:
1. Can I self-host the solution for complete control?
2. Do  you have any security certifications?
3. How is data handled during integrations?"""
        },
    ]

    for item in kb_examples:
        example = create_training_example(
            system_prompt=system_prompt,
            user_query=item["query"],
            assistant_response=item["response"]
        )
        examples.append(example)

    return examples


def save_training_data(
    examples: List[Dict],
    output_path: str,
    train_split: float = 0.8
) -> Any:
    """
    Save training data to JSONL files (train and validation split).

    Args:
        examples: List of training examples
        output_path: Base path for output files
        train_split: Fraction of data for training (rest for validation)
    """
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # Shuffle and split
    import random
    random.shuffle(examples)
    split_idx = int(len(examples) * train_split)

    train_examples = examples[:split_idx]
    val_examples = examples[split_idx:]

    # Save training data
    train_path = str(Path(output_path).parent / "marketing_train.jsonl")
    with open(train_path, 'w', encoding='utf-8') as f:
        for example in train_examples:
            f.write(json.dumps(example) + '\n')

    # Save validation data
    val_path = str(Path(output_path).parent / "marketing_val.jsonl")
    with open(val_path, 'w', encoding='utf-8') as f:
        for example in val_examples:
            f.write(json.dumps(example) + '\n')

    logger.info(f"Saved {len(train_examples)} training examples to {train_path}")
    logger.info(f"Saved {len(val_examples)} validation examples to {val_path}")

    return train_path, val_path


def generate_fine_tuning_config(
    model_id: str = "ibm/granite-4-h-small",
    learning_rate: float = 0.0002,
    num_epochs: int = 3,
    batch_size: int = 8,
    lora_rank: int = 16
) -> Dict[str, Any]:
    """
    Generate fine-tuning configuration for watsonx.ai.

    Args:
        model_id: Base model ID
        learning_rate: Learning rate for training
        num_epochs: Number of training epochs
        batch_size: Batch size
        lora_rank: LoRA rank (8, 16, or 32)

    Returns:
        Configuration dict
    """
    return {
        "model_id": model_id,
        "tuning_method": "lora",
        "hyperparameters": {
            "learning_rate": learning_rate,
            "num_epochs": num_epochs,
            "batch_size": batch_size,
            "lora_rank": lora_rank,
            "lora_alpha": lora_rank * 2,  # Typically 2x rank
            "lora_dropout": 0.1
        },
        "expected_benefits": {
            "prompt_token_reduction": "50-60%",
            "cost_reduction": "40-50%",
            "format_consistency": "+15-25%",
            "response_speed": "+10-15%"
        }
    }


if __name__ == "__main__":
    # Generate training data
    print("Generating fine-tuning training data...")
    examples = generate_kb_based_examples()

    # Save to files
    output_base = "functions/src/ai_agent/marketing/fine_tuning/data"
    train_path, val_path = save_training_data(examples, output_base)

    print(f"\n✅ Generated {len(examples)} total examples")
    print(f"📁 Training data: {train_path}")
    print(f"📁 Validation data: {val_path}")

    # Generate config
    config = generate_fine_tuning_config()
    config_path = Path(output_base).parent / "config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"⚙️ Configuration: {config_path}")
    print("\n📋 Next steps:")
    print("1. Upload training data to S3 or watsonx.ai")
    print("2. Run fine-tuning via watsonx.ai SDK")
    print("3. Evaluate on validation set")
    print("4. Deploy fine-tuned model")
