"""
User model for authentication and user management.

Requirements: REQ-001 to REQ-008 (Authentication & User Management)
             NFR-010 (GDPR compliance)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from shared.config import Base


class AuthProvider(str, enum.Enum):
    """Authentication provider types."""
    EMAIL = "email"
    PHONE = "phone"
    GOOGLE = "google"
    FACEBOOK = "facebook"


class User(Base):
    """
    User account model.
    
    Stores user authentication credentials and profile information.
    PII is encrypted at rest (NFR-010).
    """
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # Null for social auth users
    
    # Social authentication
    auth_provider = Column(SQLEnum(AuthProvider), default=AuthProvider.EMAIL, nullable=False)
    social_id = Column(String(255), unique=True, index=True, nullable=True)  # Google/Facebook ID
    
    # Profile information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    profile_picture_url = Column(String(500), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), default="customer", nullable=False)  # customer, hotel_owner, super_admin
    
    # GDPR compliance (REQ: NFR-010, DR-01)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete timestamp
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    hotels = relationship("Hotel", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    payment_methods = relationship("SavedPaymentMethod", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, name={self.first_name} {self.last_name})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    def is_authenticated_via_email(self) -> bool:
        """Check if user registered via email."""
        return self.auth_provider == AuthProvider.EMAIL
    
    def is_authenticated_via_social(self) -> bool:
        """Check if user registered via social auth (Google/Facebook)."""
        return self.auth_provider in [AuthProvider.GOOGLE, AuthProvider.FACEBOOK]
