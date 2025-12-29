"""
Root conftest.py to configure pytest environment
"""
import sys
import os

# Add src directory to Python path for imports
src_path = os.path.join(os.path.dirname(__file__), 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)
