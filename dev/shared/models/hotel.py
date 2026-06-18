"""
Hotel model for hotel listings and properties.

Requirements: REQ-020 to REQ-027 (Hotel Details & Information)
             REQ-047, REQ-048 (Hotel management)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from shared.config import Base


class PropertyType(str, enum.Enum):
    """Property type classifications."""
    HOTEL = "hotel"
    RESORT = "resort"
    HOSTEL = "hostel"
    APARTMENT = "apartment"
    VILLA = "villa"
    GUESTHOUSE = "guesthouse"


class CancellationPolicy(str, enum.Enum):
    """Cancellation policy types."""
    FREE_CANCELLATION = "free_cancellation"  # Full refund up to 24h before check-in
    MODERATE = "moderate"  # 50% refund up to 7 days before
    STRICT = "strict"  # No refund after booking
    NON_REFUNDABLE = "non_refundable"  # No refund at all


class Hotel(Base):
    """
    Hotel property model.
    
    Stores hotel listing information including location, amenities,
    and business details.
    """
    __tablename__ = "hotels"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Owner relationship (hotel owner/manager)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    property_type = Column(SQLEnum(PropertyType), default=PropertyType.HOTEL, nullable=False)
    star_rating = Column(Integer, nullable=False)  # 1-5 stars
    
    # Location
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False, index=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Contact information
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    website = Column(String(255), nullable=True)
    
    # Business details
    check_in_time = Column(String(10), default="14:00", nullable=False)  # Format: HH:MM
    check_out_time = Column(String(10), default="11:00", nullable=False)  # Format: HH:MM
    cancellation_policy = Column(SQLEnum(CancellationPolicy), default=CancellationPolicy.FREE_CANCELLATION, nullable=False)
    
    # Images
    cover_image_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)  # Verified by admin
    
    # Performance metrics (cached)
    average_rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_rooms = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="hotels")
    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
    amenities = relationship("HotelAmenity", back_populates="hotel", cascade="all, delete-orphan")
    images = relationship("HotelImage", back_populates="hotel", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="hotel")
    reviews = relationship("Review", back_populates="hotel")
    
    def __repr__(self) -> str:
        return f"<Hotel(id={self.id}, name={self.name}, city={self.city}, rating={self.average_rating})>"
