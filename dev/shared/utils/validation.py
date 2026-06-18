"""
Validation utilities for input data.

Requirements: NFR-008 (Input validation)
"""

import re
from typing import Optional
from datetime import date, datetime


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if valid email format, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number to validate (supports international format)
    
    Returns:
        True if valid phone format, False otherwise
    """
    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    
    # Check if it's numeric and reasonable length (7-15 digits)
    return cleaned.isdigit() and 7 <= len(cleaned) <= 15


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def validate_date_range(check_in: date, check_out: date) -> tuple[bool, Optional[str]]:
    """
    Validate booking date range.
    
    Args:
        check_in: Check-in date
        check_out: Check-out date
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    today = date.today()
    
    # Check-in must be today or future
    if check_in < today:
        return False, "Check-in date cannot be in the past"
    
    # Check-out must be after check-in
    if check_out <= check_in:
        return False, "Check-out date must be after check-in date"
    
    # Maximum booking duration (e.g., 30 nights)
    max_nights = 30
    num_nights = (check_out - check_in).days
    if num_nights > max_nights:
        return False, f"Maximum booking duration is {max_nights} nights"
    
    return True, None


def validate_rating(rating: int) -> bool:
    """
    Validate review rating (1-5 stars).
    
    Args:
        rating: Rating value
    
    Returns:
        True if valid (1-5), False otherwise
    """
    return 1 <= rating <= 5


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input string (remove dangerous characters).
    
    Args:
        text: Input string
        max_length: Maximum allowed length
    
    Returns:
        Sanitized string
    """
    # Remove HTML tags
    sanitized = re.sub(r'<[^>]+>', '', text)
    
    # Trim whitespace
    sanitized = sanitized.strip()
    
    # Limit length
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def generate_confirmation_id() -> str:
    """
    Generate unique booking confirmation ID.
    
    Format: BKXXXXXXXXXXXX (BK + 12 random alphanumeric characters)
    
    Returns:
        Booking confirmation ID
    """
    import random
    import string
    
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=12))
    return f"BK{random_part}"
