"""Vérifs du squelette : allowlist fail-closed, cycle complet, couverture.

Stdlib only. Run: python tests/test_orchestrator.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.agent import BlueAgent, RedAgent
from src.events import AgentAction, Detection
from src.guardrails import TargetAllowlist, TargetNotAllowed
from src.orchestrator import PurpleOrchestrator


# --- Agents de démo (remplaçables par les vôtres) ---

class DemoRecon(RedAgent):
    def __init__(self, name, target):
        super().__init__(name)
        self.target = target

    def plan(self):
        return [AgentAction(self.name, "T1046", self.target, "port scan")]


class DemoSensor(BlueAgent):
    def analyze(self, action, result):
        if action.technique_id == "T1046":
            return Detection("scan-detector", action, "medium", "T1046")
        return None


class Silent(BlueAgent):
    def analyze(self, action, result):
        return None


def test_allowlist_refuse_par_defaut():
    assert TargetAllowlist().allows("1.2.3.4") is False


def test_allowlist_host_et_cidr():
    al = TargetAllowlist(hosts=["host.lab"], cidrs=["10.0.0.0/24"])
    assert al.allows("host.lab")
    assert al.allows("10.0.0.5")
    assert not al.allows("10.0.1.5")
    assert not al.allows("evil.example.com")


def test_allowlist_insensible_casse_et_espaces():
    al = TargetAllowlist(hosts=["Target.Lab"])
    assert al.allows("target.lab")
    assert al.allows("  TARGET.LAB  ")
    assert not al.allows("other.lab")


def test_cible_hors_perimetre_stoppe_le_cycle():
    al = TargetAllowlist(hosts=["10.0.0.1"])
    orch = PurpleOrchestrator(al, [DemoRecon("red", "8.8.8.8")], [DemoSensor("blue")])
    try:
        orch.run_cycle()
    except TargetNotAllowed:
        return
    raise AssertionError("le cycle aurait dû refuser une cible hors périmètre")


def test_cycle_detecte_et_calcule_couverture():
    al = TargetAllowlist(hosts=["10.0.0.1"])
    orch = PurpleOrchestrator(al, [DemoRecon("red", "10.0.0.1")], [DemoSensor("blue")])
    report = orch.run_cycle()
    assert report.attempted_techniques == {"T1046"}
    assert report.detected_techniques == {"T1046"}
    assert report.coverage == 1.0
    assert report.missed_techniques == set()


def test_technique_non_detectee_compte_comme_manquee():
    al = TargetAllowlist(hosts=["10.0.0.1"])
    orch = PurpleOrchestrator(al, [DemoRecon("red", "10.0.0.1")], [Silent("blue")])
    report = orch.run_cycle()
    assert report.coverage == 0.0
    assert report.missed_techniques == {"T1046"}


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"ok  {t.__name__}")
    print(f"\n{len(tests)} tests passés.")
