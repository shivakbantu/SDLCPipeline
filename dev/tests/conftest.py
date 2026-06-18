"""
Pytest Configuration and Fixtures

Sets up test environment, database, and shared fixtures.
"""

import pytest
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add dev directory to path
dev_dir = Path(__file__).parent.parent
sys.path.insert(0, str(dev_dir))

from shared.config.database import Base
from shared.models import User, Hotel, Room, Booking, AuthProvider, UserRole


@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    yield TestingSessionLocal
    
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db):
    """Create database session for each test"""
    session = test_db()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_user(db_session):
    """Create test user"""
    from shared.utils.auth import hash_password
    
    user = User(
        email="testuser@example.com",
        phone="+1234567890",
        password_hash=hash_password("TestPass123!"),
        first_name="Test",
        last_name="User",
        role=UserRole.CUSTOMER,
        email_verified=True,
        phone_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_hotel_owner(db_session):
    """Create test hotel owner"""
    from shared.utils.auth import hash_password
    
    owner = User(
        email="owner@hotel.com",
        password_hash=hash_password("OwnerPass123!"),
        first_name="Hotel",
        last_name="Owner",
        role=UserRole.HOTEL_OWNER,
        email_verified=True,
        is_active=True,
    )
    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)
    return owner


@pytest.fixture
def test_admin(db_session):
    """Create test admin user"""
    from shared.utils.auth import hash_password
    
    admin = User(
        email="admin@platform.com",
        password_hash=hash_password("AdminPass123!"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        email_verified=True,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def test_hotel(db_session, test_hotel_owner):
    """Create test hotel"""
    from shared.models import HotelStatus
    
    hotel = Hotel(
        name="Test Grand Hotel",
        description="Luxury hotel for testing",
        address="123 Test St",
        city="Test City",
        state="TS",
        country="Test Country",
        zip_code="12345",
        latitude=40.7128,
        longitude=-74.0060,
        star_rating=4,
        owner_id=test_hotel_owner.id,
        status=HotelStatus.ACTIVE,
        amenities=["WiFi", "Pool", "Gym", "Parking"],
        check_in_time="14:00",
        check_out_time="11:00",
        cancellation_policy="Free cancellation up to 24 hours before check-in",
    )
    db_session.add(hotel)
    db_session.commit()
    db_session.refresh(hotel)
    return hotel


@pytest.fixture
def test_room(db_session, test_hotel):
    """Create test room"""
    room = Room(
        hotel_id=test_hotel.id,
        room_type="Deluxe",
        description="Spacious deluxe room",
        price_per_night=150.00,
        max_guests=2,
        total_rooms=10,
        amenities=["King Bed", "WiFi", "TV", "Mini Bar"],
    )
    db_session.add(room)
    db_session.commit()
    db_session.refresh(room)
    return room


@pytest.fixture
def auth_client():
    """Create test client for auth service"""
    from services.auth.app import app
    return TestClient(app)


@pytest.fixture
def hotel_client():
    """Create test client for hotel service"""
    from services.hotel.app import app
    return TestClient(app)


@pytest.fixture
def booking_client():
    """Create test client for booking service"""
    from services.booking.app import app
    return TestClient(app)
