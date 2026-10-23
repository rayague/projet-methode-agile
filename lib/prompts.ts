/**
 * Instructions and JSON schemas sent to Gemini (server side only). Every
 * prompt keeps the model on one job — framing a software project — and
 * forbids inventing anything the client did not say.
 */
import { THEMES, type Backlog, type Synthesis, type ThemeKey } from "@/lib/types";

const str = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
const list = (description: string) => ({ type: "array", items: { type: "string" }, description });

/* ------------------------------------------------------------------ */
/* 1. Discovery: analysis of the conversation                          */
/* ------------------------------------------------------------------ */

export interface Analysis {
  themes: Record<ThemeKey, { couvert: boolean; connu: string }>;
  ambiguite: string;
  horsSujet: boolean;
  titre: string;
}

export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    themes: {
      type: "object",
      properties: Object.fromEntries(
        THEMES.map((theme) => [
          theme.key,
          {
            type: "object",
            properties: {
              couvert: { type: "boolean" },
              connu: str("Ce que le client a dit sur ce thème, en une phrase, ou chaîne vide."),
            },
            required: ["couvert", "connu"],
          },
        ]),
      ),
      required: THEMES.map((theme) => theme.key),
    },
    ambiguite: str(
      "Ambiguïté ou contradiction dans le DERNIER message du client, en une phrase ; chaîne vide s’il n’y en a pas.",
    ),
    horsSujet: { type: "boolean", description: "Le dernier message n’a aucun rapport avec le projet." },
    titre: str("Nom court du projet (2 à 5 mots), ou chaîne vide si inconnu."),
  },
  required: ["themes", "ambiguite", "horsSujet", "titre"],
};

export const ANALYSIS_PROMPT = `Tu es l’analyste de XScrum AI. Tu lis une conversation entre un client et un assistant qui clarifie le besoin d’un projet logiciel.

Pour chacun des thèmes, indique s’il est COUVERT :
- utilisateurs : qui utilisera le produit (types d’utilisateurs, cibles) ;
- objectifs : le problème à résoudre, le résultat attendu ;
- fonctionnalites : au moins les fonctionnalités clés du produit ;
- contraintes : techniques, plateformes, réglementaires, sécurité, ou absence explicite de contrainte ;
- priorites : ce qui est le plus important / à livrer en premier ;
- budgetDelais : budget, échéances ou délais.

Un thème est couvert uniquement si le CLIENT a donné une information explicite et exploitable, ou a confirmé une reformulation de l’assistant. Une supposition de l’assistant ne compte pas. Une réponse du type « je ne sais pas » ou « peu importe » couvre le thème si le client l’assume explicitement.
Signale une ambiguïté seulement si le dernier message du client est vague, contradictoire ou interprétable de plusieurs façons.`;

export function chatPrompt(analysis: Analysis, firstTurn: boolean) {
  const covered = THEMES.filter((t) => analysis.themes[t.key]?.couvert);
  const missingRequired = THEMES.filter((t) => t.required && !analysis.themes[t.key]?.couvert);
  const missingOptional = THEMES.filter((t) => !t.required && !analysis.themes[t.key]?.couvert);
  const ready = missingRequired.length === 0;
  const names = (themes: readonly { label: string }[]) =>
    themes.map((t) => t.label.toLowerCase()).join(", ") || "aucun";

  return `Tu es XScrum AI, un analyste métier expert en Scrum. Ta seule mission : aider un client à clarifier le besoin de son projet logiciel. L’application en tirera ensuite une synthèse, puis un backlog Scrum. Tu ne fais rien d’autre.

Règles :
- Réponds en français, avec un ton professionnel et chaleureux, en 120 mots maximum. Markdown léger autorisé (gras, listes).
- Pose AU MAXIMUM 3 questions, numérotées, ciblées sur les thèmes manquants, en commençant par les obligatoires. Propose des exemples de réponses quand cela aide le client.
- N’invente et ne suppose rien sur le projet : appuie-toi uniquement sur ce que le client a dit.
- Ne salue pas (pas de « Bonjour ») : la conversation est déjà engagée.
- Ne rédige jamais de synthèse, de user stories ni de backlog dans la conversation : l’application s’en charge à l’étape suivante.
${firstTurn ? "- C’est la première description du client : remercie-le en une phrase qui montre que tu as compris l’idée générale, puis pose tes questions.\n" : ""}${
    analysis.ambiguite
      ? `- AMBIGUÏTÉ DÉTECTÉE : « ${analysis.ambiguite} ». Commence par reformuler ce que tu as compris et demande confirmation (« Si je comprends bien, … Est-ce bien cela ? »). Cette confirmation compte dans les 3 questions.\n`
      : ""
  }${
    analysis.horsSujet
      ? "- Le dernier message est HORS SUJET : réponds en une phrase que tu es dédié au cadrage du projet, puis reviens au projet.\n"
      : ""
  }${
    ready
      ? "- TOUS LES THÈMES ESSENTIELS SONT COUVERTS : récapitule le projet en une ou deux phrases, puis propose de passer à la synthèse en invitant le client à cliquer sur « Générer la synthèse ». Il peut aussi apporter d’autres précisions avant. Au plus une question facultative.\n"
      : ""
  }
État de l’analyse :
- Thèmes couverts : ${names(covered)}
- Thèmes obligatoires manquants : ${names(missingRequired)}
- Thèmes facultatifs manquants : ${names(missingOptional)}`;
}

/* ------------------------------------------------------------------ */
/* 2. Synthesis                                                        */
/* ------------------------------------------------------------------ */

export interface RawSynthesis {
  contexte: string;
  objectifs: string[];
  utilisateurs: string[];
  fonctionnalites: string[];
  contraintes: string[];
  changements: string;
}

export const SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    contexte: str("Deux à quatre phrases : le projet, le problème, le contexte."),
    objectifs: list("Objectifs du projet, une phrase chacun."),
    utilisateurs: list("Types d’utilisateurs et ce qu’ils attendent, une phrase chacun."),
    fonctionnalites: list("Une capacité distincte du produit par élément, en une phrase."),
    contraintes: list("Contraintes : techniques, plateformes, sécurité, réglementaires, budget, délais, priorités."),
    changements: str("En une phrase, ce qui a changé par rapport à la synthèse précédente ; chaîne vide pour une première synthèse."),
  },
  required: ["contexte", "objectifs", "utilisateurs", "fonctionnalites", "contraintes", "changements"],
};

export function synthesisPrompt(current: Synthesis | null) {
  return `Tu es l’analyste de XScrum AI. Rédige la synthèse structurée du besoin du client à partir de la conversation.

Règles :
- Uniquement des informations données ou confirmées par le client. N’invente rien : un élément non abordé n’apparaît pas (une liste peut être vide).
- Chaque élément est une phrase concise et autonome, en français, sans numérotation.
- fonctionnalites : TOUTES les capacités du produit évoquées par le client, y compris celles décrites à travers le rôle d’un utilisateur (« le service planning valide les réservations » donne aussi la fonctionnalité « Valider les réservations ») et celles prévues pour plus tard, signalées par « (plus tard) ». Une capacité par élément.
- Les priorités, le budget et les délais exprimés vont dans les contraintes.
${
  current
    ? `- Le client CORRIGE la synthèse actuelle (dernier message). Pars de la synthèse actuelle ci-dessous, applique exactement la correction demandée et ne modifie rien d’autre. Décris le changement dans « changements ».

Synthèse actuelle :
${JSON.stringify(current)}`
    : ""
}`;
}

/* ------------------------------------------------------------------ */
/* 3. Backlog                                                          */
/* ------------------------------------------------------------------ */

const STORY_PROPERTIES = {
  titre: str("Titre court, 8 mots maximum."),
  enTantQue: str("Le type d’utilisateur, sans les mots « En tant que »."),
  jeVeux: str("L’action précise, sans les mots « je veux »."),
  afinDe: str("Le bénéfice, sans les mots « afin de »."),
  priorite: { type: "string", enum: ["Must", "Should", "Could", "Won't"] },
  estimation: { type: "integer", description: "Points de Fibonacci : 1, 2, 3, 5, 8, 13, 21 ou 34." },
  criteres: {
    type: "array",
    minItems: 2,
    description: "Au moins 2 critères d’acceptation testables, format Gherkin.",
    items: {
      type: "object",
      properties: {
        etantDonne: str("Contexte initial, qui se lit après « Étant donné que » (ex. « l’étudiant est connecté »)."),
        quand: str("Action, sans « Quand »."),
        alors: str("Résultat observable et vérifiable, sans « Alors »."),
      },
      required: ["etantDonne", "quand", "alors"],
    },
  },
  sources: list("Identifiants des éléments de la synthèse dont la story découle (O1, U1, F1, C1…). Au moins un F."),
};
const STORY_REQUIRED = Object.keys(STORY_PROPERTIES);

export const BACKLOG_SCHEMA = {
  type: "object",
  properties: {
    epics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre: str("Titre de l’epic."),
          description: str("Une phrase."),
          sources: list("Identifiants des éléments de la synthèse couverts."),
          stories: {
            type: "array",
            items: { type: "object", properties: STORY_PROPERTIES, required: STORY_REQUIRED },
          },
        },
        required: ["titre", "description", "sources", "stories"],
      },
    },
  },
  required: ["epics"],
};

const QUALITY_RULES = `- Format : enTantQue = un des utilisateurs de la synthèse ; jeVeux = une action précise ; afinDe = le bénéfice concret.
- Pas deux stories pour le même besoin.
- Priorité MoSCoW (Must, Should, Could, Won't), cohérente avec les objectifs et les priorités de la synthèse.
- Estimation en points de Fibonacci (1, 2, 3, 5, 8, 13, 21, 34), effort relatif. Si une story dépasse 13, donne son estimation réelle : l’application la signalera « à découper ».
- Au moins 2 critères d’acceptation par story, au format Gherkin, concrets et testables (valeurs, messages, états observables).
- sources : identifiants exacts des éléments de la synthèse (O1, U1, F1, C1…). N’en invente pas.
- Tout est en français.`;

export function backlogPrompt(synthesis: Synthesis) {
  return `Tu es un Product Owner senior. Construis le product backlog Scrum du projet à partir de la SYNTHÈSE VALIDÉE ci-dessous, et uniquement d’elle.

Règles :
- Regroupe les stories en epics cohérents (en général 3 à 7), chacun couvrant un ensemble de fonctionnalités.
- Chaque fonctionnalité (F…) est couverte par au moins une story ; une fonctionnalité « (plus tard) » reçoit la priorité Could ou Won't. N’ajoute aucune fonctionnalité absente de la synthèse. Une story technique n’est permise que si elle découle directement d’un élément cité en source.
- Découpe finement : une story = un besoin livrable en un sprint.
${QUALITY_RULES}

SYNTHÈSE VALIDÉE :
${JSON.stringify(synthesis)}`;
}

/* ------------------------------------------------------------------ */
/* 4. Natural-language edits                                           */
/* ------------------------------------------------------------------ */

export const EDIT_SCHEMA = {
  type: "object",
  properties: {
    reponse: str("Une à trois phrases en français pour le client : ce qui a été fait, ou la question de clarification."),
    operations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["ajouter", "modifier", "supprimer", "decouper", "ajouterEpic"] },
          cible: str("ID de la story (modifier, supprimer, decouper) ou de l’epic (ajouter) ; chaîne vide pour ajouterEpic."),
          epic: {
            type: "object",
            properties: { titre: str(), description: str() },
            required: ["titre", "description"],
          },
          stories: {
            type: "array",
            items: {
              type: "object",
              properties: { epicId: str("ID de l’epic de rattachement (EP-..)."), ...STORY_PROPERTIES },
              required: ["epicId", ...STORY_REQUIRED],
            },
          },
          raison: str("Pourquoi, en quelques mots."),
        },
        required: ["action", "cible", "stories", "raison"],
      },
    },
  },
  required: ["reponse", "operations"],
};

export function editPrompt(synthesis: Synthesis, backlog: Backlog) {
  const active = backlog.stories
    .filter((story) => story.statut === "active")
    .map((story) => ({
      id: story.id,
      epicId: story.epicId,
      titre: story.titre,
      enTantQue: story.enTantQue,
      jeVeux: story.jeVeux,
      afinDe: story.afinDe,
      priorite: story.priorite,
      estimation: story.estimation,
      criteres: story.criteres,
      sources: story.sources,
    }));
  return `Tu es l’assistant Product Owner de XScrum AI. Le client demande en langage naturel de faire évoluer le backlog ci-dessous. Traduis sa demande (dernier message) en opérations :
- ajouter : cible = ID de l’epic, stories = les nouvelles stories ;
- modifier : cible = ID de la story, stories = [la story COMPLÈTE après modification, tous les champs] ;
- supprimer : cible = ID de la story, stories = [] ;
- decouper : cible = ID de la story, stories = au moins 2 nouvelles stories plus petites qui couvrent ensemble tout le périmètre de l’originale (l’application archive l’originale) ;
- ajouterEpic : epic = { titre, description }, stories = les stories du nouvel epic.

Règles :
- Fais exactement ce qui est demandé, rien de plus. Les IDs des nouvelles stories sont attribués par l’application : ne renumérote jamais.
- Demande ambiguë (plusieurs stories possibles, intention floue) : aucune opération, pose une question précise dans « reponse ».
- Question sur le backlog (sans modification) : aucune opération, réponds dans « reponse » à partir des données ci-dessous.
- Demande sans rapport avec le backlog du projet : aucune opération, rappelle poliment ton rôle.
- Reste fidèle à la synthèse ; si le client ajoute un besoin qui n’y figure pas, fais-le et précise-le dans la réponse.
${QUALITY_RULES}

SYNTHÈSE VALIDÉE :
${JSON.stringify(synthesis)}

EPICS :
${JSON.stringify(backlog.epics.map(({ id, titre }) => ({ id, titre })))}

STORIES ACTIVES :
${JSON.stringify(active)}`;
}
