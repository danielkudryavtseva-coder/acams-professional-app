"""
Reads CAMS Alumni Rolodex.xlsx, geocodes city/state strings, writes
src/app/data/alumniRolodexData.json for the Connect page map.

Requires: pandas openpyxl geopy
Re-run when the spreadsheet changes. Geocode results are cached in
scripts/alumni_geocode_cache.json
"""
from __future__ import annotations

import hashlib
import json
import re
import time
from pathlib import Path

import pandas as pd
from geopy.exc import GeocoderServiceError, GeocoderTimedOut
from geopy.geocoders import Nominatim

ROOT = Path(__file__).resolve().parents[1]
XLSX_DEFAULT = Path(r"c:\Users\whitf\Downloads\CAMS Alumni Rolodex.xlsx")
OUT_JSON = ROOT / "src" / "app" / "data" / "alumniRolodexData.json"
CACHE_PATH = Path(__file__).resolve().parent / "alumni_geocode_cache.json"

LOCATION_FIXES = {
    "Cincinatti, OH": "Cincinnati, OH",
    "Washington D.C.": "Washington, DC",
    "Washington DC": "Washington, DC",
}


def split_name(full: str) -> tuple[str, str]:
    parts = str(full).strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def primary_location(loc) -> str | None:
    if pd.isna(loc) or str(loc).strip() == "" or str(loc).lower() == "nan":
        return None
    s = str(loc).strip()
    parts = [p.strip() for p in s.split(",")]
    if len(parts) >= 2:
        city, st = parts[0], parts[1]
        if re.match(r"^[A-Z]{2}$", st):
            key = f"{city}, {st}"
            return LOCATION_FIXES.get(key, key)
    if "washington" in s.lower() and ("d.c" in s.lower() or re.search(r"\bDC\b", s)):
        return "Washington, DC"
    return parts[0] if parts else s


def first_segment(val) -> str:
    if pd.isna(val) or str(val).strip() == "":
        return ""
    return str(val).split(",")[0].strip()


def phone_str(val) -> str:
    if pd.isna(val):
        return ""
    if isinstance(val, float):
        if val == int(val):
            return str(int(val))
        return str(val)
    s = str(val).strip()
    if s.endswith(".0") and s[:-2].replace("-", "").isdigit():
        return s[:-2]
    return s


def infer_track(company: str, role: str) -> str:
    blob = f"{company} {role}".lower()
    if any(x in blob for x in ("venture", " vc", "seed ", "series a")):
        return "VC"
    if any(x in blob for x in ("private equity", " pe ", "lbo", "buyout")):
        return "PE"
    if any(
        x in blob
        for x in (
            "investment banking",
            "investment bank",
            " i-banking",
            "m&a",
            "mergers",
            "capital markets",
            "coverage",
            "leerink",
            "jmp securities",
            "wells fargo",
            "mizuho",
            "ib analyst",
            "ib associate",
        )
    ):
        return "IB"
    if any(x in blob for x in ("equity research", "research associate", "evestment")):
        return "ER"
    if any(x in blob for x in ("asset management", "portfolio manager", "wealth management")):
        return "AM"
    if any(x in blob for x in ("consulting", "consultant", "advisory", "kpmg", "pwc", "deloitte", "bain", "bcg", "protiviti", "capgemini")):
        return "Consulting"
    return "IB"


def load_cache() -> dict[str, list[float]]:
    if CACHE_PATH.is_file():
        raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        return {k: v for k, v in raw.items() if isinstance(v, list) and len(v) == 2}
    return {}


def save_cache(cache: dict[str, list[float]]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, indent=2, sort_keys=True), encoding="utf-8")


def geocode_all(unique_queries: list[str], cache: dict[str, list[float]]) -> dict[str, tuple[float, float]]:
    geo = Nominatim(user_agent="cams-professional-app-rolodex/1.1")
    out: dict[str, tuple[float, float]] = {}
    for q in unique_queries:
        if q in cache:
            lat, lng = cache[q]
            out[q] = (lat, lng)
            continue
        lat = lng = None
        for suffix in (", USA", ""):
            try:
                time.sleep(1.15)
                loc = geo.geocode(q + suffix, timeout=12)
                if loc:
                    lat, lng = loc.latitude, loc.longitude
                    break
            except (GeocoderTimedOut, GeocoderServiceError):
                pass
        if lat is None:
            print(f"WARN: no coords for {q!r}, using Tuscaloosa fallback")
            lat, lng = 33.2098, -87.5692
        cache[q] = [lat, lng]
        out[q] = (lat, lng)
    return out


def jitter(lat: float, lng: float, key: str) -> tuple[float, float]:
    h = hashlib.sha256(key.encode()).digest()
    # ~0–3 km spread
    dl = (h[0] / 255 - 0.5) * 0.05
    dn = (h[1] / 255 - 0.5) * 0.05
    return lat + dl, lng + dn


def main() -> None:
    xlsx = XLSX_DEFAULT if XLSX_DEFAULT.is_file() else None
    if not xlsx:
        raise SystemExit(f"Excel not found: {XLSX_DEFAULT}")

    df = pd.read_excel(xlsx)
    df = df.dropna(subset=["Name"])
    cache = load_cache()

    loc_keys: list[str] = []
    for _, row in df.iterrows():
        pl = primary_location(row.get("Full Time: Location"))
        if not pl:
            pl = primary_location(row.get("Prior Internship: Location"))
        if not pl:
            pl = "Tuscaloosa, AL"
        loc_keys.append(pl)

    unique = sorted(set(loc_keys))
    print(f"Geocoding {len(unique)} unique locations…")
    coords_by_key = geocode_all(unique, cache)
    save_cache(cache)

    alumni: list[dict] = []
    for i, (_, row) in enumerate(df.iterrows()):
        name = str(row["Name"]).strip()
        first, last = split_name(name)
        pl = loc_keys[i]
        lat, lng = coords_by_key[pl]
        aid = f"alum-{i + 1:03d}"
        lat_j, lng_j = jitter(lat, lng, aid)

        gy = row.get("Graduation Year")
        if pd.isna(gy):
            graduation_year = 2019
        else:
            graduation_year = int(float(gy))

        firm = first_segment(row.get("Full Time: Company")) or first_segment(row.get("Prior Internship: Company")) or "—"
        role = first_segment(row.get("Full Time: Role")) or first_segment(row.get("Prior Internship: Role")) or "—"
        track = infer_track(firm, role)

        school_e = row.get("School Email")
        personal_e = row.get("Personal Email")
        email = ""
        if not pd.isna(school_e) and str(school_e).strip():
            email = str(school_e).strip()
        elif not pd.isna(personal_e) and str(personal_e).strip():
            email = str(personal_e).strip()

        prior_c = first_segment(row.get("Prior Internship: Company"))
        prior_r = first_segment(row.get("Prior Internship: Role"))
        bio_parts = [f"CAMS alum ({graduation_year})."]
        if prior_c:
            bio_parts.append(f"Internship: {prior_c} — {prior_r or 'Intern'}.")
        bio_parts.append(f"Full-time: {firm} — {role}.")
        bio = " ".join(bio_parts)

        rec: dict = {
            "id": aid,
            "firstName": first,
            "lastName": last,
            "graduationYear": graduation_year,
            "firm": firm[:120],
            "role": role[:120],
            "track": track,
            "linkedin": "",
            "bio": bio[:500],
            "availableForChat": False,
            "mapCity": pl,
            "mapLat": round(lat_j, 6),
            "mapLng": round(lng_j, 6),
        }
        if email:
            rec["email"] = email
        ph = phone_str(row.get("Phone Number"))
        if ph:
            rec["phone"] = ph
        alumni.append(rec)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(alumni, indent=2), encoding="utf-8")
    print(f"Wrote {len(alumni)} alumni to {OUT_JSON}")

    # Hints for mock firm cards / jobs (first match by substring)
    def first_id(substr: str) -> str | None:
        substr_l = substr.lower()
        for rec in alumni:
            if substr_l in rec["firm"].lower():
                return rec["id"]
        return None

    print("Referral id hints:", {k: first_id(k) for k in ("Goldman", "Blackstone", "Sequoia", "Wells Fargo", "Mizuho")})


if __name__ == "__main__":
    main()
