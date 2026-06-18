"""
Hotel Service - Main Application

Handles hotel listings, room management, and inventory operations.

Requirements: REQ-020 to REQ-027 (Hotel Details & Information)
             REQ-047, REQ-048 (Hotel management)
Tasks: TASK-018, TASK-019, TASK-020
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from shared.config import get_db, settings
from shared.models import Hotel, Room, Amenity, HotelAmenity, HotelImage, PropertyType, CancellationPolicy

from .schemas import (
    HotelCreateRequest,
    HotelUpdateRequest,
    HotelResponse,
    HotelDetailResponse,
    RoomCreateRequest,
    RoomUpdateRequest,
    RoomResponse,
    PaginatedHotelResponse,
)


# Initialize FastAPI app
app = FastAPI(
    title="Hotel Service",
    description="Hotel and room management service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"service": "hotel", "status": "running", "version": "1.0.0"}


@app.post("/api/v1/hotels", response_model=HotelResponse, status_code=status.HTTP_201_CREATED)
def create_hotel(request: HotelCreateRequest, db: Session = Depends(get_db)):
    """
    Create new hotel listing (Super Admin only).
    
    Requirements: REQ-047 (Manage hotel profile)
    Task: TASK-019
    """
    # TODO: Add authentication middleware to verify Super Admin role
    
    # Create hotel
    new_hotel = Hotel(
        name=request.name,
        description=request.description,
        property_type=request.property_type,
        star_rating=request.star_rating,
        address=request.address,
        city=request.city,
        state=request.state,
        country=request.country,
        postal_code=request.postal_code,
        latitude=request.latitude,
        longitude=request.longitude,
        phone=request.phone,
        email=request.email,
        website=request.website,
        check_in_time=request.check_in_time,
        check_out_time=request.check_out_time,
        cancellation_policy=request.cancellation_policy,
        is_verified=False,  # Requires admin approval
    )
    
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    
    # TODO: Trigger Elasticsearch indexing (TASK-021)
    
    return new_hotel


@app.get("/api/v1/hotels/{hotel_id}", response_model=HotelDetailResponse)
def get_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """
    Get hotel details by ID.
    
    Requirements: REQ-020 to REQ-027 (Hotel details)
    Task: TASK-019
    """
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id, Hotel.is_active == True).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Get rooms
    rooms = db.query(Room).filter(Room.hotel_id == hotel_id, Room.is_active == True).all()
    
    # Get amenities
    amenities = db.query(Amenity).join(HotelAmenity).filter(
        HotelAmenity.hotel_id == hotel_id
    ).all()
    
    # Get images
    images = db.query(HotelImage).filter(
        HotelImage.hotel_id == hotel_id,
        HotelImage.is_active == True
    ).order_by(HotelImage.display_order).all()
    
    return HotelDetailResponse(
        id=hotel.id,
        name=hotel.name,
        description=hotel.description,
        property_type=hotel.property_type,
        star_rating=hotel.star_rating,
        address=hotel.address,
        city=hotel.city,
        state=hotel.state,
        country=hotel.country,
        latitude=hotel.latitude,
        longitude=hotel.longitude,
        phone=hotel.phone,
        email=hotel.email,
        website=hotel.website,
        check_in_time=hotel.check_in_time,
        check_out_time=hotel.check_out_time,
        cancellation_policy=hotel.cancellation_policy,
        average_rating=hotel.average_rating,
        total_reviews=hotel.total_reviews,
        cover_image_url=hotel.cover_image_url,
        rooms=[RoomResponse.from_orm(room) for room in rooms],
        amenities=[{"id": a.id, "name": a.name, "category": a.category} for a in amenities],
        images=[{"url": img.image_url, "caption": img.caption} for img in images],
    )


@app.get("/api/v1/hotels", response_model=PaginatedHotelResponse)
def list_hotels(
    page: int = 1,
    page_size: int = 20,
    city: Optional[str] = None,
    country: Optional[str] = None,
    min_rating: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List hotels with pagination and filters.
    
    Task: TASK-019
    """
    query = db.query(Hotel).filter(Hotel.is_active == True)
    
    # Apply filters
    if city:
        query = query.filter(Hotel.city.ilike(f"%{city}%"))
    
    if country:
        query = query.filter(Hotel.country.ilike(f"%{country}%"))
    
    if min_rating:
        query = query.filter(Hotel.star_rating >= min_rating)
    
    # Get total count
    total = query.count()
    
    # Paginate
    hotels = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedHotelResponse(
        hotels=[HotelResponse.from_orm(h) for h in hotels],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@app.put("/api/v1/hotels/{hotel_id}", response_model=HotelResponse)
def update_hotel(hotel_id: int, request: HotelUpdateRequest, db: Session = Depends(get_db)):
    """
    Update hotel information (Hotel Manager only).
    
    Requirements: REQ-047 (Manage hotel profile)
    Task: TASK-019
    """
    # TODO: Add authentication middleware to verify Hotel Manager role
    
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hotel, field, value)
    
    hotel.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(hotel)
    
    # TODO: Trigger Elasticsearch re-indexing (TASK-021)
    
    return hotel


@app.delete("/api/v1/hotels/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """
    Soft delete hotel (Super Admin only).
    
    Task: TASK-019
    """
    # TODO: Add authentication middleware to verify Super Admin role
    
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Soft delete
    hotel.is_active = False
    db.commit()
    
    return None


@app.post("/api/v1/hotels/{hotel_id}/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(hotel_id: int, request: RoomCreateRequest, db: Session = Depends(get_db)):
    """
    Create room type for hotel.
    
    Requirements: REQ-048 (Manage room inventory)
    Task: TASK-019
    """
    # TODO: Add authentication middleware to verify Hotel Manager role
    
    # Verify hotel exists
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id, Hotel.is_active == True).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Create room
    new_room = Room(
        hotel_id=hotel_id,
        room_type=request.room_type,
        description=request.description,
        max_guests=request.max_guests,
        num_beds=request.num_beds,
        bed_type=request.bed_type,
        base_price=request.base_price,
        total_rooms=request.total_rooms,
        size_sqm=request.size_sqm,
    )
    
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    return new_room


@app.put("/api/v1/hotels/{hotel_id}/rooms/{room_id}", response_model=RoomResponse)
def update_room(hotel_id: int, room_id: int, request: RoomUpdateRequest, db: Session = Depends(get_db)):
    """
    Update room type pricing and details.
    
    Requirements: REQ-048 (Manage room inventory)
    Task: TASK-019
    """
    # TODO: Add authentication middleware to verify Hotel Manager role
    
    room = db.query(Room).filter(Room.id == room_id, Room.hotel_id == hotel_id).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)
    
    room.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(room)
    
    return room


@app.post("/api/v1/hotels/{hotel_id}/inventory/webhook")
def pms_webhook(hotel_id: int, db: Session = Depends(get_db)):
    """
    PMS integration webhook for inventory updates.
    
    Requirements: REQ-048 (Manage inventory)
    Task: TASK-020 (DR-04 resolution)
    """
    # TODO: Implement webhook authentication (API key per hotel)
    # TODO: Validate payload schema (room type, date range, available count)
    # TODO: Update inventory in database
    # TODO: Documentation for Opera, Maestro, Cloudbeds PMS systems
    
    return {"message": "Webhook received (stub implementation)"}


@app.post("/api/v1/hotels/{hotel_id}/images/upload")
async def upload_hotel_image(hotel_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload hotel image to S3.
    
    Requirements: REQ-020 (Hotel photo gallery)
    Task: TASK-019
    """
    # TODO: Upload to S3 using boto3
    # TODO: Get CloudFront URL
    # TODO: Save to database
    
    # Stub implementation
    image_url = f"https://cdn.example.com/hotels/{hotel_id}/{file.filename}"
    
    new_image = HotelImage(
        hotel_id=hotel_id,
        image_url=image_url,
        caption=None,
        display_order=0,
    )
    
    db.add(new_image)
    db.commit()
    
    return {"image_url": image_url}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
