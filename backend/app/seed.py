from .config import get_settings
from .database import SessionLocal
from .models import User
from .security import hash_password


def seed_users() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
        db.add(User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            role="admin",
        ))
        db.add(User(
            username=settings.professor_username,
            password_hash=hash_password(settings.professor_password),
            role="professor",
        ))
        db.commit()
    finally:
        db.close()
