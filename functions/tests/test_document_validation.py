import pytest

from src.utils.file_validator import (
    validate_file_type,
    validate_file_size,
    sanitize_filename,
    validate_file,
    MAX_FILE_SIZE,
)


def test_validate_file_type_and_size():
    assert validate_file_type('.pdf', 'application/pdf') is True
    assert validate_file_type('.exe', 'application/octet-stream') is False

    assert validate_file_size(1024) is True
    assert validate_file_size(0) is False
    assert validate_file_size(MAX_FILE_SIZE + 1) is False


def test_sanitize_and_validate_file_text_min_length():
    ok, err, safe = validate_file(' doc .txt ', b'Hello world! This is text.')
    assert ok is True and err is None

    # Too short text should fail for text-like files
    ok2, err2, _ = validate_file('short.txt', b' x ')
    assert ok2 is False
    assert 'insufficient textual content' in (err2 or '')


def test_sanitize_filename():
    name = sanitize_filename('../weird/..name?.pdf')
    assert '..' not in name
    assert '/' not in name
    assert '?' not in name

