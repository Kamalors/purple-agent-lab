# Purple Agent Lab

**Des équipes d'agents IA qui réalisent des audits de sécurité de niveau
intermédiaire sur des infrastructures — exclusivement autorisées.**

Méthodologie **purple team** : des agents **Red** trouvent les faiblesses, des
agents **Blue** les détectent, un **Purple** orchestre le tout et produit un
**rapport actionnable**, mappé sur **MITRE ATT&CK / ATLAS**. Le but est
**défensif** : trouver, expliquer, aider à corriger — pas attaquer pour attaquer.

> ⚠️ **Périmètre non négociable.** Uniquement des cibles pour lesquelles tu as une
> **autorisation écrite** et un périmètre défini. Garde-fou **fail-closed**
> (`src/guardrails.py` refuse toute cible hors allowlist) + **validation humaine**
> avant toute action à impact. Jamais de systèmes tiers, jamais de destruction.

## Le principe (réutilisable)

Un audit se décompose en phases ; à chaque phase, un **agent spécialisé** :

| Côté | Rôle | Agents |
|------|------|--------|
| **Red** | Trouver | Recon → Exploit → Post-Exploit |
| **Blue** | Détecter | Détections + règles, mesure ce que le Red déclenche |
| **Purple** | Orchestrer & mesurer | Cycle, mapping ATT&CK, **rapport** + tableau de bord |

Chaque agent Red est un `RedAgent` du framework (`plan()` / `execute()`), gardé par
l'allowlist ; chaque action porte un `technique_id` MITRE pour que le Blue
construise la détection correspondante. **Un agent Red n'a de valeur que par la
détection qu'il permet et la mesure de robustesse qu'il fournit.**

## Où on en est

**Étape 1 — FAITE (preuve du pattern sur un cas concret : la sécurité des LLM).**
Un lab complet où un agent attaque un LLM par injection de prompt, un modèle gardé
défend, et un vérificateur indépendant mesure — avec dashboard animé (carte
d'attaques, kill-chain ATT&CK, courbes, narration) et Grafana. C'est le **squelette
Red/Blue/Purple** qui sera généralisé aux infrastructures.

**Vision — équipes d'agents pour audits d'infra.** Les mêmes briques
(orchestrateur, allowlist, mapping ATT&CK, rapport) pilotent des agents Recon /
Exploit / Post-Exploit sur une infra autorisée, pour un audit de niveau
intermédiaire aboutissant à un rapport pour les défenseurs. Voir
[docs/ROADMAP.md](docs/ROADMAP.md).

## Garde-fous (non négociables)

- **Autorisation écrite** + périmètre explicitement défini avant tout audit.
- **Allowlist fail-closed** : aucune cible non déclarée n'est touchée.
- **Humain dans la boucle** : validation avant toute action à impact.
- **Preuves horodatées** et rapport orienté remédiation (aider à corriger).
- **Niveau intermédiaire, non destructif** : pas d'armes, pas de DoS, pas de cibles tierces.

## Structure du dépôt

| Chemin | Rôle |
|--------|------|
| `src/` | Framework d'orchestration Red→Blue→Purple (Python pur, réutilisable) |
| `lab/` | Étape 1 : lab d'injection LLM en conteneurs Docker durcis |
| `deploy/` | Provisioning reproductible (VM Proxmox) + campagnes |
| `dashboard.html` | Tableau de bord (carte d'attaques, kill-chain ATT&CK, courbes, ATLAS) |
| `docs/ROADMAP.md` | Les étapes (celle-ci = Étape 1) |
| `docs/personas/` | Specs des agents (recon / exploit / post-exploit) |
| `AGENTS.md` | Reprise du projet par une IA ou un contributeur |
| `tests/` | Tests stdlib |

## MITRE ATLAS — couverture de l'Étape 1 (LLM)

| Scénario | Technique |
|----------|-----------|
| S01 Injection directe / S02 Usurpation | `AML.T0051.000` Prompt Injection: Direct |
| S03 Extraction du message système | `AML.T0056` Meta Prompt Extraction |
| S04 Escalade | `AML.T0054` LLM Jailbreak |
| S07 Injection dans un document | `AML.T0051.001` Prompt Injection: Indirect |
| S08 Traduction / encodage | `AML.T0057` LLM Data Leakage |

Les audits d'infra (étapes suivantes) s'appuieront sur **MITRE ATT&CK** (recon,
accès initial, mouvement, exfiltration…), même logique de mapping.

## Prérequis

**Contribuer au code** : Python 3.11+ (stdlib), Git + GitHub, **Claude Code
(Opus 4.8/5.5 recommandé)**, un navigateur. **Lancer le lab** : accès SSH à la VM
(clé ajoutée par le mainteneur) ou ton propre Proxmox VE 9.x. Détail :
[CONTRIBUTING.md](CONTRIBUTING.md).

## Démarrage

```bash
git clone https://github.com/Kamalors/purple-agent-lab
cd purple-agent-lab
python tests/test_orchestrator.py
python tests/test_llm_injection.py
# puis ouvrir dashboard.html
```

## Contribuer

[CONTRIBUTING.md](CONTRIBUTING.md) · [AGENTS.md](AGENTS.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/DECISIONS.md](docs/DECISIONS.md).
Règle unique et absolue : **cibles autorisées uniquement**.
