# app.py
from flask import Flask, send_file, jsonify
import os
import socket
import threading
import backendIndex
import sys
from typing import Tuple, List

app = Flask(__name__)

# Helper: locate resources both in normal env and when frozen (PyInstaller)
def resource_path(relative_path: str) -> str:
    """
    Return an absolute path to a resource. If running from a PyInstaller bundle,
    sys._MEIPASS is used. Otherwise uses the current working directory.
    """
    try:
        base_path = sys._MEIPASS  # type: ignore[attr-defined]
    except AttributeError:
        base_path = os.path.abspath('.')
    return os.path.join(base_path, relative_path)


# ---- Routes (use resource_path so bundled apps find files) ----
@app.route('/')  # Index
def home():
    path = resource_path('index.html')
    if os.path.exists(path):
        return send_file(path)
    return "index.html not found", 404
@app.route('/Ranking')  # Index
def ranking():
    path = resource_path('ranking.html')
    if os.path.exists(path):
        return send_file(path)
    return "ranking.html not found", 404
@app.route('/Matches')  # Matches page
def matches():
    path = resource_path('matches.html')
    if os.path.exists(path):
        return send_file(path)
    return "matches.html not found", 404


@app.route('/teams')  # Teams page
def teams():
    path = resource_path('teams.html')
    if os.path.exists(path):
        return send_file(path)
    return "teams.html not found", 404


# Index backend
@app.route('/index_ranking_list')
def IndexRankingList():
    # backendIndex.YoinkEventRankings() should return JSON-serializable object
    try:
        return jsonify(backendIndex.YoinkEventRankings())
    except Exception:
        # If backend returns a pre-built response or string, fall back
        return backendIndex.YoinkEventRankings()


@app.route('/index_matches')
def IndexMatches():
    try:
        return jsonify(backendIndex.YoinkEventMatches())
    except Exception:
        return backendIndex.YoinkEventMatches()


@app.route('/index_TBASite')
def IndexTBASite():
    # Keep behavior similar to your previous code: return a string representation
    try:
        return str(backendIndex.YoinkTBAPage())
    except Exception:
        return "TBA page unavailable", 500


# Matches backend
@app.route('/match_matchesList')
def MatchMatches():
    return jsonify(backendIndex.YoinkEventMatches())


@app.route('/match_matches')
def MatchEventPayload():
    return backendIndex.YoinkEventMatchBreakdown()


# Teams backend
@app.route('/teams_ranking_list')
def TeamsRankingList():
    return backendIndex.YoinkEventRankings()


# Assets
@app.route('/CORELogo')
def ReturnAssest_CORELOGO():
    path = resource_path('CORELogo.png')
    if os.path.exists(path):
        # explicit mimetype helps in some packaging environments
        return send_file(path, mimetype='image/png')
    return "CORELogo.png not found", 404


# -----------------------
# Binding utilities (kept from your original)
# -----------------------
def _discover_candidate_hosts() -> list:
    """
    Return an ordered list of hosts to try.
    Order:
      1. PREFERRED_HOSTS env (comma-separated)
      2. 0.0.0.0
      3. 127.0.0.1
      4. primary outbound IP (best-effort)
      5. socket.gethostbyname_ex(...) results
    """
    seen = []

    def add(h):
        if h and h not in seen:
            seen.append(h)

    pref = os.environ.get('PREFERRED_HOSTS')
    if pref:
        for part in (p.strip() for p in pref.split(',')):
            add(part)

    add('0.0.0.0')
    add('127.0.0.1')

    # primary outbound IP (best-effort)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # doesn't actually send data
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
        add(local_ip)
    except Exception:
        pass

    # host name addresses
    try:
        _, _, addrs = socket.gethostbyname_ex(socket.gethostname())
        for a in addrs:
            add(a)
    except Exception:
        pass

    return seen


def _is_bindable(host: str, port: int) -> bool:
    """
    Try to bind a temporary socket to (host, port) to test availability.
    Returns True if bind succeeded (then closes socket).
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind((host, port))
        s.listen(1)
        s.close()
        return True
    except OSError:
        try:
            s.close()
        except Exception:
            pass
        return False


def find_available_host_port(start_port: int, max_tries: int = 50) -> Tuple[str, int]:
    """
    Return (host, port) the first pair that is bindable. Raises RuntimeError if none found.
    """
    hosts = _discover_candidate_hosts()
    if not hosts:
        raise RuntimeError("No candidate hosts discovered for binding.")

    for host in hosts:
        for offset in range(max_tries):
            port = start_port + offset
            # skip privileged ports on non-root if port < 1024
            if port < 1024 and os.geteuid() != 0 if hasattr(os, 'geteuid') else False:
                # not allowed to bind privileged ports; skip
                continue

            if _is_bindable(host, port):
                return host, port
    raise RuntimeError(
        f"Unable to bind any of the candidate hosts on ports {start_port}..{start_port + max_tries - 1}"
    )

# -----------------------
# Server control API (module-level)
# -----------------------
_server_state = {
    "host": None,
    "port": None,
    "thread": None,
    "running_in_background": False
}


def _flask_runner(host: str, port: int, debug_mode: bool):
    """
    Internal helper target for thread-based server runs.
    """
    # debug_mode is already a bool; ensure reloader is off for background runs.
    app.run(host=host, port=port, debug=debug_mode, use_reloader=False)


def run(background: bool = True, start_port: int = None, max_tries: int = None, debug: bool = None):
    """
    Start the Flask server.

    - background=True -> start server in a daemon thread and return immediately.
    - background=False -> blocking call, runs in current thread (like normal Flask).

    Optional overrides:
      start_port  - port to start probing from (default: env PORT or 5000)
      max_tries   - how many port attempts to try (default: env MAX_TRIES or 50)
      debug       - True/False to set Flask debug mode (default: read FLASK_DEBUG env or True)
    """
    # defaults from environment (same behavior as your original script)
    if start_port is None:
        start_port = int(os.environ.get('PORT', '5000'))
    if max_tries is None:
        max_tries = int(os.environ.get('MAX_TRIES', '50'))
    if debug is None:
        debug = bool(os.environ.get('FLASK_DEBUG', '1'))

    # Try to find an available host/port
    try:
        host, port = find_available_host_port(start_port, max_tries)
    except RuntimeError as exc:
        # fallback to requested port and allow Flask to raise if unavailable
        host, port = '0.0.0.0', start_port

    # store info for GrabCurrentURL
    _server_state["host"] = host
    _server_state["port"] = port
    _server_state["running_in_background"] = bool(background)

    if background:
        thread = threading.Thread(target=_flask_runner, args=(host, port, debug), daemon=True)
        thread.start()
        _server_state["thread"] = thread
        # print minimal info (keeps parity with your previous prints)
        print(f"Flask started in background on host={host} port={port} (debug={debug})")
        return {"host": host, "port": port, "background": True}
    else:
        # blocking call: run in current thread
        print(f"Starting Flask (blocking) on host={host} port={port} (debug={debug})")
        _flask_runner(host, port, debug)
        return {"host": host, "port": port, "background": False}


def GrabCurrentURL() -> List[str]:
    """
    Return a list of candidate URLs to access the running server.
    If the server hasn't been started yet, returns an empty list.
    Useful results:
      - if host == '0.0.0.0' -> returns http://127.0.0.1:port/ plus other local addresses discovered
      - otherwise -> returns http://{host}:{port}/ and http://127.0.0.1:{port}/ (if appropriate)
    """
    host = _server_state.get("host")
    port = _server_state.get("port")
    if not host or not port:
        return []

    urls = []
    if host == '0.0.0.0':
        urls.append(f"http://127.0.0.1:{port}/")
        # also add local network IPs discovered
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
            s.close()
            if local_ip:
                urls.append(f"http://{local_ip}:{port}/")
        except Exception:
            pass
    else:
        urls.append(f"http://{host}:{port}/")
        # add loopback too if different
        if host != '127.0.0.1':
            urls.append(f"http://127.0.0.1:{port}/")

    # remove duplicates and return
    seen = []
    for u in urls:
        if u not in seen:
            seen.append(u)
    return seen


# If executed as a script, run blocking (original behavior)
if __name__ == '__main__':
    import os

    # --- AppImage recursion guard ---
    # During internal AppImage stages ARGV0 != APPIMAGE
    # We only want to run the server when the user actually launches the app
    is_appimage_internal = (
        os.environ.get("APPIMAGE") and
        os.environ.get("ARGV0") != os.environ.get("APPIMAGE")
    )

    if not is_appimage_internal:
        # Print backend diagnostics
        try:
            print(backendIndex.YoinkMostRecentEventKey())
        except Exception as e:
            print("Warning: YoinkMostRecentEventKey() failed:", e)

        try:
            print(backendIndex.YoinkEventRankings())
        except Exception as e:
            print("Warning: YoinkEventRankings() failed:", e)

        # Start server normally
        run(background=False)
