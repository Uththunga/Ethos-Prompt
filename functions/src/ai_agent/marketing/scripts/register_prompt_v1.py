"""
Script to register the current prompt as v1.0.0 in Firestore
Run this once during deployment to initialize prompt versioning
"""

from typing import Dict, Any, List, Optional, Union
import sys
import os
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.ai_agent.marketing.prompts.marketing_prompts import (
    BASE_SYSTEM_PROMPT,
    FEW_SHOT_EXAMPLES,
    CURRENT_PROMPT_VERSION
)
from src.ai_agent.marketing.prompt_versioning import get_version_manager
from firebase_admin import firestore, initialize_app, credentials
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def register_current_prompt() -> Any:
    """Register the current hardcoded prompt as v1.0.0"""

    # Initialize Firebase (if not already)
    try:
        initialize_app()
    except ValueError:
        # Already initialized
        pass

    db = firestore.client()
    version_manager = get_version_manager(db)

    # Register v1.0.0
    version_id = version_manager.register_version(
        prompt_template=BASE_SYSTEM_PROMPT,
        few_shot_examples=FEW_SHOT_EXAMPLES,
        metadata={
            "major": 1,
            "minor": 0,
            "patch": 0,
            "description": "Initial prompt version - Base system prompt with conversion guidance",
            "author": "system",
            "created_by": "auto_registration_script"
        }
    )

    logger.info(f"✓ Registered version: {version_id}")

    # Set as active
    version_manager.set_active_version(version_id)
    logger.info(f"✓ Activated version: {version_id}")

    # Verify
    active = version_manager.get_active_version()
    if active:
        logger.info(f"✅ Success! Active version: {active['version_id']}")
    else:
        logger.error("❌ Failed to verify active version")

    return version_id


if __name__ == "__main__":
    print("=" * 60)
    print("PROMPT VERSION REGISTRATION")
    print("=" * 60)

    version_id = register_current_prompt()

    print("\n✅ Prompt versioning initialized!")
    print(f"   Version: {version_id}")
    print(f"   Status: Active")
    print("\nNext steps:")
    print("- Update prompt in Firestore to create new versions")
    print("- Use set_active_version() to switch versions")
    print("- Use log_performance() to track metrics")
