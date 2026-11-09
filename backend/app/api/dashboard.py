"""
Dashboard API: aggregated KPI metrics for the main view.
"""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.db.database import get_db
from app.core.security import get_current_user
from app.core.currencies import get_currency
from app.models.models import User, Account, Transaction
from app.schemas.schemas import DashboardMetrics
from app.services.budget_service import get_budget_summary
from app.services.transaction_service import get_transaction_count
from app.services.installment_service import get_installment_summary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated dashboard metrics."""
    today = date.today()

    # Total balance across all accounts
    total_balance = (
        db.query(func.coalesce(func.sum(Account.current_balance), 0.0))
        .filter(Account.user_id == user.id)
        .scalar()
    )

    # Liquid balance: only accounts that are genuinely liquid (excluding credit cards and term savings)
    liquid_balance = (
        db.query(func.coalesce(func.sum(Account.current_balance), 0.0))
        .filter(
            Account.user_id == user.id,
            Account.type.in_(["checking", "vista", "rut", "wallet"])
        )
        .scalar()
    )

    # Total pending amount (pending expenses that will impact balance once classified)
    pending_amount = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .join(Account)
        .filter(
            Account.user_id == user.id,
            Transaction.status == "PENDING",
            Transaction.type == "EXPENSE"
        )
        .scalar()
    )

    # Total income this month
    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .join(Account)
        .filter(
            Account.user_id == user.id,
            Transaction.type == "INCOME",
            extract("year", Transaction.transaction_date) == today.year,
            extract("month", Transaction.transaction_date) == today.month,
        )
        .scalar()
    )

    # Total expenses this month
    total_expenses = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .join(Account)
        .filter(
            Account.user_id == user.id,
            Transaction.type == "EXPENSE",
            Transaction.status == "CLASSIFIED",
            extract("year", Transaction.transaction_date) == today.year,
            extract("month", Transaction.transaction_date) == today.month,
        )
        .scalar()
    )

    # Pending count
    pending_count = get_transaction_count(db, user.id, status_filter="PENDING")

    # Budget summaries
    budgets = get_budget_summary(db, user.id, today.year, today.month)

    # Accounts count
    accounts_count = db.query(Account).filter(Account.user_id == user.id).count()

    # Installment monthly commitment
    inst_summary = get_installment_summary(db, user.id)

    # Currency info
    currency = get_currency(user.currency_code)

    return DashboardMetrics(
        total_balance=float(total_balance),
        liquid_balance=float(liquid_balance),
        pending_amount=float(pending_amount),
        total_income_month=float(total_income),
        total_expenses_month=float(total_expenses),
        pending_count=pending_count,
        budget_summaries=budgets,
        accounts_count=accounts_count,
        currency_code=user.currency_code,
        currency_symbol=currency["symbol"] if currency else "$",
        active_installments_monthly=float(inst_summary.monthly_commitment),
    )
