"""
Session model for JWT token management and user sessions.

Requirements: NFR-009 (JWT authentication)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from shared.config import Base


class Session(Base):
    """
    User session model for JWT refresh token management.
    
    Stores active sessions with refresh tokens for token rotation.
    Access tokens are stateless (not stored in DB).
    """
    __tablename__ = "sessions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to users table
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Session information
    refresh_token = Column(String(500), unique=True, nullable=False, index=True)
    device_info = Column(String(255), nullable=True)  # User agent / device identifier
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    
    # Session status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self) -> str:
        return f"<Session(id={self.id}, user_id={self.user_id}, active={self.is_active})>"
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
