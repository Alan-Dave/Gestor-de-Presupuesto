"""
Accounts API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import AccountCreate, AccountUpdate, AccountRead
from app.services import account_service

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.get("/", response_model=list[AccountRead])
def list_accounts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all accounts for the current user."""
    return account_service.get_accounts(db, user.id)


@router.post("/", response_model=AccountRead, status_code=201)
def create(
    data: AccountCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new account."""
    return account_service.create_account(db, user, data)


@router.get("/{account_id}", response_model=AccountRead)
def get_account(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific account."""
    return account_service.get_account(db, user.id, account_id)


@router.put("/{account_id}", response_model=AccountRead)
def update(
    account_id: int,
    data: AccountUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an account."""
    return account_service.update_account(db, user.id, account_id, data)


@router.delete("/{account_id}", status_code=204)
def delete(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an account and its transactions."""
    account_service.delete_account(db, user.id, account_id)
