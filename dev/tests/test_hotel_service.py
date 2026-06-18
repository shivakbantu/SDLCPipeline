"""
Hotel Service Tests

Covers REQ-020 to REQ-027 (Hotel Details & Information)
Tests TASK-016, TASK-017, TASK-018
"""

import pytest
from datetime import date, timedelta


class TestHotelCRUD:
    """Test hotel CRUD operations - REQ-047"""
    
    def test_get_hotel_details_success(self, hotel_client, test_hotel):
        """
        AC: Given user on hotel details page
            When page loads
            Then hotel information with photos and amenities is displayed
        """
        response = hotel_client.get(f"/api/hotels/{test_hotel.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_hotel.id
        assert data["name"] == "Test Grand Hotel"
        assert data["star_rating"] == 4
        assert "amenities" in data
        assert len(data["amenities"]) > 0
    
    def test_get_nonexistent_hotel_fails(self, hotel_client):
        """Nonexistent hotel should return 404"""
        response = hotel_client.get("/api/hotels/99999")
        assert response.status_code == 404
    
    def test_list_hotels_success(self, hotel_client, test_hotel):
        """List all hotels"""
        response = hotel_client.get("/api/hotels")
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0


class TestRoomManagement:
    """Test room management - REQ-022, REQ-048"""
    
    def test_get_room_types_with_pricing(self, hotel_client, test_hotel, test_room):
        """
        AC: Given user on hotel details page
            When viewing room options
            Then all room types with prices and availability are shown
        """
        response = hotel_client.get(f"/api/hotels/{test_hotel.id}/rooms")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        room = data[0]
        assert "room_type" in room
        assert "price_per_night" in room
        assert "max_guests" in room
        assert "amenities" in room
    
    def test_check_room_availability(self, hotel_client, test_hotel, test_room):
        """Check room availability for dates"""
        check_in = date.today() + timedelta(days=7)
        check_out = check_in + timedelta(days=2)
        
        response = hotel_client.get(
            f"/api/hotels/{test_hotel.id}/availability",
            params={
                "check_in_date": check_in.isoformat(),
                "check_out_date": check_out.isoformat(),
                "guests": 2,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "available_rooms" in data


class TestHotelSearch:
    """Test hotel search functionality - REQ-009 to REQ-019"""
    
    def test_basic_hotel_search(self, hotel_client, test_hotel):
        """
        AC: Given user on search page
            When they enter destination, dates, guests
            Then matching hotels are displayed
        """
        check_in = date.today() + timedelta(days=7)
        check_out = check_in + timedelta(days=2)
        
        response = hotel_client.get("/api/hotels/search", params={
            "city": "Test City",
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "guests": 2,
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_search_with_price_filter(self, hotel_client):
        """
        AC: Given search results displayed
            When user sets min/max price
            Then only hotels within price range are shown
        """
        response = hotel_client.get("/api/hotels/search", params={
            "city": "Test City",
            "min_price": 100,
            "max_price": 200,
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all results are within price range
        for hotel in data.get("items", []):
            if "min_price" in hotel:
                assert 100 <= hotel["min_price"] <= 200
    
    def test_search_with_star_rating_filter(self, hotel_client):
        """
        AC: Given search results displayed
            When user selects star rating
            Then only hotels matching rating criteria are shown
        """
        response = hotel_client.get("/api/hotels/search", params={
            "city": "Test City",
            "min_rating": 4,
        })
        
        assert response.status_code == 200
        data = response.json()
        
        for hotel in data.get("items", []):
            assert hotel["star_rating"] >= 4
    
    def test_search_with_amenities_filter(self, hotel_client):
        """
        AC: Given search results displayed
            When user selects amenities
            Then only hotels with selected amenities are shown
        """
        response = hotel_client.get("/api/hotels/search", params={
            "city": "Test City",
            "amenities": "WiFi,Pool",
        })
        
        assert response.status_code == 200
    
    def test_sort_by_price(self, hotel_client):
        """
        AC: Given search results displayed
            When user selects price sort
            Then hotels are reordered accordingly
        """
        response = hotel_client.get("/api/hotels/search", params={
            "city": "Test City",
            "sort": "price_asc",
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify ascending price order
        prices = [h.get("min_price", 0) for h in data.get("items", [])]
        assert prices == sorted(prices)


class TestHotelPolicies:
    """Test hotel policy display - REQ-026, REQ-027"""
    
    def test_cancellation_policy_display(self, hotel_client, test_hotel):
        """
        AC: Given user on hotel details page
            When viewing booking terms
            Then clear cancellation policy is displayed
        """
        response = hotel_client.get(f"/api/hotels/{test_hotel.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "cancellation_policy" in data
        assert len(data["cancellation_policy"]) > 0
    
    def test_checkin_checkout_times_display(self, hotel_client, test_hotel):
        """
        AC: Given user on hotel details page
            When viewing property policies
            Then check-in and check-out times are clearly stated
        """
        response = hotel_client.get(f"/api/hotels/{test_hotel.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "check_in_time" in data
        assert "check_out_time" in data
        assert data["check_in_time"] == "14:00"
        assert data["check_out_time"] == "11:00"
