"""
Test Suite for Document Upload & Storage (Section 3)
Tests file validation, sanitization, and document management
"""

import sys
import os
from pathlib import Path

# Add functions directory to path
functions_dir = Path(__file__).parent
sys.path.insert(0, str(functions_dir))

from datetime import datetime
from typing import Dict, Any

# Import modules to test
from src.utils.file_validator import (
    validate_file_type,
    validate_file_size,
    sanitize_filename,
    is_safe_filename,
    get_file_extension,
    format_file_size,
    check_for_malicious_content,
    validate_file,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE
)


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

class TestResults:
    """Track test results"""
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_pass(self, test_name: str):
        self.total += 1
        self.passed += 1
        print(f"✅ PASS: {test_name}")

    def add_fail(self, test_name: str, error: str):
        self.total += 1
        self.failed += 1
        self.errors.append((test_name, error))
        print(f"❌ FAIL: {test_name}")
        print(f"   Error: {error}")

    def print_summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total}")
        print(f"Passed: {self.passed} ✅")
        print(f"Failed: {self.failed} ❌")
        print(f"Success Rate: {(self.passed/self.total*100):.1f}%")

        if self.errors:
            print("\nFailed Tests:")
            for test_name, error in self.errors:
                print(f"  - {test_name}: {error}")


results = TestResults()


# =============================================================================
# TEST 1: FILE TYPE VALIDATION
# =============================================================================

def test_file_type_validation():
    """Test file type validation"""
    try:
        # Test allowed extensions
        assert validate_file_type('.pdf', 'application/pdf') == True
        assert validate_file_type('.txt', 'text/plain') == True
        assert validate_file_type('.md', 'text/markdown') == True
        assert validate_file_type('.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') == True

        # Test disallowed extensions
        assert validate_file_type('.exe') == False
        assert validate_file_type('.sh') == False
        assert validate_file_type('.js') == False

        results.add_pass("File Type Validation")
    except Exception as e:
        results.add_fail("File Type Validation", str(e))


# =============================================================================
# TEST 2: FILE SIZE VALIDATION
# =============================================================================

def test_file_size_validation():
    """Test file size validation"""
    try:
        # Test valid sizes
        assert validate_file_size(1024) == True  # 1KB
        assert validate_file_size(1024 * 1024) == True  # 1MB
        assert validate_file_size(5 * 1024 * 1024) == True  # 5MB

        # Test invalid sizes
        assert validate_file_size(0) == False  # Zero size
        assert validate_file_size(-1) == False  # Negative size
        assert validate_file_size(11 * 1024 * 1024) == False  # 11MB (exceeds 10MB limit)

        results.add_pass("File Size Validation")
    except Exception as e:
        results.add_fail("File Size Validation", str(e))


# =============================================================================
# TEST 3: FILENAME SANITIZATION
# =============================================================================

def test_filename_sanitization():
    """Test filename sanitization"""
    try:
        # Test basic sanitization
        result1 = sanitize_filename("test.pdf")
        assert result1 == "test.pdf", f"Expected 'test.pdf', got '{result1}'"

        result2 = sanitize_filename("my document.txt")
        assert result2 == "my document.txt", f"Expected 'my document.txt', got '{result2}'"

        # Test dangerous characters
        result3 = sanitize_filename("../etc/passwd")
        assert ".." not in result3, f"'..' found in '{result3}'"

        result4 = sanitize_filename("path/to/file.txt")
        assert "/" not in result4, f"'/' found in '{result4}'"

        result5 = sanitize_filename("path\\to\\file.txt")
        assert "\\" not in result5, f"'\\' found in '{result5}'"

        # Test special characters - should replace with underscores
        sanitized = sanitize_filename("file<>:\"?*.txt")
        assert "<" not in sanitized, f"'<' found in '{sanitized}'"
        assert ">" not in sanitized, f"'>' found in '{sanitized}'"
        assert ":" not in sanitized, f"':' found in '{sanitized}'"
        assert "?" not in sanitized, f"'?' found in '{sanitized}'"
        assert "*" not in sanitized, f"'*' found in '{sanitized}'"
        assert sanitized.endswith(".txt"), f"Expected to end with '.txt', got '{sanitized}'"

        # Test whitespace
        result6 = sanitize_filename("  file.txt  ")
        assert result6 == "file.txt", f"Expected 'file.txt', got '{result6}'"

        # Test leading/trailing dots (dots are stripped after sanitization)
        result7 = sanitize_filename(".file.txt")
        assert result7 == "file.txt", f"Expected 'file.txt', got '{result7}'"

        results.add_pass("Filename Sanitization")
    except AssertionError as e:
        results.add_fail("Filename Sanitization", str(e))
    except Exception as e:
        results.add_fail("Filename Sanitization", f"Unexpected error: {str(e)}")


# =============================================================================
# TEST 4: SAFE FILENAME CHECK
# =============================================================================

def test_safe_filename():
    """Test safe filename checking"""
    try:
        # Test safe filenames
        assert is_safe_filename("document.pdf") == True
        assert is_safe_filename("my_file.txt") == True
        assert is_safe_filename("report-2024.docx") == True

        # Test unsafe filenames
        assert is_safe_filename("malware.exe") == False
        assert is_safe_filename("script.sh") == False
        assert is_safe_filename("virus.bat") == False
        assert is_safe_filename("../etc/passwd") == False

        results.add_pass("Safe Filename Check")
    except Exception as e:
        results.add_fail("Safe Filename Check", str(e))


# =============================================================================
# TEST 5: FILE EXTENSION EXTRACTION
# =============================================================================

def test_file_extension():
    """Test file extension extraction"""
    try:
        assert get_file_extension("document.pdf") == ".pdf"
        assert get_file_extension("file.TXT") == ".txt"  # Case insensitive
        assert get_file_extension("archive.tar.gz") == ".gz"
        assert get_file_extension("noextension") == ""

        results.add_pass("File Extension Extraction")
    except Exception as e:
        results.add_fail("File Extension Extraction", str(e))


# =============================================================================
# TEST 6: FILE SIZE FORMATTING
# =============================================================================

def test_file_size_formatting():
    """Test file size formatting"""
    try:
        assert "B" in format_file_size(100)
        assert "KB" in format_file_size(1024)
        assert "MB" in format_file_size(1024 * 1024)
        assert "GB" in format_file_size(1024 * 1024 * 1024)

        results.add_pass("File Size Formatting")
    except Exception as e:
        results.add_fail("File Size Formatting", str(e))


# =============================================================================
# TEST 7: MALICIOUS CONTENT DETECTION
# =============================================================================

def test_malicious_content_detection():
    """Test malicious content detection"""
    try:
        # Test safe content
        safe_content = b"This is a safe text document."
        is_safe, error = check_for_malicious_content(safe_content, "safe.txt")
        assert is_safe == True
        assert error is None

        # Test executable signature
        exe_content = b"MZ\x90\x00"  # Windows executable signature
        is_safe, error = check_for_malicious_content(exe_content, "malware.exe")
        assert is_safe == False
        assert "executable" in error.lower()

        # Test script tags in text
        script_content = b"<script>alert('xss')</script>"
        is_safe, error = check_for_malicious_content(script_content, "malicious.txt")
        assert is_safe == False
        assert "script" in error.lower()

        results.add_pass("Malicious Content Detection")
    except Exception as e:
        results.add_fail("Malicious Content Detection", str(e))


# =============================================================================
# TEST 8: COMPREHENSIVE FILE VALIDATION
# =============================================================================

def test_comprehensive_validation():
    """Test comprehensive file validation"""
    try:
        # Test valid file
        valid_content = b"This is a valid PDF document content."
        is_valid, error, safe_name = validate_file("document.pdf", valid_content, "application/pdf")
        assert is_valid == True
        assert error is None
        assert safe_name == "document.pdf"

        # Test invalid file type
        is_valid, error, safe_name = validate_file("malware.exe", b"MZ", "application/x-msdownload")
        assert is_valid == False
        assert error is not None

        # Test file too large
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        is_valid, error, safe_name = validate_file("large.pdf", large_content, "application/pdf")
        assert is_valid == False
        assert "size" in error.lower()

        # Test filename sanitization
        is_valid, error, safe_name = validate_file("../../../etc/passwd.txt", b"safe content", "text/plain")
        assert ".." not in safe_name
        assert "/" not in safe_name

        results.add_pass("Comprehensive File Validation")
    except Exception as e:
        results.add_fail("Comprehensive File Validation", str(e))


# =============================================================================
# TEST 9: ALLOWED EXTENSIONS
# =============================================================================

def test_allowed_extensions():
    """Test allowed extensions configuration"""
    try:
        # Verify expected extensions are allowed
        expected_extensions = ['.pdf', '.txt', '.doc', '.docx', '.md']
        for ext in expected_extensions:
            assert ext in ALLOWED_EXTENSIONS, f"Expected extension {ext} not in ALLOWED_EXTENSIONS"

        # Verify at least 5 extensions
        assert len(ALLOWED_EXTENSIONS) >= 5, "Should have at least 5 allowed extensions"

        results.add_pass("Allowed Extensions Configuration")
    except Exception as e:
        results.add_fail("Allowed Extensions Configuration", str(e))


# =============================================================================
# TEST 10: MAX FILE SIZE
# =============================================================================

def test_max_file_size():
    """Test max file size configuration"""
    try:
        # Verify max file size is 10MB
        expected_size = 10 * 1024 * 1024
        assert MAX_FILE_SIZE == expected_size, f"Expected MAX_FILE_SIZE to be {expected_size}, got {MAX_FILE_SIZE}"

        results.add_pass("Max File Size Configuration")
    except Exception as e:
        results.add_fail("Max File Size Configuration", str(e))


# =============================================================================
# RUN ALL TESTS
# =============================================================================

def run_all_tests():
    """Run all tests"""
    print("="*80)
    print("DOCUMENT UPLOAD & STORAGE TEST SUITE")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Run tests
    test_file_type_validation()
    test_file_size_validation()
    test_filename_sanitization()
    test_safe_filename()
    test_file_extension()
    test_file_size_formatting()
    test_malicious_content_detection()
    test_comprehensive_validation()
    test_allowed_extensions()
    test_max_file_size()

    # Print summary
    results.print_summary()

    print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    return results.failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
