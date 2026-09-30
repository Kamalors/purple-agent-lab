"""Garde-fous d'exécution.

En mode lab réel, RIEN ne doit jamais s'exécuter contre une cible hors
périmètre. Toute action Red passe par `TargetAllowlist.check` avant exécution ;
une cible non autorisée lève `TargetNotAllowed` et le cycle s'arrête.
"""

from __future__ import annotations

import ipaddress


class TargetNotAllowed(Exception):
    """Levée quand une action vise une cible hors du périmètre autorisé."""


class TargetAllowlist:
    """Périmètre autorisé : hosts exacts et/ou plages CIDR.

    On refuse par défaut : liste vide => tout est refusé.
    """

    def __init__(self, hosts: list[str] | None = None, cidrs: list[str] | None = None):
        self.hosts = set(hosts or [])
        self.networks = [ipaddress.ip_network(c, strict=False) for c in (cidrs or [])]

    def allows(self, target: str) -> bool:
        if target in self.hosts:
            return True
        try:
            ip = ipaddress.ip_address(target)
        except ValueError:
            return False  # nom d'hôte non listé explicitement => refusé
        return any(ip in net for net in self.networks)

    def check(self, target: str) -> None:
        if not self.allows(target):
            raise TargetNotAllowed(
                f"Cible '{target}' hors périmètre autorisé. "
                f"Ajoutez-la à l'allowlist du lab avant toute action."
            )
