// Référentiel de maturité IA : dimensions, questions, paliers, recommandations.
// Contenu générique (aucune donnée client). Sert de base au scoring (code) et
// de grounding au diagnostic rédigé par le modèle.

export const LEVELS = [
  { min: 0.0, label: "Absent" },
  { min: 1.0, label: "Initial" },
  { min: 2.0, label: "Structuré" },
  { min: 3.0, label: "Avancé" },
  { min: 3.5, label: "Industrialisé" }
];

// levelIndex(score) -> 0..4
export function levelIndex(score) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) { if (score >= LEVELS[i].min) idx = i; }
  return idx;
}

// Chaque dimension : 3 affirmations notées de 0 (pas du tout) à 4 (tout à fait),
// et une recommandation par palier (le pas suivant à franchir).
export const DIMENSIONS = [
  {
    id: "strategie",
    label: "Stratégie et cas d'usage",
    questions: [
      "L'entreprise a identifié des cas d'usage IA prioritaires liés à ses objectifs.",
      "Des moyens (budget, temps, sponsor) sont alloués à l'IA.",
      "La direction porte le sujet, au-delà d'initiatives isolées."
    ],
    reco: [
      "Lister 3 irritants métier coûteux et poser une première hypothèse de cas d'usage IA pour chacun.",
      "Prioriser 1 ou 2 cas d'usage à ROI rapide et nommer un sponsor côté direction.",
      "Formaliser une feuille de route IA à 6 mois reliée aux objectifs de l'entreprise.",
      "Arbitrer un portefeuille de cas d'usage et suivre leur valeur créée.",
      "Piloter l'IA comme un levier stratégique récurrent, avec revue régulière du portefeuille."
    ]
  },
  {
    id: "donnees",
    label: "Données",
    questions: [
      "Les données utiles sont accessibles, centralisées et de qualité maîtrisée.",
      "La gouvernance des données (droits, qualité, cycle de vie) est définie.",
      "L'entreprise sait relier ses données à des cas d'usage concrets."
    ],
    reco: [
      "Cartographier les données disponibles et repérer celles qui bloquent un premier cas d'usage.",
      "Nettoyer et centraliser le jeu de données d'un cas d'usage prioritaire.",
      "Définir des règles de qualité et de droits d'accès sur les données clés.",
      "Automatiser le contrôle qualité et la mise à disposition des données.",
      "Traiter la donnée comme un actif gouverné, réutilisable d'un cas d'usage à l'autre."
    ]
  },
  {
    id: "technologie",
    label: "Technologie et outils",
    questions: [
      "Les équipes disposent d'outils IA (assistants, automatisation) au-delà de tests ponctuels.",
      "Les outils IA sont intégrés au système d'information.",
      "Des solutions IA sont passées en production, pas seulement en POC."
    ],
    reco: [
      "Mettre un assistant IA fiable entre les mains d'une équipe pilote, sur un cas réel.",
      "Choisir une brique d'automatisation (par exemple n8n) et connecter un premier flux.",
      "Intégrer l'outil IA au système existant plutôt que de le laisser à côté.",
      "Industrialiser le passage du POC à la production (tests, suivi, reprise d'erreur).",
      "Standardiser une base technique réutilisable pour déployer plus vite."
    ]
  },
  {
    id: "competences",
    label: "Compétences et adoption",
    questions: [
      "Les collaborateurs sont formés aux usages de l'IA adaptés à leur métier.",
      "L'IA est réellement utilisée au quotidien, pas seulement par quelques personnes.",
      "L'entreprise sait accompagner le changement et lever les réticences."
    ],
    reco: [
      "Former une équipe pilote aux usages concrets de l'IA sur ses tâches réelles.",
      "Documenter des modes d'emploi simples et désigner des référents internes.",
      "Mesurer l'adoption et traiter les points de friction un par un.",
      "Faire monter en autonomie des super-utilisateurs capables d'entraîner les autres.",
      "Ancrer l'IA dans les pratiques, avec un socle de formation continue."
    ]
  },
  {
    id: "gouvernance",
    label: "Gouvernance et conformité",
    questions: [
      "Les usages IA respectent le RGPD et un cadre interne clair.",
      "L'entreprise connaît ses obligations liées à l'AI Act et les anticipe.",
      "Les risques IA (biais, erreurs, sécurité) sont identifiés et suivis."
    ],
    reco: [
      "Poser des règles simples : données autorisées, usages interdits, validation humaine.",
      "Recenser les usages IA et les classer selon leur niveau de risque.",
      "Cadrer la conformité RGPD et préparer les obligations de l'AI Act.",
      "Suivre les risques (biais, erreurs, sécurité) avec des contrôles réguliers.",
      "Tenir une gouvernance IA vivante, revue à chaque nouveau cas d'usage."
    ]
  },
  {
    id: "organisation",
    label: "Organisation et processus",
    questions: [
      "Les processus métier à fort potentiel IA sont cartographiés.",
      "L'IA est intégrée dans les processus, pas juxtaposée à côté.",
      "Les gains de l'IA sont mesurés (temps, qualité, coût)."
    ],
    reco: [
      "Cartographier 1 ou 2 processus coûteux où l'IA ferait gagner du temps.",
      "Redessiner un processus autour de l'outil IA plutôt que de l'ajouter en bout de chaîne.",
      "Définir des indicateurs de gain (temps, qualité, coût) avant de déployer.",
      "Mesurer les gains réels et ajuster le processus en continu.",
      "Généraliser les processus augmentés par l'IA, avec pilotage par indicateurs."
    ]
  }
];
