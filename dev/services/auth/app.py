"""
Authentication Service - Main Application

Handles user authentication, registration, and token management.

Requirements: REQ-001 to REQ-005 (Authentication)
             NFR-009 (JWT authentication)
Tasks: TASK-011, TASK-012, TASK-013, TASK-014
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from shared.config import get_db, settings
from shared.models import User, Session as UserSession, AuthProvider
from shared.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    validate_email,
    validate_phone,
    validate_password_strength,
)

from .schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SocialAuthRequest,
)


# Initialize FastAPI app
app = FastAPI(
    title="Auth Service",
    description="Authentication and user management service",
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
    return {"service": "auth", "status": "running", "version": "1.0.0"}


@app.post("/api/v1/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register new user via email or phone.
    
    Requirements: REQ-001 (Email registration), REQ-002 (Phone registration)
    Task: TASK-011
    """
    # Validate email or phone
    if request.email:
        if not validate_email(request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if request.phone:
        if not validate_phone(request.phone):
            raise HTTPException(status_code=400, detail="Invalid phone format")
        
        # Check if phone already exists
        existing_user = db.query(User).filter(User.phone == request.phone).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Phone already registered")
    
    # Validate password strength
    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    # Hash password (bcrypt with cost factor 12)
    password_hash = hash_password(request.password)
    
    # Create user
    new_user = User(
        email=request.email,
        phone=request.phone,
        password_hash=password_hash,
        first_name=request.first_name,
        last_name=request.last_name,
        auth_provider=AuthProvider.EMAIL if request.email else AuthProvider.PHONE,
        is_verified=False,  # TODO: Send verification email/SMS
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT tokens
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    # Create session
    session = UserSession(
        user_id=new_user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days),
        device_info=request.device_info,
    )
    db.add(session)
    db.commit()
    
    # TODO: Send verification email/SMS (TASK-011)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            phone=new_user.phone,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            is_verified=new_user.is_verified,
        ),
    )


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email/phone and password.
    
    Requirements: REQ-001, REQ-002 (Login)
    Task: TASK-013
    """
    # Find user by email or phone
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    elif request.phone:
        user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Verify password
    if not user.password_hash or not verify_password(request.password, user.password_hash):
        # TODO: Implement rate limiting (5 failed attempts → 15-min lockout)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    
    # Generate JWT tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Create new session
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days),
        device_info=request.device_info,
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            is_verified=user.is_verified,
        ),
    )


@app.post("/api/v1/auth/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    
    Requirements: NFR-009 (JWT token rotation)
    Task: TASK-013
    """
    # Verify refresh token
    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user_id = int(payload.get("sub"))
    
    # Find session by refresh token
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_token,
        UserSession.is_active == True,
    ).first()
    
    if not session or session.is_expired():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update session with new refresh token
    session.refresh_token = new_refresh_token
    session.expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
    session.last_activity_at = datetime.utcnow()
    db.commit()
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            is_verified=user.is_verified,
        ),
    )


@app.post("/api/v1/auth/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):
    """
    Logout user (invalidate session).
    
    Task: TASK-013
    """
    # Find and deactivate session
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_token,
        UserSession.is_active == True,
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
    
    return {"message": "Logged out successfully"}


@app.post("/api/v1/auth/social", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def social_auth(request: SocialAuthRequest, db: Session = Depends(get_db)):
    """
    OAuth login/registration with Google or Facebook.
    
    Requirements: REQ-003 (Google auth), REQ-004 (Facebook auth)
    Task: TASK-012
    """
    # TODO: Verify OAuth token with provider (Google/Facebook API)
    # For now, this is a stub implementation
    
    if request.provider not in ["google", "facebook"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    # Check if user already exists with this social ID
    user = db.query(User).filter(User.social_id == request.social_id).first()
    
    if user:
        # Existing user - login
        user.last_login_at = datetime.utcnow()
    else:
        # New user - create account
        user = User(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            profile_picture_url=request.profile_picture_url,
            auth_provider=AuthProvider.GOOGLE if request.provider == "google" else AuthProvider.FACEBOOK,
            social_id=request.social_id,
            is_verified=True,  # Social accounts are pre-verified
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Generate JWT tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Create session
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days),
    )
    db.add(session)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user=UserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            is_verified=user.is_verified,
        ),
    )


@app.post("/api/v1/auth/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset (send OTP via email/SMS).
    
    Requirements: REQ-005 (Password recovery)
    Task: TASK-014
    """
    # Find user
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    elif request.phone:
        user = db.query(User).filter(User.phone == request.phone).first()
    
    # Always return success (don't reveal if user exists)
    if not user:
        return {"message": "If the account exists, a reset code has been sent"}
    
    # TODO: Generate OTP and send via SendGrid (email) or Twilio (SMS)
    # TODO: Store OTP in Redis with 10-minute expiration
    # TODO: Implement rate limiting (3 attempts per user per hour)
    
    return {"message": "Password reset code sent"}


@app.post("/api/v1/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using OTP.
    
    Requirements: REQ-005 (Password recovery)
    Task: TASK-014
    """
    # TODO: Verify OTP from Redis
    # TODO: Check OTP expiration (10 minutes)
    
    # Find user
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    elif request.phone:
        user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate new password
    is_valid, error_message = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    # Update password
    user.password_hash = hash_password(request.new_password)
    db.commit()
    
    # Invalidate all sessions (force re-login)
    db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})
    db.commit()
    
    return {"message": "Password reset successful"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
