"""
Pydantic schemas for Auth Service request/response models.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """User registration request."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    device_info: Optional[str] = None


class LoginRequest(BaseModel):
    """User login request."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    device_info: Optional[str] = None


class UserResponse(BaseModel):
    """User information in response."""
    id: int
    email: Optional[str]
    phone: Optional[str]
    first_name: str
    last_name: str
    is_verified: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class SocialAuthRequest(BaseModel):
    """OAuth social authentication request."""
    provider: str = Field(..., pattern="^(google|facebook)$")
    social_id: str
    email: Optional[EmailStr] = None
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    """Password reset request."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    """Password reset with OTP."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
