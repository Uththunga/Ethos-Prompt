import pytest

from src.utils.file_validator import (
    guess_mime_type,
    validate_file_size,
    format_file_size,
    is_safe_filename,
    check_for_malicious_content,
)


def test_guess_mime_type_pdf():
    assert guess_mime_type("report.pdf") == "application/pdf"


def test_validate_file_size_zero_and_over():
    assert validate_file_size(0) is False
    assert validate_file_size(1) is True


def test_format_file_size_units():
    assert format_file_size(1023) == "1023.0 B"
    assert format_file_size(1024) == "1.0 KB"


def test_is_safe_filename_blocks_exe_and_chars():
    assert is_safe_filename("program.exe") is False
    assert is_safe_filename("bad|name.txt") is False
    assert is_safe_filename("good_name.txt") is True


def test_malicious_content_detection_executable_and_script():
    # Executable signature (Windows MZ)
    ok, err = check_for_malicious_content(b"MZ....", "file.bin")
    assert ok is False and "executable" in (err or "")

    # Script tag in markdown
    ok2, err2 = check_for_malicious_content(b"<script>alert('x')</script>", "note.md")
    assert ok2 is False and "script tags" in (err2 or "")

