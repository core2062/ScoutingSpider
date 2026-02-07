#!/usr/bin/env python3
"""
Run helper for compiled app

Usage (positional):
  Compiledprogram.exe [YEAR] [EVENT_KEY] [TEAM]

Examples:
  Compiledprogram.exe 2025 2025miket 2062
  Compiledprogram.exe 2025 2025miket frc2062
  Compiledprogram.exe           # use defaults from backendIndex

Behavior:
 - YEAR is parsed as int if present.
 - EVENT_KEY is passed verbatim (e.g. '2025miket').
 - TEAM may be given as a number (e.g. '2062') or with 'frc' prefix; this script will ensure the team value stored in backendIndex.SelectedTeam has an 'frc' prefix when appropriate so tbapy calls work correctly.
 - If an argument is omitted, the defaults from backendIndex (or environment variables) are used.

This file expects backendIndex.py, app.py and Viewer.py to be importable from the same package/directory.
"""

import sys
from typing import Optional

import backendIndex
import app as Server
import Viewer as Browser


def _normalize_team_arg(team_arg: Optional[str]) -> Optional[str]:
    """Return a team string suitable for backendIndex/TBA calls.
    If input looks numeric (e.g. '2062'), prefix with 'frc'. If already starts with 'frc', keep it.
    If None, return None.
    """
    if not team_arg:
        return None
    s = str(team_arg).strip()
    if not s:
        return None
    if s.lower().startswith('frc'):
        return s
    # if it's purely digits, prefix with 'frc'
    if s.isdigit():
        return f'frc{s}'
    # otherwise return as-is
    return s


def main():
    # argv: prog [YEAR] [EVENT_KEY] [TEAM]
    args = sys.argv[1:]
    year = None
    event = None
    team = None

    if len(args) >= 1 and args[0] not in ('-h', '--help'):
        # try parse year
        try:
            year = int(args[0])
        except Exception:
            # not an int -> treat as event (so shifting supported)
            year = None
            event = args[0]

    if len(args) >= 2:
        # if we parsed year above, args[1] is event; otherwise args[1] might be team
        if year is not None:
            event = args[1]
            if len(args) >= 3:
                team = args[2]
        else:
            # year was absent; args[1] could be team
            team = args[1]
    elif len(args) == 1 and year is None:
        # single non-year arg -> it's the event
        event = args[0]

    # Normalize team to 'frc...' when appropriate
    team_normalized = _normalize_team_arg(team) if team is not None else None

    # Apply defaults in backendIndex
    try:
        backendIndex.set_defaults(team=team_normalized, year=year, event=event)
    except Exception as e:
        print('Warning: set_defaults failed:', e)

    # Start server and viewer as before
    try:
        Server.run()  # non-blocking per your original
    except Exception as e:
        print('Error starting Server.run():', e)
        raise

    # Grab current URLs (robust to different return shapes)
    try:
        ports = Server.GrabCurrentURL()
    except Exception as e:
        print('Error getting GrabCurrentURL():', e)
        ports = None

    SelectedURL = None
    try:
        if isinstance(ports, (list, tuple)) and len(ports) > 0:
            # prefer index 1 if available to keep your original behavior
            SelectedURL = ports[1] if len(ports) > 1 else ports[0]
        elif isinstance(ports, str):
            SelectedURL = ports
    except Exception:
        SelectedURL = None

    print('SelectedURL ->', SelectedURL)

    # Run the browser viewer (this is blocking in your original call)
    try:
        Browser.run(address=SelectedURL, blocking=True, title="CORE2062 Dashboard")
    except Exception as e:
        print('Error starting Browser.run():', e)
        raise


if __name__ == '__main__':
    main()
