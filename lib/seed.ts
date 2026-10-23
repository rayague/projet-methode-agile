import type { Attachment, Conversation, Message, Role } from "@/lib/types";
import { uid } from "@/lib/utils";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function ago(ms: number) {
  return Date.now() - ms;
}

function message(
  role: Role,
  content: string,
  createdAt: number,
  attachments?: Attachment[],
): Message {
  return {
    id: uid("msg"),
    role,
    content,
    createdAt,
    status: "complete",
    attachments,
  };
}

function conversation(
  title: string,
  messages: Message[],
  options: { pinned?: boolean } = {},
): Conversation {
  const createdAt = messages[0]?.createdAt ?? Date.now();
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;
  return {
    id: uid("conv"),
    title,
    createdAt,
    updatedAt,
    pinned: options.pinned ?? false,
    messages,
  };
}

export function seedConversations(): Conversation[] {
  return [
    conversation(
      "Planification du sprint 4",
      [
        message(
          "user",
          "Aide-moi à préparer la planification du sprint 4. L’équipe doit livrer le module de paiement et réduire la dette technique.",
          ago(2 * HOUR),
        ),
        message(
          "assistant",
          "Voici une trame de planification prête à animer, centrée sur un objectif de sprint clair et mesurable.\n\n### Objectif proposé\n**Livrer le parcours de paiement de bout en bout, tout en réduisant de 20 % les bugs critiques du backlog.**\n\n### Ordre du jour (90 min)\n- **0–10 min** · Rappel de la vision produit et des métriques du sprint précédent.\n- **10–25 min** · Revue du backlog priorisé par la valeur.\n- **25–55 min** · Découpage des stories et estimation en story points.\n- **55–75 min** · Arbitrage capacité / dette technique (réserver 20 % du sprint).\n- **75–90 min** · Validation de l’engagement et définition des risques.\n\n### Points de vigilance\n1. La dépendance avec l’équipe infra doit être levée avant le jour 3.\n2. Prévoir un binôme sur les tests de régression.\n3. Formaliser la Definition of Done avant de commencer.\n\nJe peux te générer le tableau des stories avec leurs critères d’acceptation si tu veux.",
          ago(2 * HOUR - 4 * 60_000),
        ),
        message(
          "user",
          "Oui, propose 4 stories avec des critères d’acceptation courts.",
          ago(HOUR + 20 * 60_000),
        ),
        message(
          "assistant",
          "Voici quatre stories prêtes à être affinées en équipe.\n\n### 1. Payer par carte\n**En tant que** client, **je veux** régler ma commande par carte **afin de** finaliser mon achat.\n- Le paiement est refusé proprement si la carte est invalide.\n- Un reçu est affiché et envoyé par e-mail.\n\n### 2. Rembourser une commande\n**En tant que** support, **je veux** déclencher un remboursement **afin de** traiter une réclamation.\n- Le statut de la commande passe à « remboursée ».\n- L’action est tracée dans le journal d’audit.\n\n### 3. Réduire les erreurs du checkout\n**En tant qu’**équipe, **nous voulons** corriger les 5 erreurs les plus fréquentes **afin de** stabiliser le tunnel.\n- Chaque correctif est couvert par un test automatisé.\n- Le taux d’erreur baisse sous 1 %.\n\n### 4. Suivre le taux de conversion\n**En tant que** product owner, **je veux** visualiser le taux de conversion du checkout **afin de** prioriser les prochains ajustements.\n- Les données sont actualisées toutes les heures.\n- Le filtre par période fonctionne.\n\nJe recommande de découper la story 3 en sous-tâches techniques avant l’estimation.",
          ago(HOUR - 5 * 60_000),
        ),
      ],
      { pinned: true },
    ),
    conversation(
      "Rédiger les user stories",
      [
        message(
          "user",
          "Transforme cette idée en user story : les utilisateurs veulent recevoir une notification quand leur rapport est prêt.",
          ago(5 * HOUR),
        ),
        message(
          "assistant",
          "### User story\n**En tant qu’**utilisateur, **je veux** être notifié dès que mon rapport est prêt **afin de** consulter les résultats sans actualiser la page.\n\n### Critères d’acceptation\n- Une notification apparaît dans l’application et par e-mail.\n- Le lien de la notification ouvre directement le rapport concerné.\n- La préférence de canal est configurable dans le profil.\n\n### Questions à trancher\n- Faut-il un regroupement des notifications si plusieurs rapports arrivent ?\n- Quel délai maximum entre la fin du traitement et la notification ?",
          ago(5 * HOUR - 3 * 60_000),
        ),
        message(
          "user",
          "Ajoute la notion de priorité et de statut de lecture.",
          ago(4 * HOUR),
        ),
        message(
          "assistant",
          "Très bien, la story gagne deux dimensions produit utiles.\n\n### User story enrichie\n**En tant qu’**utilisateur, **je veux** recevoir des notifications hiérarchisées et marquées comme lues **afin de** traiter en priorité les informations importantes.\n\n### Critères d’acceptation\n- Trois niveaux existent : **information**, **important**, **critique**.\n- Chaque notification peut être marquée comme lue individuellement ou en masse.\n- Le compteur de notifications non lues reste synchronisé entre les onglets.\n\n### Note d’implémentation\nPrévoir un champ `priority` et un champ `readAt` dans le modèle de données pour garder l’historique exploitable.",
          ago(4 * HOUR - 2 * 60_000),
        ),
      ],
    ),
    conversation(
      "Rétrospective : actions concrètes",
      [
        message(
          "user",
          "Notre rétrospective tourne en rond. Comment la rendre plus actionnable ?",
          ago(DAY + 2 * HOUR),
        ),
        message(
          "assistant",
          "Le problème vient souvent d’un déséquilibre entre le temps de discussion et le temps de décision. Voici une structure qui produit des engagements concrets.\n\n### Format en 60 minutes\n1. **Météo d’ouverture** · 5 min, une phrase par personne.\n2. **Faits marquants** · 10 min, données et événements, pas d’interprétation.\n3. **Analyse** · 20 min, regroupement des causes racines.\n4. **Décisions** · 20 min, maximum 3 actions avec un responsable et une date.\n5. **Clôture** · 5 min, un mot chacun.\n\n### Règles efficaces\n- Une action sans **responsable** et sans **échéance** n’existe pas.\n- Les actions du sprint précédent sont revues en premier.\n- On limite à trois engagements pour éviter la dispersion.\n\nJe peux te préparer un modèle de tableau de suivi pour les actions.",
          ago(DAY + HOUR),
        ),
      ],
    ),
    conversation(
      "Estimation en story points",
      [
        message(
          "user",
          "Comment expliquer les story points à une équipe qui débute en Scrum ?",
          ago(2 * DAY + 4 * HOUR),
        ),
        message(
          "assistant",
          "Les story points mesurent la **complexité relative**, pas la durée. L’objectif est de créer un langage commun pour comparer les tickets entre eux.\n\n### L’analogie à utiliser\nImagine que tu ranges des cartons. Un petit carton peut être lourd, un grand peut être léger. On ne mesure pas le temps de portage : on mesure l’effort, l’incertitude et la complexité.\n\n### Atelier de 45 minutes\n- Choisir une story de référence déjà livrée.\n- La placer à **3 points**.\n- Comparer chaque nouvelle story à cette référence.\n- Utiliser le planning poker avec les valeurs **1, 2, 3, 5, 8, 13, 21**.\n- Discuter uniquement les écarts importants.\n\n### Erreur fréquente\nConvertir les points en heures. Cela détruit la valeur de l’estimation et crée de fausses prévisions.\n\nLa vélocité doit rester un indicateur de prévision, jamais un objectif de performance individuelle.",
          ago(2 * DAY + 3 * HOUR),
        ),
      ],
    ),
    conversation(
      "Cérémonies Scrum efficaces",
      [
        message(
          "user",
          "Donne-moi les signaux d’alerte d’un daily trop long.",
          ago(3 * DAY + HOUR),
        ),
        message(
          "assistant",
          "Un daily devient problématique dès qu’il se transforme en réunion de statut. Voici les signaux les plus fiables.\n\n### Signaux d’alerte\n- Chaque personne raconte ce qu’elle a fait **hier** en détail.\n- Les discussions techniques prennent plus de deux minutes.\n- Le Scrum Master doit relancer chaque participant.\n- L’événement dépasse régulièrement 20 minutes.\n\n### Version saine en 15 minutes\nChaque membre répond à trois questions, orientées **ensemble** :\n1. Qu’est-ce qui bloque ma progression ?\n2. Ai-je besoin d’aide aujourd’hui ?\n3. Suis-je toujours aligné sur l’objectif de sprint ?\n\nLes sujets annexes se règlent après la réunion, en petit groupe.",
          ago(3 * DAY + 30 * 60_000),
        ),
      ],
    ),
    conversation(
      "Definition of Done",
      [
        message(
          "user",
          "Rédige une Definition of Done pour une équipe web de 6 personnes.",
          ago(4 * DAY + 2 * HOUR),
        ),
        message(
          "assistant",
          "Voici une Definition of Done raisonnable pour une équipe web pluridisciplinaire. Elle doit être affichée, comprise et réellement appliquée.\n\n### Une story est terminée lorsque\n- Le code est relu par au moins un pair.\n- Les tests unitaires et d’intégration passent en CI.\n- Le parcours a été testé sur mobile et desktop.\n- L’accessibilité clavier et le contraste respectent le niveau AA.\n- La documentation utilisateur ou technique est mise à jour.\n- La fonctionnalité est déployée en environnement de recette.\n- Le product owner a validé les critères d’acceptation.\n\n### Revue trimestrielle\nRevoir la Definition of Done à chaque rétrospective de fin de trimestre pour l’adapter à la maturité de l’équipe.",
          ago(4 * DAY + HOUR),
        ),
      ],
    ),
    conversation(
      "Roadmap Q4 et OKR",
      [
        message(
          "user",
          "Propose 3 OKR pour le dernier trimestre, orientés fiabilité et croissance.",
          ago(6 * DAY),
        ),
        message(
          "assistant",
          "### O1 · Fiabiliser l’expérience de paiement\n**Objectif clé 1 :** Réduire le taux d’échec du checkout de 4,2 % à moins de 1,5 %.\n**Objectif clé 2 :** Ramener le temps de réponse p95 sous 400 ms.\n\n### O2 · Accélérer la livraison produit\n**Objectif clé 3 :** Réduire le délai moyen entre l’idée et la mise en production de 21 à 10 jours.\n**Objectif clé 4 :** Atteindre 85 % des stories livrées sans retour en développement.\n\n### O3 · Développer la confiance utilisateur\n**Objectif clé 5 :** Porter le taux de complétion de l’onboarding à 70 %.\n**Objectif clé 6 :** Obtenir un NPS supérieur à 45 sur les nouveaux comptes.\n\n### Principe de pilotage\nChaque objectif clé doit avoir **une métrique unique**, une source de données fiable et une revue hebdomadaire de 15 minutes. Les initiatives qui ne servent aucun objectif clé sont reportées au trimestre suivant.",
          ago(6 * DAY - 8 * HOUR),
        ),
      ],
    ),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const SUGGESTIONS = [
  {
    icon: "sparkles",
    title: "Préparer un sprint",
    description: "Objectif, stories et ordre du jour en quelques secondes.",
    prompt:
      "Prépare la planification de mon prochain sprint avec un objectif clair, un ordre du jour et des risques.",
  },
  {
    icon: "layers",
    title: "Rédiger une user story",
    description: "Transforme une idée floue en story avec critères d’acceptation.",
    prompt:
      "Transforme cette idée en user story complète avec des critères d’acceptation : recevoir une alerte quand un rapport est prêt.",
  },
  {
    icon: "refresh",
    title: "Améliorer une rétro",
    description: "Un format actionnable avec responsables et échéances.",
    prompt:
      "Propose un format de rétrospective de 60 minutes qui produit des actions concrètes avec responsables et échéances.",
  },
  {
    icon: "target",
    title: "Définir des OKR",
    description: "Des objectifs mesurables alignés sur la stratégie produit.",
    prompt:
      "Propose trois OKR pour le prochain trimestre, orientés fiabilité, livraison et confiance utilisateur.",
  },
] as const;
