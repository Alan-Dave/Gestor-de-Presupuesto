"""
Desktop launcher for Gestor de Presupuesto (FinFlow).
Starts uvicorn in a background thread and opens the webview / browser desktop window.
"""
import sys
import time
import socket
import threading
import webbrowser
import multiprocessing
from pathlib import Path

# Required for frozen executables (PyInstaller)
multiprocessing.freeze_support()

import uvicorn

# Adjust path to find app package properly
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.main import app


def find_free_port(start_port: int = 8000) -> int:
    """Find an available TCP port starting from start_port."""
    for port in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


def run_server(port: int):
    """Run uvicorn server programmatically."""
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="error",
        access_log=False,
    )


def wait_for_server(port: int, timeout: float = 10.0) -> bool:
    """Wait until the local server accepts connections."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def main():
    port = find_free_port(8000)

    # Start FastAPI server in daemon thread
    server_thread = threading.Thread(target=run_server, args=(port,), daemon=True)
    server_thread.start()

    # Wait for server to come online
    if not wait_for_server(port):
        print("Error: Could not start local backend server.")
        sys.exit(1)

    app_url = f"http://127.0.0.1:{port}"

    # Try to open with pywebview if installed, otherwise system browser
    opened_webview = False
    try:
        import webview
        webview.create_window(
            title="Gestor de Presupuesto — FinFlow",
            url=app_url,
            width=1280,
            height=850,
            min_size=(900, 600),
        )
        webview.start()
        opened_webview = True
    except Exception as e:
        print(f"Webview could not start ({e}), falling back to default browser...")

    if not opened_webview:
        webbrowser.open(app_url)
        # Keep process alive while user is using it
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
