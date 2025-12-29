"""Test Australian Communication Optimization"""
from src.ai_agent.marketing.intent_classifier import is_exit_signal
from src.ai_agent.marketing.prompts.marketing_prompts import get_system_prompt

# Test exit signals
tests = [
    ('cheers mate', True),
    ('no worries', True),
    ('too easy', True),
    ('thanks, got it', True),
    ('that helps, legend', True),
    ('hello', False),
    ('what services do you offer', False),
    ('tell me about pricing', False),
]

print('=== EXIT SIGNAL TESTS ===')
all_pass = True
for query, expected in tests:
    result = is_exit_signal(query)
    status = 'PASS' if result == expected else 'FAIL'
    if result != expected:
        all_pass = False
    print(f'{status}: "{query}" -> {result} (expected {expected})')

print()
print('=== PROMPT VERIFICATION ===')
prompt = get_system_prompt()
checks = [
    ('AUSTRALIAN COMMUNICATION STYLE' in prompt, 'Australian section'),
    ('Response Calibration' in prompt, 'Response calibration'),
    ('Exit Signals' in prompt, 'Exit signals section'),
    ('cheers' in prompt, 'Australian phrases'),
]
for check, name in checks:
    status = 'PASS' if check else 'FAIL'
    print(f'{status}: {name}')

print()
print('=== SUMMARY ===')
if all_pass:
    print('All exit signal tests PASSED')
else:
    print('Some tests FAILED')
