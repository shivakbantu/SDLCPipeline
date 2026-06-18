"""
Redis client configuration for caching and distributed locking.

Requirements: NFR-001 (Caching), DR-03 (Inventory locking)
"""

import redis
from redis.connection import ConnectionPool
from typing import Optional
import warnings

from .settings import settings


class RedisClient:
    """Redis client wrapper with connection pooling."""
    
    def __init__(self):
        """Initialize Redis connection pool (optional - only if Redis URL is configured)."""
        self.pool: Optional[ConnectionPool] = None
        self._client: Optional[redis.Redis] = None
        self._enabled = bool(settings.redis_url)
        
        if self._enabled:
            try:
                self.pool = ConnectionPool.from_url(
                    str(settings.redis_url),
                    max_connections=settings.redis_max_connections,
                    decode_responses=True
                )
            except Exception as e:
                warnings.warn(f"Redis connection failed: {e}. Redis features will be disabled.")
                self._enabled = False
    
    @property
    def client(self) -> Optional[redis.Redis]:
        """Get Redis client instance (lazy initialization)."""
        if not self._enabled:
            return None
        
        if self._client is None and self.pool is not None:
            try:
                self._client = redis.Redis(connection_pool=self.pool)
            except Exception as e:
                warnings.warn(f"Redis client creation failed: {e}")
                self._enabled = False
                return None
        return self._client
    
    @property
    def is_enabled(self) -> bool:
        """Check if Redis is enabled and available."""
        return self._enabled and self.client is not None
    
    def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        if not self.is_enabled:
            return None
        return self.client.get(key)
    
    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """
        Set value in Redis.
        
        Args:
            key: Redis key
            value: Value to store
            ex: Expiration time in seconds
        """
        if not self.is_enabled:
            return False
        return self.client.set(key, value, ex=ex)
    
    def delete(self, key: str) -> int:
        """Delete key from Redis."""
        if not self.is_enabled:
            return 0
        return self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        """Check if key exists in Redis."""
        if not self.is_enabled:
            return False
        return self.client.exists(key) > 0
    
    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration time for key."""
        if not self.is_enabled:
            return False
        return self.client.expire(key, seconds)
    
    def ttl(self, key: str) -> int:
        """Get remaining TTL for key in seconds."""
        if not self.is_enabled:
            return -1
        return self.client.ttl(key)
    
    def incr(self, key: str, amount: int = 1) -> int:
        """Increment integer value."""
        if not self.is_enabled:
            return 0
        return self.client.incr(key, amount)
    
    def decr(self, key: str, amount: int = 1) -> int:
        """Decrement integer value."""
        if not self.is_enabled:
            return 0
        return self.client.decr(key, amount)
    
    def close(self):
        """Close Redis connection."""
        if self._client:
            self._client.close()


# Global Redis client instance (gracefully handles missing Redis)
redis_client = RedisClient()
