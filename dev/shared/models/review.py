"""
Review model for hotel ratings and user feedback.

Requirements: REQ-024, REQ-025 (User reviews & ratings)
             REQ-043 (Rate & review hotel)
             REQ-052 (Hotel manager response)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
import enum

from shared.config import Base


class ReviewStatus(str, enum.Enum):
    """Review moderation status."""
    PENDING = "pending"  # Awaiting moderation
    APPROVED = "approved"  # Published
    REJECTED = "rejected"  # Removed by moderator
    FLAGGED = "flagged"  # Flagged for manual review


class Review(Base):
    """
    Hotel review model.
    
    Stores user reviews with ratings and automated moderation.
    """
    __tablename__ = "reviews"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Review content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=True)
    review_text = Column(Text, nullable=False)
    
    # Review status
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False, index=True)
    
    # Moderation flags
    contains_profanity = Column(Boolean, default=False, nullable=False)
    is_spam = Column(Boolean, default=False, nullable=False)
    
    # Hotel manager response
    manager_response = Column(Text, nullable=True)
    manager_response_at = Column(DateTime, nullable=True)
    
    # Helpful votes (future feature)
    helpful_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    moderated_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="reviews")
    hotel = relationship("Hotel", back_populates="reviews")
    
    def __repr__(self) -> str:
        return f"<Review(id={self.id}, hotel_id={self.hotel_id}, rating={self.rating}, status={self.status})>"
