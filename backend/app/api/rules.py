"""
Categorization Rules API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import RuleCreate, RuleUpdate, RuleRead
from app.services import rule_service

router = APIRouter(prefix="/api/rules", tags=["Rules"])


@router.get("/", response_model=list[RuleRead])
def list_rules(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all categorization rules."""
    return rule_service.get_rules(db, user.id)


@router.post("/", response_model=RuleRead, status_code=201)
def create(
    data: RuleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new rule."""
    return rule_service.create_rule(db, user, data)


@router.put("/{rule_id}", response_model=RuleRead)
def update(
    rule_id: int,
    data: RuleUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a rule."""
    return rule_service.update_rule(db, user.id, rule_id, data)


@router.delete("/{rule_id}", status_code=204)
def delete(
    rule_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a rule."""
    rule_service.delete_rule(db, user.id, rule_id)
