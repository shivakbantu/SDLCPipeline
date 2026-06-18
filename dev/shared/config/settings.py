"""
Configuration management using Pydantic Settings.
Loads configuration from environment variables.

Requirements: NFR-020 (Maintainability), NFR-010 (Security)
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    # Application
    app_name: str = "Hotel Booking Platform"
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Database (SQLite default for easy development)
    database_url: str = Field(default="sqlite:///./hotel_booking.db", env="DATABASE_URL")
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")
    
    # Redis (optional for development)
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    redis_max_connections: int = Field(default=50, env="REDIS_MAX_CONNECTIONS")
    
    # Elasticsearch (optional for development)
    elasticsearch_url: Optional[str] = Field(default=None, env="ELASTICSEARCH_URL")
    elasticsearch_index_hotels: str = Field(default="hotels", env="ES_INDEX_HOTELS")
    
    # JWT Authentication
    jwt_secret_key: str = Field(default="dev-secret-key-CHANGE-IN-PRODUCTION", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=15, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Password Hashing
    password_bcrypt_rounds: int = Field(default=12, env="PASSWORD_BCRYPT_ROUNDS")
    
    # AWS (optional - for development/testing)
    aws_region: str = Field(default="us-east-1", env="AWS_REGION")
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    s3_bucket_name: str = Field(default="hotel-booking-dev", env="S3_BUCKET_NAME")
    
    # Payment Gateway - Stripe (optional for development)
    stripe_secret_key: str = Field(default="sk_test_placeholder", env="STRIPE_SECRET_KEY")
    stripe_publishable_key: str = Field(default="pk_test_placeholder", env="STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    
    # Payment Gateway - PayPal (optional for development)
    paypal_client_id: str = Field(default="paypal_client_id_placeholder", env="PAYPAL_CLIENT_ID")
    paypal_client_secret: str = Field(default="paypal_secret_placeholder", env="PAYPAL_CLIENT_SECRET")
    paypal_mode: str = Field(default="sandbox", env="PAYPAL_MODE")  # sandbox or live
    
    # Notifications - SendGrid (optional for development)
    sendgrid_api_key: str = Field(default="sendgrid_api_key_placeholder", env="SENDGRID_API_KEY")
    sendgrid_from_email: str = Field(default="noreply@hotelbooking.com", env="SENDGRID_FROM_EMAIL")
    
    # Notifications - Twilio (optional for development)
    twilio_account_sid: str = Field(default="twilio_sid_placeholder", env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="twilio_token_placeholder", env="TWILIO_AUTH_TOKEN")
    twilio_phone_number: str = Field(default="+1234567890", env="TWILIO_PHONE_NUMBER")
    
    # Notifications - Firebase Cloud Messaging (optional for development)
    fcm_server_key: str = Field(default="fcm_server_key_placeholder", env="FCM_SERVER_KEY")
    
    # OAuth - Google (optional for development)
    google_client_id: str = Field(default="google_client_id_placeholder", env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="google_secret_placeholder", env="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(default="http://localhost:8001/auth/callback/google", env="GOOGLE_REDIRECT_URI")
    
    # OAuth - Facebook (optional for development)
    facebook_app_id: str = Field(default="facebook_app_id_placeholder", env="FACEBOOK_APP_ID")
    facebook_app_secret: str = Field(default="facebook_secret_placeholder", env="FACEBOOK_APP_SECRET")
    facebook_redirect_uri: str = Field(default="http://localhost:8001/auth/callback/facebook", env="FACEBOOK_REDIRECT_URI")
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = Field(default=60, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    rate_limit_login_attempts: int = Field(default=5, env="RATE_LIMIT_LOGIN_ATTEMPTS")
    rate_limit_login_lockout_minutes: int = Field(default=15, env="RATE_LIMIT_LOGIN_LOCKOUT_MINUTES")
    
    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
        env="CORS_ORIGINS"
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra fields in .env file (JIRA, TestRail, etc.)
    )


# Global settings instance
settings = Settings()
