"""
Amenity models for hotel facilities and features.

Requirements: REQ-012 (Amenities filter)
             REQ-023 (Amenities list display)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from shared.config import Base


class Amenity(Base):
    """
    Master amenity model.
    
    Defines available amenities that can be associated with hotels.
    """
    __tablename__ = "amenities"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Amenity information
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False)  # e.g., "General", "Room Features", "Dining"
    icon = Column(String(50), nullable=True)  # Icon identifier for UI
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    hotels = relationship("HotelAmenity", back_populates="amenity")
    
    def __repr__(self) -> str:
        return f"<Amenity(id={self.id}, name={self.name}, category={self.category})>"


class HotelAmenity(Base):
    """
    Association table between hotels and amenities.
    
    Links hotels to their available amenities.
    """
    __tablename__ = "hotel_amenities"
    
    # Composite primary key
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Additional information
    is_free = Column(Boolean, default=True, nullable=False)  # Is amenity free or paid?
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    hotel = relationship("Hotel", back_populates="amenities")
    amenity = relationship("Amenity", back_populates="hotels")
    
    def __repr__(self) -> str:
        return f"<HotelAmenity(hotel_id={self.hotel_id}, amenity_id={self.amenity_id})>"


class HotelImage(Base):
    """
    Hotel image model for photo galleries.
    
    Requirements: REQ-020 (Hotel photo gallery)
    """
    __tablename__ = "hotel_images"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to hotels table
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Image information
    image_url = Column(String(500), nullable=False)  # S3/CloudFront URL
    caption = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)  # Order in gallery
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    hotel = relationship("Hotel", back_populates="images")
    
    def __repr__(self) -> str:
        return f"<HotelImage(id={self.id}, hotel_id={self.hotel_id})>"
