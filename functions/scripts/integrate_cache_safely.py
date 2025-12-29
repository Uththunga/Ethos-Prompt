"""
Safe Cache Integration Script
Programmatically integrates cache code into cloud_run_main.py with validation
"""
import os
import ast
import shutil
from datetime import datetime

def validate_python_syntax(code):
    """Validate Python syntax using AST parser"""
    try:
        ast.parse(code)
        return True, None
    except SyntaxError as e:
        return False, str(e)

def integrate_cache_safely():
    """Safely integrate cache code into cloud_run_main.py"""

    source_file = "src/api/cloud_run_main.py"

    print("="*80)
    print("SAFE CACHE INTEGRATION SCRIPT")
    print("="*80)

    # Step 1: Read original file
    print(f"\n[1/8] Reading {source_file}...")
    with open(source_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"✓ Read {len(lines)} lines")

    # Step 2: Create backup
    backup_file = f"{source_file}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    print(f"\n[2/8] Creating backup: {backup_file}...")
    shutil.copy2(source_file, backup_file)
    print(f"✓ Backup created")

    # Step 3: Insert cache import (after line 51 - START_TIME)
    print(f"\n[3/8] Inserting cache import...")
    cache_import = """
# Initialize intelligent response cache
try:
    from rag.cache_manager import intelligent_response_cache
    logger.info("Intelligent response cache initialized")
except Exception as cache_init_err:
    logger.warning(f"Failed to initialize cache: {cache_init_err}")
    intelligent_response_cache = None

"""

    # Find START_TIME line
    start_time_idx = None
    for i, line in enumerate(lines):
        if 'START_TIME = datetime.now(timezone.utc)' in line:
            start_time_idx = i
            break

    if start_time_idx is None:
        print("❌ ERROR: Could not find START_TIME line")
        return False

    lines.insert(start_time_idx + 1, cache_import)
    print(f"✓ Inserted cache import at line {start_time_idx + 2}")

    # Step 4: Insert cache checking (before agent call)
    print(f"\n[4/8] Inserting cache checking logic...")
    cache_check = """
            # Real mode: Intelligent caching + agent streaming

            # 1. CHECK CACHE FIRST (with semantic similarity)
            if intelligent_response_cache:
                try:
                    cached_data = intelligent_response_cache.get_similar_cached_response(
                        query=chat_request.message,
                        page_context=chat_request.page_context or "unknown"
                    )
                    if cached_data:
                        logger.info(f"✓ Cache HIT for: {chat_request.message[:50]}...")
                        # Serve cached response instantly
                        cached_response_text = cached_data['response']
                        yield f"data: {json.dumps({'type': 'content', 'chunk': cached_response_text})}\\n\\n"
                        yield "data: [DONE]\\n\\n"
                        return
                    else:
                        logger.info(f"Cache MISS for: {chat_request.message[:50]}...")
                except Exception as cache_err:
                    logger.warning(f"Cache check failed: {cache_err}")

            # 2. No cache hit - generate from agent
"""

    # Find "# Real mode: stream from agent" line
    real_mode_idx = None
    for i, line in enumerate(lines):
        if '# Real mode: stream from agent' in line:
            real_mode_idx = i
            break

    if real_mode_idx is None:
        print("❌ ERROR: Could not find '# Real mode' comment")
        return False

    # Replace the comment line with cache checking code
    lines[real_mode_idx] = cache_check
    print(f"✓ Inserted cache checking at line {real_mode_idx + 1}")

    # Step 5: Add full_response_text collection
    print(f"\n[5/8] Adding response collection for caching...")

    # Find "total_content_length = 0" line
    total_content_idx = None
    for i, line in enumerate(lines):
        if 'total_content_length = 0  # Track total content' in line:
            total_content_idx = i
            break

    if total_content_idx is None:
        print("❌ ERROR: Could not find total_content_length line")
        return False

    # Add full_response_text initialization
    lines[total_content_idx] = lines[total_content_idx].rstrip() + '\\n            full_response_text = ""  # Collect full response for caching\\n'
    print(f"✓ Added response collection at line {total_content_idx + 1}")

    # Step 6: Update streaming loop to collect response
    print(f"\n[6/8] Updating streaming loop...")

    # Find "buffer += normalized" line
    buffer_normalized_idx = None
    for i, line in enumerate(lines):
        if 'buffer += normalized' in line and 'total_content_length += len(normalized)' in lines[i+1]:
            buffer_normalized_idx = i
            break

    if buffer_normalized_idx is None:
        print("❌ ERROR: Could not find buffer += normalized line")
        return False

    # Insert full_response_text collection
    indent = ' ' * 20  # Match indentation
    lines.insert(buffer_normalized_idx + 1, f"{indent}full_response_text += normalized\\n")
    print(f"✓ Updated streaming loop at line {buffer_normalized_idx + 2}")

    # Step 7: Add cache saving after response
    print(f"\n[7/8] Adding cache saving logic...")
    cache_save = """
            # 3. Save to cache after generation (if valid)
            if intelligent_response_cache and full_response_text and total_content_length >= MIN_EXPECTED_LENGTH:
                try:
                    cache_success = intelligent_response_cache.cache_response_safe(
                        query=chat_request.message,
                        response=full_response_text,
                        page_context=chat_request.page_context or "unknown",
                        metadata={'model': 'granite-3.0-8b', 'conversation_id': conversation_id}
                    )
                    if cache_success:
                        logger.info(f"✓ Cached response for: {chat_request.message[:50]}...")
                    else:
                        logger.warning(f"✗ Failed to cache (PII/Quality): {chat_request.message[:50]}...")
                except Exception as cache_save_err:
                    logger.warning(f"Cache save failed: {cache_save_err}")

"""

    # Find 'yield "data: [DONE]' line in generate() function
    done_idx = None
    for i, line in enumerate(lines):
        if 'yield "data: [DONE]' in line and i > total_content_idx:
            done_idx = i
            break

    if done_idx is None:
        print("❌ ERROR: Could not find DONE yield line")
        return False

    # Insert cache saving before [DONE]
    lines.insert(done_idx, cache_save)
    print(f"✓ Added cache saving at line {done_idx + 1}")

    # Step 8: Validate syntax
    print(f"\n[8/8] Validating Python syntax...")
    final_code = ''.join(lines)
    valid, error = validate_python_syntax(final_code)

    if not valid:
        print(f"❌ SYNTAX ERROR: {error}")
        print(f"\\nRestoring from backup...")
        shutil.copy2(backup_file, source_file)
        print(f"✓ Restored original file")
        return False

    print(f"✓ Syntax validation PASSED")

    # Step 9: Write final file
    print(f"\\n[9/9] Writing integrated file...")
    with open(source_file, 'w', encoding='utf-8') as f:
        f.write(final_code)

    print(f"✓ File written successfully")
    print(f"\\n" + "="*80)
    print("INTEGRATION COMPLETE!")
    print("="*80)
    print(f"Original lines: {len(lines) - len(cache_import.split('\\n')) - len(cache_check.split('\\n')) - len(cache_save.split('\\n'))}")
    print(f"Final lines: {len(lines)}")
    print(f"Lines added: ~{len(cache_import.split('\\n')) + len(cache_check.split('\\n')) + len(cache_save.split('\\n'))}")
    print(f"\\nBackup: {backup_file}")
    print(f"\\nNext steps:")
    print(f"1. Review changes: git diff {source_file}")
    print(f"2. Test syntax: python -m py_compile {source_file}")
    print(f"3. Commit: git add {source_file} && git commit -m 'feat: integrate cache'")
    print(f"4. Deploy: gcloud run deploy ...")
    print("="*80)

    return True

if __name__ == "__main__":
    try:
        os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
        success = integrate_cache_safely()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
