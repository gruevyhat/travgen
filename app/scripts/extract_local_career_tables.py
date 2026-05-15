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
DEFAULT_PDF = ROOT / "books" / "Traveller - Core Rulebook (mgp3800).pdf"
DEFAULT_OUT = ROOT / "app" / "src" / "data" / "coreCareerTables.local.json"
CAREERS = [
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


def pdftotext(pdf: Path) -> str:
    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")
    if not shutil.which("pdftotext"):
        raise SystemExit("pdftotext is required. Install poppler/pdftotext first.")
    result = subprocess.run(
        ["pdftotext", "-layout", "-f", "10", "-l", "36", str(pdf), "-"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout


def normalise_lines(text: str) -> list[str]:
    return [line.rstrip() for line in text.splitlines()]


def split_sections(lines: list[str]) -> dict[str, dict]:
    starts = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        for career, heading, page in CAREERS:
            if stripped == heading:
                starts.append((index, career, page))
    starts.sort()

    sections = {}
    for position, (start, career, page) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else first_non_career_tail(lines, start)
        section = trim_blank(lines[start:end])
        sections[career] = {
            "sourcePage": page,
            "verbatimSection": "\n".join(section),
            "tables": split_tables(section),
        }
    return sections


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


def parse_numbered_table(text: str, min_roll: int, max_roll: int) -> list[dict]:
    entries = []
    seen = set()
    current = None
    for raw_line in text.splitlines():
        line = raw_line.strip()
        match = re.match(rf"^({min_roll}|[3-9]|1[0-2])\s+(.*)$", line)
        if min_roll == 1:
            match = re.match(r"^([1-6])\s+(.*)$", line)
        if match:
            roll = int(match.group(1))
            if min_roll <= roll <= max_roll:
                if roll in seen and current:
                    current["text"] = f"{current['text']} {line}".strip()
                else:
                    current = {"roll": roll, "text": match.group(2).strip()}
                    entries.append(current)
                    seen.add(roll)
                continue
        if current and line and not line.lower().startswith(("1d6", "2d6", "roll")):
            current["text"] = f"{current['text']} {line}".strip()
    return entries


def enrich_tables(sections: dict[str, dict]) -> dict[str, dict]:
    for career, data in sections.items():
        tables = data["tables"]
        if "mishaps" in tables:
            data["mishaps"] = {
                "roll": "1d6",
                "entries": parse_numbered_table(tables["mishaps"], 1, 6),
            }
        if "events" in tables:
            data["events"] = {
                "roll": "2d6",
                "entries": parse_numbered_table(tables["events"], 2, 12),
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
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    text = pdftotext(args.pdf)
    sections = enrich_tables(split_sections(normalise_lines(text)))
    missing = [career for career, *_ in CAREERS if career not in sections]
    if missing:
        raise SystemExit(f"Could not extract career sections: {', '.join(missing)}")

    payload = {
        "metadata": {
            "id": "mgp3800-core-career-tables-local",
            "source": str(args.pdf.relative_to(ROOT)),
            "generatedBy": "app/scripts/extract_local_career_tables.py",
            "localOnly": True,
            "gitIgnored": True,
            "containsVerbatimText": True,
        },
        "lifeEvents": extract_life_events(normalise_lines(text)),
        "careers": sections,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote local career tables to {args.out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
