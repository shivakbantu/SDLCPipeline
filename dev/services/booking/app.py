"""
Booking Service - Main Application

Handles booking creation, inventory locking, cancellation, and refund logic.

Requirements: REQ-028 to REQ-037 (Booking & Payment)
             DR-03 (Inventory double-booking prevention)
Tasks: TASK-024, TASK-025, TASK-026, TASK-029, TASK-030, TASK-031
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, date

from shared.config import get_db, settings
from shared.models import Booking, BookingStatus, Hotel, Room, User
from shared.utils import InventoryLockManager, validate_date_range, generate_confirmation_id

from .schemas import (
    BookingCreateRequest,
    BookingResponse,
    BookingDetailResponse,
    CancelBookingRequest,
    PromoCodeRequest,
    PaginatedBookingResponse,
)


# Initialize FastAPI app
app = FastAPI(
    title="Booking Service",
    description="Booking and reservation management service",
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
    return {"service": "booking", "status": "running", "version": "1.0.0"}


@app.post("/api/v1/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(request: BookingCreateRequest, db: Session = Depends(get_db)):
    """
    Create booking draft with inventory locking.
    
    Requirements: REQ-028 (Room selection), REQ-029 (Special requests)
                 DR-03 (Inventory double-booking prevention)
    Tasks: TASK-026, TASK-025
    """
    # Validate date range
    is_valid, error_message = validate_date_range(request.check_in_date, request.check_out_date)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    # Verify hotel exists
    hotel = db.query(Hotel).filter(Hotel.id == request.hotel_id, Hotel.is_active == True).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Verify room exists
    room = db.query(Room).filter(Room.id == request.room_id, Room.is_active == True).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check room availability (real-time check)
    num_nights = (request.check_out_date - request.check_in_date).days
    
    # Count existing confirmed bookings for this room and date range
    overlapping_bookings = db.query(Booking).filter(
        and_(
            Booking.room_id == request.room_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT, BookingStatus.DRAFT]),
            Booking.check_in_date < request.check_out_date,
            Booking.check_out_date > request.check_in_date,
        )
    ).count()
    
    if overlapping_bookings >= room.total_rooms:
        raise HTTPException(status_code=409, detail="Room not available for selected dates")
    
    # Acquire Redis distributed lock (DR-03)
    lock_key = InventoryLockManager.acquire_lock(
        hotel_id=request.hotel_id,
        room_id=request.room_id,
        check_in_date=str(request.check_in_date),
        check_out_date=str(request.check_out_date),
        booking_id=0,  # Will be updated after booking is created
        user_id=request.user_id,
    )
    
    if not lock_key:
        raise HTTPException(status_code=409, detail="Room no longer available (locked by another user)")
    
    # Calculate pricing
    total_base_price = room.base_price * num_nights
    taxes = total_base_price * 0.10  # 10% tax
    service_fee = total_base_price * 0.05  # 5% service fee
    discount = 0.0  # TODO: Apply promo code discount (TASK-031)
    total_price = total_base_price + taxes + service_fee - discount
    
    # Generate confirmation ID
    confirmation_id = generate_confirmation_id()
    
    # Create booking draft
    new_booking = Booking(
        confirmation_id=confirmation_id,
        user_id=request.user_id,
        hotel_id=request.hotel_id,
        room_id=request.room_id,
        check_in_date=request.check_in_date,
        check_out_date=request.check_out_date,
        num_nights=num_nights,
        num_guests=request.num_guests,
        guest_first_name=request.guest_first_name,
        guest_last_name=request.guest_last_name,
        guest_email=request.guest_email,
        guest_phone=request.guest_phone,
        special_requests=request.special_requests,
        base_price=room.base_price,
        total_base_price=total_base_price,
        taxes=taxes,
        service_fee=service_fee,
        discount=discount,
        total_price=total_price,
        status=BookingStatus.DRAFT,
        inventory_lock_key=lock_key,
        inventory_locked_at=datetime.utcnow(),
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return BookingResponse(
        id=new_booking.id,
        confirmation_id=new_booking.confirmation_id,
        user_id=new_booking.user_id,
        hotel_id=new_booking.hotel_id,
        room_id=new_booking.room_id,
        check_in_date=new_booking.check_in_date,
        check_out_date=new_booking.check_out_date,
        num_nights=new_booking.num_nights,
        num_guests=new_booking.num_guests,
        total_price=new_booking.total_price,
        status=new_booking.status.value,
        created_at=new_booking.created_at,
    )


@app.get("/api/v1/bookings/{booking_id}", response_model=BookingDetailResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """
    Get booking details by ID.
    
    Requirements: REQ-038, REQ-039 (View bookings)
    Task: TASK-017
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get hotel and room details
    hotel = db.query(Hotel).filter(Hotel.id == booking.hotel_id).first()
    room = db.query(Room).filter(Room.id == booking.room_id).first()
    
    return BookingDetailResponse(
        id=booking.id,
        confirmation_id=booking.confirmation_id,
        user_id=booking.user_id,
        hotel_id=booking.hotel_id,
        hotel_name=hotel.name if hotel else None,
        room_id=booking.room_id,
        room_type=room.room_type if room else None,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        num_nights=booking.num_nights,
        num_guests=booking.num_guests,
        guest_first_name=booking.guest_first_name,
        guest_last_name=booking.guest_last_name,
        guest_email=booking.guest_email,
        guest_phone=booking.guest_phone,
        special_requests=booking.special_requests,
        base_price=booking.base_price,
        total_base_price=booking.total_base_price,
        taxes=booking.taxes,
        service_fee=booking.service_fee,
        discount=booking.discount,
        total_price=booking.total_price,
        status=booking.status.value,
        created_at=booking.created_at,
        confirmed_at=booking.confirmed_at,
    )


@app.get("/api/v1/users/{user_id}/bookings", response_model=PaginatedBookingResponse)
def list_user_bookings(
    user_id: int,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    List user bookings with filters.
    
    Requirements: REQ-008, REQ-038, REQ-039 (Booking history)
    Task: TASK-017
    """
    query = db.query(Booking).filter(Booking.user_id == user_id)
    
    # Filter by status
    if status:
        try:
            status_enum = BookingStatus(status)
            query = query.filter(Booking.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid booking status")
    
    # Get total count
    total = query.count()
    
    # Paginate
    bookings = query.order_by(Booking.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedBookingResponse(
        bookings=[
            BookingResponse(
                id=b.id,
                confirmation_id=b.confirmation_id,
                user_id=b.user_id,
                hotel_id=b.hotel_id,
                room_id=b.room_id,
                check_in_date=b.check_in_date,
                check_out_date=b.check_out_date,
                num_nights=b.num_nights,
                num_guests=b.num_guests,
                total_price=b.total_price,
                status=b.status.value,
                created_at=b.created_at,
            )
            for b in bookings
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@app.post("/api/v1/bookings/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(booking_id: int, db: Session = Depends(get_db)):
    """
    Confirm booking after successful payment.
    
    Requirements: REQ-035 (Booking confirmation)
    Task: TASK-029
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != BookingStatus.PENDING_PAYMENT:
        raise HTTPException(status_code=400, detail="Booking is not in pending payment status")
    
    # Update booking status
    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_at = datetime.utcnow()
    
    # Release Redis lock
    if booking.inventory_lock_key:
        InventoryLockManager.release_lock(booking.inventory_lock_key)
    
    db.commit()
    db.refresh(booking)
    
    # TODO: Publish booking_confirmed event to SQS (triggers notification)
    
    return BookingResponse(
        id=booking.id,
        confirmation_id=booking.confirmation_id,
        user_id=booking.user_id,
        hotel_id=booking.hotel_id,
        room_id=booking.room_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        num_nights=booking.num_nights,
        num_guests=booking.num_guests,
        total_price=booking.total_price,
        status=booking.status.value,
        created_at=booking.created_at,
    )


@app.post("/api/v1/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: int, request: CancelBookingRequest, db: Session = Depends(get_db)):
    """
    Cancel booking with refund calculation.
    
    Requirements: REQ-036, REQ-040 (Booking cancellation)
    Task: TASK-030
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.PENDING_CONFIRMATION]:
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")
    
    # Get hotel cancellation policy
    hotel = db.query(Hotel).filter(Hotel.id == booking.hotel_id).first()
    
    # Calculate refund based on cancellation policy
    refund_amount = 0.0
    days_until_checkin = (booking.check_in_date - date.today()).days
    
    if hotel.cancellation_policy.value == "free_cancellation":
        # Full refund if cancelled 24+ hours before check-in
        if days_until_checkin >= 1:
            refund_amount = booking.total_price
    elif hotel.cancellation_policy.value == "moderate":
        # 50% refund if cancelled 7+ days before check-in
        if days_until_checkin >= 7:
            refund_amount = booking.total_price * 0.5
    elif hotel.cancellation_policy.value == "strict":
        # No refund after booking
        refund_amount = 0.0
    elif hotel.cancellation_policy.value == "non_refundable":
        # No refund
        refund_amount = 0.0
    
    # Update booking status
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    booking.cancellation_reason = request.reason
    booking.refund_amount = refund_amount
    
    db.commit()
    db.refresh(booking)
    
    # TODO: Trigger refund via Payment Service (TASK-030)
    # TODO: Publish booking_cancelled event to SQS (triggers notification)
    
    return BookingResponse(
        id=booking.id,
        confirmation_id=booking.confirmation_id,
        user_id=booking.user_id,
        hotel_id=booking.hotel_id,
        room_id=booking.room_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        num_nights=booking.num_nights,
        num_guests=booking.num_guests,
        total_price=booking.total_price,
        status=booking.status.value,
        created_at=booking.created_at,
    )


@app.post("/api/v1/bookings/{booking_id}/renew-lock")
def renew_lock(booking_id: int, db: Session = Depends(get_db)):
    """
    Renew inventory lock (extend lock duration).
    
    Requirements: DR-03 (Lock renewal for long payment flows)
    Task: TASK-025
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not booking.inventory_lock_key:
        raise HTTPException(status_code=400, detail="No active lock for this booking")
    
    # Renew lock (extend by 5 minutes)
    renewed = InventoryLockManager.renew_lock(booking.inventory_lock_key)
    
    if not renewed:
        raise HTTPException(status_code=410, detail="Lock has expired")
    
    return {"message": "Lock renewed successfully", "lock_key": booking.inventory_lock_key}


@app.post("/api/v1/bookings/{booking_id}/apply-promo")
def apply_promo_code(booking_id: int, request: PromoCodeRequest, db: Session = Depends(get_db)):
    """
    Apply promo code to booking.
    
    Requirements: REQ-031 (Promo/discount code)
    Task: TASK-031
    """
    # TODO: Implement promo code validation and discount calculation
    # TODO: Check promo code expiry, usage limit, minimum booking amount
    
    return {"message": "Promo code application (stub implementation)"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
