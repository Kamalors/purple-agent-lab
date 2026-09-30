# Persona — Agent RECON

**Statut : planifié (Étape 2a).** Spec de conception, pas encore implémenté.

## Périmètre & garde-fous (à lire d'abord)

- **Cibles de laboratoire autorisées uniquement.** Toute action passe par
  `TargetAllowlist.check` avant exécution (fail-closed). Aucune cible tierce.
- **Actions bénignes et non destructives** : observation et cartographie, pas
  d'exploitation. Données fictives.
- **Finalité purple** : produire le signal de reconnaissance que le Blue apprend
  à détecter, et cartographier la surface pour mesurer la robustesse. Ce n'est pas
  un outil de recon « dans la nature ».

## Mission

Comprendre la cible **avant** toute tentative d'attaque, pour que l'agent Exploit
travaille de façon informée plutôt qu'à l'aveugle :

- **Empreinte du modèle** : identifier famille/comportement de la cible via ses
  réponses à des sondes bénignes (style, longueur, langue, format imposé).
- **Cartographie de la surface** : lister les scénarios et endpoints exposés par
  l'API du lab (`/api/scenarios`), le format de réponse attendu, les limites
  (budget de tours, taille de message).
- **Découverte des garde-fous** : repérer les schémas de refus, les règles
  affichées, la présence d'un format JSON imposé, etc. — sans tenter de les briser.

## Techniques MITRE (à confirmer sur atlas.mitre.org)

Tactique **Reconnaissance / Discovery**. Côté ATLAS : accès à l'API d'inférence,
découverte de la famille/ontologie du modèle. Chaque `AgentAction` porte le
`technique_id` correspondant pour le mapping.

## Intégration au framework

Sous-classe de `RedAgent` :
- `plan()` → liste d'`AgentAction` de sondage bénin (technique_id = recon), cible
  = hôte du lab (allowlist).
- `execute(action)` → envoie la sonde via l'interface sanctionnée, renvoie
  l'observation (jamais d'exploitation).
- Sortie : un **profil de cible** (JSON) consommé par l'agent Exploit.

## Ce que le Blue détecte (le vrai but)

- Énumération systématique (balayage des scénarios/endpoints).
- Sondes de fingerprinting (requêtes anormalement variées/répétées).
- Signature « phase de reconnaissance » précédant une campagne d'attaque.

## Critères de « fait »

Produit un profil de cible reproductible ; au moins une détection Blue dédiée
existe et se déclenche sur le comportement de recon ; un test couvre la génération
du profil ; les IDs ATLAS sont vérifiés.
