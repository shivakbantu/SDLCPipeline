"""
Payment model for payment transactions and refunds.

Requirements: REQ-032 to REQ-034 (Payment methods)
             NFR-007 (PCI DSS compliance)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
import enum

from shared.config import Base


class PaymentStatus(str, enum.Enum):
    """Payment transaction status."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(str, enum.Enum):
    """Payment method types."""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    GOOGLE_PAY = "google_pay"
    APPLE_PAY = "apple_pay"
    PAY_AT_HOTEL = "pay_at_hotel"


class PaymentProvider(str, enum.Enum):
    """Payment gateway providers."""
    STRIPE = "stripe"
    PAYPAL = "paypal"


class Payment(Base):
    """
    Payment transaction model.
    
    Stores payment details for bookings. Card details are tokenized
    via Stripe/PayPal (PCI DSS compliant - NFR-007).
    """
    __tablename__ = "payments"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to bookings table
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Payment information
    amount = Column(Float, nullable=False)  # Amount in USD
    currency = Column(String(3), default="USD", nullable=False)
    
    # Payment method
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    payment_provider = Column(SQLEnum(PaymentProvider), nullable=False)
    
    # Payment gateway details
    provider_payment_id = Column(String(255), unique=True, nullable=True, index=True)  # Stripe charge ID or PayPal transaction ID
    provider_payment_intent_id = Column(String(255), nullable=True)  # Stripe PaymentIntent ID
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)  # Prevent duplicate charges
    
    # Tokenized payment method (PCI DSS compliant)
    payment_method_token = Column(String(255), nullable=True)  # Stripe payment method token
    
    # Card details (for display only, no full card number)
    card_last4 = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)  # e.g., "visa", "mastercard"
    card_exp_month = Column(Integer, nullable=True)
    card_exp_year = Column(Integer, nullable=True)
    
    # Payment status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    
    # Refund information
    refunded_amount = Column(Float, default=0.0, nullable=False)
    refund_reason = Column(Text, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    succeeded_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Relationship
    booking = relationship("Booking", back_populates="payment")
    
    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, booking_id={self.booking_id}, amount=${self.amount}, status={self.status})>"


class SavedPaymentMethod(Base):
    """
    Saved payment method model for user profiles.
    
    Stores tokenized payment methods for quick checkout (REQ-007).
    """
    __tablename__ = "saved_payment_methods"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to users table
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment method type
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    payment_provider = Column(SQLEnum(PaymentProvider), nullable=False)
    
    # Tokenized payment method (PCI DSS compliant)
    payment_method_token = Column(String(255), nullable=False)
    
    # Card details (for display only)
    card_last4 = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)
    card_exp_month = Column(Integer, nullable=True)
    card_exp_year = Column(Integer, nullable=True)
    
    # Status
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="payment_methods")
    
    def __repr__(self) -> str:
        return f"<SavedPaymentMethod(id={self.id}, user_id={self.user_id}, card_last4={self.card_last4})>"
