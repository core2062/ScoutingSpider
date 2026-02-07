# backendIndex.py
import os
from tbapy import TBA
from datetime import date, datetime
from typing import List, Optional, Any

# Prefer environment variable for API key; fallback only for quick local testing.
TBA_KEY = os.environ.get("TBA_KEY", " YOUR TBA KEY HERE ")
tba = TBA(TBA_KEY)

# sensible defaults when module is imported by a web app
SelectedYear = 2024#date.today().year
SelectedTeam = os.environ.get("TBA_TEAM", "frc2062")
SelectedEvent: Optional[str] = None


def YoinkMostRecentEventKey(team: Optional[str] = None, year: Optional[int] = None) -> Optional[str]:
    """
    Returns the closest (ongoing / upcoming / most recent past) event key for a team in a year.
    """
    team = team or SelectedTeam
    year = int(year or SelectedYear)

    if not team or not year:
        raise ValueError("YoinkMostRecentEventKey requires team and year (or set defaults).")

    try:
        events = tba.team_events(team, year=year, simple=True)
    except Exception as e:
        # caller can inspect logs; return None on network/API error
        print("Error fetching events:", e)
        return None

    if not events:
        return None

    today = date.today()

    def event_distance(event: Any) -> int:
        # event['start_date'] and 'end_date' are expected in YYYY-MM-DD
        try:
            start = datetime.strptime(event.get('start_date'), "%Y-%m-%d").date()
            end = datetime.strptime(event.get('end_date'), "%Y-%m-%d").date()
        except Exception:
            return float('inf')
        if start <= today <= end:
            return 0
        if today < start:
            return (start - today).days
        return (today - end).days

    try:
        best = min(events, key=event_distance)
        return best.get("key")
    except Exception as e:
        print("Error selecting most recent event:", e)
        return None


def YoinkEventRankings(event_key: Optional[str] = None, return_ints: bool = True, keep_prefix: bool = False) -> List[Any]:
    """
    Returns a list of team numbers (ints or strings) from the event rankings.
    If event_key is omitted, attempts to use SelectedEvent or finds the most recent event.
    """
    global SelectedEvent

    # Determine event_key lazily if not provided
    event_key = event_key or SelectedEvent
    if not event_key:
        event_key = YoinkMostRecentEventKey()
        SelectedEvent = event_key  # cache for subsequent calls

    if not event_key:
        # No event key available, return empty list (caller should handle)
        print("YoinkEventRankings: no event_key available")
        return []

    try:
        resp = tba.event_rankings(event_key)
    except Exception as e:
        print(f"Error fetching rankings for {event_key}: {e}")
        return []

    # Coerce 'rankings' into a safe list regardless of response shape
    rankings = []
    try:
        if resp is None:
            rankings = []
        elif isinstance(resp, dict) and 'rankings' in resp:
            rankings = resp.get('rankings') or []
        elif hasattr(resp, 'rankings'):
            rankings = getattr(resp, 'rankings') or []
        elif hasattr(resp, 'data') and isinstance(getattr(resp, 'data', None), dict) and 'rankings' in resp.data:
            rankings = resp.data.get('rankings') or []
        else:
            # Unknown/unsupported shape -> attempt to coerce to list if possible
            try:
                rankings = list(resp) if resp is not None else []
            except Exception:
                rankings = []
    except Exception as e:
        print(f"YoinkEventRankings: error normalizing response for {event_key}: {e}")
        rankings = []

    # Ensure it's an iterable list
    if rankings is None:
        rankings = []

    # Ensure it's a list and sorted by rank if possible
    try:
        rankings = list(rankings)
        rankings.sort(key=lambda r: r.get('rank', float('inf')) if isinstance(r, dict) else float('inf'))
    except Exception:
        # If sorting fails, leave as-is
        pass

    teams: List[Any] = []
    for r in rankings:
        if not isinstance(r, dict):
            # try to be permissive: skip non-dict ranking entries
            continue
        # tbapy sometimes uses 'team_key', sometimes 'team'
        tk = r.get('team_key') or r.get('team')
        if not tk:
            continue

        tk_str = str(tk)
        raw = tk_str[3:] if tk_str.lower().startswith('frc') else tk_str

        if return_ints:
            try:
                teams.append(int(raw))
            except ValueError:
                teams.append(raw)
        else:
            teams.append(tk_str if keep_prefix else raw)

    return teams


def YoinkEventMatches(event_key: Optional[str] = None) -> List[dict]:
    """
    Fetch matches for an event and return a simplified list of matches.

    Returns:
      List[dict]: [
        {"MatchNum": 1, "Red": [111, 222, 333], "Blue": [444, 555, 666]},
        ...
      ]
    """
    global SelectedEvent

    # Determine event_key lazily if not provided
    event_key = event_key or SelectedEvent
    if not event_key:
        event_key = YoinkMostRecentEventKey()
        SelectedEvent = event_key  # cache for subsequent calls

    if not event_key:
        print("YoinkEventMatches: no event_key available")
        return []

    try:
        raw_matches = tba.event_matches(event_key, True)
    except Exception as e:
        print(f"Error fetching matches for {event_key}: {e}")
        return []

    if not raw_matches:
        return []

    simplified: List[dict] = []

    def _extract_team_nums(team_keys: Any) -> List[Any]:
        out: List[Any] = []
        if not team_keys:
            return out
        for tk in team_keys:
            if not tk:
                continue
            if isinstance(tk, int):
                out.append(tk)
                continue
            s = str(tk)
            if s.lower().startswith('frc'):
                s_num = s[3:]
            else:
                s_num = s
            try:
                out.append(int(s_num))
            except Exception:
                out.append(s_num)
        return out

    for m in raw_matches:
        # m may be a dict-like or object-like; normalize access
        match_number = None
        try:
            match_number = getattr(m, "match_number", None)
        except Exception:
            match_number = None
        if match_number is None:
            try:
                match_number = m.get("match_number") if isinstance(m, dict) else None
            except Exception:
                match_number = None

        # fallback: try to parse from key like '2022ilch_qm62'
        if match_number is None:
            try:
                key = getattr(m, "key", None) or (m.get("key") if isinstance(m, dict) else None)
                if key:
                    import re
                    digits = re.findall(r'(\d+)$', str(key))
                    if digits:
                        match_number = int(digits[-1])
            except Exception:
                match_number = None

        # alliances extraction
        alliances = None
        try:
            alliances = getattr(m, "alliances", None)
        except Exception:
            alliances = None
        if alliances is None and isinstance(m, dict):
            alliances = m.get("alliances")

        # if alliances missing, skip
        if not alliances or not isinstance(alliances, dict):
            continue

        # get team lists for red and blue
        red_keys = None
        blue_keys = None
        try:
            red_keys = alliances.get("red", {}).get("team_keys")
            blue_keys = alliances.get("blue", {}).get("team_keys")
        except Exception:
            # alliances might be object-like
            try:
                red_all = alliances.get("red") if isinstance(alliances, dict) else getattr(alliances, "red", None)
                blue_all = alliances.get("blue") if isinstance(alliances, dict) else getattr(alliances, "blue", None)
                red_keys = red_all.get("team_keys") if isinstance(red_all, dict) else getattr(red_all, "team_keys", None)
                blue_keys = blue_all.get("team_keys") if isinstance(blue_all, dict) else getattr(blue_all, "team_keys", None)
            except Exception:
                red_keys = None
                blue_keys = None

        # If either alliance missing team lists, skip this match
        if not red_keys or not blue_keys:
            continue

        red_nums = _extract_team_nums(red_keys)
        blue_nums = _extract_team_nums(blue_keys)

        # If match_number still None, try actual_time ordering fallback
        if match_number is None:
            try:
                actual_time = getattr(m, "actual_time", None) or (m.get("actual_time") if isinstance(m, dict) else None)
                match_number = int(actual_time) if actual_time is not None else None
            except Exception:
                match_number = None

        simplified.append({
            "MatchNum": match_number,
            "Red": red_nums,
            "Blue": blue_nums
        })

    # Sort by MatchNum when possible (None values go to the end)
    def _sort_key(x: dict):
        mn = x.get("MatchNum")
        return (mn is None, mn if isinstance(mn, int) else float('inf'))

    simplified.sort(key=_sort_key)

    return simplified


def YoinkTBAPage(event_key: Optional[str] = None) -> str:
    """
    Returns the full TBA event page URL for the given event_key.
    If event_key is None, uses SelectedEvent or finds the most recent event.
    """
    global SelectedEvent

    event_key = event_key or SelectedEvent
    if not event_key:
        event_key = YoinkMostRecentEventKey()
        SelectedEvent = event_key  # cache for subsequent calls

    if not event_key:
        raise ValueError("No event_key available (set SelectedEvent or provide event_key).")

    return f"https://www.thebluealliance.com/event/{event_key}"


def YoinkEventMatchBreakdown(event_key: Optional[str] = None) -> dict:
    """
    Single-function replacement that returns match-level breakdowns (including heuristic 'auto' data)
    for a The Blue Alliance event using the existing `tba` (tbapy.TBA) instance and module globals.
    """
    global SelectedEvent

    # determine event_key
    event_key = event_key or SelectedEvent
    if not event_key:
        event_key = YoinkMostRecentEventKey()
        SelectedEvent = event_key
    if not event_key:
        raise ValueError("No event_key available (set SelectedEvent or provide event_key).")

    # helper: safely get attribute or dict key
    def _get(m: Any, key: str):
        try:
            return getattr(m, key)
        except Exception:
            try:
                return m.get(key) if isinstance(m, dict) else None
            except Exception:
                return None

    # helper: convert team key strings like 'frc1234' to int 1234 when possible
    def _extract_team_nums(team_keys: Any):
        out = []
        if not team_keys:
            return out
        for tk in team_keys:
            if tk is None:
                continue
            if isinstance(tk, int):
                out.append(tk)
                continue
            s = str(tk)
            if s.lower().startswith('frc'):
                s_num = s[3:]
            else:
                s_num = s
            try:
                out.append(int(s_num))
            except Exception:
                out.append(s_num)
        return out

    # helper: recursively collect fields containing 'auto' (case-insensitive)
    def _collect_auto(d: Any, prefix: str = ""):
        found = {}
        if not isinstance(d, dict):
            return None
        for k, v in d.items():
            if "auto" in k.lower():
                found[prefix + k] = v
            # descend one more level if nested dict
            if isinstance(v, dict):
                for k2, v2 in v.items():
                    if "auto" in k2.lower():
                        found[prefix + k + "." + k2] = v2
                deeper = _collect_auto(v, prefix=prefix + k + ".")
                if deeper:
                    found.update(deeper)
        return found if found else None

    out = {"event_key": event_key, "matches": []}

    try:
        raw_matches = tba.event_matches(event_key, True)
    except Exception as e:
        # return empty structure on error (caller can log)
        print(f"Error fetching matches for {event_key}: {e}")
        return out

    if not raw_matches:
        return out

    for m in raw_matches:
        # basic normalization
        match_obj = m
        match_key = _get(m, "key") or _get(m, "match_key") or None

        # determine match number
        match_number = _get(m, "match_number")
        if match_number is None:
            # try parse from key
            try:
                if match_key:
                    import re
                    digits = re.findall(r'(\d+)$', str(match_key))
                    if digits:
                        match_number = int(digits[-1])
            except Exception:
                match_number = None

        # alliances extraction from simple object
        alliances = _get(m, "alliances") or None
        red_keys = None
        blue_keys = None
        if alliances and isinstance(alliances, dict):
            try:
                red_keys = alliances.get("red", {}).get("team_keys")
                blue_keys = alliances.get("blue", {}).get("team_keys")
            except Exception:
                red_keys = None
                blue_keys = None

        # fallback: some shapes store team lists elsewhere
        if not red_keys or not blue_keys:
            # try top-level fields
            red_keys = red_keys or _get(m, "red_alliance") or _get(m, "red_teams") or None
            blue_keys = blue_keys or _get(m, "blue_alliance") or _get(m, "blue_teams") or None

        red_nums = _extract_team_nums(red_keys) if red_keys else []
        blue_nums = _extract_team_nums(blue_keys) if blue_keys else []

        # prepare result entry
        entry = {
            "MatchNum": match_number,
            "MatchKey": match_key,
            "Red": red_nums,
            "Blue": blue_nums,
            "red_score": None,
            "blue_score": None,
            "red_auto": None,
            "blue_auto": None,
            "simple": match_obj,
            "detailed": None
        }

        # attempt detailed fetch to get score_breakdown
        detailed = None
        if match_key:
            try:
                detailed = tba.match(match_key)
            except Exception:
                detailed = None

        entry["detailed"] = detailed

        # try to find alliances/scores from detailed or simple
        alliances_det = None
        if detailed:
            alliances_det = _get(detailed, "alliances") or (_get(detailed, "alliances") if isinstance(detailed, dict) else None)
        if alliances_det and isinstance(alliances_det, dict):
            try:
                entry["red_score"] = alliances_det.get("red", {}).get("score")
                entry["blue_score"] = alliances_det.get("blue", {}).get("score")
            except Exception:
                pass
        else:
            # fallback to simple
            try:
                alliances_simple = _get(m, "alliances") if isinstance(m, dict) else None
                if alliances_simple and isinstance(alliances_simple, dict):
                    entry["red_score"] = alliances_simple.get("red", {}).get("score")
                    entry["blue_score"] = alliances_simple.get("blue", {}).get("score")
            except Exception:
                pass

        # find score_breakdown (prefer detailed)
        score_breakdown = None
        if detailed:
            score_breakdown = _get(detailed, "score_breakdown") or (detailed.get("score_breakdown") if isinstance(detailed, dict) else None)
        if not score_breakdown:
            # fallback to simple match object
            score_breakdown = _get(m, "score_breakdown") if isinstance(m, dict) else None

        # parse auto fields heuristically
        if score_breakdown and isinstance(score_breakdown, dict):
            # prefer per-alliance breakdown if present
            red_bd = score_breakdown.get("red") if isinstance(score_breakdown.get("red"), dict) else None
            blue_bd = score_breakdown.get("blue") if isinstance(score_breakdown.get("blue"), dict) else None

            if red_bd:
                entry["red_auto"] = _collect_auto(red_bd)
            else:
                entry["red_auto"] = _collect_auto(score_breakdown)

            if blue_bd:
                entry["blue_auto"] = _collect_auto(blue_bd)
            else:
                entry["blue_auto"] = _collect_auto(score_breakdown)

            if entry["red_auto"] == {}:
                entry["red_auto"] = None
            if entry["blue_auto"] == {}:
                entry["blue_auto"] = None

        out["matches"].append(entry)

    # sort by MatchNum (None to end)
    def _sort_key(x):
        mn = x.get("MatchNum")
        return (mn is None, mn if isinstance(mn, int) else float('inf'))

    out["matches"].sort(key=_sort_key)
    return out


def set_defaults(team: Optional[str] = None, year: Optional[int] = None, event: Optional[str] = None):
    global SelectedTeam, SelectedYear, SelectedEvent
    if team:
        SelectedTeam = team
    if year:
        SelectedYear = int(year)
    if event:
        SelectedEvent = event
