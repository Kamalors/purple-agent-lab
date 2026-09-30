"""Chargement de config lab (TOML, stdlib tomllib).

Le fichier de config déclare le périmètre autorisé. C'est le seul endroit où
les cibles du lab sont définies -> une source de vérité pour l'allowlist.
"""

from __future__ import annotations

import tomllib
from pathlib import Path

from .guardrails import TargetAllowlist


def load_allowlist(path: str | Path) -> TargetAllowlist:
    data = tomllib.loads(Path(path).read_text(encoding="utf-8"))
    scope = data.get("scope", {})
    return TargetAllowlist(hosts=scope.get("hosts"), cidrs=scope.get("cidrs"))
