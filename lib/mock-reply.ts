const GENERIC_REPLIES = [
  (prompt: string) =>
    `Bonne question. Voici comment je structurerais la réponse autour de « ${prompt.trim()} ».\n\n### Ce que je retiens\n- Le sujet mérite d’être cadré par un objectif mesurable.\n- Il faut identifier les parties prenantes et les contraintes dès le départ.\n- Une première version courte permet de valider la direction avant d’investir davantage.\n\n### Plan proposé\n1. **Clarifier le résultat attendu** en une phrase compréhensible par toute l’équipe.\n2. **Découper le travail** en petits incréments livrables.\n3. **Définir les critères de réussite** avant de commencer.\n4. **Planifier une revue** rapide pour ajuster la suite.\n\nSi tu me donnes le contexte de ton équipe et le délai visé, je peux transformer cela en plan d’action détaillé.`,
  (prompt: string) =>
    `Je peux t’aider à avancer sur « ${prompt.trim()} ». Voici une approche pragmatique.\n\n### Premiers pas\n- **Formuler l’objectif** du travail en une phrase, du point de vue de l’utilisateur.\n- **Lister les inconnues** et les valider avec les personnes concernées.\n- **Choisir un petit lot** à livrer cette semaine pour obtenir un retour réel.\n\n### Critères de qualité\nUne bonne solution est compréhensible, testable et réversible. Si un choix n’est pas réversible, il mérite une discussion d’équipe avant implémentation.\n\n### Risque principal\nChercher la solution parfaite trop tôt. Il vaut mieux livrer une version imparfaite mais observable, puis itérer à partir des retours.`,
];

const SPRINT_REPLY = `Voici une proposition de plan de sprint structurée autour de la valeur livrée.\n\n### Objectif de sprint\n**Livrer un incrément utilisable du parcours prioritaire, en réduisant les principaux points de friction identifiés lors du dernier sprint.**\n\n### Découpage suggéré\n- **Lot 1 · Fondations** — modèle de données, permissions et parcours nominal.\n- **Lot 2 · Expérience** — états de chargement, erreurs et feedback utilisateur.\n- **Lot 3 · Qualité** — tests d’intégration, accessibilité et télémétrie.\n\n### Répartition de capacité\n- 70 % sur les fonctionnalités prioritaires.\n- 20 % sur la dette technique et les correctifs.\n- 10 % de marge pour les imprévus.\n\n### Risques à surveiller\n1. Une dépendance externe non confirmée peut bloquer le lot 1.\n2. Le périmètre du lot 2 doit rester stable après le jour 3.\n3. Prévoir un point de synchronisation à mi-sprint pour ajuster.\n\nJe peux détailler les critères d’acceptation de chaque lot si nécessaire.`;

const STORY_REPLY = `### User story proposée\n**En tant qu’**utilisateur, **je veux** accomplir cette action sans friction **afin de** gagner du temps dans mon quotidien.\n\n### Critères d’acceptation\n- Le parcours nominal fonctionne sur mobile et desktop.\n- Les erreurs sont explicites et proposent une action de sortie.\n- Le résultat est visible immédiatement après validation.\n- Les données sont conservées en cas de rechargement de la page.\n\n### Découpage technique\n1. Modéliser les données et les états du parcours.\n2. Construire l’interface avec les états vide, chargement et erreur.\n3. Ajouter la persistance et les tests du parcours critique.\n\n### Question à trancher\nQuel comportement attendu si l’utilisateur a plusieurs éléments en cours ? Un choix explicite évitera une dette produit plus tard.`;

const RETRO_REPLY = `### Format de rétrospective actionnable\n\n**1. Contexte (5 min)**\nRappeler l’objectif du sprint et les faits marquants, sans interprétation.\n\n**2. Ce qui a fonctionné (10 min)**\nChaque personne note un succès et une cause concrète.\n\n**3. Ce qui a freiné (15 min)**\nRegrouper les irritants par thème et identifier les causes racines.\n\n**4. Décisions (20 min)**\nChoisir **trois actions maximum**, chacune avec :\n- un responsable identifié ;\n- une échéance réaliste ;\n- un indicateur de réussite observable.\n\n**5. Clôture (5 min)**\nVérifier que tout le monde peut reformuler les engagements.\n\n### Règle d’or\nUne action sans responsable ni échéance est une intention, pas une décision. Je peux te préparer le tableau de suivi correspondant.`;

const ESTIMATION_REPLY = `Les story points mesurent la **complexité relative**, l’effort et l’incertitude — jamais une durée précise.\n\n### Méthode simple\n- Choisir une story de référence déjà livrée et la valoriser à **3 points**.\n- Comparer chaque nouvelle story à cette référence.\n- Estimer en équipe avec la suite **1, 2, 3, 5, 8, 13, 21**.\n- Discuter uniquement les écarts importants, pas chaque carte.\n\n### Bonnes pratiques\n- Ne jamais convertir les points en heures.\n- Garder la même échelle pendant plusieurs sprints.\n- Utiliser la vélocité pour prévoir, pas pour évaluer les personnes.\n\n### Piège classique\nUne story trop grande doit être découpée avant d’être estimée. Au-delà de 8 points, l’incertitude rend l’estimation peu utile.`;

const FILE_REPLY = `J’ai bien pris en compte le fichier joint à notre conversation.\n\n### Première lecture\n- Le document semble structuré autour de plusieurs sections complémentaires.\n- Les points clés sont identifiables, mais certains éléments demandent une validation métier.\n- Je peux en extraire un résumé exécutif, une liste d’actions ou un plan de présentation.\n\n### Ce que je te propose\n1. **Résumé en 5 points** pour un comité de pilotage.\n2. **Liste des décisions** à prendre et des responsables associés.\n3. **Plan de prochaine étape** avec échéances réalistes.\n\nDis-moi le format attendu et je restructure le contenu en conséquence.`;

export function createMockReply(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes("sprint") ||
    normalized.includes("planification") ||
    normalized.includes("backlog")
  ) {
    return SPRINT_REPLY;
  }
  if (
    normalized.includes("user stor") ||
    normalized.includes("story") ||
    normalized.includes("critère")
  ) {
    return STORY_REPLY;
  }
  if (
    normalized.includes("rétro") ||
    normalized.includes("retro") ||
    normalized.includes("amélioration continue")
  ) {
    return RETRO_REPLY;
  }
  if (
    normalized.includes("estimation") ||
    normalized.includes("story point") ||
    normalized.includes("vélocité")
  ) {
    return ESTIMATION_REPLY;
  }
  if (
    normalized.includes("fichier") ||
    normalized.includes("document") ||
    normalized.includes("pdf")
  ) {
    return FILE_REPLY;
  }
  const index = Math.abs(hash(prompt)) % GENERIC_REPLIES.length;
  return GENERIC_REPLIES[index](prompt);
}

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = (result << 5) - result + value.charCodeAt(i);
    result |= 0;
  }
  return result;
}

export function chunkReply(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}
