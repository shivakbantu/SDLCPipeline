"""
Database Seed Script - Demo Data

Creates demo users and sample data for development and testing.

Run this script to populate the database with:
- Demo hotel owner account
- Demo super admin account
- Sample hotel data
- Sample room types

Usage:
    python seed_database.py
"""

import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from shared.config import SessionLocal, engine
from shared.models import User, Hotel, Room, Amenity, AuthProvider, Base, CancellationPolicy
from shared.utils.auth import hash_password


def seed_database():
    """Seed database with demo data."""
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if demo users already exist
        existing_owner = db.query(User).filter(User.email == "owner@grandhotel.com").first()
        existing_admin = db.query(User).filter(User.email == "admin@hotelplatform.com").first()
        
        if existing_owner and existing_admin:
            print("⚠ Demo users already exist. Skipping seed.")
            return
        
        print("\n🌱 Seeding database with demo data...")
        
        # ======================
        # 1. DEMO HOTEL OWNER
        # ======================
        if not existing_owner:
            print("\n📝 Creating demo hotel owner...")
            owner_password_hash = hash_password("demo1234")
            
            demo_owner = User(
                email="owner@grandhotel.com",
                phone="+1-555-0100",
                password_hash=owner_password_hash,
                first_name="John",
                last_name="Anderson",
                auth_provider=AuthProvider.EMAIL,
                role="hotel_owner",
                is_verified=True,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(demo_owner)
            db.flush()  # Get ID without committing
            
            # Create demo hotel for this owner
            print("  → Creating Grand Hotel...")
            demo_hotel = Hotel(
                owner_id=demo_owner.id,
                name="Grand Plaza Hotel",
                description="Luxury hotel in the heart of downtown with stunning city views, world-class amenities, and exceptional service.",
                address="123 Main Street",
                city="New York",
                state="NY",
                country="USA",
                postal_code="10001",
                latitude=40.7580,
                longitude=-73.9855,
                phone="+1-555-0100",
                email="info@grandplazahotel.com",
                star_rating=5,
                check_in_time="15:00",
                check_out_time="11:00",
                cancellation_policy=CancellationPolicy.FREE_CANCELLATION,
                is_verified=True,
                is_active=True,
                total_rooms=50,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(demo_hotel)
            db.flush()
            
            # Create sample room types
            print("  → Creating room types...")
            room_types = [
                {
                    "name": "Standard Room",
                    "description": "Comfortable room with queen bed, city view, and modern amenities",
                    "base_price": 150.00,
                    "max_guests": 2,
                    "total_rooms": 20,
                },
                {
                    "name": "Deluxe Room",
                    "description": "Spacious room with king bed, premium bedding, and sitting area",
                    "base_price": 220.00,
                    "max_guests": 3,
                    "total_rooms": 20,
                },
                {
                    "name": "Executive Suite",
                    "description": "Luxurious suite with separate living area, premium amenities, and panoramic views",
                    "base_price": 380.00,
                    "max_guests": 4,
                    "total_rooms": 10,
                },
            ]
            
            for room_data in room_types:
                room = Room(
                    hotel_id=demo_hotel.id,
                    room_type=room_data["name"],
                    description=room_data["description"],
                    base_price=room_data["base_price"],
                    max_guests=room_data["max_guests"],
                    total_rooms=room_data["total_rooms"],
                    num_beds=1 if room_data["max_guests"] <= 2 else 2,
                    bed_type="Queen" if room_data["max_guests"] <= 2 else "King",
                    size_sqm=30.0 if room_data["max_guests"] <= 2 else 45.0,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(room)
            
            print("  ✓ Demo hotel owner created")
            print(f"    Email: owner@grandhotel.com")
            print(f"    Password: demo1234")
        
        # ======================
        # 2. DEMO SUPER ADMIN
        # ======================
        if not existing_admin:
            print("\n🔐 Creating demo super admin...")
            admin_password_hash = hash_password("admin1234")
            
            demo_admin = User(
                email="admin@hotelplatform.com",
                phone="+1-555-9999",
                password_hash=admin_password_hash,
                first_name="Admin",
                last_name="Platform",
                auth_provider=AuthProvider.EMAIL,
                role="super_admin",
                is_verified=True,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(demo_admin)
            
            print("  ✓ Demo super admin created")
            print(f"    Email: admin@hotelplatform.com")
            print(f"    Password: admin1234")
        
        # ======================
        # 3. COMMIT ALL CHANGES
        # ======================
        db.commit()
        
        print("\n✅ Database seeding completed successfully!")
        print("\n" + "="*50)
        print("DEMO CREDENTIALS")
        print("="*50)
        print("\n🏨 Hotel Owner Panel (http://localhost:3001)")
        print("   Email: owner@grandhotel.com")
        print("   Password: demo1234")
        print("\n🛡️  Super Admin Panel (http://localhost:3002)")
        print("   Email: admin@hotelplatform.com")
        print("   Password: admin1234")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def clear_database():
    """Clear all data from database (use with caution!)."""
    print("\n⚠️  WARNING: This will delete ALL data from the database!")
    confirm = input("Type 'DELETE ALL' to confirm: ")
    
    if confirm == "DELETE ALL":
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped")
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Tables recreated")
        print("✅ Database cleared successfully")
    else:
        print("❌ Operation cancelled")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database seeding utility")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear all data before seeding (DESTRUCTIVE!)"
    )
    
    args = parser.parse_args()
    
    if args.clear:
        clear_database()
    
    seed_database()
