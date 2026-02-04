#!/usr/bin/env python3
"""
simple_browser_pywebview.py - importable minimal browser using pywebview.

Features:
 - Accepts full URLs (e.g. "http://172.30.34.172:5000/") or bare hosts ("192.168.1.5" or "myhost:8000").
 - Does NOT start on import. Call run(...) to start the browser.
 - If prompt_for_address is True and address is None, run() will ask via input().
 - run(blocking=False) starts the GUI in a child process (multiprocessing).
 - run(blocking=True) runs the GUI in the current process (blocking call).

Dependencies:
    pip install pywebview

On Linux you usually also need a system WebKit backend (libwebkit2gtk) and PyGObject
if pywebview chooses the GTK backend. If pywebview isn't available the module falls
back to using the system default browser via the webbrowser module.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
import multiprocessing
import re
import sys
import time
from urllib.parse import urlparse, urlunparse

# Local state container
@dataclass
class _State:
    last_url: Optional[str] = None
    _proc: Optional[multiprocessing.Process] = None
    _blocking: bool = False

_state = _State()

# ----------------- Validation / normalization -----------------
def _looks_like_full_url(s: str) -> bool:
    """True if s parses as a URL with scheme and netloc (e.g. http://host:port)."""
    try:
        p = urlparse(s)
        return bool(p.scheme) and bool(p.netloc)
    except Exception:
        return False


def _looks_like_host_or_hostport(s: str) -> bool:
    """Rudimentary check for host or host:port (IPv4, IPv6, or hostname)."""
    s = s.strip()
    if not s:
        return False
    # IPv4 or IPv6 bracket form or hostname with optional port
    if re.match(r'^\[?[0-9a-fA-F:\.]+\]?(?::\d+)?$', s):
        return True
    if re.match(r'^[A-Za-z0-9\-\._]+(?::\d+)?$', s):
        return True
    return False


def _normalize_to_url(address: str, default_port: int = 5000) -> str:
    """
    Convert an input into a full URL string.

    - If input is full URL (has scheme+netloc) -> return normalized URL.
    - If input is host or host:port -> return http://host:port/
    - Raises ValueError for invalid inputs.
    """
    if not address:
        raise ValueError("No address provided.")

    address = address.strip()
    if _looks_like_full_url(address):
        # Ensure it has a trailing slash for consistency
        p = urlparse(address)
        path = p.path if p.path else "/"
        normalized = urlunparse((p.scheme, p.netloc, path, '', '', ''))
        return normalized

    if _looks_like_host_or_hostport(address):
        # If address already contains :port, honor it; otherwise use default_port.
        # Handle IPv6 bracketed/unbracketed forms conservatively.
        if ":" in address and not address.startswith('['):
            host_part, port_part = address.rsplit(':', 1)
            if port_part.isdigit():
                return f"http://{host_part}:{port_part}/"
            else:
                # maybe it's an IPv6 without brackets; fall back to assuming no port
                return f"http://{address}:{default_port}/"
        # IPv6 without port might be like fe80::1 -> we should bracket it
        if ":" in address:  # likely IPv6
            return f"http://[{address}]:{default_port}/"
        # hostname or IPv4 without port
        return f"http://{address}:{default_port}/"

    raise ValueError(f"Unrecognized address format: {address}")

# ----------------- Public helpers -----------------
def GrabCurrentURL() -> Optional[str]:
    """Return the last URL used to start the browser, or None."""
    return _state.last_url


def stop(timeout: float = 2.0) -> bool:
    """Stop the background browser process (if any). Returns True if stopped or no process."""
    proc = _state._proc
    if proc is None:
        return True
    if not proc.is_alive():
        _state._proc = None
        return True
    proc.terminate()
    proc.join(timeout)
    alive = proc.is_alive()
    if not alive:
        _state._proc = None
    return not alive

# ----------------- pywebview GUI entry point -----------------
def _gui_process_entry(start_url: str, title: str = "Simple Browser"):
    """Entry point used when launching the GUI in a separate process.

    This function is intentionally minimal: it imports pywebview locally so the
    parent process does not need the dependency unless it actually starts the GUI.
    """
    try:
        import webview
    except Exception as exc:  # pragma: no cover - fallback in unusual envs
        # Fallback: open system browser if pywebview is not available.
        import webbrowser
        webbrowser.open(start_url)
        return

    # Create window and start webview in this process. webview.start() blocks.
    webview.create_window(title, start_url, width=1000, height=700)
    webview.start()


def _gui_main_entry(start_url: str, title: str = "Simple Browser"):
    """Run the GUI in the current (main) process. Behaves the same as the
    process entry but kept separate for clarity.
    """
    _gui_process_entry(start_url, title)

# ----------------- Public API: run -----------------
def run(prompt_for_address: bool = True,
        address: Optional[str] = None,
        port: int = 5000,
        blocking: bool = True,
        title: str = "Simple Browser",
        backend: str = "auto") -> dict:

    if prompt_for_address and not address:
        address = input("Enter address or URL: ").strip()

    url = _normalize_to_url(address, default_port=port)

    _state.last_url = url
    _state._blocking = bool(blocking)

    # Choose backend: prefer pywebview if available
    if backend == "auto":
        try:
            import webview  # type: ignore
            chosen = "pywebview"
        except Exception:
            chosen = "system"
    else:
        chosen = backend

    if chosen == "pywebview":
        entry = _gui_main_entry
    else:
        def entry(u=url, t=title):
            import webbrowser
            webbrowser.open(u)

    if blocking:
        entry(url, title)
        return {"url": url, "mode": "blocking", "pid": None, "backend": chosen}
    else:
        proc = multiprocessing.Process(target=_gui_process_entry if chosen == "pywebview" else entry,
                                       args=(url, title), daemon=True)
        proc.start()
        _state._proc = proc
        # give the process a tiny moment to start so callers can inspect pid etc.
        time.sleep(0.1)
        return {"url": url, "mode": "background", "pid": proc.pid, "backend": chosen}

# ----------------- CLI entry -----------------
def _cli_main(argv: Optional[List[str]] = None):
    import argparse
    parser = argparse.ArgumentParser(description="Simple Python Browser (importable module)")
    parser.add_argument("--address", "-a", default=None,
                        help='Full URL ("http://host:port/") or host ("192.168.1.5" or "host:8000"). If omitted, you will be prompted.')
    parser.add_argument("--port", "-p", type=int, default=5000, help="Port to use if address has no port")
    parser.add_argument("--background", "-b", action="store_true", help="Run in background (child process)")
    parser.add_argument("--backend", help="Backend to use: 'auto', 'pywebview' or 'system'", default="auto")
    args = parser.parse_args(argv or sys.argv[1:])
    run(prompt_for_address=(args.address is None), address=args.address, port=args.port, blocking=(not args.background), backend=args.backend)


if __name__ == "__main__":
    _cli_main()
