"""
Booking model for room reservations.

Requirements: REQ-028 to REQ-037 (Booking & Payment)
             DR-03 (Inventory double-booking prevention)
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from shared.config import Base


class BookingStatus(str, enum.Enum):
    """Booking status lifecycle."""
    DRAFT = "draft"  # Initial state, inventory locked
    PENDING_PAYMENT = "pending_payment"  # Awaiting payment
    CONFIRMED = "confirmed"  # Payment successful, booking confirmed
    PENDING_CONFIRMATION = "pending_confirmation"  # Requires hotel confirmation (on-request)
    CANCELLED = "cancelled"  # Cancelled by user or hotel
    COMPLETED = "completed"  # Check-out completed
    NO_SHOW = "no_show"  # User did not check in


class Booking(Base):
    """
    Hotel booking/reservation model.
    
    Represents a room booking with dates, pricing, and status tracking.
    Implements inventory locking to prevent double-booking (DR-03).
    """
    __tablename__ = "bookings"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Unique booking confirmation ID (user-facing)
    confirmation_id = Column(String(20), unique=True, nullable=False, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Booking dates
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    num_nights = Column(Integer, nullable=False)
    
    # Guest information
    num_guests = Column(Integer, nullable=False)
    guest_first_name = Column(String(100), nullable=False)
    guest_last_name = Column(String(100), nullable=False)
    guest_email = Column(String(255), nullable=False)
    guest_phone = Column(String(20), nullable=False)
    special_requests = Column(Text, nullable=True)
    
    # Pricing (all amounts in USD)
    base_price = Column(Float, nullable=False)  # Base room price per night
    total_base_price = Column(Float, nullable=False)  # base_price * num_nights
    taxes = Column(Float, default=0.0, nullable=False)
    service_fee = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)  # From promo code
    total_price = Column(Float, nullable=False)  # Final amount charged
    
    # Promo code
    promo_code = Column(String(50), nullable=True)
    
    # Booking status
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.DRAFT, nullable=False, index=True)
    
    # Inventory lock (DR-03)
    inventory_lock_key = Column(String(255), nullable=True)  # Redis lock key
    inventory_locked_at = Column(DateTime, nullable=True)
    inventory_lock_expires_at = Column(DateTime, nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    refund_amount = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    hotel = relationship("Hotel", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    
    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, confirmation_id={self.confirmation_id}, status={self.status})>"
    
    @property
    def guest_full_name(self) -> str:
        """Get guest's full name."""
        return f"{self.guest_first_name} {self.guest_last_name}"
    
    def calculate_num_nights(self) -> int:
        """Calculate number of nights between check-in and check-out."""
        return (self.check_out_date - self.check_in_date).days
