"""
Currencies API: list supported currencies.
"""
from fastapi import APIRouter

from app.core.currencies import list_currencies
from app.schemas.schemas import CurrencyRead

router = APIRouter(prefix="/api/currencies", tags=["Currencies"])


@router.get("/", response_model=list[CurrencyRead])
def get_currencies():
    """Get all supported currencies (public endpoint, no auth required)."""
    return list_currencies()
