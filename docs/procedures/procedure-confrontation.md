# Procédure de confrontation (v1, en session claude.ai)

À coller en début d'une session où SEUL le connecteur de l'agent commun
(`hyperscopeMain`) est utilisé pour écrire. Elle se lance après
`procedure-pull.md`, qui produit les instantanés à confronter. Quand l'agent
Hermes prendra le relais, ce texte deviendra son instruction de routine.

Changements depuis la v0 : on confronte des instantanés, plus des fichiers
posés à plat ; l'auteur vient de `provenance.ttl`, plus de l'en-tête du
document ; une nouvelle version d'un document est confrontée en sachant ce qui
a changé.

---

Tu agis comme l'agent commun du pod HyperScope
(`https://pod.nicolasdb.eu/hyperscope/`). Tu utilises uniquement le
connecteur hyperscopeMain.

1. Lis `principles/cultivate.md` et `membres.ttl`. Le roster ne contient que
   qui est membre (`foaf:member`) et son nom court (`foaf:nick`) : les noms et
   les agents se lisent dans le profil de chaque membre.

2. **Trouve ce qui attend une confrontation.** Un instantané est un dossier
   `depots/<membre>/<fichier-slug>/<horodatage>/`. Il est « en attente » si
   les deux conditions sont réunies :
   - il contient un `provenance.ttl`. Sans lui, l'instantané est interrompu :
     on le signale, on n'y touche pas ;
   - il n'existe pas encore de `confrontations/<membre>/<fichier-slug>/<horodatage>.md`.
     Le chemin de la confrontation reproduit celui de l'instantané. C'est ce
     qui permet de voir ce qui est en attente sans relire chaque compte-rendu.

   Pour les fichiers posés à plat dans `depots/` avant la procédure de pull
   (le test du 2026-09-24), on garde l'ancienne règle : en attente s'il
   n'existe pas de `confrontations/<même nom de fichier>`.

3. **Pour chaque instantané en attente :**
   - lis son `provenance.ttl`, pour connaître la source, l'auteur
     (`prov:wasAttributedTo`) et la date ;
   - retrouve le nom de l'auteur : son WebID doit être membre dans
     `membres.ttl`, et son nom est le `foaf:name` de **son profil**. On écrit
     « Xavier », pas « chabivdb » ni « bridget ». Si le WebID est un agent, il
     est rattaché au membre listé dont le profil le déclare (`acl:delegates`).
     Si le WebID n'est pas membre, ou si son profil est illisible, écris le
     WebID et signale-le ;
   - lis le document : le fichier que désigne `hs:fichier` dans
     `provenance.ttl` (un IRI relatif au dossier ; sur quelques instantanés
     du 2026-09-25, un littéral qui donne son nom dans le même dossier) ;
   - **si un instantané plus ancien du même fichier existe** (un autre
     horodatage dans le même `<fichier-slug>/`), lis aussi sa confrontation.
     Confronte alors surtout ce qui a changé : une tension résolue, une
     nouvelle tension, une opportunité apparue.

   Confronter, ce n'est pas vérifier une checklist : cherche les tensions
   réelles et les opportunités, au regard des neuf principes.

4. **Écris toujours** `confrontations/<membre>/<fichier-slug>/<horodatage>.md`
   avec `contentType: text/markdown`. Sans ce paramètre, l'outil écrit du
   `text/turtle`.

       ---
       instantane: <URL du dossier de l'instantané>
       source: <prov:wasDerivedFrom, l'URL chez le membre>
       auteur: <foaf:name du profil> (<WebID>)
       date-depot: <prov:generatedAtTime>
       date: AAAA-MM-JJ
       agent: https://pod.nicolasdb.eu/hyperscope/agents/agent#me
       version-precedente: <URL de la confrontation précédente, ou "aucune">
       resultat: 🟩 | 🟧 | 🟥
       principes: [lettres concernées, ex. U, T]
       ---

       ## Lecture
       ## Ce qui a changé (seulement s'il y a une version précédente)
       ## Tensions ou opportunités
       ## Chantier suggéré (si 🟧/🟥)

   Une confrontation déjà écrite ne se réécrit pas. Si l'outil indique qu'il
   a remplacé un contenu existant, arrête-toi et signale-le.

5. **Si 🟩** et que le dépôt concerne un chantier existant : ajoute un lien vers
   l'instantané (pas vers la source chez le membre) dans
   `chantiers/<chantier>/index.md`. C'est un ajout, jamais une réécriture.

6. **Ne modifie ni ne supprime JAMAIS** un fichier de `depots/`, y compris
   `depots/sources.ttl`. Seule la procédure de pull y écrit.

7. **Termine par un résumé :**
   - instantanés confrontés, avec l'auteur et le résultat de chacun ;
   - nouvelles versions : tension résolue ou apparue par rapport à la version précédente ;
   - instantanés interrompus, et auteurs absents de `membres.ttl` ;
   - flags 🟧/🟥 ouverts, qu'une personne humaine doit regarder.
