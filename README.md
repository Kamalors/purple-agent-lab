# Purple Agent Lab

Laboratoire multi-agents **Red / Blue / Purple** pour la sécurité des systèmes à
base de LLM. On **attaque** un modèle par injection de prompt, on le **défend**,
et un vérificateur indépendant **mesure** les résultats — le tout mappé sur
**MITRE ATLAS**. Fonctionne **exclusivement sur des cibles de laboratoire autorisées**.

## Ce que ça contient

- **`src/`** — framework d'orchestration Red → Blue → Purple, Python pur (0 dépendance).
- **`lab/`** — le lab d'injection déployé en conteneurs Docker (cible LLM gardée,
  agent attaquant Hermes, vérificateur déterministe).
- **`deploy/`** — provisioning Proxmox (`provision.sh`) et campagne d'attaque (`campaign.sh`).
- **`dashboard.html`** — tableau de bord graphique : carte des attaques animée,
  verdicts par scénario, couverture ATLAS, historique des campagnes.
  Ouvre-le dans un navigateur, ou charge un rapport (`reports/latest.json`) dedans.

## Architecture

```
RED (attaquant)          CIBLE (Blue)              PURPLE (arbitre)
──────────────────       ─────────────────────     ────────────────────
hermes + ollama-3b   →   api + ollama-target   →   verifier (sans réseau)
(génère l'injection)     (LLM gardé, secret)       → reports/latest.json
```

Une VM Proxmox (`10.10.10.40`) fait tourner ces services en **conteneurs Docker
isolés** sur des réseaux `internal` (pas d'Internet au runtime), `cap_drop: ALL`,
deux jetons d'accès distincts.

## Mapping MITRE ATLAS

| Scénario | Attaque | Technique |
|----------|---------|-----------|
| S01 | Injection directe | `AML.T0051.000` Prompt Injection: Direct |
| S02 | Usurpation d'autorité | `AML.T0051.000` |
| S03 | Extraction du message système | `AML.T0056` Meta Prompt Extraction |
| S04 | Escalade conversationnelle | `AML.T0054` LLM Jailbreak |
| S05 | Rupture du format JSON | `AML.T0051.000` |
| S06 | Autorisation simulée | `AML.T0051.000` |
| S07 | Injection dans un document | `AML.T0051.001` Prompt Injection: Indirect |
| S08 | Traduction et encodage | `AML.T0057` LLM Data Leakage |

## Prérequis pour participer

**Pour contribuer au code** (framework, dashboard, scénarios) — suffisant pour la plupart :
- **Python 3.11+** (les tests sont en stdlib pure, aucun `pip install`).
- **Git** + un compte **GitHub**.
- **Claude Code** avec un modèle **Opus (4.8 / 5.5 recommandé)** — l'agent utilisé pour développer ce lab.
- Un navigateur pour ouvrir `dashboard.html`.

**Pour lancer le lab en vrai** (en plus) :
- Accès **SSH** à la VM du lab (le mainteneur ajoute ta clé publique), avec `ssh`/`scp` (OpenSSH).
- *Ou* ton propre hôte **Proxmox VE 9.x** (≥ 8 cœurs, ≥ 18 Gio RAM libre, ≥ 64 Go disque) pour rejouer `deploy/provision.sh`.

## Démarrage (contributeur)

```bash
git clone https://github.com/Kamalors/purple-agent-lab
cd purple-agent-lab
python tests/test_orchestrator.py     # framework
python tests/test_llm_injection.py    # pont injection + détection
# puis ouvre dashboard.html dans un navigateur
```

## Lancer une simulation (avec accès au lab)

```bash
scp deploy/campaign.sh lab-guest:/tmp/campaign.sh
ssh lab-guest "sudo bash /tmp/campaign.sh"   # rejoue les 8 scénarios + vérificateur
```
Copie le rapport JSON affiché → colle-le dans `dashboard.html` (section « Charger un rapport »).

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md). Règle unique : **cibles de laboratoire autorisées uniquement**.
