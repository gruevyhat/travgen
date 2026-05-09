import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "app" / "src" / "data"
sys.path.insert(0, str(ROOT))

from traveller import data, names


def tuple_keyed(mapping):
    return {"|".join(key): value for key, value in mapping.items()}


game_data = {
    "STARTING_AGE": data.STARTING_AGE,
    "STARTING_SKILLS": data.STARTING_SKILLS,
    "COMMISSION": data.COMMISSION,
    "FIELDS": data.FIELDS,
    "TERM": data.TERM,
    "CAREERS": data.CAREERS,
    "PSION": data.PSION,
    "AGENT": data.AGENT,
    "CHTHONIAN_STARS": data.CHTHONIAN_STARS,
    "SCOUNDREL": data.SCOUNDREL,
    "DILETTANTE": data.DILETTANTE,
    "FALLBACK_CAREERS": data.FALLBACK_CAREERS,
    "SKILLS": tuple_keyed(data.SKILLS),
    "RANKS": tuple_keyed(data.RANKS),
    "AGING": data.AGING,
    "BENEFITS": data.BENEFITS,
    "CREDITS": data.CREDITS,
    "DRAFT": data.DRAFT,
    "EDU_SKILLS": data.EDU_SKILLS,
    "WORLDS": data.WORLDS,
    "SKILL_TYPES": data.SKILL_TYPES,
    "WORLD_ADJ": data.WORLD_ADJ,
    "PERSONALITIES": data.PERSONALITIES,
}

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "gameData.json").write_text(
    json.dumps(game_data, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
(OUT / "nameData.json").write_text(
    json.dumps({"NAMES": names.NAMES, "CTHUVIAN": names.CTHUVIAN}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
