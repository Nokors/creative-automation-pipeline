from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
from config import get_settings
from api.models import Base

settings = get_settings()

# Get database URL
database_url = settings.get_database_url()

# Create database engine with MySQL optimizations
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,  # Enable connection health checks
    "pool_recycle": 3600,   # Recycle connections after 1 hour
}

# Add MySQL-specific configurations
if "mysql" in database_url:
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
    })
elif "sqlite" in database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Create database engine
engine = create_engine(database_url, **engine_kwargs)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database tables initialized successfully")
    print(f"📊 Using database: {database_url.split('@')[-1] if '@' in database_url else 'SQLite'}")


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

