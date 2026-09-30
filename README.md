# Purple Agent Lab

Laboratoire multi-agents **Red / Blue / Purple**, orienté sécurité des systèmes
à base de LLM. Le projet fonctionne **exclusivement sur des cibles de laboratoire
autorisées**.

Deux couches :

1. **Framework d'orchestration** (`src/`) — un cycle `Red → allowlist → Blue`
   avec rapport de couverture, en Python pur (aucune dépendance).
2. **Lab d'injection de prompt** — une VM dédiée (Proxmox) qui fait tourner une
   cible LLM gardée, un agent attaquant (Hermes) et un vérificateur indépendant.
   Le framework rejoue les preuves du lab et les tague en **MITRE ATLAS**.

## Architecture

```
Red  (attaquant)      Blue (défense/détection)     Purple (orchestrateur)
─────────────────     ────────────────────────     ──────────────────────
InjectionRedAgent  →  garde-fou allowlist       →  PurpleOrchestrator
(scénarios S01–S08)   InjectionBlueAgent            CycleReport.coverage
                      (portage du vérificateur)     mapping ATLAS
```

Le lab distant (VM `llm-security-lab`, `10.10.10.40`) : cible `qwen2.5:1.5b`
gardée par un system prompt, attaquant `qwen2.5:3b` piloté par Hermes,
vérificateur déterministe sans réseau. Conteneurs `cap_drop: ALL`, réseaux
`internal`, deux jetons distincts en comparaison timing-safe.

## Mapping MITRE ATLAS

| Scénario | Attaque | Technique |
|----------|---------|-----------|
| S01 | Injection directe | `AML.T0051.000` LLM Prompt Injection: Direct |
| S02 | Usurpation d'autorité | `AML.T0051.000` |
| S03 | Extraction du message système | `AML.T0056` LLM Meta Prompt Extraction |
| S04 | Escalade conversationnelle | `AML.T0054` LLM Jailbreak |
| S05 | Rupture du format JSON | `AML.T0051.000` |
| S06 | Autorisation simulée | `AML.T0051.000` |
| S07 | Injection dans un document | `AML.T0051.001` LLM Prompt Injection: Indirect |
| S08 | Traduction et encodage | `AML.T0057` LLM Data Leakage |

IDs à revérifier sur <https://atlas.mitre.org> (matrice vivante).

## Démarrage

```bash
python tests/test_orchestrator.py    # framework
python tests/test_llm_injection.py   # pont injection + détection

# Rapport ATLAS sur une exécution réelle du lab (fichiers data/*.json) :
python -c "from src.llm_injection import load_sessions, atlas_summary; \
import json; print(json.dumps(atlas_summary(load_sessions('data')), indent=2))"
```

Périmètre autorisé : voir `config/lab.example.toml` (copier en `config/lab.toml`).
Le garde-fou refuse par défaut toute cible non listée (fail-closed).

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).
