import secrets
import hashlib
from datetime import datetime


def generate_oauth_state() -> str:
    """Generate a secure random state for OAuth flow"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

