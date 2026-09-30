# Contribuer au Purple Agent Lab

Merci de venir bricoler sur ce lab ! C'est un projet **d'apprentissage de la
sécurité des LLM** : on attaque, on défend, on mesure — uniquement sur nos
propres cibles de laboratoire.

## Règle unique et non négociable

**Tout tourne sur des cibles de lab autorisées, jamais sur des systèmes tiers.**
Le garde-fou (`src/guardrails.py`) refuse par défaut toute cible non déclarée
dans `config/lab.toml`. Ne le contourne pas.

## Mettre le pied à l'étrier (5 min)

```bash
git clone https://github.com/Kamalors/purple-agent-lab
cd purple-agent-lab
python tests/test_orchestrator.py
python tests/test_llm_injection.py
```

Aucune dépendance : Python 3.11+ (stdlib uniquement). Les tests sont des scripts
`assert`, pas de framework.

## Où contribuer

- **Nouveaux scénarios d'injection** — ajoute une entrée dans `SCENARIOS`
  (`src/llm_injection.py`) + un indicateur de détection dans `detect()` + un cas
  de test. Tague la technique [MITRE ATLAS](https://atlas.mitre.org).
- **Détection (Blue)** — améliore `detect()` : fuites partielles, homoglyphes,
  autres encodages. Chaque indicateur = un test.
- **Agents Red/Blue** — implémente `RedAgent.plan/execute` ou `BlueAgent.analyze`
  pour de nouvelles familles d'attaque.
- **Rapport (Purple)** — enrichis `CycleReport` / `atlas_summary`.

## Style

- Le plus simple qui marche. Pas de dépendance pour ce qu'une poignée de lignes fait.
- Toute logique non triviale laisse **un test exécutable** qui casse si elle casse.
- Une branche par sujet, une PR courte, un test qui passe.

## Sécurité

Une faille réelle (pas un scénario de lab) ? N'ouvre pas d'issue publique :
contacte le mainteneur en privé.
