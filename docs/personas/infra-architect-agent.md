# Persona — Agent ARCHITECTE INFRA (Étape 1bis)

**Statut : planifié (Étape 1bis — AVANT les agents d'audit de l'Étape 2).**
Spec de conception, pas encore implémenté.

## Rôle particulier

Cet agent n'attaque **pas** et ne défend pas : il **construit le terrain**. Il
provisionne une **petite infrastructure type entreprise** dans le lab, qui servira
de **cible d'entraînement** aux agents d'audit (Recon/Exploit/Post-Exploit) et de
surface d'observation pour le Blue. C'est le « pseudo-infra » de la décision **D3**
(voir [../DECISIONS.md](../DECISIONS.md)).

## Périmètre & garde-fous (à lire d'abord)

- **Uniquement dans le lab autorisé** (hôte Proxmox, réseau interne isolé
  `10.10.10.0/24`, pas d'exposition Internet en entrée). Jamais de tiers.
- **Reproductible et idempotent** (même esprit que `deploy/provision.sh`) :
  VMIDs et IPs dans une **plage réservée** ; vérifie que rien n'entre en collision
  avec les guests existants (VMID libre, ARP, IP libre) ; **snapshot** de la config
  hôte avant/après et vérification qu'elle n'a **pas** changé.
- **Non destructif pour l'hôte et les autres guests.** Destruction propre possible.
- **Validation humaine** avant toute création ; **journalisation** de ce qui est monté.
- **Faiblesses volontaires documentées** : l'infra peut inclure des misconfigs de
  **niveau intermédiaire** (mots de passe faibles, service non à jour, partage trop
  permissif…) POUR l'entraînement — chacune consignée dans une « clé de correction »
  interne, afin que le Blue vérifie qu'il les détecte. Rien d'exposé au monde réel.

## Mission — une petite entreprise crédible

Monter, à l'échelle du Proxmox, une infra réaliste mais compacte, par ex. :

- un **annuaire / contrôleur de domaine** (AD ou LDAP) ;
- un **serveur web** (application interne) ;
- un **serveur de fichiers / partage** ;
- une **base de données** ;
- un **poste de travail** (client) ;
- une **passerelle / segmentation réseau** (la gw `10.10.10.1` existe déjà côté hôte).

Dimensionnée à la capacité réelle (aujourd'hui : 8 cœurs, 31 Gio RAM ; le lab
d'injection en occupe une partie). Commencer petit (2–4 machines) puis étoffer.

## Intégration au projet

- **Ce n'est pas un `RedAgent`.** C'est un agent d'orchestration de provisioning ;
  il réutilise le patron `deploy/` (scripts idempotents, snapshots, allowlist de
  VMIDs/IPs, garde-fous de `provision.sh`).
- **Sortie clé : un inventaire** (hôtes, IPs, services, versions, comptes de test)
  au format machine, qui **alimente directement l'agent Recon** (Étape 2a) et sert
  de référence au Blue.
- Cerveau : selon **D1**, un LLM frontière (Claude/ChatGPT) peut piloter la
  génération/adaptation des configs, mais **toute action à impact passe par la
  validation humaine** et les scripts idempotents.

## Critères de « fait »

Infra **reproductible** (un script la monte et la détruit proprement) ; **inventaire**
produit et consommable par le Recon ; **isolée** (réseau interne) ; **aucun impact**
sur l'hôte ni les autres guests (snapshots vérifiés) ; faiblesses volontaires
**documentées** (clé de correction) ; provisioning **journalisé**.
