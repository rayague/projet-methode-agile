"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Menu,
  PanelRight,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import { getModel, MODELS } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function ChatHeader({
  panelOpen,
  onOpenSidebar,
  onOpenPalette,
  onTogglePanel,
}: {
  panelOpen: boolean;
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
  onTogglePanel: () => void;
}) {
  const { activeConversation, settings, updateSettings } = useChat();
  const { toast } = useToast();
  const [modelOpen, setModelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const model = getModel(settings.model);
  const title = activeConversation?.title ?? "Nouvelle conversation";
  const count = activeConversation?.messages.length ?? 0;

  useEffect(() => {
    if (!modelOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setModelOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModelOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [modelOpen]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de cette conversation est prêt à être partagé.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Votre navigateur a bloqué l’accès au presse-papiers.",
        variant: "error",
      });
    }
  };

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[#07070f]/45 px-3 sm:gap-3 sm:px-5">
      <IconButton
        label="Ouvrir le menu"
        onClick={onOpenSidebar}
        className="lg:hidden"
      >
        <Menu className="size-4.5" />
      </IconButton>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-medium text-[var(--text)]">
            {title}
          </h1>
          {activeConversation ? (
            <span className="hidden shrink-0 rounded-md border border-[var(--border)] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[var(--faint)] sm:inline-flex">
              Privé
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-[var(--faint)]">
          <span className="inline-flex size-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
          {model.name}
          <span className="text-white/20">·</span>
          {count > 0
            ? `${count} message${count > 1 ? "s" : ""}`
            : "Nouveau fil de discussion"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <IconButton
          label="Rechercher dans l’espace"
          onClick={onOpenPalette}
          className="hidden sm:inline-flex"
        >
          <Search className="size-4" />
        </IconButton>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={modelOpen}
            onClick={() => setModelOpen((value) => !value)}
            className="glass focus-ring flex h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] sm:gap-2 sm:px-2.5"
          >
            <span className="flex size-5 items-center justify-center rounded-md bg-[rgba(var(--accent-rgb),0.16)] text-[var(--accent)]">
              <Sparkles className="size-3" />
            </span>
            <span className="hidden max-w-24 truncate sm:block">
              {model.name}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-[var(--faint)] transition-transform duration-200",
                modelOpen && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence>
            {modelOpen ? (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="glass-strong absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl p-1.5"
              >
                <p className="px-2.5 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                  Choisir un modèle
                </p>
                {MODELS.map((item) => {
                  const active = item.id === settings.model;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        updateSettings({ model: item.id });
                        setModelOpen(false);
                        toast({
                          title: `${item.name} activé`,
                          description: item.description,
                          variant: "info",
                        });
                      }}
                      className={cn(
                        "focus-ring flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                        active
                          ? "bg-[rgba(var(--accent-rgb),0.1)]"
                          : "hover:bg-white/[0.05]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border",
                          active
                            ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-white/[0.03] text-[var(--faint)]",
                        )}
                      >
                        <Sparkles className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[var(--text)]">
                            {item.name}
                          </span>
                          <span className="rounded border border-[var(--border)] bg-white/[0.04] px-1 py-px text-[8px] uppercase tracking-wide text-[var(--faint)]">
                            {item.badge}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--muted)]">
                          {item.description}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[9px] text-[var(--faint)]">
                          <span>{item.context} tokens</span>
                          <span className="text-white/20">·</span>
                          <span>{item.speed}</span>
                        </span>
                      </span>
                      {active ? (
                        <Check className="mt-1 size-3.5 shrink-0 text-[var(--accent)]" />
                      ) : null}
                    </button>
                  );
                })}
                <div className="mt-1 flex items-center justify-between border-t border-[var(--border)] px-2.5 py-2 text-[10px] text-[var(--faint)]">
                  <span>Raccourci</span>
                  <Kbd>⌘⇧M</Kbd>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <IconButton
          label="Partager la conversation"
          onClick={share}
          className="hidden sm:inline-flex"
        >
          <Share2 className="size-4" />
        </IconButton>

        <IconButton
          label={panelOpen ? "Masquer le panneau" : "Afficher le panneau"}
          onClick={onTogglePanel}
          active={panelOpen}
        >
          <PanelRight className="size-4" />
        </IconButton>
      </div>
    </header>
  );
}
