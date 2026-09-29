from pathlib import Path
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        echo=False,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to database successfully using {db_url.split('@')[-1] if '@' in db_url else 'local db'}")
except Exception as e:
    backend_dir = Path(__file__).resolve().parent.parent.parent
    sqlite_path = (backend_dir / "techno_club.db").as_posix()
    fallback_url = f"sqlite:///{sqlite_path}"
    logger.warning(f"Could not connect to configured DATABASE_URL ({db_url}): {e}. Falling back to SQLite local database at {fallback_url}.")
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
