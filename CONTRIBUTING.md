# Contribuer au Purple Agent Lab

Merci de venir bricoler sur ce lab ! C'est un projet **d'apprentissage de la
sécurité des LLM** : on attaque, on défend, on mesure — uniquement sur nos
propres cibles de laboratoire.

## Règle unique et non négociable

**Tout tourne sur des cibles de lab autorisées, jamais sur des systèmes tiers.**
Le garde-fou (`src/guardrails.py`) refuse par défaut toute cible non déclarée
dans `config/lab.toml`. Ne le contourne pas.

## Prérequis

- **Python 3.11+** (stdlib uniquement, aucun `pip install`).
- **Git** + compte **GitHub**.
- **Claude Code** avec un modèle **Opus (4.8 / 5.5 recommandé)** — l'agent utilisé ici.
- Un navigateur pour `dashboard.html`.
- *Pour le lab en vrai* : accès **SSH** à la VM (le mainteneur ajoute ta clé), ou ton propre **Proxmox VE 9.x**.

Détail complet dans le [README](README.md#prérequis-pour-participer).

## Mettre le pied à l'étrier (5 min)

```bash
git clone https://github.com/Kamalors/purple-agent-lab
cd purple-agent-lab
python tests/test_orchestrator.py
python tests/test_llm_injection.py
```

Les tests sont des scripts `assert`, pas de framework. Ouvre ensuite `dashboard.html`
dans un navigateur pour voir la carte des attaques et charger un rapport.

## Flux de contribution (branches)

`main` est **protégé** : aucun commit direct. Les changements passent par une
**branche tampon commune** (`staging`) avant `main`.

1. **Ta branche perso** — travaille sur `dev/<ton-pseudo>` (ou `feat/<sujet>`) :
   ```bash
   git checkout -b dev/alice
   # ... commits ...
   git push -u origin dev/alice
   ```
2. **Branche tampon `staging`** — ouvre une **PR de ta branche vers `staging`**.
   C'est là que les contributions se rassemblent et sont revues.
3. **`main`** — le mainteneur fusionne `staging` → `main` par PR (revue requise),
   quand l'intégration est stable.

```
dev/<pseudo>  ──PR──▶  staging (tampon)  ──PR + revue──▶  main
```

Règles appliquées par GitHub : `main` requiert une PR + 1 revue ; `staging`
requiert une PR ; **pas de push direct** sur `main`/`staging`, pas de force-push.
Un sujet = une branche = une PR courte + un test qui passe.

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
