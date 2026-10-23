import type {
  Accent,
  ModelId,
  PresenceStatus,
  Settings,
} from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  accent: "violet",
  density: "comfortable",
  reduceMotion: false,
  timestamps: true,
  model: "xscrum-pro",
  temperature: 0.7,
  displayName: "Alex Martin",
  email: "alex@xscrum.io",
  status: "online",
};

export const ACCENTS: {
  id: Accent;
  label: string;
  from: string;
  to: string;
  hint: string;
}[] = [
  {
    id: "violet",
    label: "Aurora",
    from: "#8b5cf6",
    to: "#22d3ee",
    hint: "Violet néon et cyan",
  },
  {
    id: "cyan",
    label: "Océan",
    from: "#22d3ee",
    to: "#818cf8",
    hint: "Cyan électrique et indigo",
  },
  {
    id: "emerald",
    label: "Menthe",
    from: "#34d399",
    to: "#22d3ee",
    hint: "Vert menthe et turquoise",
  },
  {
    id: "rose",
    label: "Nébuleuse",
    from: "#fb7185",
    to: "#a78bfa",
    hint: "Rose corail et violet",
  },
];

export const MODELS: {
  id: ModelId;
  name: string;
  description: string;
  badge: string;
  context: string;
  speed: string;
}[] = [
  {
    id: "xscrum-pro",
    name: "XScrum Pro",
    description:
      "Le meilleur équilibre pour rédiger, analyser et piloter vos rituels agile.",
    badge: "Recommandé",
    context: "128k",
    speed: "Rapide",
  },
  {
    id: "xscrum-fast",
    name: "XScrum Flash",
    description:
      "Réponses ultra-rapides pour les questions courtes et les reformulations.",
    badge: "Éclair",
    context: "32k",
    speed: "Très rapide",
  },
  {
    id: "xscrum-reason",
    name: "XScrum Reason",
    description:
      "Raisonnement approfondi pour les estimations, arbitrages et plans de sprint.",
    badge: "Réflexion",
    context: "200k",
    speed: "Approfondi",
  },
];

export const STATUS_LABELS: Record<PresenceStatus, string> = {
  online: "Disponible",
  away: "Absent",
  focus: "Concentration",
};

export function getModel(id: ModelId) {
  return MODELS.find((model) => model.id === id) ?? MODELS[0];
}
