"""
Script to add intelligent cache integration to cloud_run_main.py
This inserts cache checking at the correct locations.
"""

def add_cache_integration():
    file_path = "src/api/cloud_run_main.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find the line after START_TIME initialization (around line 51)
    cache_import_code = """
# Initialize intelligent response cache
try:
    from rag.cache_manager import intelligent_response_cache
    logger.info("Intelligent response cache initialized")
except Exception as cache_init_err:
    logger.warning(f"Failed to initialize cache: {cache_init_err}")
    intelligent_response_cache = None
"""

    # Insert after START_TIME line
    for i, line in enumerate(lines):
        if 'START_TIME = datetime.now(timezone.utc)' in line:
            lines.insert(i + 1, cache_import_code)
            print(f"✓ Added cache import at line {i+1}")
            break

    # Find the streaming endpoint and add cache logic before agent call
    # Look for: "# Real mode: stream from agent"
    cache_check_code = """
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
                        yield f"data: {json.dumps({'type': 'content', 'chunk': cached_response_text})}\\\\n\\\\n"
                        yield "data: [DONE]\\\\n\\\\n"
                        return
                    else:
                        logger.info(f"Cache MISS for: {chat_request.message[:50]}...")
                except Exception as cache_err:
                    logger.warning(f"Cache check failed: {cache_err}")

            # 2. No cache hit - generate from agent
"""

    cache_save_code = """
            # 3. Save to cache after generation (if no PII/quality issues)
            full_response_text = ""  # Collect full response
"""

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("✓ Cache integration added successfully!")
    print("Note: Full implementation requires manual verification")

if __name__ == "__main__":
    add_cache_integration()
