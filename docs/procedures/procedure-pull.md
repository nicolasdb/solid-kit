# Procédure — tirer les dépôts (pull)

**Exécutée par** l'agent commun `https://pod.nicolasdb.eu/hyperscope/agents/agent#me` :
aujourd'hui depuis claude.ai (connecteur `hyperscopeMain`), demain par Hermes.
**Déclencheur** : « tire les dépôts annoncés » (ou « lance le pull »).
**Référence** : ADR 006 du solid-kit (adhésion et publication par pull).
**À la suite** : `procedure-confrontation.md`, sur les instantanés que ce pull vient de créer.

## Règles qu'on ne contourne jamais

1. **On écrit uniquement dans `hyperscope/depots/`.** Jamais sur le pod d'un membre, jamais
   dans `inbox/`, jamais ailleurs dans le pod commun.
2. **Un instantané existant ne se modifie pas et ne se supprime pas.** Un changement à la
   source produit un nouvel instantané, à côté de l'ancien.
3. **Un refus (401/403) ou une absence (404) est un statut à noter, pas un problème à résoudre.**
   On l'inscrit, on ne réessaie pas, et on ne cherche pas d'autre chemin.
4. **On lit ce qui est annoncé, rien de plus.** On ne parcourt pas le pod d'un membre en dehors
   de la source qu'il a déclarée. Chaque lecture laisse une trace chez lui.
5. **On ne réécrit pas le contenu.** L'instantané garde les octets exacts de l'original, avec
   son nom d'origine.

## Fichiers utilisés

| Fichier | Rôle | Accès de l'agent |
|---|---|---|
| `hyperscope/membres.ttl` | qui est membre (reconnu par le collectif) | lecture |
| `hyperscope/inbox/` | annonces `as:Announce` envoyées par les membres | lecture |
| `hyperscope/depots/sources.ttl` | les sources suivies, leur statut, les annonces déjà traitées | écriture |
| `hyperscope/depots/<membre>/…` | les instantanés et leur `provenance.ttl` | écriture |

Si `depots/sources.ttl` n'existe pas encore, on le crée à partir du modèle en annexe B.

## Étapes

### 1. Lire l'état

- Lire `membres.ttl` pour savoir qui est reconnu, et sous quel nom court.
- Lire `depots/sources.ttl` pour connaître les sources suivies, leur statut et la dernière
  version tirée de chaque fichier.

### 2. Traiter les annonces nouvelles

Lister `inbox/`. Toute annonce `as:Announce` absente de `sources.ttl` est nouvelle. Pour chacune :

- **Si l'acteur (`as:actor`) est membre** (listé dans `membres.ttl`, ou agent déclaré d'un
  membre) : ajouter `as:object` aux sources suivies, avec le statut `suivie`.
- **Sinon** : ne rien tirer. Inscrire l'annonce avec le statut `en-attente-humaine`.
- **Dans les deux cas** : inscrire l'annonce comme traitée. On ne la retraite pas au pull suivant.

**Phase 0, sans annonce.** Tant que les membres n'envoient pas encore d'annonce, un admin peut
déclarer une source en séance (« `…/output2hyperscope/` de Nicolas est une source »). On
l'inscrit alors avec `hs:declareePar "session"` à la place d'une annonce.

### 3. Tirer chaque source suivie

Pour chaque source au statut `suivie` :

**a. Lister.** Si c'est un conteneur (URL finissant par `/`), le lister. Ne descendre dans ses
sous-dossiers que s'ils sont listés et lisibles. Si c'est un fichier, il est son propre et
unique élément.

**b. Clé de version, pour chaque fichier.** On prend dans l'ordre le premier élément disponible :

1. `modified` et `size`, tels que `solid_list_container` les donne pour chaque fichier.
   C'est le moyen le moins coûteux : aucune lecture de plus, donc aucun reçu de plus dans le
   journal du membre ;
2. si le listing donne `null` : lire le fichier et prendre l'`etag` du bloc
   `[metadata, not file content]` que renvoie `solid_read_resource`. **Ce bloc ne fait
   jamais partie du fichier** : on ne le recopie pas dans l'instantané ;
3. sinon, s'il existe déjà un instantané de ce fichier : comparer le texte de la source avec
   celui du dernier instantané. S'ils sont identiques, rien n'a changé ; on n'écrit rien et
   on note « inchangé (comparé au contenu) ». Cela ne marche que pour du texte ;
4. sinon (premier pull de ce fichier) : on tire. Le rapport signale « clé absente », car
   c'est l'outil qu'il faut corriger, pas une valeur à deviner.

**On ne compare que des clés de même nature.** Le `modified` d'un listing se compare au
`modified` noté, et un `etag` à un `etag`. Ne jamais déduire l'une de l'autre en décodant
leur format : qu'un ETag de CSS contienne l'heure de modification est un détail interne du
serveur, qu'un autre serveur ne respectera pas. Si la clé notée n'est pas de la même nature
que celle qu'on a maintenant, on descend d'un cran dans la liste ci-dessus.

Lors d'un instantané, le fichier est lu de toute façon. On note donc **les deux** clés dans
`provenance.ttl` (`hs:cleSource`) et dans `sources.ttl` (`hs:derniereCle`), par exemple
`"modified=2026-09-24T13:47:57.035Z;size=1234;etag=\"1790257677035-text/markdown\""`.
Le pull suivant peut alors toujours comparer à partir du listing seul.

**c. Comparer.** Si la clé est identique à la dernière clé notée dans `sources.ttl` pour ce
fichier, il n'y a rien à faire. Si elle diffère, ou si le fichier est nouveau, on crée un
instantané (étape d).

**d. Créer l'instantané.**

Chemin : `depots/<membre>/<fichier-slug>/<AAAA-MM-JJTHHMM>/`

- `<membre>` : le `foaf:nick` du membre dans `membres.ttl`. Il est fixé à l'acceptation et
  **ne change plus une fois qu'il a servi dans `depots/`** : le changer couperait
  l'historique des versions en deux. À défaut, on prend le premier segment du chemin du pod
  source, **signalé dans le rapport**. Ce n'est qu'une étiquette : on n'en déduit rien
  d'autre.
- `<fichier-slug>` : le nom du fichier en minuscules, sans extension ni accents, avec des
  tirets à la place des espaces et de la ponctuation. Exemple :
  `24.12.27 Synthèse réunion_jason_Nico.md` devient `24-12-27-synthese-reunion-jason-nico`.
- Horodatage : le moment du pull, en UTC.

Dans ce dossier, **dans cet ordre** :

1. le fichier, **sous son nom d'origine et avec son contenu exact** ;
2. `provenance.ttl` (modèle en annexe A).

Deux précautions propres à l'outil d'écriture (`solid_write_resource`) :

- **Toujours passer `contentType`.** Par défaut, l'outil écrit en `text/turtle`, si bien qu'un
  `.md` enregistré sans ce paramètre devient un faux Turtle. Utiliser `text/markdown` pour `.md`,
  `text/plain` pour `.txt`, `application/json` pour `.json`, et `text/turtle` seulement pour `.ttl`.
- **L'outil écrase sans prévenir la ressource visée.** Le dossier horodaté est neuf, donc rien ne
  devrait exister à ce chemin. Si l'outil indique qu'il a remplacé un contenu existant, arrêter
  le pull et le signaler (règle 2).

`provenance.ttl` s'écrit en dernier. **Un dossier sans `provenance.ttl` est un instantané
interrompu.** Au pull suivant, on le signale ; on ne le complète pas et on ne le supprime pas.

**e. Mettre à jour `sources.ttl`** : dernière clé, dernier instantané et date de ce fichier.

**f. Fichiers binaires** (`.docx`, `.pdf`, images…). En session claude.ai, l'outil ne transfère
que du texte. On ne tire donc pas : on inscrit le fichier comme `binaire-en-attente`, et Hermes
s'en chargera. Ne jamais recopier un binaire en le transformant en texte : la conversion en
texte est un index, pas un instantané (ADR 001).

### 4. Noter les erreurs sans insister

| Réponse de la source | Statut à inscrire dans `sources.ttl` | Ce qui arrive aux instantanés |
|---|---|---|
| 401 / 403 | `acces-retire`, avec la date | ils restent |
| 404 sur la source | `source-disparue`, avec la date | ils restent |
| un fichier ne figure plus dans le conteneur | `retire-a-la-source` pour ce fichier | ils restent |

Une source au statut `acces-retire` ou `source-disparue` n'est plus tirée. Elle ne redevient
`suivie` qu'avec une nouvelle annonce.

### 5. Rapport de fin

Toujours produire le rapport, même quand il n'y a rien de nouveau :

- les annonces traitées : combien, et lesquelles sont `en-attente-humaine` ;
- les instantanés créés : leurs chemins. **Ce sont les entrées de la confrontation** ;
- les fichiers inchangés : leur nombre ;
- les statuts changés : accès retiré, source disparue, retiré à la source, binaire en attente ;
- les anomalies : clé absente, instantané interrompu, membre sans nom court.

Enchaîner ensuite `procedure-confrontation.md` sur les instantanés créés. Un instantané est
« en attente de confrontation » tant qu'aucun compte-rendu de `confrontations/` ne cite son chemin.

## Annexe A — modèle de `provenance.ttl`

```turtle
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix hs:      <https://pod.nicolasdb.eu/hyperscope/vocab#> .

<>  a prov:Entity ;
    prov:wasDerivedFrom   <URL-EXACTE-DU-FICHIER-SOURCE> ;
    prov:wasAttributedTo  <WEBID-DU-MEMBRE> ;
    prov:generatedAtTime  "AAAA-MM-JJTHH:MM:SSZ"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    prov:wasGeneratedBy   [ a prov:Activity ;
                            prov:wasAssociatedWith <https://pod.nicolasdb.eu/hyperscope/agents/agent#me> ;
                            hs:via "claude.ai session" ] ;        # plus tard : "hermes"
    hs:fichier            <NOM-D-ORIGINE-ENCODE> ;
    hs:cleSource          "ETAG-OU-MODIFIED+TAILLE" ;
    hs:annonce            <URL-DE-L-ANNONCE-DANS-INBOX> .         # ou : hs:declareePar "session"
```

`hs:` est un espace de noms provisoire. On le garde tel quel jusqu'à ce qu'un vocabulaire
commun soit décidé ; le renommer plus tard est une passe mécanique.

## Annexe B — modèle de `depots/sources.ttl`

```turtle
@prefix hs:      <https://pod.nicolasdb.eu/hyperscope/vocab#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<#source-nicolas-output>
    hs:source      <https://pod.nicolasdb.eu/hyperscope_ndb/output2hyperscope/> ;
    hs:membre      <https://pod.nicolasdb.eu/hyperscope_ndb/profile/card#me> ;
    hs:statut      "suivie" ;                    # suivie | acces-retire | source-disparue
    hs:declareePar "session" ;                   # ou hs:annonce <inbox/…>
    dcterms:created "2026-09-24" ;
    hs:element [
        hs:fichier         <https://pod.nicolasdb.eu/hyperscope_ndb/output2hyperscope/24.12.27%20Synth%C3%A8se%20r%C3%A9union_jason_Nico.md> ;
        hs:statut          "tire" ;              # tire | binaire-en-attente | retire-a-la-source | non-tire-via-pull
        hs:derniereCle     "…" ;
        hs:dernierInstantane <24-12-27-synthese-reunion-jason-nico/AAAA-MM-JJTHHMM/> ;
    ] .

# Annonces déjà traitées, pour ne jamais les retraiter
<#annonces> hs:traitee <../inbox/…> .
```

## Annexe C — l'annonce, côté membre

Le membre, ou son agent, la dépose dans `hyperscope/inbox/` une fois, au moment où il donne à
l'agent commun le droit de lecture sur sa source :

```turtle
@prefix as: <https://www.w3.org/ns/activitystreams#> .

<> a as:Announce ;
   as:actor     <WEBID-DU-MEMBRE> ;
   as:object    <https://pod.nicolasdb.eu/<son-pod>/output2hyperscope/> ;
   as:target    <https://pod.nicolasdb.eu/hyperscope/> ;
   as:published "AAAA-MM-JJTHH:MM:SSZ" .
```

Une seule annonce suffit pour un conteneur : tout fichier ajouté ensuite est tiré au pull
suivant. L'onboarding doit le dire clairement : **déposer un fichier dans ce dossier, c'est le
publier au collectif.**

## Le dépôt de test du 2026-09-24

`depots/24.12.27 Synthèse réunion_jason_Nico.md` a été copié à plat, avant cette procédure. On ne
le déplace pas et on ne le supprime pas (règle 2). Le premier pull fait selon cette procédure
créera l'instantané conforme à côté. Le fichier à plat reste comme témoin du test, et sa
confrontation existante reste valable pour lui.
