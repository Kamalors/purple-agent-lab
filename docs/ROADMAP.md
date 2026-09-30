# Roadmap — Purple Agent Lab

> Cadre : tout se déroule sur des **cibles de laboratoire autorisées**, avec
> données fictives, allowlist fail-closed. Chaque agent Red existe pour **produire
> du signal mesurable côté Blue** — la finalité est défensive (mesurer et
> améliorer la robustesse), pas offensive dans le monde réel.

## Étape 1 — Fondations (FAITE)

Le socle purple team complet :

- Framework d'orchestration **Red → Blue → Purple** (`src/`), Python stdlib.
- Lab d'injection de prompt en conteneurs Docker durcis (`lab/`) : cible LLM
  gardée, agent attaquant (Hermes), **vérificateur indépendant déterministe**.
- 8 scénarios d'injection mappés **MITRE ATLAS** (T0051 direct/indirect, T0054
  jailbreak, T0056 extraction de prompt système, T0057 fuite de données).
- **Dashboard** : carte des attaques animée, narration Stratégie/Technique,
  courbes d'historique, couverture ATLAS ; **Grafana** pour les séries temporelles.
- Provisioning reproductible (`deploy/`) sur VM Proxmox.

## Vision — des agents Red spécialisés par phase

Les prochaines étapes suivent la kill-chain, **une IA spécialiste par phase**.
Chacune est un `RedAgent` du framework (`plan()` / `execute()`), gardée par
l'allowlist, et chaque action porte un `technique_id` ATLAS/ATT&CK pour que le
Blue construise la détection correspondante. Specs détaillées dans
[`docs/personas/`](personas/).

### Étape 2a — Agent RECON (`docs/personas/recon-agent.md`)
Reconnaissance **avant** l'attaque : empreinte du modèle cible, cartographie de la
surface (endpoints, scénarios), découverte des garde-fous et des schémas de refus.
Produit le contexte que l'agent Exploit utilise. Actions bénignes, non destructives.

### Étape 2b — Agent EXPLOIT (`docs/personas/exploit-agent.md`)
Génère et adapte les **injections** qui font céder la cible, à partir du recon.
Généralise ce que font aujourd'hui la campagne + Hermes, en un spécialiste
adaptatif (multi-tours, variantes par technique ATLAS). Passe par l'interface
sanctionnée du lab.

### Étape 2c — Agent POST-EXPLOIT (`docs/personas/post-exploit-agent.md`)
Une fois une injection réussie, **mesure la profondeur** de la compromission
dans le lab : jusqu'où va la fuite (chaînes d'encodage), persistance sur plusieurs
tours, enchaînement de règles cassées. Données fictives, tours bornés.

### Étape 3 — Blue enrichi + boucle purple continue
Pour chaque technique des agents Red : détections dédiées côté Blue, alerting
Grafana, et une boucle « attaque → détection → durcissement → re-mesure »
automatisée, avec suivi des progrès dans le temps (courbes déjà en place).

## Principe directeur

Un agent Red n'a de valeur que par la **détection qu'il permet de construire** et
la **mesure de robustesse** qu'il fournit. Pas d'agent offensif sans le pendant
défensif et sans le garde-fou de périmètre.
