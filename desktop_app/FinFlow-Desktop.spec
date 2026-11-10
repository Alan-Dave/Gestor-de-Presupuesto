# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

# Base path
desktop_dir = Path.cwd() / "desktop_app"
backend_dir = Path.cwd() / "backend"

datas = [
    (str(backend_dir / "app"), "app"),
]

hidden_imports = [
    "PyQt6",
    "PyQt6.QtCore",
    "PyQt6.QtGui",
    "PyQt6.QtWidgets",
    "sqlalchemy",
    "sqlalchemy.sql.default_comparator",
    "passlib",
    "passlib.handlers.bcrypt",
    "bcrypt",
    "jose",
    "cryptography",
    "dateutil",
]
hidden_imports += collect_submodules("app")
hidden_imports += collect_submodules("ui")

a = Analysis(
    [str(desktop_dir / "main.py")],
    pathex=[str(desktop_dir), str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib"],
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
    name="FinFlow-Desktop",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
