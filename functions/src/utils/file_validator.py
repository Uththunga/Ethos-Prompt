"""
File Validation Utility
Validates file types, sizes, and sanitizes filenames for document uploads
"""

import re
import os
import mimetypes
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

# Allowed file extensions
ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.md', '.markdown']

# Allowed MIME types
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/x-markdown'
]

# Maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024
# Minimum meaningful text length (characters) for text-like files
MIN_TEXT_LENGTH = 20

# Dangerous file patterns
DANGEROUS_PATTERNS = [
    r'\.exe$',
    r'\.bat$',
    r'\.cmd$',
    r'\.sh$',
    r'\.ps1$',
    r'\.vbs$',
    r'\.js$',
    r'\.jar$',
    r'\.app$',
    r'\.dmg$',
    r'\.pkg$',
    r'\.deb$',
    r'\.rpm$'
]

# Dangerous filename characters
DANGEROUS_CHARS = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*', '\0']


# =============================================================================
# FILE TYPE VALIDATION
# =============================================================================

def validate_file_type(file_extension: str, mime_type: Optional[str] = None) -> bool:
    """
    Validate file type based on extension and MIME type

    Args:
        file_extension: File extension (e.g., '.pdf')
        mime_type: Optional MIME type

    Returns:
        True if file type is allowed, False otherwise
    """
    # Normalize extension
    ext = file_extension.lower()

    # Check extension
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file extension: {ext}")
        return False

    # Check MIME type if provided
    if mime_type:
        if mime_type not in ALLOWED_MIME_TYPES:
            logger.warning(f"Invalid MIME type: {mime_type}")
            return False

    return True


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename

    Args:
        filename: Filename

    Returns:
        File extension (e.g., '.pdf')
    """
    _, ext = os.path.splitext(filename)
    return ext.lower()


def guess_mime_type(filename: str) -> Optional[str]:
    """
    Guess MIME type from filename

    Args:
        filename: Filename

    Returns:
        MIME type or None
    """
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type


# =============================================================================
# FILE SIZE VALIDATION
# =============================================================================

def validate_file_size(file_size: int, max_size: int = MAX_FILE_SIZE) -> bool:
    """
    Validate file size

    Args:
        file_size: File size in bytes
        max_size: Maximum allowed size in bytes

    Returns:
        True if file size is valid, False otherwise
    """
    if file_size <= 0:
        logger.warning("File size is zero or negative")
        return False

    if file_size > max_size:
        logger.warning(f"File size {file_size} exceeds maximum {max_size}")
        return False

    return True


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format

    Args:
        size_bytes: File size in bytes

    Returns:
        Formatted file size (e.g., '1.5 MB')
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


# =============================================================================
# FILENAME SANITIZATION
# =============================================================================

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent security issues

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove dangerous characters
    for char in DANGEROUS_CHARS:
        filename = filename.replace(char, '_')

    # Remove leading/trailing whitespace and dots
    filename = filename.strip('. ')

    # Replace multiple underscores with single underscore
    filename = re.sub(r'_+', '_', filename)

    # Limit filename length (max 255 characters)
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        max_name_length = 255 - len(ext)
        filename = name[:max_name_length] + ext

    # Ensure filename is not empty
    if not filename or filename == '_':
        filename = 'unnamed_file'

    return filename


def is_safe_filename(filename: str) -> bool:
    """
    Check if filename is safe (no dangerous patterns)

    Args:
        filename: Filename to check

    Returns:
        True if filename is safe, False otherwise
    """
    # Check for dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, filename, re.IGNORECASE):
            logger.warning(f"Dangerous pattern detected in filename: {filename}")
            return False

    # Check for dangerous characters
    for char in DANGEROUS_CHARS:
        if char in filename:
            logger.warning(f"Dangerous character '{char}' in filename: {filename}")
            return False

    return True


# =============================================================================
# MALICIOUS CONTENT DETECTION
# =============================================================================

def check_for_malicious_content(file_content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
    """
    Check file content for malicious patterns

    Args:
        file_content: File content as bytes
        filename: Filename

    Returns:
        Tuple of (is_safe, error_message)
    """
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed size"

    # Check for executable signatures
    executable_signatures = [
        b'MZ',  # Windows executable
        b'\x7fELF',  # Linux executable
        b'\xca\xfe\xba\xbe',  # macOS executable
        b'#!/bin/',  # Shell script
        b'#!/usr/bin/',  # Shell script
    ]

    for signature in executable_signatures:
        if file_content.startswith(signature):
            return False, "File appears to be an executable"

    # Check for script content in text files
    if filename.endswith(('.txt', '.md', '.markdown')):
        try:
            text_content = file_content.decode('utf-8', errors='ignore')

            # Check for script tags
            if re.search(r'<script[^>]*>', text_content, re.IGNORECASE):
                return False, "File contains script tags"

            # Check for dangerous JavaScript
            if re.search(r'javascript:', text_content, re.IGNORECASE):
                return False, "File contains JavaScript protocol"

        except Exception as e:
            logger.warning(f"Failed to decode text content: {e}")

    return True, None


def _has_min_text_content(file_content: bytes, filename: str) -> bool:
    """Heuristic check for minimum textual content in text-like files.
    Skip binary formats like PDF/DOCX to avoid false negatives.
    """
    lower = filename.lower()
    if lower.endswith(('.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html')):
        try:
            # Try utf-8 first, fallback to latin-1
            try:
                text = file_content.decode('utf-8')
            except UnicodeDecodeError:
                text = file_content.decode('latin-1', errors='ignore')
            # Remove HTML tags if present
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return len(text) >= MIN_TEXT_LENGTH
        except Exception:
            return True  # Don't block if decoding fails unexpectedly
    # For PDFs and DOCX, let the extractor decide later
    return True


def _virus_scan_placeholder(file_content: bytes) -> bool:
    """Placeholder for AV scanning integration. Returns True (safe) by default."""
    # Integrate with a real scanner here if needed (e.g., ClamAV via service)
    return True



# =============================================================================
# COMPREHENSIVE VALIDATION
# =============================================================================

def validate_file(
    filename: str,
    file_content: bytes,
    mime_type: Optional[str] = None,
    *,
    enable_virus_scan: bool = False
) -> Tuple[bool, Optional[str], str]:
    """
    Comprehensive file validation

    Args:
        filename: Original filename
        file_content: File content as bytes
        mime_type: Optional MIME type
        enable_virus_scan: When True, run optional AV scan hook

    Returns:
        Tuple of (is_valid, error_message, sanitized_filename)
    """
    # Sanitize filename
    safe_filename = sanitize_filename(filename)

    # Check if filename is safe
    if not is_safe_filename(safe_filename):
        return False, "Filename contains dangerous patterns", safe_filename

    # Get file extension
    file_extension = get_file_extension(safe_filename)

    # Validate file type
    if not validate_file_type(file_extension, mime_type):
        return False, f"Unsupported file type: {file_extension}", safe_filename

    # Validate file size
    if not validate_file_size(len(file_content)):
        return False, f"File size exceeds maximum allowed size ({format_file_size(MAX_FILE_SIZE)})", safe_filename

    # Optional virus scan hook
    if enable_virus_scan and not _virus_scan_placeholder(file_content):
        return False, "File failed antivirus scanning", safe_filename

    # Check for malicious content
    is_safe, error = check_for_malicious_content(file_content, safe_filename)
    if not is_safe:
        return False, error, safe_filename

    # Content validation for text-like files
    if not _has_min_text_content(file_content, safe_filename):
        return False, "File appears to have insufficient textual content", safe_filename

    return True, None, safe_filename
