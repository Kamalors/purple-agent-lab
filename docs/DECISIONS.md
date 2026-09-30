# Décisions d'architecture — direction commune

Ce fichier existe pour qu'une **IA ou un collègue** qui reprend le projet sache
**d'où on part et où on va**, et qu'on reste **cohérents en équipe**. Chaque
décision a un statut. Toute personne (humaine ou IA) qui contribue s'aligne dessus.

> **Cadre permanent (ne change jamais) :** cibles **autorisées** / **pseudo-infra**
> uniquement ; allowlist **fail-closed** ; **humain dans la boucle** avant toute
> action à impact ; **journalisation** et preuves horodatées ; niveau intermédiaire,
> **non destructif** ; but **défensif** (produire un rapport pour aider à corriger).

## D1 — Cerveau des agents : LLM frontière (Claude ou ChatGPT) — *adoptée, à implémenter*

Les futurs agents (recon / exploit / post-exploit) **raisonneront avec des modèles
frontière — Claude ou ChatGPT — via API**, pour la puissance de calcul et de
raisonnement.

À bien distinguer de l'**Étape 1** : là, les petits modèles **Ollama locaux**
(`qwen2.5:1.5b` / `:3b`) sont la **cible** et l'attaquant *du lab d'injection* —
ce ne sont **pas** le cerveau des agents d'audit. Le cerveau = frontier LLM.

## D2 — Outillage offensif : conteneur Kali piloté via un serveur MCP — *planifiée*

Les agents accèderont à leur outillage via un **conteneur Kali Linux** exposé par
un **serveur MCP** (Model Context Protocol), avec :
- une **surface d'outils bornée** (liste blanche d'outils exposés) ;
- l'**allowlist de cibles appliquée au niveau du MCP** (aucune action hors périmètre) ;
- **journalisation** de chaque commande (traçabilité / preuves) ;
- **validation humaine** avant toute action à impact.

À mettre en place plus tard (Étapes 2/4). Le MCP est le point de contrôle : c'est
lui qui garantit que l'outillage reste dans le cadre.

## D3 — Cibles : pseudo-infrastructure de laboratoire — *planifiée*

Les audits s'exercent sur une **pseudo-infrastructure** montée délibérément dans le
lab (VMs / conteneurs qu'on contrôle, volontairement vulnérables), **jamais** sur
des systèmes tiers. C'est le terrain d'entraînement des équipes d'agents ; elle sera
provisionnée plus tard (mêmes garde-fous que le lab actuel).

## Où on en est vs où on va

- **Aujourd'hui (Étape 1)** : lab d'injection LLM local (Ollama), framework
  Red/Blue/Purple, dashboard, Grafana, CI, flux de contribution protégé.
- **Ensuite** : agents à cerveau frontier (D1) → outillés par Kali/MCP (D2) →
  s'entraînant sur une pseudo-infra (D3) → produisant des rapports d'audit, dans le
  cadre purple team et les garde-fous ci-dessus.

Voir [ROADMAP.md](ROADMAP.md) pour la séquence et [personas/](personas/) pour le
rôle de chaque agent.
