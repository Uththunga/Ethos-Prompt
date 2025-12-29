import os
import pytest

from src.utils.file_validator import (
    validate_file,
    validate_file_size,
    validate_file_type,
    sanitize_filename,
    MAX_FILE_SIZE,
)


def test_boundary_file_sizes_pdf():
    # Exactly at limit should pass size check, but overall validation depends on type
    content_at_limit = b"0" * MAX_FILE_SIZE
    ok, err, _ = validate_file("large.pdf", content_at_limit, mime_type="application/pdf")
    # For PDFs, we allow empty or non-text content; size boundary should be accepted
    assert ok is True, f"Expected OK at MAX_FILE_SIZE, got error: {err}"

    # Just over limit should fail
    content_over = b"0" * (MAX_FILE_SIZE + 1)
    ok2, err2, _ = validate_file("too_large.pdf", content_over, mime_type="application/pdf")
    assert ok2 is False
    assert "exceeds maximum" in (err2 or "").lower()


def test_invalid_mime_types():
    # Current validator treats MIME as an allowlist independent of extension
    assert validate_file_type(".pdf", "text/plain") is True
    assert validate_file_type(".docx", "application/octet-stream") is False
    assert validate_file_type(".md", "text/markdown") is True


def test_corrupted_text_file_fails_content_min_length():
    ok, err, _ = validate_file("corrupt.txt", b"x", mime_type="text/plain")
    assert ok is False
    assert "insufficient textual content" in (err or "")


def test_sanitize_filename_boundaries():
    name = sanitize_filename("../..//bad\\name?.txt")
    assert ".." not in name
    assert "/" not in name
    assert "?" not in name
