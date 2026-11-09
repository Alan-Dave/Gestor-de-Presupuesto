"""
Installments API router.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    InstallmentCreate,
    InstallmentUpdate,
    InstallmentRead,
    InstallmentSummary,
)
from app.services import installment_service

router = APIRouter(prefix="/api/installments", tags=["Installments"])


@router.get("/", response_model=list[InstallmentRead])
def list_installments(
    status: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all installments with optional status filter (ACTIVE, COMPLETED)."""
    return installment_service.get_installments(db, user.id, status_filter=status)


@router.get("/summary", response_model=InstallmentSummary)
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get overall summary of user installments debt and monthly commitments."""
    return installment_service.get_installment_summary(db, user.id)


@router.get("/{installment_id}", response_model=InstallmentRead)
def get_installment(
    installment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single installment detail."""
    return installment_service.get_installment(db, user.id, installment_id)


@router.post("/", response_model=InstallmentRead, status_code=status.HTTP_201_CREATED)
def create_installment(
    data: InstallmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new installment tracker."""
    return installment_service.create_installment(db, user, data)


@router.put("/{installment_id}", response_model=InstallmentRead)
def update_installment(
    installment_id: int,
    data: InstallmentUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an installment tracker (e.g. adjust paid installments, amounts)."""
    return installment_service.update_installment(db, user, installment_id, data)


@router.post("/{installment_id}/pay-next", response_model=InstallmentRead)
def pay_next_installment(
    installment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Advance one paid installment for this debt."""
    return installment_service.increment_installment(db, user.id, installment_id)


@router.delete("/{installment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_installment(
    installment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an installment tracker."""
    installment_service.delete_installment(db, user.id, installment_id)
