"""
Security Configuration - Comprehensive security settings and utilities
"""
import logging
import hashlib
import secrets
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import jwt
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger(__name__)

@dataclass
class SecurityPolicy:
    max_request_size: int = 50 * 1024 * 1024  # 50MB
    max_requests_per_minute: int = 100
    max_requests_per_hour: int = 1000
    max_requests_per_day: int = 10000
    require_https: bool = True
    allowed_origins: Optional[List[str]] = None
    blocked_ips: Optional[List[str]] = None
    rate_limit_whitelist: Optional[List[str]] = None

class InputValidator:
    """
    Validate and sanitize user inputs
    """
    
    # Regex patterns for validation
    PATTERNS = {
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'alphanumeric': re.compile(r'^[a-zA-Z0-9_-]+$'),
        'filename': re.compile(r'^[a-zA-Z0-9._-]+$'),
        'uuid': re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
        'safe_text': re.compile(r'^[a-zA-Z0-9\s.,!?;:()\[\]{}\'"-]+$')
    }
    
    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'eval\s*\(', re.IGNORECASE),
        re.compile(r'exec\s*\(', re.IGNORECASE),
        re.compile(r'import\s+', re.IGNORECASE),
        re.compile(r'__.*__', re.IGNORECASE),
        re.compile(r'\.\./'),  # Path traversal
        re.compile(r'\.\.\\'),  # Path traversal (Windows)
    ]
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """Validate email format"""
        if not email or len(email) > 254:
            return False
        return bool(cls.PATTERNS['email'].match(email))
    
    @classmethod
    def validate_filename(cls, filename: str) -> bool:
        """Validate filename for safety"""
        if not filename or len(filename) > 255:
            return False
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(filename):
                return False
        
        return bool(cls.PATTERNS['filename'].match(filename))
    
    @classmethod
    def validate_user_input(cls, text: str, max_length: int = 10000) -> bool:
        """Validate general user input"""
        if not text or len(text) > max_length:
            return False
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(text):
                return False
        
        return True
    
    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Sanitize text input"""
        if not text:
            return ""
        
        # Remove dangerous characters
        sanitized = re.sub(r'[<>"\']', '', text)
        
        # Limit length
        sanitized = sanitized[:10000]
        
        return sanitized.strip()
    
    @classmethod
    def validate_api_key(cls, api_key: str) -> bool:
        """Validate API key format"""
        if not api_key:
            return False
        
        # Check length (typical API keys are 32-128 characters)
        if len(api_key) < 16 or len(api_key) > 256:
            return False
        
        # Check for alphanumeric and common special characters
        if not re.match(r'^[a-zA-Z0-9._-]+$', api_key):
            return False
        
        return True

class EncryptionManager:
    """
    Handle encryption and decryption of sensitive data
    """
    
    def __init__(self, encryption_key: Optional[str] = None):
        if encryption_key:
            self.key = encryption_key.encode()
        else:
            self.key = Fernet.generate_key()
        
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt string data"""
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.cipher.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Invalid encrypted data")
    
    def hash_password(self, password: str, salt: Optional[str] = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        # Use PBKDF2 for password hashing
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt.encode(),
            100000  # iterations
        )
        
        return base64.urlsafe_b64encode(password_hash).decode(), salt
    
    def verify_password(self, password: str, hashed_password: str, salt: str) -> bool:
        """Verify password against hash"""
        try:
            new_hash, _ = self.hash_password(password, salt)
            return secrets.compare_digest(new_hash, hashed_password)
        except Exception:
            return False

class TokenManager:
    """
    Manage JWT tokens and API keys
    """
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def generate_token(self, payload: Dict[str, Any], expires_in: int = 3600) -> str:
        """Generate JWT token"""
        payload['exp'] = datetime.utcnow() + timedelta(seconds=expires_in)
        payload['iat'] = datetime.utcnow()
        
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
    
    def generate_api_key(self, prefix: str = "rag") -> str:
        """Generate secure API key"""
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}_{random_part}"

class SecurityAuditor:
    """
    Audit security events and detect threats
    """
    
    def __init__(self):
        self.security_events: List[Dict[str, Any]] = []
        self.threat_patterns = {
            'sql_injection': [
                re.compile(r"union\s+select", re.IGNORECASE),
                re.compile(r"drop\s+table", re.IGNORECASE),
                re.compile(r"insert\s+into", re.IGNORECASE),
                re.compile(r"delete\s+from", re.IGNORECASE),
            ],
            'xss_attempt': [
                re.compile(r"<script", re.IGNORECASE),
                re.compile(r"javascript:", re.IGNORECASE),
                re.compile(r"onerror\s*=", re.IGNORECASE),
            ],
            'path_traversal': [
                re.compile(r"\.\./"),
                re.compile(r"\.\.\\"),
                re.compile(r"%2e%2e%2f", re.IGNORECASE),
            ]
        }
    
    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security event"""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type,
            'details': details
        }
        
        self.security_events.append(event)
        
        # Keep only recent events (last 1000)
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]
        
        logger.warning(f"Security event: {event_type} - {details}")
    
    def detect_threats(self, input_text: str, source_ip: Optional[str] = None) -> List[str]:
        """Detect potential security threats in input"""
        threats = []
        
        for threat_type, patterns in self.threat_patterns.items():
            for pattern in patterns:
                if pattern.search(input_text):
                    threats.append(threat_type)
                    self.log_security_event(threat_type, {
                        'input': input_text[:100],  # Log first 100 chars
                        'source_ip': source_ip,
                        'pattern_matched': pattern.pattern
                    })
                    break
        
        return threats
    
    def get_security_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get security summary for the last N hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        recent_events = [
            event for event in self.security_events
            if datetime.fromisoformat(event['timestamp']) >= cutoff_time
        ]
        
        event_counts = {}
        for event in recent_events:
            event_type = event['type']
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        return {
            'total_events': len(recent_events),
            'event_types': event_counts,
            'high_risk_events': [
                event for event in recent_events
                if event['type'] in ['sql_injection', 'xss_attempt']
            ]
        }

class SecurityManager:
    """
    Main security manager coordinating all security components
    """
    
    def __init__(self, config: SecurityPolicy = None):
        self.config = config or SecurityPolicy()
        self.validator = InputValidator()
        self.encryption_manager = EncryptionManager()
        self.token_manager = TokenManager(secrets.token_urlsafe(32))
        self.auditor = SecurityAuditor()
    
    def validate_request(self, request_data: Dict[str, Any], source_ip: Optional[str] = None) -> Dict[str, Any]:
        """Validate incoming request"""
        validation_result = {
            'valid': True,
            'errors': [],
            'threats': []
        }
        
        # Check for threats in text inputs
        for key, value in request_data.items():
            if isinstance(value, str):
                threats = self.auditor.detect_threats(value, source_ip)
                if threats:
                    validation_result['threats'].extend(threats)
                    validation_result['valid'] = False
                
                # Validate input
                if not self.validator.validate_user_input(value):
                    validation_result['errors'].append(f"Invalid input in field: {key}")
                    validation_result['valid'] = False
        
        # Check IP restrictions
        if source_ip and self.config.blocked_ips:
            if source_ip in self.config.blocked_ips:
                validation_result['valid'] = False
                validation_result['errors'].append("IP address blocked")
                self.auditor.log_security_event('blocked_ip_access', {'ip': source_ip})
        
        return validation_result
    
    def secure_api_key(self, api_key: str) -> str:
        """Securely store API key (encrypted)"""
        return self.encryption_manager.encrypt(api_key)
    
    def get_api_key(self, encrypted_key: str) -> str:
        """Retrieve API key (decrypted)"""
        return self.encryption_manager.decrypt(encrypted_key)
    
    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers for HTTP responses"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    
    def get_security_report(self) -> Dict[str, Any]:
        """Get comprehensive security report"""
        return {
            'config': {
                'max_request_size': self.config.max_request_size,
                'rate_limits': {
                    'per_minute': self.config.max_requests_per_minute,
                    'per_hour': self.config.max_requests_per_hour,
                    'per_day': self.config.max_requests_per_day
                },
                'https_required': self.config.require_https
            },
            'audit_summary': self.auditor.get_security_summary(),
            'recommendations': self._get_security_recommendations()
        }
    
    def _get_security_recommendations(self) -> List[str]:
        """Get security recommendations"""
        recommendations = []
        
        # Check recent security events
        summary = self.auditor.get_security_summary()
        
        if summary['total_events'] > 100:
            recommendations.append("High number of security events detected - consider tightening security policies")
        
        if summary.get('high_risk_events'):
            recommendations.append("High-risk security events detected - immediate investigation recommended")
        
        if not self.config.require_https:
            recommendations.append("HTTPS should be required for all connections")
        
        return recommendations

# Global instance
security_manager = SecurityManager()


