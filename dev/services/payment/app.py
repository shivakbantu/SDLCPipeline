"""
Payment Service - Main Application

Handles payment processing, refunds, and payment method management.

Requirements: REQ-032 to REQ-034 (Payment methods)
             NFR-007 (PCI DSS compliance)
Tasks: TASK-027, TASK-028
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from shared.config import get_db, settings
from shared.models import Payment, PaymentStatus, PaymentMethod, PaymentProvider

from .schemas import (
    PaymentCreateRequest,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
)


# Initialize FastAPI app
app = FastAPI(
    title="Payment Service",
    description="Payment processing and refund management service",
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
    return {"service": "payment", "status": "running", "version": "1.0.0"}


@app.post("/api/v1/payments/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(request: PaymentCreateRequest, db: Session = Depends(get_db)):
    """
    Process payment via Stripe or PayPal.
    
    Requirements: REQ-032 (Credit/debit card payment)
                 REQ-033 (Digital wallet payment)
                 NFR-007 (PCI DSS compliance)
    Tasks: TASK-027, TASK-028
    """
    # Generate idempotency key (prevent duplicate charges)
    idempotency_key = request.idempotency_key or str(uuid.uuid4())
    
    # Check if payment already exists with this idempotency key
    existing_payment = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
    if existing_payment:
        return PaymentResponse(
            id=existing_payment.id,
            booking_id=existing_payment.booking_id,
            amount=existing_payment.amount,
            currency=existing_payment.currency,
            payment_method=existing_payment.payment_method.value,
            status=existing_payment.status.value,
            provider_payment_id=existing_payment.provider_payment_id,
            created_at=existing_payment.created_at,
        )
    
    # Create payment record
    new_payment = Payment(
        booking_id=request.booking_id,
        amount=request.amount,
        currency=request.currency,
        payment_method=PaymentMethod(request.payment_method),
        payment_provider=PaymentProvider(request.payment_provider),
        idempotency_key=idempotency_key,
        status=PaymentStatus.PENDING,
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    # Process payment based on provider
    try:
        if request.payment_provider == "stripe":
            # TODO: Implement Stripe payment processing
            # - Create Stripe PaymentIntent
            # - Charge card via Stripe API
            # - Handle 3D Secure (3DS) for European cards
            # - Enable Stripe Radar fraud detection
            
            # Stub implementation
            provider_payment_id = f"ch_stripe_{uuid.uuid4().hex[:16]}"
            new_payment.provider_payment_id = provider_payment_id
            new_payment.status = PaymentStatus.SUCCEEDED
            new_payment.succeeded_at = datetime.utcnow()
            
            # Store tokenized card details (PCI DSS compliant)
            if request.card_token:
                new_payment.payment_method_token = request.card_token
                new_payment.card_last4 = request.card_last4
                new_payment.card_brand = request.card_brand
                new_payment.card_exp_month = request.card_exp_month
                new_payment.card_exp_year = request.card_exp_year
        
        elif request.payment_provider == "paypal":
            # TODO: Implement PayPal payment processing
            # - PayPal Express Checkout
            # - PayPal SDK integration
            
            # Stub implementation
            provider_payment_id = f"PAYPAL-{uuid.uuid4().hex[:16].upper()}"
            new_payment.provider_payment_id = provider_payment_id
            new_payment.status = PaymentStatus.SUCCEEDED
            new_payment.succeeded_at = datetime.utcnow()
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported payment provider")
        
        db.commit()
        db.refresh(new_payment)
        
        return PaymentResponse(
            id=new_payment.id,
            booking_id=new_payment.booking_id,
            amount=new_payment.amount,
            currency=new_payment.currency,
            payment_method=new_payment.payment_method.value,
            status=new_payment.status.value,
            provider_payment_id=new_payment.provider_payment_id,
            created_at=new_payment.created_at,
        )
    
    except Exception as e:
        # Payment failed
        new_payment.status = PaymentStatus.FAILED
        new_payment.error_message = str(e)
        db.commit()
        
        raise HTTPException(status_code=400, detail=f"Payment failed: {str(e)}")


@app.get("/api/v1/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Get payment details by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return PaymentResponse(
        id=payment.id,
        booking_id=payment.booking_id,
        amount=payment.amount,
        currency=payment.currency,
        payment_method=payment.payment_method.value,
        status=payment.status.value,
        provider_payment_id=payment.provider_payment_id,
        created_at=payment.created_at,
    )


@app.post("/api/v1/payments/{payment_id}/refund", response_model=RefundResponse)
def refund_payment(payment_id: int, request: RefundRequest, db: Session = Depends(get_db)):
    """
    Process refund for payment.
    
    Requirements: REQ-036, REQ-040 (Booking cancellation with refund)
    Task: TASK-030
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != PaymentStatus.SUCCEEDED:
        raise HTTPException(status_code=400, detail="Payment is not in succeeded status")
    
    # Validate refund amount
    max_refundable = payment.amount - payment.refunded_amount
    if request.amount > max_refundable:
        raise HTTPException(status_code=400, detail=f"Refund amount exceeds refundable amount (${max_refundable})")
    
    # Process refund based on provider
    try:
        if payment.payment_provider == PaymentProvider.STRIPE:
            # TODO: Implement Stripe refund
            # stripe.Refund.create(charge=payment.provider_payment_id, amount=...)
            pass
        
        elif payment.payment_provider == PaymentProvider.PAYPAL:
            # TODO: Implement PayPal refund
            pass
        
        # Update payment record
        payment.refunded_amount += request.amount
        payment.refund_reason = request.reason
        payment.refunded_at = datetime.utcnow()
        
        if payment.refunded_amount >= payment.amount:
            payment.status = PaymentStatus.REFUNDED
        else:
            payment.status = PaymentStatus.PARTIALLY_REFUNDED
        
        db.commit()
        db.refresh(payment)
        
        return RefundResponse(
            payment_id=payment.id,
            refund_amount=request.amount,
            total_refunded=payment.refunded_amount,
            status=payment.status.value,
            refunded_at=payment.refunded_at,
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Refund failed: {str(e)}")


@app.post("/api/v1/payments/webhook/stripe")
def stripe_webhook(db: Session = Depends(get_db)):
    """
    Stripe webhook handler for async payment status updates.
    
    Requirements: TASK-027 (Webhook handler)
    """
    # TODO: Verify Stripe webhook signature
    # TODO: Handle webhook events:
    #   - payment_intent.succeeded
    #   - payment_intent.failed
    #   - charge.refunded
    
    return {"message": "Webhook received (stub implementation)"}


@app.post("/api/v1/payments/webhook/paypal")
def paypal_webhook(db: Session = Depends(get_db)):
    """
    PayPal webhook handler for async payment status updates.
    
    Requirements: TASK-028 (PayPal integration)
    """
    # TODO: Verify PayPal webhook signature
    # TODO: Handle webhook events
    
    return {"message": "Webhook received (stub implementation)"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
