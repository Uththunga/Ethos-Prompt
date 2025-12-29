import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))
print(f"sys.path: {sys.path}")

try:
    import ai_agent
    print(f"Imported ai_agent: {ai_agent}")
    import ai_agent.marketing
    print(f"Imported ai_agent.marketing: {ai_agent.marketing}")
    print(f"dir(ai_agent.marketing): {dir(ai_agent.marketing)}")

    from ai_agent.marketing.marketing_agent import MarketingAgent
    print("Import successful")

    import sys
    print(f"sys.modules keys matching 'src': {[k for k in sys.modules.keys() if 'src' in k]}")
    print(f"sys.modules keys matching 'ai_agent': {[k for k in sys.modules.keys() if 'ai_agent' in k]}")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
