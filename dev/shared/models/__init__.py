"""Shared database models."""

from .user import User, AuthProvider
from .session import Session
from .hotel import Hotel, PropertyType, CancellationPolicy
from .room import Room
from .amenity import Amenity, HotelAmenity, HotelImage
from .booking import Booking, BookingStatus
from .payment import Payment, PaymentStatus, PaymentMethod, PaymentProvider, SavedPaymentMethod
from .review import Review, ReviewStatus

# Import Base from config for convenience
from shared.config import Base

__all__ = [
    # User models
    "User",
    "AuthProvider",
    "Session",
    # Hotel models
    "Hotel",
    "PropertyType",
    "CancellationPolicy",
    "Room",
    "Amenity",
    "HotelAmenity",
    "HotelImage",
    # Booking models
    "Booking",
    "BookingStatus",
    # Payment models
    "Payment",
    "PaymentStatus",
    "PaymentMethod",
    "PaymentProvider",
    "SavedPaymentMethod",
    # Review models
    "Review",
    "ReviewStatus",
    # Base class for models
    "Base",
]
