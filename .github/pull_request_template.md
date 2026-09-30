<!-- PR vers `staging` (branche tampon), jamais vers `main` directement. -->

## Quoi
<!-- Ce que change cette PR, en une phrase -->

## Pourquoi
<!-- Le contexte / l'objectif -->

## Checklist
- [ ] La PR cible **`staging`** (pas `main`)
- [ ] Cibles **autorisées uniquement** (allowlist) — aucun système tiers, données fictives
- [ ] Les tests passent (`python tests/test_orchestrator.py` && `python tests/test_llm_injection.py`)
- [ ] Logique non triviale couverte par un test
- [ ] Technique taguée **MITRE ATT&CK / ATLAS** si pertinent
