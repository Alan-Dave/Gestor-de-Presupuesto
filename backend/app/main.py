"""
FastAPI application entry point.
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.database import create_tables
from app.api import auth, accounts, transactions, budgets, rules, dashboard, currencies, email, installments

# ---------------------------------------------------------------------------
# Create app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Gestor de Presupuesto",
    description="API para gestión de presupuestos personales con control de liquidez por cuenta",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(rules.router)
app.include_router(dashboard.router)
app.include_router(currencies.router)
app.include_router(email.router)
app.include_router(installments.router)

# ---------------------------------------------------------------------------
# Static frontend serving (for desktop app bundle)
# ---------------------------------------------------------------------------
def _resolve_frontend_dist() -> Path | None:
    # Check if bundled with PyInstaller (_MEIPASS)
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        dist = Path(sys._MEIPASS) / "frontend" / "dist"
        if dist.exists():
            return dist
    # Check local relative paths
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "frontend" / "dist",
    ]
    for p in candidates:
        if p.exists() and (p / "index.html").exists():
            return p
    return None

frontend_dist = _resolve_frontend_dist()
if frontend_dist:
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if full_path and file_path.exists() and not file_path.is_dir():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        """Health check endpoint."""
        return {"status": "ok", "app": "Gestor de Presupuesto API"}
