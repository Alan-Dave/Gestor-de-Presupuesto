"""
Transactions API endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    TransactionCreate,
    TransactionClassify,
    TransactionReassign,
    TransactionRead,
    TransferCreate,
)
from app.services import transaction_service

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


def _enrich(tx) -> dict:
    """Add account name and color to transaction for frontend display."""
    data = TransactionRead.model_validate(tx).model_dump()
    data["account_name"] = tx.account.name if tx.account else None
    data["account_color"] = tx.account.color if tx.account else None
    return data


@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    status: str | None = Query(None),
    category: str | None = Query(None),
    type: str | None = Query(None),
    account_id: int | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List transactions with optional filters."""
    txs = transaction_service.get_transactions(
        db, user.id,
        status_filter=status,
        category_filter=category,
        type_filter=type,
        account_id=account_id,
        limit=limit,
        offset=offset,
    )
    return [_enrich(tx) for tx in txs]


@router.get("/pending", response_model=list[TransactionRead])
def list_pending(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all pending transactions."""
    txs = transaction_service.get_pending_transactions(db, user.id)
    return [_enrich(tx) for tx in txs]


@router.post("/ingest", response_model=TransactionRead, status_code=201)
def ingest(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ingest a new transaction (with auto-classification attempt)."""
    tx = transaction_service.ingest_transaction(db, user, data)
    return _enrich(tx)


@router.put("/{transaction_id}/classify", response_model=TransactionRead)
def classify(
    transaction_id: int,
    data: TransactionClassify,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually classify a pending transaction."""
    tx = transaction_service.classify_transaction(db, user, transaction_id, data)
    return _enrich(tx)


@router.put("/{transaction_id}/reassign", response_model=TransactionRead)
def reassign(
    transaction_id: int,
    data: TransactionReassign,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reassign a transaction to another account."""
    tx = transaction_service.reassign_transaction_account(db, user, transaction_id, data.account_id)
    return _enrich(tx)


@router.post("/transfer", response_model=list[TransactionRead], status_code=201)
def transfer(
    data: TransferCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an internal transfer between accounts."""
    tx_out, tx_in = transaction_service.create_transfer(db, user, data)
    return [_enrich(tx_out), _enrich(tx_in)]
