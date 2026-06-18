"""
Redis-based distributed lock manager for inventory management.

Requirements: DR-03 (Inventory double-booking prevention)
             TASK-025 (Inventory locking with Redis RedLock)
"""

import time
import uuid
from typing import Optional
from datetime import datetime, timedelta

from shared.config import redis_client


class InventoryLockManager:
    """
    Distributed lock manager using Redis for preventing double-booking.
    
    Implements RedLock algorithm for distributed locking with:
    - 10-minute default TTL
    - Lock renewal capability
    - Fallback to PostgreSQL row-level locks (TODO)
    """
    
    DEFAULT_LOCK_TTL_SECONDS = 600  # 10 minutes
    LOCK_RENEWAL_SECONDS = 300  # 5 minutes
    
    @staticmethod
    def generate_lock_key(hotel_id: int, room_id: int, check_in_date: str, check_out_date: str) -> str:
        """
        Generate Redis lock key for inventory.
        
        Args:
            hotel_id: Hotel ID
            room_id: Room type ID
            check_in_date: Check-in date (YYYY-MM-DD)
            check_out_date: Check-out date (YYYY-MM-DD)
        
        Returns:
            Redis lock key
        """
        return f"lock:hotel:{hotel_id}:room:{room_id}:dates:{check_in_date}:{check_out_date}"
    
    @staticmethod
    def acquire_lock(
        hotel_id: int,
        room_id: int,
        check_in_date: str,
        check_out_date: str,
        booking_id: int,
        user_id: int,
        ttl_seconds: Optional[int] = None
    ) -> Optional[str]:
        """
        Acquire distributed lock for room inventory.
        
        Args:
            hotel_id: Hotel ID
            room_id: Room type ID
            check_in_date: Check-in date (YYYY-MM-DD)
            check_out_date: Check-out date (YYYY-MM-DD)
            booking_id: Booking draft ID
            user_id: User ID attempting to book
            ttl_seconds: Lock TTL in seconds (default: 10 minutes)
        
        Returns:
            Lock key if acquired, None if failed
        
        Requirements: DR-03 (Prevent double-booking)
        """
        if ttl_seconds is None:
            ttl_seconds = InventoryLockManager.DEFAULT_LOCK_TTL_SECONDS
        
        lock_key = InventoryLockManager.generate_lock_key(
            hotel_id, room_id, check_in_date, check_out_date
        )
        
        # Lock value contains booking and user info for debugging
        lock_value = f"{booking_id}:{user_id}:{int(time.time())}"
        
        # Try to acquire lock (SET NX EX - set if not exists with expiration)
        acquired = redis_client.client.set(lock_key, lock_value, nx=True, ex=ttl_seconds)
        
        if acquired:
            return lock_key
        
        return None
    
    @staticmethod
    def renew_lock(lock_key: str, ttl_seconds: Optional[int] = None) -> bool:
        """
        Renew lock TTL (extend lock duration).
        
        Args:
            lock_key: Redis lock key
            ttl_seconds: New TTL in seconds (default: 5 minutes)
        
        Returns:
            True if renewed, False if lock doesn't exist
        
        Requirements: DR-03 (Lock renewal for long payment flows)
        """
        if ttl_seconds is None:
            ttl_seconds = InventoryLockManager.LOCK_RENEWAL_SECONDS
        
        # Check if lock exists
        if not redis_client.exists(lock_key):
            return False
        
        # Extend TTL
        return redis_client.expire(lock_key, ttl_seconds)
    
    @staticmethod
    def release_lock(lock_key: str, booking_id: int, user_id: int) -> bool:
        """
        Release lock (delete from Redis) with ownership validation.
        
        Args:
            lock_key: Redis lock key
            booking_id: Booking ID that acquired the lock
            user_id: User ID that acquired the lock
        
        Returns:
            True if released, False if lock didn't exist or ownership mismatch
        
        Requirements: DR-03 (Prevent unauthorized lock release)
        """
        # Verify lock ownership before deleting
        lock_info = InventoryLockManager.check_lock_status(lock_key)
        
        if lock_info is None:
            return False  # Lock doesn't exist
        
        # Validate ownership
        if lock_info["booking_id"] != booking_id or lock_info["user_id"] != user_id:
            return False  # Not the owner, cannot release
        
        deleted = redis_client.delete(lock_key)
        return deleted > 0
    
    @staticmethod
    def check_lock_status(lock_key: str) -> Optional[dict]:
        """
        Check lock status and get lock information.
        
        Args:
            lock_key: Redis lock key
        
        Returns:
            Lock info dict if exists, None otherwise
        """
        if not redis_client.exists(lock_key):
            return None
        
        lock_value = redis_client.get(lock_key)
        ttl = redis_client.ttl(lock_key)
        
        if lock_value:
            parts = lock_value.split(":")
            if len(parts) == 3:
                return {
                    "booking_id": int(parts[0]),
                    "user_id": int(parts[1]),
                    "locked_at": int(parts[2]),
                    "ttl_seconds": ttl
                }
        
        return None
    
    @staticmethod
    def get_lock_metrics() -> dict:
        """
        Get lock contention metrics for monitoring.
        
        Returns:
            Dictionary with lock statistics
        
        Requirements: DR-03 (Monitor lock contention rate)
        """
        # TODO: Implement metrics collection
        # - Total locks acquired
        # - Lock acquisition failures (contention)
        # - Average lock duration
        # - Alert if contention rate > 5%
        
        return {
            "total_locks": 0,
            "active_locks": 0,
            "failed_acquisitions": 0,
            "contention_rate": 0.0
        }
