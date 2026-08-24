#!/usr/bin/env python3
"""
CAMS Program Verifier
=====================
Uses Ollama to audit eligibility rules and date accuracy across every program
in recruitingPrograms.ts.  Runs date-only validation without Ollama when the
local service is unavailable.

Usage
-----
  # Dry run — shows what would change (safe, no writes)
  py -3 scripts/verify_programs.py

  # Only run the 5 canonical test cases (fast, good for CI)
  py -3 scripts/verify_programs.py --test

  # Single program
  py -3 scripts/verify_programs.py --program gs-sa27-amer

  # Apply corrections to the TS file (creates .bak first)
  py -3 scripts/verify_programs.py --apply

  # Skip Ollama, date-only validation
  py -3 scripts/verify_programs.py --no-ollama

  # Different model
  py -3 scripts/verify_programs.py --model mistral

Scheduling (Windows Task Scheduler)
-------------------------------------
  Action: py -3 D:\\acams-professional-app\\scripts\\verify_programs.py --apply
  Trigger: Daily at 06:00
  Start in: D:\\acams-professional-app
"""

from __future__ import annotations

import sys
sys.stdout.reconfigure(encoding="utf-8")

import argparse
import json
import logging
import re
import shutil
import sys
from datetime import date
from pathlib import Path
from typing import Optional

# requests is stdlib-absent; install once with: py -3 -m pip install requests
try:
    import requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
TS_FILE      = PROJECT_ROOT / "src" / "app" / "data" / "recruitingPrograms.ts"
REPORT_FILE  = SCRIPT_DIR / "verify_report.json"
OLLAMA_BASE  = "http://localhost:11434"

YEAR_ORDER: list[str] = ["Freshman", "Sophomore", "Junior", "Senior"]

# Canonical test-case program ids (5 required; gs-launch-sa27 is GS Sophomore)
TEST_IDS = [
    "gs-sa27-amer",           # 1. GS 2027 SA — Junior, open Aug 15 2026
    "gs-launch-sa27",         # 2. GS Launch — Sophomore program (Class of '29)
    "gs-virtual-insight-26",  # 3. GS Virtual Insight — Freshman/Sophomore/Junior
    "bofa-gib-sa27",          # 4. BofA 2027 GIB SA — Junior, date/status check
    "ms-early-insights-26",   # 5. MS Early Insights — closed program verification
]

# Academic transition window: May 15 – Aug 31
# During this period a student who selected "Freshman" is "incoming Sophomore",
# so the filter expands one step forward.
SUMMER_WINDOW = ((5, 15), (8, 31))   # (month, day) inclusive

# ---------------------------------------------------------------------------
# TS file parser
# ---------------------------------------------------------------------------

def _resolve_j_calls(text: str) -> str:
    """Replace J("mm","dd","yyyy") with the ISO string "yyyy-mm-dd"."""
    return re.sub(
        r'J\("(\d{2})",\s*"(\d{2})",\s*"(\d{4})"\)',
        lambda m: f'"{m.group(3)}-{m.group(1)}-{m.group(2)}"',
        text,
    )


def _extract_program_blobs(text: str) -> list[str]:
    """Return each top-level {...} object inside RECRUITING_PROGRAMS array."""
    start = text.find("export const RECRUITING_PROGRAMS")
    if start == -1:
        raise ValueError("RECRUITING_PROGRAMS not found in TS file")
    # Find the actual array literal `= [` not `Program[]`
    eq_pos = text.find("=", start)
    bracket = text.find("[", eq_pos)
    # depth=1 means we're inside the outer array but not inside any object
    blobs, depth, obj_start = [], 1, None
    for i in range(bracket + 1, len(text)):
        c = text[i]
        if c == "{":
            if depth == 1:        # top-level object starts
                obj_start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 1 and obj_start is not None:
                blobs.append(text[obj_start : i + 1])
                obj_start = None
        elif c == "]" and depth == 1:
            break
    return blobs


def _str(blob: str, field: str) -> Optional[str]:
    m = re.search(rf'{field}:\s*"([^"]*)"', blob)
    return m.group(1) if m else None


def _bool(blob: str, field: str) -> Optional[bool]:
    m = re.search(rf'{field}:\s*(true|false)', blob)
    return (m.group(1) == "true") if m else None


def _arr(blob: str, field: str) -> list[str]:
    m = re.search(rf'{field}:\s*\[([^\]]*)\]', blob)
    return re.findall(r'"([^"]+)"', m.group(1)) if m else []


def _int(blob: str, field: str) -> Optional[int]:
    m = re.search(rf'{field}:\s*(\d+)', blob)
    return int(m.group(1)) if m else None


def _parse_blob(blob: str) -> dict:
    return {
        "id":          _str(blob, "id"),
        "firm":        _str(blob, "firm"),
        "role":        _str(blob, "role"),
        "programName": _str(blob, "programName"),
        "division":    _str(blob, "division"),
        "type":        _str(blob, "type"),
        "category":    _str(blob, "category"),
        "cycleYear":   _int(blob, "cycleYear"),
        "openDate":    _str(blob, "openDate"),
        "deadline":    _str(blob, "deadline"),
        "status":      _str(blob, "status"),
        "location":    _str(blob, "location"),
        "classYears":  _arr(blob, "classYears"),
        "rolling":     _bool(blob, "rolling"),
        "diversity":   _bool(blob, "diversity"),
        "notes":       _str(blob, "notes"),
        "source":      _str(blob, "source"),
        "_blob":       blob,
    }


def load_programs() -> list[dict]:
    text = _resolve_j_calls(TS_FILE.read_text(encoding="utf-8"))
    blobs = _extract_program_blobs(text)
    programs = [_parse_blob(b) for b in blobs]
    return [p for p in programs if p.get("id")]


# ---------------------------------------------------------------------------
# Academic calendar helpers
# ---------------------------------------------------------------------------

def in_summer_window(today: date) -> bool:
    (sm, sd), (em, ed) = SUMMER_WINDOW
    md = (today.month, today.day)
    return (sm, sd) <= md <= (em, ed)


def infer_class_years(p: dict) -> list[str]:
    """Fallback inference when classYears is not explicitly set."""
    if p.get("classYears"):
        return p["classYears"]
    combined = ((p.get("role") or "") + " " + (p.get("programName") or "")).lower()
    found = []
    if "freshman" in combined:   found.append("Freshman")
    if "sophomore" in combined:  found.append("Sophomore")
    if "junior" in combined:     found.append("Junior")
    if "senior" in combined or "full-time" in combined: found.append("Senior")
    if found:
        return found
    cat_map = {
        "FT":        ["Senior"],
        "Sophomore": ["Sophomore"],
        "Freshman":  ["Freshman"],
        "Insight":   ["Freshman", "Sophomore"],
        "Discovery": ["Freshman", "Sophomore"],
        "Fellowship":["Junior", "Senior"],
    }
    return cat_map.get(p.get("category", ""), ["Junior"])


# ---------------------------------------------------------------------------
# Ollama integration
# ---------------------------------------------------------------------------

def _check_ollama(model: str) -> bool:
    if not _HAS_REQUESTS:
        return False
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=5)
        if r.status_code != 200:
            return False
        names = [m.get("name", "") for m in r.json().get("models", [])]
        return any(model.split(":")[0] in n for n in names)
    except Exception:
        return False


def _query_ollama(prompt: str, model: str, timeout: int = 120) -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.05, "num_predict": 600},
    }
    r = requests.post(f"{OLLAMA_BASE}/api/generate", json=payload, timeout=timeout)
    r.raise_for_status()
    return r.json().get("response", "")


def _build_prompt(p: dict, today: date) -> str:
    years = infer_class_years(p)
    return (
        "You are an eligibility parser for university finance internship applications.\n\n"
        f"Today: {today.isoformat()}. Academic year starts September 1.\n"
        "Summer transition window (May 15 – Aug 31): students are 'incoming' to the next year.\n\n"
        "Application:\n"
        f"  firm        : {p.get('firm','')}\n"
        f"  role        : {p.get('role','')}\n"
        f"  programName : {p.get('programName','')}\n"
        f"  category    : {p.get('category','')}\n"
        f"  cycleYear   : {p.get('cycleYear','')}\n"
        f"  openDate    : {p.get('openDate') or 'null'}\n"
        f"  deadline    : {p.get('deadline') or 'null'}\n"
        f"  status      : {p.get('status','')}\n"
        f"  classYears  : {json.dumps(years)}\n"
        f"  rolling     : {p.get('rolling', False)}\n"
        f"  notes       : {(p.get('notes') or '')[:500]}\n\n"
        "Tasks:\n"
        "1. Confirm or correct eligible_years (use only: Freshman Sophomore Junior Senior).\n"
        "2. Set incoming_eligible=true if students who are *about to enter* the eligible year\n"
        "   should also apply (common for sophomore programs in summer).\n"
        "3. Verify open_date / close_date. If stored dates look implausible or conflict with\n"
        "   the notes, correct them. Output null only if truly unknown.\n"
        "4. Set inferred_status: 'open' if today falls within [open_date, close_date],\n"
        "   'closed' otherwise. For rolling programs within range, use 'open'.\n"
        "5. List any issues (wrong date, wrong year, etc.).\n\n"
        "Output ONLY a valid JSON object — no prose before or after:\n"
        "{\n"
        '  "eligible_years": ["Junior"],\n'
        '  "incoming_eligible": false,\n'
        '  "min_gpa": null,\n'
        '  "preferred_majors": [],\n'
        '  "open_date": "YYYY-MM-DD or null",\n'
        '  "close_date": "YYYY-MM-DD or null",\n'
        '  "inferred_status": "open",\n'
        '  "issues": [],\n'
        '  "confidence": 0.90\n'
        "}"
    )


def _parse_llm(raw: str) -> Optional[dict]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    m = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except Exception:
            pass
    return None


# ---------------------------------------------------------------------------
# Validation & diff
# ---------------------------------------------------------------------------

def _date_status(open_str: Optional[str], dead_str: Optional[str],
                 rolling: bool, today: date) -> Optional[str]:
    """
    Compute corrected status.
    Rule: only force-close when the deadline has definitively passed.
    Programs with a future openDate but stored status='open' are intentional
    (the UI shows them as 'Opening Soon') — leave those alone.
    """
    try:
        dead_d = date.fromisoformat(dead_str) if dead_str else None
        open_d = date.fromisoformat(open_str) if open_str else None
    except ValueError:
        return None
    # Deadline already passed and it's not a rolling program → close it
    if dead_d and dead_d < today and not rolling:
        return "closed"
    # Open date is in the future → store as 'open' (UI handles 'Opening Soon')
    if open_d and open_d > today:
        return "open"
    return None


def diff_program(p: dict, llm: dict, today: date) -> dict:
    corrections: list[dict] = []
    issues: list[str] = list(llm.get("issues") or [])

    # ── date corrections ──────────────────────────────────────────
    for db_key, llm_key, label in [
        ("openDate", "open_date",  "open date"),
        ("deadline", "close_date", "deadline"),
    ]:
        stored = p.get(db_key)
        proposed = llm.get(llm_key)
        if proposed and stored != proposed:
            conf = llm.get("confidence", 0.0)
            if conf >= 0.75:
                corrections.append({
                    "field":  db_key,
                    "from":   stored,
                    "to":     proposed,
                    "reason": f"LLM corrected {label} (confidence {conf:.2f})",
                })
            else:
                issues.append(
                    f"LLM suggested {label} {proposed!r} but confidence {conf:.2f} < 0.75 — skipped"
                )

    # ── status correction via date arithmetic ─────────────────────
    computed = _date_status(p.get("openDate"), p.get("deadline"),
                            bool(p.get("rolling")), today)
    if computed and p.get("status") not in ("applied", "interviewing", "offer", "rejected"):
        if p.get("status") != computed:
            corrections.append({
                "field":  "status",
                "from":   p.get("status"),
                "to":     computed,
                "reason": (
                    f"Date arithmetic: open={p.get('openDate')} "
                    f"deadline={p.get('deadline')} today={today}"
                ),
            })

    # ── class-year corrections ────────────────────────────────────
    stored_yrs  = sorted(p.get("classYears") or infer_class_years(p))
    llm_yrs     = sorted(llm.get("eligible_years") or [])
    conf = llm.get("confidence", 0.0)
    if llm_yrs and stored_yrs != llm_yrs and conf >= 0.75:
        corrections.append({
            "field":  "classYears",
            "from":   stored_yrs,
            "to":     llm_yrs,
            "reason": f"LLM found different eligible class years (confidence {conf:.2f})",
        })

    return {
        "id":               p["id"],
        "firm":             p.get("firm", ""),
        "role":             (p.get("role") or "")[:80],
        "corrections":      corrections,
        "issues":           issues,
        "confidence":       llm.get("confidence", None),
        "incoming_eligible":bool(llm.get("incoming_eligible", False)),
        "llm_used":         bool(llm),
    }


# ---------------------------------------------------------------------------
# Apply corrections to TS file
# ---------------------------------------------------------------------------

def _patch_field(blob: str, field: str, new_val) -> str:
    if field in ("openDate", "deadline"):
        if new_val:
            yyyy, mm, dd = new_val[:4], new_val[5:7], new_val[8:10]
            repl = f'{field}: J("{mm}", "{dd}", "{yyyy}")'
        else:
            repl = f"{field}: undefined"
        return re.sub(
            rf'{field}:\s*J\("[^"]*",\s*"[^"]*",\s*"[^"]*"\)',
            repl, blob,
        )
    if field == "status":
        return re.sub(rf'status:\s*"[^"]*"', f'status: "{new_val}"', blob)
    if field == "classYears":
        arr_str = json.dumps(new_val)
        return re.sub(rf'classYears:\s*\[[^\]]*\]', f'classYears: {arr_str}', blob)
    return blob


def apply_all_corrections(results: list[dict], dry_run: bool = True) -> int:
    to_apply = [(r, c) for r in results for c in r["corrections"] if c.get("to") is not None]
    if not to_apply:
        logging.info("No corrections to apply.")
        return 0

    text = TS_FILE.read_text(encoding="utf-8")

    if not dry_run:
        backup = TS_FILE.with_suffix(".ts.bak")
        shutil.copy2(TS_FILE, backup)
        logging.info(f"Backup: {backup}")

    applied = 0
    for result, c in to_apply:
        pid = result["id"]
        field, new_val = c["field"], c["to"]

        if dry_run:
            logging.info(f"[DRY RUN] {pid} · {field}: {c['from']!r} → {new_val!r}")
        else:
            # Locate the program block by id, then patch only that block
            id_pat = re.compile(rf'id:\s*"{re.escape(pid)}"')
            m = id_pat.search(text)
            if not m:
                logging.warning(f"Could not locate id={pid!r} in TS file — skipping")
                continue
            obj_start = text.rfind("{", 0, m.start())
            depth, i = 1, obj_start + 1
            while i < len(text) and depth:
                if text[i] == "{":   depth += 1
                elif text[i] == "}": depth -= 1
                i += 1
            old_blob = text[obj_start:i]
            new_blob = _patch_field(old_blob, field, new_val)
            text = text[:obj_start] + new_blob + text[i:]
            logging.info(f"Applied: {pid} · {field}: {c['from']!r} → {new_val!r}")
        applied += 1

    if not dry_run and applied:
        TS_FILE.write_text(text, encoding="utf-8")
        logging.info(f"Saved {TS_FILE.name} ({applied} corrections)")

    return applied


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def _banner(char: str, width: int = 62) -> str:
    return char * width


def print_report(results: list[dict], today: date) -> None:
    flagged = [r for r in results if r["corrections"] or r["issues"]]
    clean   = len(results) - len(flagged)

    print(f"\n{_banner('═')}")
    print(f"  CAMS Verifier  ·  {today}  ·  {len(results)} programs")
    print(f"  ✓ clean: {clean}   ✎ flagged: {len(flagged)}")
    if in_summer_window(today):
        print("  ⚡ Summer transition window active (May 15 – Aug 31)")
    print(_banner('═'))

    for r in flagged:
        print(f"\n  [{r['id']}]  {r['firm']}  —  {r['role']}")
        for c in r["corrections"]:
            arrow = f"{c['from']!r} → {c['to']!r}"
            print(f"    ✎ {c['field']:<12} {arrow}")
            print(f"             {c['reason']}")
        for issue in r["issues"]:
            print(f"    ⚠  {issue}")
        if r.get("incoming_eligible"):
            print("    ℹ  incoming_eligible=true — summer filter applies")
        if r.get("confidence") is not None:
            print(f"    ○  LLM confidence: {r['confidence']:.2f}")

    print(f"\n{_banner('─')}")
    print(f"  Report: {REPORT_FILE}")
    print(_banner('─'))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="CAMS Program Verifier — eligibility + date audit via Ollama",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("--apply",     action="store_true",
                    help="Write corrections to TS file (default: dry run)")
    ap.add_argument("--model",     default="llama3",
                    help="Ollama model (default: llama3)")
    ap.add_argument("--batch",     type=int, default=10,
                    help="Programs per Ollama batch (default: 10)")
    ap.add_argument("--program",   default="",
                    help="Verify a single program id")
    ap.add_argument("--test",      action="store_true",
                    help="Run only the 5 canonical test cases")
    ap.add_argument("--no-ollama", action="store_true",
                    help="Skip Ollama; date-only validation")
    ap.add_argument("--verbose",   action="store_true",
                    help="Debug logging")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-8s %(message)s",
    )

    today = date.today()
    logging.info(f"Date: {today} | Summer window: {in_summer_window(today)}")

    # Load
    programs = load_programs()
    logging.info(f"Loaded {len(programs)} programs from {TS_FILE.name}")

    # Filter
    if args.program:
        programs = [p for p in programs if p["id"] == args.program]
        if not programs:
            logging.error(f"Program '{args.program}' not found")
            sys.exit(1)
    elif args.test:
        id_set = set(TEST_IDS)
        programs = [p for p in programs if p["id"] in id_set]
        missing = id_set - {p["id"] for p in programs}
        for mid in missing:
            logging.warning(f"Test program '{mid}' not found in data")
        # Preserve order defined in TEST_IDS
        order = {pid: i for i, pid in enumerate(TEST_IDS)}
        programs.sort(key=lambda p: order.get(p["id"], 99))

    if not programs:
        logging.error("No programs to process")
        sys.exit(1)

    # Ollama availability check
    use_ollama = not args.no_ollama
    if use_ollama:
        if not _HAS_REQUESTS:
            logging.warning("'requests' not installed.  pip install requests  or use --no-ollama")
            use_ollama = False
        elif not _check_ollama(args.model):
            logging.warning(
                f"Ollama not reachable or model '{args.model}' not found. "
                "Run: ollama pull llama3   Falling back to date-only check."
            )
            use_ollama = False

    # Process
    results: list[dict] = []
    for i, p in enumerate(programs):
        logging.info(f"[{i+1}/{len(programs)}] {p['id']}")
        llm: dict = {}

        if use_ollama:
            try:
                raw = _query_ollama(_build_prompt(p, today), model=args.model)
                parsed = _parse_llm(raw)
                if parsed:
                    llm = parsed
                    logging.debug(f"  LLM → {json.dumps(llm, separators=(',',':'))}")
                else:
                    logging.warning(f"  Could not parse LLM response for {p['id']}")
            except Exception as exc:
                logging.warning(f"  Ollama error for {p['id']}: {exc}")

        results.append(diff_program(p, llm, today))

    # Report
    print_report(results, today)
    REPORT_FILE.write_text(json.dumps(results, indent=2, default=str), encoding="utf-8")

    # Apply / dry-run
    n = apply_all_corrections(results, dry_run=not args.apply)
    if not args.apply and n > 0:
        print(f"\n  → Re-run with --apply to write {n} field(s) to {TS_FILE.name}\n")


if __name__ == "__main__":
    main()
