"""
Pydantic schemas for Payment Service request/response models.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class PaymentCreateRequest(BaseModel):
    """Create payment request."""
    booking_id: int
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    payment_method: str = Field(..., pattern="^(credit_card|debit_card|paypal|google_pay|apple_pay)$")
    payment_provider: str = Field(..., pattern="^(stripe|paypal)$")
    
    # Tokenized payment method (PCI DSS compliant)
    card_token: Optional[str] = None
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    
    # Idempotency
    idempotency_key: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response model."""
    id: int
    booking_id: int
    amount: float
    currency: str
    payment_method: str
    status: str
    provider_payment_id: Optional[str]
    created_at: datetime


class RefundRequest(BaseModel):
    """Refund request."""
    amount: float = Field(..., gt=0)
    reason: Optional[str] = None


class RefundResponse(BaseModel):
    """Refund response model."""
    payment_id: int
    refund_amount: float
    total_refunded: float
    status: str
    refunded_at: datetime
