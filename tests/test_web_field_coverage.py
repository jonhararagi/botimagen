from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = ROOT / "character_rules.json"
APP_PATH = ROOT / "web" / "src" / "App.tsx"


def main() -> None:
    rules = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    source = APP_PATH.read_text(encoding="utf-8")

    field_pairs = re.findall(r'\{id:"([a-z_]+)",group:"([a-z]+)",label:', source)
    field_ids = [field_id for field_id, _group in field_pairs]
    duplicates = sorted({field_id for field_id in field_ids if field_ids.count(field_id) > 1})
    expected = set(rules.get("categories", {}))
    configured = set(field_ids)

    missing = sorted(expected - configured)
    extra = sorted(configured - expected)
    assert not duplicates, f"Duplicate editor fields: {duplicates}"
    assert not missing, f"Catalog categories are not editable in web UI: {missing}"
    assert not extra, f"Editor fields missing from official catalog: {extra}"

    tabs_match = re.search(r"const tabs:.*?\n\];", source, re.DOTALL)
    assert tabs_match, "Could not find editor tab definitions"
    tab_ids = set(re.findall(r'\{id:"([a-z]+)",label:', tabs_match.group(0)))
    field_groups = {group for _field_id, group in field_pairs}
    assert field_groups == tab_ids, (
        f"Field groups and tabs differ: groups={sorted(field_groups)}, tabs={sorted(tab_ids)}"
    )
    assert len(tab_ids) == 8, f"Expected 8 editor categories, found {len(tab_ids)}"


    # Guard against saving/exporting a selection draft with a stale generated prompt.
    assert 'const [draftDirty,setDraftDirty]=useState(false);' in source
    assert 'if(draftDirty){setStatus("Hay cambios pendientes.' in source
    assert 'disabled={!generated||draftDirty||generating}' in source
    assert 'draftDirty?"CAMBIOS PENDIENTES"' in source
    assert 'setDraftDirty(true);setSaved(false)' in source, "Seed/coherence edits must invalidate the generated snapshot"
    assert 'staleSelection=!profileResult||fields.some' in source, "Legacy inconsistent profiles should require regeneration"

    print(
        f"PASS: {len(configured)} catalog categories map to {len(tab_ids)} web editor tabs and draft sync safeguards"
    )


if __name__ == "__main__":
    main()
