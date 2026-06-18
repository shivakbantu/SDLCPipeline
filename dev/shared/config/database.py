"""
Database connection and session management.

Requirements: NFR-006 (Database performance), NFR-011 (High availability)
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from .settings import settings


# Determine if using SQLite (which doesn't support pooling)
is_sqlite = settings.database_url.startswith("sqlite")

# Database engine with connection pooling (if not SQLite)
if is_sqlite:
    engine = create_engine(
        str(settings.database_url),
        connect_args={"check_same_thread": False},  # SQLite specific
        echo=settings.debug,  # Log SQL queries in debug mode
    )
else:
    engine = create_engine(
        str(settings.database_url),
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,  # Verify connections before using
        echo=settings.debug,  # Log SQL queries in debug mode
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session.
    Automatically closes session after request.
    
    Usage:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database session (for non-FastAPI code).
    
    Usage:
        with get_db_context() as db:
            user = db.query(User).first()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables (create all tables from models)."""
    Base.metadata.create_all(bind=engine)
