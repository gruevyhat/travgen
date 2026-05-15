#!/usr/bin/env python3
"""Build normalized character-generation facts from local Traveller PDFs.

This script intentionally writes structured facts only. It uses pdftotext as a
local extraction prerequisite so future table extraction can be audited against
the source PDF, but it does not write or commit raw extracted book text.
"""

import argparse
import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PDF = ROOT / "books" / "Traveller - Core Rulebook (mgp3800).pdf"
DEFAULT_OUT = ROOT / "app" / "src" / "data" / "coreRules.json"


def verify_pdf_readable(pdf: Path) -> None:
    if not pdf.exists():
        raise SystemExit(f"PDF not found: {pdf}")
    if not shutil.which("pdftotext"):
        raise SystemExit("pdftotext is required for extraction auditing")
    subprocess.run(
        ["pdftotext", "-f", "1", "-l", "1", "-layout", str(pdf), "-"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    verify_pdf_readable(args.pdf)
    data = json.loads(args.out.read_text(encoding="utf-8"))
    data["metadata"]["source"] = str(args.pdf.relative_to(ROOT))
    data["metadata"]["rawTextCommitted"] = False
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"validated extraction source and refreshed {args.out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
