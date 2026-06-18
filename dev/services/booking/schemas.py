"""
Pydantic schemas for Booking Service request/response models.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime


class BookingCreateRequest(BaseModel):
    """Create booking request."""
    user_id: int
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    num_guests: int = Field(..., ge=1)
    guest_first_name: str = Field(..., min_length=1, max_length=100)
    guest_last_name: str = Field(..., min_length=1, max_length=100)
    guest_email: EmailStr
    guest_phone: str
    special_requests: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response model."""
    id: int
    confirmation_id: str
    user_id: int
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    num_nights: int
    num_guests: int
    total_price: float
    status: str
    created_at: datetime


class BookingDetailResponse(BaseModel):
    """Detailed booking response."""
    id: int
    confirmation_id: str
    user_id: int
    hotel_id: int
    hotel_name: Optional[str]
    room_id: int
    room_type: Optional[str]
    check_in_date: date
    check_out_date: date
    num_nights: int
    num_guests: int
    guest_first_name: str
    guest_last_name: str
    guest_email: str
    guest_phone: str
    special_requests: Optional[str]
    base_price: float
    total_base_price: float
    taxes: float
    service_fee: float
    discount: float
    total_price: float
    status: str
    created_at: datetime
    confirmed_at: Optional[datetime]


class CancelBookingRequest(BaseModel):
    """Cancel booking request."""
    reason: Optional[str] = None


class PromoCodeRequest(BaseModel):
    """Apply promo code request."""
    promo_code: str = Field(..., min_length=1, max_length=50)


class PaginatedBookingResponse(BaseModel):
    """Paginated booking list response."""
    bookings: List[BookingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
