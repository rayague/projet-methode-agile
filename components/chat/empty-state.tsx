"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  AudioLines,
  FolderOpen,
  Globe,
  Layers,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useChat } from "@/hooks/use-chat-store";
import { SUGGESTIONS } from "@/lib/seed";
import { greeting } from "@/lib/utils";

const icons: Record<(typeof SUGGESTIONS)[number]["icon"], LucideIcon> = {
  sparkles: Sparkles,
  layers: Layers,
  refresh: RefreshCw,
  target: Target,
};

const capabilities = [
  { icon: FolderOpen, label: "Fichiers" },
  { icon: AudioLines, label: "Dictée" },
  { icon: Globe, label: "Recherche web" },
  { icon: Lock, label: "Mode privé" },
];

export function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (prompt: string) => void;
}) {
  const { settings } = useChat();
  const firstName = settings.displayName.split(" ")[0] || "vous";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 rounded-full border border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.08)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--accent)]"
      >
        <Sparkles className="size-3" />
        Assistant agile de votre équipe
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative mt-7"
      >
        <div className="absolute inset-0 scale-150 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.28),transparent_70%)] blur-2xl" />
        <Logo size={64} className="relative" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="text-balance mt-6 text-center text-[26px] font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-3xl"
      >
        {greeting()}, <span className="accent-text">{firstName}</span>.
        <br />
        Que construit-on aujourd’hui ?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
        className="mt-3 max-w-md text-balance text-center text-[13px] leading-6 text-[var(--muted)]"
      >
        Planifiez un sprint, rédigez une user story ou préparez votre
        rétrospective. Je structure le reste avec vous.
      </motion.p>

      <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion, index) => {
          const Icon = icons[suggestion.icon];
          return (
            <motion.button
              key={suggestion.title}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              onClick={() => onSuggestion(suggestion.prompt)}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/[0.025] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--accent-rgb),0.32)] hover:bg-white/[0.055] hover:shadow-[0_18px_44px_-26px_var(--accent-glow)]"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.6)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] transition-transform duration-200 group-hover:scale-105">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-[var(--text)]">
                      {suggestion.title}
                    </span>
                    <ArrowUpRight className="size-3.5 text-[var(--faint)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted)]">
                    {suggestion.description}
                  </span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-7 flex flex-wrap items-center justify-center gap-2"
      >
        {capabilities.map((capability) => (
          <span
            key={capability.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/[0.025] px-2.5 py-1 text-[10px] text-[var(--faint)]"
          >
            <capability.icon className="size-3" />
            {capability.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
