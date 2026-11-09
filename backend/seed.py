"""
Seed script: generates sample data for development/testing.
Run: python seed.py
"""
import sys
import os
import io

# Fix Windows console encoding for emoji
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ensure we can import the app
sys.path.insert(0, os.path.dirname(__file__))


from datetime import date, timedelta
from app.db.database import create_tables, SessionLocal
from app.models.models import User, Account, Transaction, Budget, CategorizationRule
from app.core.security import hash_password


def seed():
    """Populate the database with sample data."""
    create_tables()
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("⚠️  Database already has data. Skipping seed.")
        db.close()
        return

    print("🌱 Seeding database...")

    # ── User ──────────────────────────────────────────────────────
    user = User(
        email="demo@gestor.cl",
        username="Demo User",
        hashed_password=hash_password("demo123"),
        currency_code="CLP",
        locale="es-CL",
    )
    db.add(user)
    db.flush()

    # ── Accounts ──────────────────────────────────────────────────
    mercado_pago = Account(
        user_id=user.id,
        name="Mercado Pago",
        type="wallet",
        initial_balance=30000,
        current_balance=30000,
        currency_code="CLP",
        icon="wallet",
        color="#00bcff",
    )
    cuenta_corriente = Account(
        user_id=user.id,
        name="Cuenta Corriente",
        type="checking",
        initial_balance=450000,
        current_balance=450000,
        currency_code="CLP",
        icon="building",
        color="#6366f1",
    )
    efectivo = Account(
        user_id=user.id,
        name="Efectivo",
        type="wallet",
        initial_balance=15000,
        current_balance=15000,
        currency_code="CLP",
        icon="banknotes",
        color="#22c55e",
    )
    db.add_all([mercado_pago, cuenta_corriente, efectivo])
    db.flush()

    # ── Rules ─────────────────────────────────────────────────────
    rules = [
        CategorizationRule(user_id=user.id, keyword="Spotify", category="FIXED", priority=10),
        CategorizationRule(user_id=user.id, keyword="Netflix", category="FIXED", priority=10),
        CategorizationRule(user_id=user.id, keyword="Claro", category="FIXED", priority=10),
        CategorizationRule(user_id=user.id, keyword="Uber", category="PERSONAL", priority=5),
        CategorizationRule(user_id=user.id, keyword="Rappi", category="PERSONAL", priority=5),
        CategorizationRule(user_id=user.id, keyword="Supermercado", category="PERSONAL", priority=5),
    ]
    db.add_all(rules)
    db.flush()

    # ── Budgets (current month) ───────────────────────────────────
    today = date.today()
    budgets = [
        Budget(
            user_id=user.id, category="FIXED",
            monthly_limit=120000, annual_limit=1440000,
            year=today.year, month=today.month,
        ),
        Budget(
            user_id=user.id, category="PERSONAL",
            monthly_limit=200000, annual_limit=2400000,
            year=today.year, month=today.month,
        ),
        Budget(
            user_id=user.id, category="SAVINGS",
            monthly_limit=100000, annual_limit=1200000,
            year=today.year, month=today.month,
        ),
    ]
    db.add_all(budgets)
    db.flush()

    # ── Transactions ──────────────────────────────────────────────
    transactions = [
        # Incomes
        Transaction(
            account_id=cuenta_corriente.id, type="INCOME", status="CLASSIFIED",
            amount=850000, description="Sueldo Septiembre",
            transaction_date=today.replace(day=1),
        ),
        Transaction(
            account_id=mercado_pago.id, type="INCOME", status="CLASSIFIED",
            amount=45000, description="Freelance diseño web",
            transaction_date=today - timedelta(days=5),
        ),

        # Auto-classified expenses (matched by rules)
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="CLASSIFIED",
            category="FIXED", amount=5990, description="Spotify Premium",
            rule_id=rules[0].id, budget_id=budgets[0].id,
            transaction_date=today - timedelta(days=10),
        ),
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="CLASSIFIED",
            category="FIXED", amount=8990, description="Netflix Estándar",
            rule_id=rules[1].id, budget_id=budgets[0].id,
            transaction_date=today - timedelta(days=8),
        ),
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="CLASSIFIED",
            category="FIXED", amount=12990, description="Claro Plan Móvil",
            rule_id=rules[2].id, budget_id=budgets[0].id,
            transaction_date=today - timedelta(days=7),
        ),
        Transaction(
            account_id=mercado_pago.id, type="EXPENSE", status="CLASSIFIED",
            category="PERSONAL", amount=8500, description="Uber al trabajo",
            rule_id=rules[3].id, budget_id=budgets[1].id,
            transaction_date=today - timedelta(days=3),
        ),
        Transaction(
            account_id=mercado_pago.id, type="EXPENSE", status="CLASSIFIED",
            category="PERSONAL", amount=15200, description="Rappi - Almuerzo",
            rule_id=rules[4].id, budget_id=budgets[1].id,
            transaction_date=today - timedelta(days=2),
        ),
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="CLASSIFIED",
            category="PERSONAL", amount=62000, description="Supermercado Líder",
            rule_id=rules[5].id, budget_id=budgets[1].id,
            transaction_date=today - timedelta(days=4),
        ),

        # Pending transactions (need manual classification)
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="PENDING",
            amount=35000, description="Farmacia Ahumada",
            transaction_date=today - timedelta(days=1),
        ),
        Transaction(
            account_id=mercado_pago.id, type="EXPENSE", status="PENDING",
            amount=12000, description="Compra MercadoLibre",
            transaction_date=today,
        ),
        Transaction(
            account_id=efectivo.id, type="EXPENSE", status="PENDING",
            amount=4500, description="Estacionamiento Mall",
            transaction_date=today,
        ),
        Transaction(
            account_id=cuenta_corriente.id, type="EXPENSE", status="PENDING",
            amount=28000, description="Pago Dentista",
            transaction_date=today - timedelta(days=2),
        ),
        Transaction(
            account_id=efectivo.id, type="EXPENSE", status="PENDING",
            amount=7800, description="Restaurant La Plaza",
            transaction_date=today - timedelta(days=1),
        ),
    ]
    db.add_all(transactions)
    db.commit()

    # Recalculate balances
    from app.services.account_service import recalculate_balance
    for acc in [mercado_pago, cuenta_corriente, efectivo]:
        recalculate_balance(db, acc.id)

    db.close()

    print("✅ Seed complete!")
    print("   📧 Login: demo@gestor.cl / demo123")
    print(f"   💰 3 accounts, {len(rules)} rules, {len(budgets)} budgets, {len(transactions)} transactions")


if __name__ == "__main__":
    seed()
