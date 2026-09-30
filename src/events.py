"""Événements échangés dans un cycle purple team.

Une seule source de vérité : les Red agents émettent des `AgentAction`,
les Blue agents renvoient des `Detection`. Chaque objet porte un technique_id
MITRE ATT&CK pour que le Purple puisse mesurer la couverture.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass(frozen=True)
class AgentAction:
    """Action planifiée par un Red agent contre une cible de lab autorisée."""

    actor: str
    technique_id: str          # ex: "T1046" (Network Service Discovery)
    target: str                # host/ip — DOIT être dans l'allowlist
    description: str
    params: dict = field(default_factory=dict)
    ts: float = field(default_factory=time.time)


@dataclass(frozen=True)
class Detection:
    """Verdict d'un Blue agent sur une action observée."""

    rule: str
    action: AgentAction
    severity: str              # "low" | "medium" | "high" | "critical"
    technique_id: str
    ts: float = field(default_factory=time.time)
