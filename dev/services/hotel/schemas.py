"""
Pydantic schemas for Hotel Service request/response models.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class HotelCreateRequest(BaseModel):
    """Create hotel request."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str
    property_type: str = "hotel"
    star_rating: int = Field(..., ge=1, le=5)
    address: str
    city: str
    state: Optional[str] = None
    country: str
    postal_code: Optional[str] = None
    latitude: float
    longitude: float
    phone: str
    email: str
    website: Optional[str] = None
    check_in_time: str = "14:00"
    check_out_time: str = "11:00"
    cancellation_policy: str = "free_cancellation"


class HotelUpdateRequest(BaseModel):
    """Update hotel request (partial update)."""
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    cancellation_policy: Optional[str] = None


class HotelResponse(BaseModel):
    """Hotel response model."""
    id: int
    name: str
    description: str
    property_type: str
    star_rating: int
    city: str
    country: str
    latitude: float
    longitude: float
    average_rating: float
    total_reviews: int
    cover_image_url: Optional[str]
    
    class Config:
        from_attributes = True


class RoomCreateRequest(BaseModel):
    """Create room request."""
    room_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    max_guests: int = Field(..., ge=1)
    num_beds: int = Field(..., ge=1)
    bed_type: Optional[str] = None
    base_price: float = Field(..., gt=0)
    total_rooms: int = Field(..., ge=1)
    size_sqm: Optional[float] = None


class RoomUpdateRequest(BaseModel):
    """Update room request (partial update)."""
    room_type: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    total_rooms: Optional[int] = None


class RoomResponse(BaseModel):
    """Room response model."""
    id: int
    hotel_id: int
    room_type: str
    description: Optional[str]
    max_guests: int
    num_beds: int
    bed_type: Optional[str]
    base_price: float
    total_rooms: int
    size_sqm: Optional[float]
    
    class Config:
        from_attributes = True


class HotelDetailResponse(BaseModel):
    """Detailed hotel response with rooms and amenities."""
    id: int
    name: str
    description: str
    property_type: str
    star_rating: int
    address: str
    city: str
    state: Optional[str]
    country: str
    latitude: float
    longitude: float
    phone: str
    email: str
    website: Optional[str]
    check_in_time: str
    check_out_time: str
    cancellation_policy: str
    average_rating: float
    total_reviews: int
    cover_image_url: Optional[str]
    rooms: List[RoomResponse]
    amenities: List[dict]
    images: List[dict]


class PaginatedHotelResponse(BaseModel):
    """Paginated hotel list response."""
    hotels: List[HotelResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
