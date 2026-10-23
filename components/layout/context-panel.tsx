"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Lock,
  PanelRightClose,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import { getModel } from "@/lib/settings";
import type { Attachment } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

type PanelTab = "context" | "files";

export function ContextPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { activeConversation, settings } = useChat();
  const { toast } = useToast();
  const [tab, setTab] = useState<PanelTab>("context");
  const [memory, setMemory] = useState(true);
  const [instructions, setInstructions] = useState(
    "Réponds en français, avec des exemples concrets et des actions mesurables. Priorise la clarté.",
  );
  const model = getModel(settings.model);

  const files = useMemo(() => {
    const attachments: Attachment[] = [];
    activeConversation?.messages.forEach((message) => {
      message.attachments?.forEach((attachment) => {
        attachments.push(attachment);
      });
    });
    return attachments;
  }, [activeConversation]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            aria-label="Fermer le panneau"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm xl:hidden"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <aside
        aria-label="Panneau de contexte"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[#07070f]/92 backdrop-blur-2xl transition-transform duration-300 ease-out xl:static xl:z-20 xl:translate-x-0",
          open
            ? "translate-x-0"
            : "translate-x-full xl:w-0 xl:overflow-hidden xl:border-0",
        )}
      >
        {open ? (
          <div className="flex h-full w-[320px] flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">
                  <SlidersHorizontal className="size-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">
                    Contexte
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">
                    Session privée
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  label="Fermer le panneau"
                  size="sm"
                  onClick={onClose}
                  className="xl:hidden"
                >
                  <X className="size-4" />
                </IconButton>
                <IconButton
                  label="Réduire le panneau"
                  size="sm"
                  onClick={onClose}
                  className="hidden xl:inline-flex"
                >
                  <PanelRightClose className="size-4" />
                </IconButton>
              </div>
            </div>

            <div className="flex shrink-0 gap-1 px-3 pt-3">
              {(
                [
                  { id: "context", label: "Contexte" },
                  { id: "files", label: `Fichiers${files.length ? ` (${files.length})` : ""}` },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "focus-ring relative flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                    tab === item.id
                      ? "bg-white/[0.07] text-[var(--text)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]",
                  )}
                >
                  {item.label}
                  {tab === item.id ? (
                    <span className="absolute inset-x-3 -bottom-1 h-px accent-gradient" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="scroll-area flex-1 overflow-y-auto p-3">
              {tab === "context" ? (
                <div className="space-y-3">
                  <section className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]">
                        <Sparkles className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[var(--text)]">
                          {model.name}
                        </p>
                        <p className="text-[10px] text-[var(--faint)]">
                          Fenêtre de {model.context} tokens
                        </p>
                      </div>
                      <span className="rounded-md border border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.1)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        Actif
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-[var(--faint)]">
                        <span>Contexte utilisé</span>
                        <span className="font-mono tabular-nums">42 %</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-[42%] rounded-full accent-gradient" />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-3.5">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Lock className="size-3 text-[var(--faint)]" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                        Instructions
                      </p>
                    </div>
                    <textarea
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      rows={4}
                      aria-label="Instructions système"
                      className="focus-ring w-full resize-none rounded-xl border border-[var(--border)] bg-black/20 p-2.5 text-[11px] leading-relaxed text-[var(--muted)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Instructions enregistrées",
                          description:
                            "Elles seront appliquées aux prochaines réponses.",
                          variant: "success",
                        })
                      }
                      className="focus-ring mt-2 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] py-1.5 text-[10px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
                    >
                      Appliquer les instructions
                    </button>
                  </section>

                  <section className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[var(--text)]">
                          Mémoire de l’espace
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--faint)]">
                          Retenir les préférences de l’équipe.
                        </p>
                      </div>
                      <Switch
                        checked={memory}
                        onChange={setMemory}
                        label="Mémoire de l’espace"
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                      Raccourcis
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { label: "Palette de commandes", keys: "⌘K" },
                        { label: "Nouveau chat", keys: "⌘N" },
                        { label: "Paramètres", keys: "⌘," },
                      ].map((shortcut) => (
                        <div
                          key={shortcut.label}
                          className="flex items-center justify-between text-[10px] text-[var(--muted)]"
                        >
                          <span>{shortcut.label}</span>
                          <Kbd>{shortcut.keys}</Kbd>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : files.length === 0 ? (
                <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.03] text-[var(--faint)]">
                    <FolderOpen className="size-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-[var(--muted)]">
                    Aucun fichier dans ce chat
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--faint)]">
                    Glissez un document dans le composer ou utilisez le
                    trombone pour l’ajouter à la conversation.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 pb-1">
                    <Info className="size-3 text-[var(--faint)]" />
                    <p className="text-[10px] text-[var(--faint)]">
                      Pièces jointes de cette conversation
                    </p>
                  </div>
                  {files.map((file) => {
                    const isImage = file.type.startsWith("image/");
                    const Icon = isImage ? ImageIcon : FileText;
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-white/[0.025] p-2"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)]">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-[var(--text)]">
                            {file.name}
                          </span>
                          <span className="block text-[9px] text-[var(--faint)]">
                            {formatBytes(file.size)}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] text-[var(--faint)]">
                  <span className="size-1.5 rounded-full bg-[var(--success)]" />
                  Contexte synchronisé
                </span>
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: "Contexte réinitialisé",
                      description: "La conversation repart sur une base propre.",
                      variant: "info",
                    })
                  }
                  className="focus-ring rounded-md px-1.5 py-0.5 text-[10px] text-[var(--faint)] transition-colors hover:text-[var(--text)]"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
