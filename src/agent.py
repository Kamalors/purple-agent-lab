"""Classes de base des agents.

- RedAgent : planifie des actions (technique ATT&CK) et les exécute contre le lab.
- BlueAgent : observe une action et renvoie une détection éventuelle.

L'exécution réelle est un point d'extension : `RedAgent.execute` par défaut ne
fait que journaliser (dry-run). Branchez-y VOTRE outillage autorisé (nmap, etc.)
en surchargeant `execute` dans une sous-classe. L'orchestrateur garantit que
`execute` n'est jamais appelé sur une cible hors allowlist.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from .events import AgentAction, Detection


class Agent(ABC):
    def __init__(self, name: str):
        self.name = name


class RedAgent(Agent):
    @abstractmethod
    def plan(self) -> list[AgentAction]:
        """Retourne les actions que cet agent veut lancer ce cycle."""

    def execute(self, action: AgentAction) -> dict:
        """Exécute l'action contre la cible (déjà validée par l'allowlist).

        Défaut = dry-run : on ne lance rien, on renvoie juste un marqueur.
        ponytail: hook laissé vide volontairement — l'exécution offensive réelle
        dépend de l'outillage autorisé de VOTRE lab ; surchargez ici.
        """
        return {"executed": False, "dry_run": True, "action": action.description}


class BlueAgent(Agent):
    @abstractmethod
    def analyze(self, action: AgentAction, result: dict) -> Detection | None:
        """Renvoie une Detection si l'action est repérée, sinon None."""
