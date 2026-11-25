# Diagnostic de maturité IA

Un outil de diagnostic : l'utilisateur répond à un questionnaire court, le **score est calculé en code** (transparent, reproductible), puis un modèle **Claude Sonnet** rédige un diagnostic personnalisé (niveau, forces, angles morts, feuille de route priorisée, cas d'usage, conformité) et un rapport téléchargeable.

- Démo live : à renseigner après déploiement.
- Référentiel générique, aucune donnée client.

## Principe de conception

Le score ne sort pas du modèle. Il est calculé par une formule déterministe à partir des réponses, donc reproductible et auditable. Le modèle intervient là où il crée de la valeur : synthétiser, prioriser et formuler un diagnostic pour un dirigeant. Cette séparation évite les scores hallucinés et garde le résultat vérifiable.

## Architecture

```
public/index.html   Questionnaire (6 dimensions, 18 affirmations), radar, diagnostic, rapport imprimable
data/framework.js   Référentiel : dimensions, questions, paliers, recommandations par palier
api/diagnose.js     Serverless : scoring déterministe -> sélection de recommandations -> Claude (JSON) -> validation
```

**Flux :** les réponses arrivent à `api/diagnose.js`, qui calcule un score par dimension et un niveau global, sélectionne les recommandations du référentiel correspondant à chaque niveau, demande à Claude un diagnostic en **JSON structuré** borné à ces éléments, valide la forme du JSON, puis renvoie scores et diagnostic. Le front affiche un radar et un rapport, imprimable en PDF.

## Choix techniques

- **Scoring déterministe en code, rédaction par le LLM.** Reproductibilité et auditabilité du score, valeur du modèle sur la synthèse.
- **Sortie JSON validée.** Le serveur vérifie la forme du diagnostic avant affichage et dégrade proprement en cas de réponse mal formée, plutôt que de parser du texte libre au hasard.
- **Grounding strict.** Le modèle ne voit que les scores et les recommandations du référentiel. Consigne : aucun chiffre, benchmark ou nom de client inventé.
- **Backend serverless sans dépendance** (fetch natif). Déploiement et audit simples, pas de `node_modules`.
- **Claude Sonnet** pour une rédaction de diagnostic nuancée. La bascule vers Haiku (coût et latence moindres) tient en une constante.
- **Rapport imprimable par CSS d'impression**, sans librairie PDF côté serveur : l'utilisateur exporte en PDF depuis le navigateur.

## Sécurité et garde-fous

- Clé API uniquement en variable d'environnement (`.env` exclu par `.gitignore`).
- Réponses validées (6 dimensions, 18 items, valeurs 0 à 4), limitation de débit par IP, réponse plafonnée en tokens, `stop_reason: "refusal"` géré.
- Filet de sécurité recommandé : une limite de dépense mensuelle dans la console Anthropic.

## Limites et pistes de production

- Référentiel figé dans le dépôt : pour un usage réel, l'adosser à une source versionnée et le faire valider par des experts métier.
- Scoring volontairement simple (moyenne par dimension) : transparent plutôt que pondéré ; une pondération par secteur serait une évolution naturelle.
- Pas de persistance ni d'historique des diagnostics : à ajouter selon le besoin.
- Diagnostic indicatif, pas un audit formel.

## Lancer en local

```bash
cp .env.example .env      # renseigner ANTHROPIC_API_KEY
npx vercel dev            # http://localhost:3000
```

## Déploiement

Importer le dépôt dans Vercel (framework : Other), ajouter `ANTHROPIC_API_KEY`, déployer. Chaque push sur la branche par défaut redéploie.

## Adapter à un autre référentiel

La logique est indépendante du contenu : modifier les dimensions, questions et recommandations dans `data/framework.js`, et répercuter les intitulés dans `public/index.html` (les clés `dimension_index` doivent rester identiques des deux côtés).

## Licence

MIT. Voir `LICENSE`.
