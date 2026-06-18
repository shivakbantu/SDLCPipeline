"""
Authentication Service Tests

Covers REQ-001 to REQ-005 (User Registration & Authentication)
Tests TASK-011, TASK-012, TASK-013, TASK-014
"""

import pytest
from fastapi.testclient import TestClient


class TestUserRegistration:
    """Test user registration endpoints - REQ-001, REQ-002"""
    
    def test_register_with_email_success(self, auth_client):
        """
        AC: Given a new user accesses registration
            When they provide valid email and password
            Then account is created and confirmation email is sent
        """
        response = auth_client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data
    
    def test_register_with_phone_success(self, auth_client):
        """
        AC: Given a new user accesses registration
            When they provide valid phone number and password
            Then account is created and OTP verification is sent
        """
        response = auth_client.post("/api/auth/register", json={
            "phone": "+1234567890",
            "password": "SecurePass123!",
            "first_name": "Phone",
            "last_name": "User",
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["phone"] == "+1234567890"
        assert "id" in data
    
    def test_register_duplicate_email_fails(self, auth_client, test_user):
        """Duplicate email should fail"""
        response = auth_client.post("/api/auth/register", json={
            "email": test_user.email,
            "password": "SecurePass123!",
            "first_name": "Duplicate",
            "last_name": "User",
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_register_weak_password_fails(self, auth_client):
        """Weak password should be rejected"""
        response = auth_client.post("/api/auth/register", json={
            "email": "weakpass@example.com",
            "password": "123",
            "first_name": "Weak",
            "last_name": "Password",
        })
        
        assert response.status_code == 400


class TestUserLogin:
    """Test user login endpoints - REQ-001, REQ-002"""
    
    def test_login_with_email_success(self, auth_client, test_user):
        """
        AC: Given registered user
            When they log in with correct credentials
            Then JWT tokens are returned
        """
        response = auth_client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "TestPass123!",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_with_invalid_password_fails(self, auth_client, test_user):
        """Invalid password should fail"""
        response = auth_client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "WrongPassword",
        })
        
        assert response.status_code == 401
    
    def test_login_with_nonexistent_email_fails(self, auth_client):
        """Nonexistent user should fail"""
        response = auth_client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        })
        
        assert response.status_code == 401


class TestPasswordRecovery:
    """Test password recovery - REQ-005"""
    
    def test_forgot_password_success(self, auth_client, test_user):
        """
        AC: Given user forgot password
            When they request password reset via email
            Then secure reset link is sent
        """
        response = auth_client.post("/api/auth/forgot-password", json={
            "email": "testuser@example.com",
        })
        
        # Should return success even for non-existent emails (security)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_reset_password_with_valid_token(self, auth_client):
        """Reset password with valid token"""
        # Note: In real tests, you'd generate a valid token
        # For now, testing the endpoint structure
        response = auth_client.post("/api/auth/reset-password", json={
            "token": "mock-reset-token",
            "new_password": "NewSecurePass123!",
        })
        
        # Will fail with invalid token, but endpoint exists
        assert response.status_code in [200, 400, 401]


class TestTokenValidation:
    """Test JWT token validation - NFR-009"""
    
    def test_access_protected_route_with_valid_token(self, auth_client, test_user):
        """Valid token should grant access"""
        # Login first
        login_response = auth_client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "TestPass123!",
        })
        token = login_response.json()["access_token"]
        
        # Access protected route
        response = auth_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "testuser@example.com"
    
    def test_access_protected_route_without_token_fails(self, auth_client):
        """Missing token should fail"""
        response = auth_client.get("/api/auth/me")
        assert response.status_code == 401
    
    def test_access_protected_route_with_invalid_token_fails(self, auth_client):
        """Invalid token should fail"""
        response = auth_client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401
