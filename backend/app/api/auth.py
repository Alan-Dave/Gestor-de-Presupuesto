"""
Auth API endpoints: register, login, current user.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserRead
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    return register_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and get access token."""
    return login_user(db, data)


@router.get("/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return user
