"""Orchestrateur Purple : fait tourner un cycle Red -> (allowlist) -> Blue.

Pour chaque action planifiée par les Red agents :
  1. l'allowlist valide la cible (sinon le cycle s'arrête, fail-closed) ;
  2. l'agent exécute l'action (dry-run par défaut) ;
  3. chaque Blue agent l'analyse ;
  4. on enregistre couverture et détections pour le rapport final.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from .agent import BlueAgent, RedAgent
from .events import AgentAction, Detection
from .guardrails import TargetAllowlist

log = logging.getLogger("purple")


@dataclass
class CycleReport:
    actions: list[AgentAction] = field(default_factory=list)
    detections: list[Detection] = field(default_factory=list)

    @property
    def detected_techniques(self) -> set[str]:
        return {d.technique_id for d in self.detections}

    @property
    def attempted_techniques(self) -> set[str]:
        return {a.technique_id for a in self.actions}

    @property
    def coverage(self) -> float:
        """Part des techniques tentées qui ont été détectées (0..1)."""
        if not self.attempted_techniques:
            return 0.0
        return len(self.detected_techniques & self.attempted_techniques) / len(
            self.attempted_techniques
        )

    @property
    def missed_techniques(self) -> set[str]:
        return self.attempted_techniques - self.detected_techniques


class PurpleOrchestrator:
    def __init__(
        self,
        allowlist: TargetAllowlist,
        red: list[RedAgent],
        blue: list[BlueAgent],
    ):
        self.allowlist = allowlist
        self.red = red
        self.blue = blue

    def run_cycle(self) -> CycleReport:
        report = CycleReport()
        for agent in self.red:
            for action in agent.plan():
                self.allowlist.check(action.target)  # fail-closed avant exécution
                log.info("RED %s -> %s (%s) sur %s",
                         agent.name, action.technique_id, action.description, action.target)
                result = agent.execute(action)
                report.actions.append(action)

                for defender in self.blue:
                    det = defender.analyze(action, result)
                    if det is not None:
                        log.info("BLUE %s détecte %s (%s)",
                                 defender.name, det.technique_id, det.severity)
                        report.detections.append(det)
        return report
