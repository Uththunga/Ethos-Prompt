"""AI Agent package root.

Avoid importing subpackages at import time to minimise side effects in Cloud Run.
Tests can import submodules explicitly.
"""

__all__ = [
    "marketing",
    "prompt_library",
]
