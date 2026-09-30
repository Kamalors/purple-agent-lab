# AGENTS.md — reprise du projet par une IA (ou un humain)

Ce fichier permet à un agent IA ou à un nouveau contributeur de **reprendre le
projet** sans contexte préalable. Lis-le en entier avant d'agir.

## Règle n°1 (non négociable)

**Tout se fait sur des cibles de laboratoire autorisées, jamais sur des systèmes
tiers.** Le garde-fou `src/guardrails.py` (`TargetAllowlist`) refuse par défaut
toute cible non déclarée dans `config/lab.toml` (fail-closed). On ne le contourne
pas. Données synthétiques uniquement. But du projet = **mesurer et améliorer les
défenses** (purple team), pas attaquer le monde réel.

## En une phrase

Purple Agent Lab teste la robustesse des LLM face aux **injections de prompt** :
un côté **Red** attaque, un côté **Blue** (cible gardée) défend, un **Purple**
(vérificateur indépendant) mesure objectivement, mappé sur **MITRE ATLAS**.

## Carte du dépôt

| Chemin | Rôle |
|--------|------|
| `src/` | Framework d'orchestration Red→Blue→Purple (Python pur, 0 dépendance) |
| `src/orchestrator.py` | `PurpleOrchestrator.run_cycle()` : Red → allowlist → Blue → `CycleReport` |
| `src/agent.py` | Bases `RedAgent` (`plan`/`execute`) et `BlueAgent` (`analyze`) |
| `src/guardrails.py` | `TargetAllowlist` fail-closed (host + CIDR) |
| `src/events.py` | `AgentAction` / `Detection` (portent un `technique_id` ATLAS) |
| `src/llm_injection.py` | Pont : 8 scénarios tagués ATLAS + portage des indicateurs du vérificateur |
| `lab/` | Le lab d'injection déployé en conteneurs Docker (cible, attaquant, vérificateur, dashboard) |
| `lab/app/` | API + cible LLM gardée (`server.mjs`, `scenarios.mjs`) |
| `lab/verifier/verify.mjs` | Vérificateur déterministe (source de vérité des verdicts) |
| `lab/dashboard/` | Conteneur dashboard live (sert `dashboard.html` + `/report` + `/history`) |
| `lab/grafana/` | Grafana provisionné (datasource Infinity + dashboard ATLAS) |
| `deploy/` | `provision.sh` (VM Proxmox), `campaign.sh`, `add-dashboard.sh`, `add-grafana.sh` |
| `dashboard.html` | Tableau de bord (carte d'attaques, narration 2 modes, courbes, ATLAS) |
| `docs/ROADMAP.md` | Les étapes du projet (celle-ci = Étape 1) |
| `docs/personas/` | Specs des futurs agents (recon, exploit, post-exploit) |
| `tests/` | Tests stdlib (`python tests/test_*.py`) |

Git-ignorés (spécifiques machine, jamais commités) : `config/lab.toml`,
`rebuild-lab.ps1`, `get-report.ps1`, `deploy-dashboard.ps1`, `report.json`.

## État actuel — Étape 1 : FAITE

Framework + lab d'injection + vérificateur + dashboard (carte animée, narration
Stratégie/Technique, courbes historiques, mapping ATLAS) + Grafana. Le lab tourne
sur une VM Proxmox et produit des rapports (`reports/latest.json`) scorés
indépendamment. Voir `docs/ROADMAP.md` pour la suite.

## Démarrer

```bash
python tests/test_orchestrator.py      # framework
python tests/test_llm_injection.py     # pont injection + détection
# ouvrir dashboard.html dans un navigateur
```

Lancer une campagne (avec accès au lab) : `deploy/campaign.sh` dans la VM, puis
charger `reports/latest.json` dans le dashboard (ou conteneur dashboard live).

## Conventions

- **Python stdlib uniquement** (pas de dépendance ajoutée sans raison forte).
- **Fins de ligne LF** pour tous les scripts (`.gitattributes` le force ; les `.sh`
  cassent en CRLF dans la VM Linux).
- Toute logique non triviale laisse **un test exécutable** (`assert`, pas de framework).
- Un `RedAgent` planifie des `AgentAction` (avec `technique_id` ATLAS) ; un
  `BlueAgent` renvoie une `Detection`. L'orchestrateur valide la cible via
  l'allowlist **avant** toute exécution.
- Nouveau scénario d'injection : entrée dans `SCENARIOS` (`src/llm_injection.py`)
  + indicateur dans `detect()` + cas de test + tag ATLAS. Miroir côté lab :
  `lab/app/scenarios.mjs` + `lab/verifier/verify.mjs`.

## Limites connues (contexte harnais)

- Le classifieur de sécurité de Claude Code peut bloquer : SSH vers la VM invitée,
  `qm guest exec`, modification des settings. Contourner = non. Passer par
  l'utilisateur (scripts à lancer) quand c'est le cas.
- La cible est déterministe (temp 0, seed 42) : rejouer les mêmes seeds donne les
  mêmes verdicts. Pour de la variété : nouveaux seeds, vrai agent Hermes, ou
  autres modèles.

## Suite du projet

`docs/ROADMAP.md` + les personas dans `docs/personas/`. Prochaines briques : des
agents Red spécialisés (recon, exploit, post-exploit), chacun un `RedAgent` du
framework, gardé par l'allowlist, dont la valeur est le **signal produit pour la
détection Blue**.
