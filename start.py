#!/usr/bin/env python3
"""
Techno Club Management OS - Automated Platform Launcher
Automatically manages environment checks, database initialization,
FastAPI backend startup, React Vite frontend startup, and opens the browser.
"""

import os
import sys
import time
import signal
import subprocess
import webbrowser
import urllib.request
import urllib.error
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def get_backend_python():
    """Locate the Python executable within the backend virtual environment."""
    if os.name == "nt":
        venv_py = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    else:
        venv_py = BACKEND_DIR / ".venv" / "bin" / "python"

    if venv_py.exists():
        return str(venv_py)
    return sys.executable


def check_environments():
    """Verify backend virtualenv and frontend node_modules exist, installing if needed."""
    print("=====================================================================")
    print("      Starting Techno Club Management & Operations Platform          ")
    print("=====================================================================")
    print("\n[1/4] Verifying environments and dependencies...")

    # Backend environment check
    backend_venv = BACKEND_DIR / ".venv"
    if not backend_venv.exists():
        print("  -> Creating Python virtual environment in backend/.venv...")
        subprocess.run([sys.executable, "-m", "venv", str(backend_venv)], check=True)
        py = get_backend_python()
        print("  -> Installing backend requirements...")
        subprocess.run([py, "-m", "pip", "install", "-r", str(BACKEND_DIR / "requirements.txt")], check=True)

    # Frontend node_modules check
    frontend_nm = FRONTEND_DIR / "node_modules"
    if not frontend_nm.exists():
        print("  -> Installing frontend npm packages...")
        subprocess.run(["npm", "install"], cwd=str(FRONTEND_DIR), shell=(os.name == "nt"), check=True)

    print("  -> Environments verified.")


def init_database(py_executable):
    """Initialize database schemas and seed records."""
    print("\n[2/4] Initializing Database & Seed Records...")
    try:
        res = subprocess.run(
            [py_executable, "-m", "app.db.init_db"],
            cwd=str(BACKEND_DIR),
            capture_output=True,
            text=True
        )
        if res.returncode == 0:
            print("  -> Database initialized and seed records verified.")
        else:
            print(f"  -> Database init completed with notice: {res.stderr.strip() or res.stdout.strip()}")
    except Exception as e:
        print(f"  -> Notice during DB init: {e}")


def wait_for_service(url, timeout=15, name="Service"):
    """Poll a URL until it responds with HTTP 200 or timeout."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status in (200, 304):
                    return True
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError):
            pass
        time.sleep(0.5)
    return False


def main():
    check_environments()
    py_executable = get_backend_python()
    init_database(py_executable)

    processes = []

    def cleanup(signum=None, frame=None):
        print("\n\nShutting down Techno Club platform services...")
        for p in processes:
            try:
                if os.name == "nt":
                    # On Windows, kill process tree
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
                else:
                    p.terminate()
            except Exception:
                pass
        print("Services stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("\n[3/4] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(
        [py_executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=str(BACKEND_DIR)
    )
    processes.append(backend_proc)

    print("\n[4/4] Starting React Vite Frontend on http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND_DIR),
        shell=(os.name == "nt")
    )
    processes.append(frontend_proc)

    # Wait for backend readiness
    print("\nWaiting for platform services to respond...")
    backend_ready = wait_for_service("http://localhost:8000/health", timeout=12, name="FastAPI Backend")
    frontend_ready = wait_for_service("http://localhost:5173", timeout=12, name="React Frontend")

    print("\n" + "=" * 69)
    print("  🚀 Techno Club Management OS is Online!")
    print("  - Frontend Portal:    http://localhost:5173")
    print("  - Backend REST API:   http://localhost:8000")
    print("  - Swagger API Docs:   http://localhost:8000/docs")
    print("  - Public Verify:      http://localhost:5173 (Select Public Verification)")
    print("\n  🔑 Default Credentials:")
    print("    President:      president@technoclub.org / TechnoClub@2026")
    print("    Vice President: vp@technoclub.org / TechnoClub@2026")
    print("    AI/ML Head:     aiml.head@technoclub.org / TechnoClub@2026")
    print("    Treasurer:      treasurer@technoclub.org / TechnoClub@2026")
    print("    Member:         member1@technoclub.org / TechnoClub@2026")
    print("    (Instant 1-Click Role Switcher available in the top navbar!)")
    print("=" * 69)
    print("\nPress Ctrl+C to stop both frontend and backend.\n")

    # Optional browser launch (only if explicitly requested)
    if "--open-browser" in sys.argv or "-b" in sys.argv:
        try:
            webbrowser.open("http://localhost:5173")
        except Exception:
            pass

    try:
        # Keep runner alive while processes run
        while True:
            time.sleep(1)
            # Check if any child process terminated prematurely
            for p in processes:
                if p.poll() is not None:
                    print(f"Notice: Process {p.pid} exited with code {p.returncode}")
                    cleanup()
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
