"""
Room model for hotel room types and inventory.

Requirements: REQ-022 (Room types with pricing)
             REQ-048 (Manage room inventory)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from shared.config import Base


class Room(Base):
    """
    Hotel room type model.
    
    Represents different room categories (Standard, Deluxe, Suite)
    with pricing and capacity information.
    """
    __tablename__ = "rooms"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to hotels table
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Room information
    room_type = Column(String(100), nullable=False)  # e.g., "Standard Double", "Deluxe Suite"
    description = Column(Text, nullable=True)
    
    # Capacity
    max_guests = Column(Integer, nullable=False)  # Maximum number of guests
    num_beds = Column(Integer, nullable=False)  # Number of beds
    bed_type = Column(String(50), nullable=True)  # e.g., "King", "Queen", "Twin"
    
    # Pricing (per night in USD)
    base_price = Column(Float, nullable=False)
    
    # Inventory
    total_rooms = Column(Integer, nullable=False)  # Total rooms of this type
    
    # Room size
    size_sqm = Column(Float, nullable=True)  # Room size in square meters
    
    # Images
    image_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    hotel = relationship("Hotel", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")
    
    def __repr__(self) -> str:
        return f"<Room(id={self.id}, hotel_id={self.hotel_id}, type={self.room_type}, price=${self.base_price})>"
