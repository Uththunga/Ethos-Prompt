#!/usr/bin/env python3
"""
Automatic Type Annotation Fixer for Marketing Agent
Programmatically adds type annotations to fix mypy errors.
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

def add_return_type_to_function(content: str, func_name: str, return_type: str) -> str:
    """Add return type annotation to a function definition."""
    # Pattern: def func_name(params):
    pattern = rf'(def {func_name}\([^)]*\)):'
    replacement = rf'\1 -> {return_type}:'
    return re.sub(pattern, replacement, content)

def add_parameter_types(content: str, func_name: str, param_types: dict) -> str:
    """Add type annotations to function parameters."""
    # This is complex, so we'll handle it case by case
    for param, ptype in param_types.items():
        # Pattern: param=value or param,
        pattern = rf'({func_name}\([^)]*?)({param})(=|,|\))'
        replacement = rf'\1{param}: {ptype}\3'
        content = re.sub(pattern, replacement, content)
    return content

def fix_marketing_agent_py(file_path: Path) -> str:
    """Fix type errors in marketing_agent.py."""
    content = file_path.read_text(encoding='utf-8')

    # Add missing imports at top
    if 'from datetime import datetime, timezone' not in content:
        content = content.replace(
            'from typing import Dict, Any, List, Optional',
            'from typing import Dict, Any, List, Optional, Union, AsyncIterator\nfrom datetime import datetime, timezone'
        )

    # Fix get_http_client return type
    content = add_return_type_to_function(content, 'get_http_client', 'Any')

    # Fix __init__ parameter types
    content = re.sub(
        r'def __init__\(self, db=None, openrouter_api_key: Optional\[str\] = None\):',
        'def __init__(self, db: Any = None, openrouter_api_key: Optional[str] = None) -> None:',
        content
    )

    # Fix _initialize_llm return type
    content = add_return_type_to_function(content, '_initialize_llm', 'Any')

    # Fix get_marketing_agent
    content = re.sub(
        r'def get_marketing_agent\(db=None, openrouter_api_key: Optional\[str\] = None\):',
        "def get_marketing_agent(db: Any = None, openrouter_api_key: Optional[str] = None) -> 'MarketingAgent':",
        content
    )

    # Fix chat_stream return type
    content = re.sub(
        r'async def chat_stream\(\s*self,\s*user_message: str,\s*thread_id: Optional\[str\] = None,\s*user_id: Optional\[str\] = None,\s*metadata: Optional\[Dict\[str, Any\]\] = None\s*\):',
        'async def chat_stream(\n        self,\n        user_message: str,\n        thread_id: Optional[str] = None,\n        user_id: Optional[str] = None,\n        metadata: Optional[Dict[str, Any]] = None\n    ) -> AsyncIterator[Dict[str, Any]]:',
        content,
        flags=re.MULTILINE | re.DOTALL
    )

    return content

def fix_prompt_versioning_py(file_path: Path) -> str:
    """Fix type errors in prompt_versioning.py."""
    content = file_path.read_text(encoding='utf-8')

    # Add missing imports
    if 'from typing import' not in content:
        content = 'from typing import Any, Optional, Dict, List\n' + content

    # Fix __init__
    content = re.sub(
        r'def __init__\(self, db\):',
        'def __init__(self, db: Any) -> None:',
        content
    )

    # Add -> None to common methods
    for method in ['create_version', 'update_version', 'set_active_version']:
        content = add_return_type_to_function(content, method, 'None')

    # Add -> dict/str/etc to getter methods
    content = add_return_type_to_function(content, 'get_active_version', 'Optional[Dict[str, Any]]')
    content = add_return_type_to_function(content, 'get_version_by_id', 'Optional[Dict[str, Any]]')
    content = add_return_type_to_function(content, 'list_versions', 'List[Dict[str, Any]]')

    return content

def fix_kb_content_backup_py(file_path: Path) -> str:
    """Fix type errors in marketing_kb_content_backup.py."""
    content = file_path.read_text(encoding='utf-8')

    # Add missing imports
    if 'from typing import' not in content:
        content = 'from typing import List, Dict, Any, Optional\n' + content

    # Fix getter functions
    content = add_return_type_to_function(content, 'get_all_kb_documents', 'List[Dict[str, Any]]')
    content = add_return_type_to_function(content, 'get_kb_document_by_id', 'Optional[Dict[str, Any]]')
    content = add_return_type_to_function(content, 'get_kb_documents_by_category', 'List[Dict[str, Any]]')

    return content

def main():
    """Main entry point."""
    functions_dir = Path(__file__).parent.parent
    src_dir = functions_dir / 'src'

    files_to_fix = {
        src_dir / 'ai_agent' / 'marketing' / 'marketing_agent.py': fix_marketing_agent_py,
        src_dir / 'ai_agent' / 'marketing' / 'prompt_versioning.py': fix_prompt_versioning_py,
        src_dir / 'ai_agent' / 'marketing' / 'marketing_kb_content_backup.py': fix_kb_content_backup_py,
    }

    for file_path, fix_func in files_to_fix.items():
        if not file_path.exists():
            print(f"⚠️  Skipping {file_path} (not found)")
            continue

        print(f"🔧 Fixing {file_path.name}...")
        try:
            fixed_content = fix_func(file_path)
            file_path.write_text(fixed_content, encoding='utf-8')
            print(f"✅ Fixed {file_path.name}")
        except Exception as e:
            print(f"❌ Error fixing {file_path.name}: {e}")

    print("\n✨ Type annotation fixes complete!")
    print("Run: mypy src/ai_agent/marketing/ --config-file mypy.ini")

if __name__ == '__main__':
    main()
