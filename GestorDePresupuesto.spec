# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller Spec file for Gestor de Presupuesto (FinFlow).
Bundles the FastAPI backend, SQLite models, and built React frontend into a single standalone Windows executable.
"""
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

ROOT_DIR = Path(SPECPATH).resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

# Collect all backend dependencies and dynamic imports
hidden_imports = [
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "fastapi",
    "starlette",
    "pydantic",
    "sqlalchemy",
    "sqlalchemy.sql.default_comparator",
    "sqlalchemy.dialects.sqlite",
    "sqlite3",
    "passlib",
    "passlib.handlers.bcrypt",
    "bcrypt",
    "jose",
    "cryptography",
    "dateutil",
]
hidden_imports += collect_submodules("app")

# Collect datas: include frontend dist files inside the bundle
datas = []
if FRONTEND_DIST.exists():
    datas.append((str(FRONTEND_DIST), "frontend/dist"))

datas += collect_data_files("app")

a = Analysis(
    [str(BACKEND_DIR / "desktop_app.py")],
    pathex=[str(BACKEND_DIR), str(ROOT_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "notebook"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="GestorDePresupuesto",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Windowed desktop application
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(FRONTEND_DIST / "favicon.ico") if (FRONTEND_DIST / "favicon.ico").exists() else None,
)
