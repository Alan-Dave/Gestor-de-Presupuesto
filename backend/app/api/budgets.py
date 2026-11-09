"""
Budget API endpoints.
"""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import BudgetCreate, BudgetUpdate, BudgetRead, BudgetSummary
from app.services import budget_service

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("/", response_model=list[BudgetRead])
def list_budgets(
    year: int | None = Query(None),
    month: int | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List budgets, optionally filtered by year/month."""
    return budget_service.get_budgets(db, user.id, year=year, month=month)


@router.post("/", response_model=BudgetRead, status_code=201)
def create(
    data: BudgetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a budget for a category/period."""
    return budget_service.create_budget(db, user, data)


@router.put("/{budget_id}", response_model=BudgetRead)
def update(
    budget_id: int,
    data: BudgetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update budget limits."""
    return budget_service.update_budget(db, user.id, budget_id, data)


@router.get("/summary", response_model=list[BudgetSummary])
def summary(
    year: int = Query(default=None),
    month: int = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get budget consumption summary for a given period."""
    today = date.today()
    y = year or today.year
    m = month or today.month
    return budget_service.get_budget_summary(db, user.id, y, m)
