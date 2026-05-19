#!/usr/bin/env python3
"""Generate local-only verbatim career tables from the user's PDF.

The output is intentionally gitignored. It may contain copyrighted text from a
locally owned rulebook PDF and is meant for private runtime use only.
"""

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "app" / "src" / "data" / "coreCareerTables.local.json"
CORE_PDF = ROOT / "books" / "Traveller - Core Rulebook (mgp3800).pdf"
CORE_CAREERS = [
    ("Agent", "AGENT", 10),
    ("Army", "ARMY", 12),
    ("Citizen", "CITIZEN", 14),
    ("Drifter", "DRIFTER", 16),
    ("Entertainer", "ENTERTAINER", 18),
    ("Marines", "MARINES", 20),
    ("Merchant", "MERCHANTS", 22),
    ("Navy", "NAVY", 24),
    ("Nobility", "NOBILITY", 26),
    ("Rogue", "ROGUE", 28),
    ("Scholar", "SCHOLAR", 30),
    ("Scout", "SCOUTS", 32),
]
SUPPLEMENT_BOOKS = [
    (
        ROOT / "books" / "Traveller - Book 01 - Mercenary (mgp3801).pdf",
        [
            ("Cadre", "CADRE"),
            ("Commando", "COMMANDO"),
            ("Guerrilla", "GUERILLA"),
            ("Security", "SECURITY"),
            ("Striker", "STRIKER"),
            ("Warmonger", "WARMONGER"),
        ],
        700,
    ),
    (
        ROOT / "books" / "Traveller - Book 02 - High Guard (mgp3803).pdf",
        [
            ("Crewman", "CREWMAN"),
            ("Support", "SUPPORT"),
            ("Engineering", "ENGINEERING"),
            ("Gunnery", "GUNNERY"),
            ("Flight Crew", "FLIGHT"),
            ("Naval Pilot", "PILOT"),
            ("Command", "COMMAND"),
        ],
        400,
    ),
    (
        ROOT / "books" / "Traveller - Book 03 - Scout (mgp3810).pdf",
        [("Contact", "CONTACT"), ("Courier", "COURIER"), ("Scout Survey", "SURVEY"), ("Special Operations", "SPECIAL OPERATIONS")],
        250,
    ),
    (
        ROOT / "books" / "Traveller - Book 04 - Psion (mgp3814).pdf",
        [("Psion", "PSION")],
        600,
    ),
    (
        ROOT / "books" / "Traveller - Book 05 - Agent (mgp3816).pdf",
        [
            ("Law Enforcement", "LAW ENFORCEMENT"),
            ("Investigator", "INVESTIGATOR"),
            ("Spy", "SPY"),
            ("Analyst", "ANALYST"),
            ("Corporate", "CORPORATE"),
            ("Bounty Hunter", "BOUNTY HUNTER"),
        ],
        180,
    ),
    (
        ROOT / "books" / "Traveller - Book 06 - Scoundrel (mgp3823).pdf",
        [
            ("Intruder", "INTRUDER"),
            ("Smuggler", "SMUGGLER"),
            ("Organized Criminal", "ORGANISED CRIMINAL"),
            ("Pirate", "PIRATE"),
            ("Scavenger", "SCAVENGER"),
            ("Wanderer", "WANDERER"),
            ("Barbarian", "BARBARIAN"),
        ],
        140,
    ),
    (
        ROOT / "books" / "Traveller - Book 07 - Merchant Prince (mgp3836).pdf",
        [
            ("Trade Broker", "BROKER"),
            ("Tramp Trader", "FREE TRADER"),
            ("Junk Dealer", "JUNK DEALER"),
            ("Marketer", "MARKETER"),
            ("Merchant Marine", "MERCHANT MARINE"),
            ("Royal Trader", "ROYAL TRADER"),
            ("Slaver", "SLAVER"),
        ],
        380,
    ),
    (
        ROOT / "books" / "Traveller - Book 08 - Dilettante (mgp3834).pdf",
        [
            ("Adventurer", "ADVENTURER"),
            ("Aristocrat", "ARISTOCRAT"),
            ("Celebrity", "CELEBRITY"),
            ("Competitor", "COMPETITOR"),
            ("Connoisseur", "CONNOISSEUR"),
            ("Dilettante", "DILETTANTE"),
            ("Humanitarian", "HUMANITARIAN"),
        ],
        240,
    ),
]
TABLE_HEADINGS = [
    "SKILLS AND TRAINING",
    "Skil l s and Training",
    "RANKS AND BENEFITS",
    "RANKS AND SKILLS",
    "MISHAPS",
    "EVENTS",
    "CAREER PROGRESS",
    "MUSTERING-OUT BENEFITS",
]


def pdftotext(pdf: Path, first: int | None = None, last: int | None = None) -> str:
    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")
    if not shutil.which("pdftotext"):
        raise SystemExit("pdftotext is required. Install poppler/pdftotext first.")
    command = ["pdftotext", "-layout"]
    if first is not None:
        command.extend(["-f", str(first)])
    if last is not None:
        command.extend(["-l", str(last)])
    command.extend([str(pdf), "-"])
    result = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.stdout


def normalise_lines(text: str) -> list[str]:
    return [line.rstrip() for line in text.splitlines()]


def split_core_sections(lines: list[str], pdf: Path) -> dict[str, dict]:
    starts = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        for career, heading, page in CORE_CAREERS:
            if stripped == heading:
                starts.append((index, career, page, str(pdf.relative_to(ROOT))))
    starts.sort()

    sections = {}
    for position, (start, career, page, source) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else first_non_career_tail(lines, start)
        section = trim_blank(lines[start:end])
        sections[career] = {
            "sourcePage": page,
            "source": source,
            "verbatimSection": "\n".join(section),
            "tables": split_tables(section),
        }
    return sections


def split_supplement_sections(lines: list[str], pdf: Path, careers: list[tuple[str, str]], min_index: int = 0) -> dict[str, dict]:
    starts = []
    for career, heading in careers:
      start = find_career_heading(lines, heading, min_index)
      if start is not None:
          starts.append((start, career, heading, str(pdf.relative_to(ROOT))))
    starts.sort()

    sections = {}
    for position, (start, career, _heading, source) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        section = trim_blank(lines[start:end])
        sections[career] = {
            "source": source,
            "sourcePage": None,
            "verbatimSection": "\n".join(section),
            "tables": split_tables(section),
        }
    return sections


def find_career_heading(lines: list[str], heading: str, min_index: int = 0) -> int | None:
    target = canonical_heading(heading)
    bad_context = (
        "MISSION", "MISSIONS", "NON-PLAYER", "NPC", "ARCHETYPE", "ARCHETYPES",
        "CAREER NEXT", "SKILL ROLL",
    )
    candidates = []
    for exact in (True, False):
        for index, line in enumerate(lines):
            if index < min_index:
                continue
            stripped = canonical_heading(line.strip())
            matches = stripped == target if exact else stripped.startswith(f"{target} ")
            if not matches:
                continue
            if any(bad in stripped for bad in bad_context):
                continue
            if (
                stripped != target
                and "RANK" not in stripped
                and "CAREER PROGRESS" not in stripped
                and re.search(r"\b(STR|DEX|END|INT|EDU|SOC)(?:\s+OR\s+\w+)?\s+\d+\+", stripped)
            ):
                continue
            window = "\n".join(lines[index:index + 260])
            has_tables = (
                re.search(r"\bSKILLS\s+AND\s+TRAINING\b", window, re.IGNORECASE)
                and re.search(r"\bMISHAPS?\b", window, re.IGNORECASE)
                and re.search(r"\bEVENTS?\b", window, re.IGNORECASE)
            )
            if has_tables:
                candidates.append(index)
        if candidates:
            return candidates[0]
    return None


def split_tables(section: list[str]) -> dict[str, str]:
    tables = {}
    markers = []
    for index, line in enumerate(section):
        stripped = canonical_heading(line.strip())
        if stripped in {canonical_heading(heading) for heading in TABLE_HEADINGS}:
            markers.append((index, stripped))

    for position, (start, heading) in enumerate(markers):
        end = markers[position + 1][0] if position + 1 < len(markers) else len(section)
        body = trim_blank(section[start:end])
        tables[table_key(heading)] = "\n".join(body)
    return tables


def parse_numbered_table(text: str, min_roll: int = 1, max_roll: int = 66) -> list[dict]:
    entries = []
    seen = set()
    current = None
    for raw_line in text.splitlines():
        line = raw_line.strip()
        match = re.match(r"^([1-6]?[0-9])(?:\s*[–-]\s*([1-6]?[0-9]))?\s+(.*)$", line)
        if match:
            start = int(match.group(1))
            end = int(match.group(2) or start)
            if min_roll <= start <= max_roll and min_roll <= end <= max_roll:
                rolls = list(range(start, end + 1))
                body = match.group(3).strip()
                if start in seen and current:
                    current["text"] = f"{current['text']} {line}".strip()
                else:
                    current = {"roll": start, "text": body}
                    entries.append(current)
                    seen.add(start)
                    for roll in rolls[1:]:
                        if roll not in seen:
                            entries.append({"roll": roll, "text": body})
                            seen.add(roll)
                continue
        if current and line and not line.lower().startswith(("1d6", "2d6", "d66", "roll", "mishap", "event")):
            current["text"] = f"{current['text']} {line}".strip()
    return entries


def infer_roll_type(table_text: str, entries: list[dict], table_name: str) -> str:
    if re.search(r"\bd66\b", table_text, re.IGNORECASE):
        return "d66"
    if any(entry["roll"] > 12 for entry in entries):
        return "d66"
    if re.search(r"\b2d6\b", table_text, re.IGNORECASE):
        return "2d6"
    if table_name == "mishaps" and any(entry["roll"] > 6 for entry in entries):
        return "2d6"
    return "1d6" if table_name == "mishaps" else "2d6"


def enrich_tables(sections: dict[str, dict]) -> dict[str, dict]:
    for career, data in sections.items():
        tables = data["tables"]
        if "mishaps" in tables:
            entries = parse_numbered_table(tables["mishaps"])
            data["mishaps"] = {
                "roll": infer_roll_type(tables["mishaps"], entries, "mishaps"),
                "entries": entries,
            }
        if "events" in tables:
            entries = parse_numbered_table(tables["events"])
            data["events"] = {
                "roll": infer_roll_type(tables["events"], entries, "events"),
                "entries": entries,
            }
    return sections


def extract_life_events(lines: list[str]) -> dict:
    start = None
    for index, line in enumerate(lines):
        if line.strip() == "LIFE EVENTS":
            start = index
            break
    if start is None:
        return {"roll": "2d6", "entries": []}

    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].strip().startswith("Contacts, Allies"):
            end = index
            break
    table_text = "\n".join(lines[start:end])
    return {
        "roll": "2d6",
        "entries": parse_numbered_table(table_text, 2, 12),
    }


def extract_wartime_events(lines: list[str]) -> dict:
    start = None
    for index, line in enumerate(lines):
        if line.strip() == "WARTIME EVENTS":
            start = index
            break
    if start is None:
        return {"roll": "2d6", "entries": []}

    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].strip().startswith("FRIENDS & FAVOURS"):
            end = index
            break
    table_text = "\n".join(lines[start:end])
    return {
        "roll": "2d6",
        "entries": parse_numbered_table(table_text, 2, 12),
    }


def extract_naval_events(lines: list[str]) -> dict:
    start = None
    for index, line in enumerate(lines):
        if line.strip() == "NAVAL EVENTS" and index + 1 < len(lines) and "Roll 2d6" in lines[index + 1]:
            start = index
            break
    if start is None:
        return {"roll": "2d6", "entries": []}

    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].strip().startswith("NEW SKILLS"):
            end = index
            break
    table_text = "\n".join(lines[start:end])
    return {
        "roll": "2d6",
        "entries": parse_numbered_table(table_text, 2, 12),
    }


def canonical_heading(text: str) -> str:
    cleaned = text.upper().replace("SKIL L S", "SKILLS").rstrip(":")
    return re.sub(r"\s+", " ", cleaned).strip()


def table_key(heading: str) -> str:
    return {
        "SKILLS AND TRAINING": "skillsAndTraining",
        "RANKS AND BENEFITS": "ranksAndBenefits",
        "RANKS AND SKILLS": "ranksAndSkills",
        "MISHAPS": "mishaps",
        "EVENTS": "events",
        "CAREER PROGRESS": "careerProgress",
        "MUSTERING-OUT BENEFITS": "musteringOutBenefits",
    }.get(heading, re.sub(r"[^a-zA-Z0-9]+", "_", heading).strip("_").lower())


def trim_blank(lines: list[str]) -> list[str]:
    start = 0
    end = len(lines)
    while start < end and not lines[start].strip():
        start += 1
    while end > start and not lines[end - 1].strip():
        end -= 1
    return lines[start:end]


def first_non_career_tail(lines: list[str], start: int) -> int:
    for index in range(start + 1, len(lines)):
        if lines[index].strip() in {"Ancient Technology", "LIFE EVENTS"}:
            return index
    return len(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=CORE_PDF)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--all-books", action="store_true", help="Merge core and all supported supplement career tables.")
    args = parser.parse_args()

    text = pdftotext(args.pdf, 10, 36)
    sections = enrich_tables(split_core_sections(normalise_lines(text), args.pdf))
    missing = [career for career, *_ in CORE_CAREERS if career not in sections]
    if missing:
        raise SystemExit(f"Could not extract career sections: {', '.join(missing)}")

    wartime_events = {"roll": "2d6", "entries": []}
    naval_events = {"roll": "2d6", "entries": []}
    if args.all_books:
        for pdf, careers, min_index in SUPPLEMENT_BOOKS:
            book_lines = normalise_lines(pdftotext(pdf))
            book_sections = enrich_tables(split_supplement_sections(book_lines, pdf, careers, min_index))
            missing = [career for career, _heading in careers if career not in book_sections]
            if missing:
                raise SystemExit(f"Could not extract career sections from {pdf.name}: {', '.join(missing)}")
            sections.update(book_sections)
            if pdf.name == "Traveller - Book 01 - Mercenary (mgp3801).pdf":
                wartime_events = extract_wartime_events(book_lines)
            if pdf.name == "Traveller - Book 02 - High Guard (mgp3803).pdf":
                naval_events = extract_naval_events(book_lines)

    payload = {
        "metadata": {
            "id": "traveller-career-tables-local",
            "source": str(args.pdf.relative_to(ROOT)),
            "sources": sorted({data["source"] for data in sections.values()}),
            "generatedBy": "app/scripts/extract_local_career_tables.py",
            "localOnly": True,
            "gitIgnored": True,
            "containsVerbatimText": True,
        },
        "lifeEvents": extract_life_events(normalise_lines(text)),
        "wartimeEvents": wartime_events,
        "navalEvents": naval_events,
        "careers": sections,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote local career tables to {args.out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
