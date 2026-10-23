"use client";

import { useMemo, useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Settings2,
  User,
  type LucideIcon,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Modal } from "@/components/ui/modal";
import { useChat } from "@/hooks/use-chat-store";
import { cn, truncate } from "@/lib/utils";

interface PaletteResult {
  id: string;
  label: string;
  hint?: string;
  group: "Actions" | "Conversations" | "Messages";
  icon: LucideIcon;
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNewChat,
  onOpenSettings,
  onOpenProfile,
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}) {
  const { conversations, selectChat } = useChat();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo<PaletteResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    const list: PaletteResult[] = [];

    const actions: PaletteResult[] = [
      {
        id: "action-new",
        label: "Nouvelle conversation",
        hint: "Démarrer un chat vierge",
        group: "Actions",
        icon: Plus,
        action: () => {
          onNewChat();
          onClose();
        },
      },
      {
        id: "action-settings",
        label: "Ouvrir les paramètres",
        hint: "Apparence, modèle, données",
        group: "Actions",
        icon: Settings2,
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
      {
        id: "action-profile",
        label: "Voir le profil",
        hint: "Compte, statut et espace",
        group: "Actions",
        icon: User,
        action: () => {
          onClose();
          onOpenProfile();
        },
      },
    ];

    actions
      .filter(
        (action) =>
          !normalized ||
          action.label.toLowerCase().includes(normalized) ||
          action.hint?.toLowerCase().includes(normalized),
      )
      .forEach((action) => list.push(action));

    conversations
      .filter(
        (conversation) =>
          !normalized ||
          conversation.title.toLowerCase().includes(normalized),
      )
      .slice(0, normalized ? 5 : 4)
      .forEach((conversation) => {
        list.push({
          id: `conv-${conversation.id}`,
          label: conversation.title,
          hint: `${conversation.messages.length} message${conversation.messages.length > 1 ? "s" : ""}`,
          group: "Conversations",
          icon: MessageSquare,
          action: () => {
            selectChat(conversation.id);
            onClose();
          },
        });
      });

    if (normalized) {
      conversations.forEach((conversation) => {
        conversation.messages.forEach((message) => {
          if (!message.content.toLowerCase().includes(normalized)) return;
          if (list.some((item) => item.id === `msg-${message.id}`)) return;
          list.push({
            id: `msg-${message.id}`,
            label: conversation.title,
            hint: truncate(message.content, 68),
            group: "Messages",
            icon: Search,
            action: () => {
              selectChat(conversation.id);
              onClose();
            },
          });
        });
      });
    }

    return list.slice(0, 12);
  }, [
    query,
    conversations,
    onClose,
    onNewChat,
    onOpenProfile,
    onOpenSettings,
    selectChat,
  ]);

  const run = (result: PaletteResult | undefined) => {
    if (!result) return;
    result.action();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Palette de commandes"
      className="max-w-xl"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
        <Search className="size-4 shrink-0 text-[var(--faint)]" />
        <input
          data-autofocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                results.length === 0 ? 0 : (index + 1) % results.length,
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) =>
                results.length === 0
                  ? 0
                  : (index - 1 + results.length) % results.length,
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              run(results[activeIndex]);
            }
          }}
          placeholder="Rechercher un chat, un message ou une action…"
          aria-label="Rechercher dans la palette de commandes"
          className="h-14 min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
        />
        <Kbd>esc</Kbd>
      </div>

      <div className="scroll-area max-h-[min(420px,60dvh)] overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-[var(--muted)]">
              Aucun résultat
            </p>
            <p className="mt-1 text-xs text-[var(--faint)]">
              Essayez un autre mot-clé ou créez une nouvelle conversation.
            </p>
          </div>
        ) : (
          results.map((result, index) => {
            const showGroup = index === 0 || results[index - 1].group !== result.group;
            const active = index === activeIndex;
            return (
              <div key={result.id}>
                {showGroup ? (
                  <p className="px-2.5 pb-1 pt-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                    {result.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => run(result)}
                  className={cn(
                    "focus-ring flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    active
                      ? "bg-[rgba(var(--accent-rgb),0.12)]"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                      active
                        ? "border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-white/[0.03] text-[var(--faint)]",
                    )}
                  >
                    <result.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-[var(--text)]">
                      {result.label}
                    </span>
                    {result.hint ? (
                      <span className="block truncate text-[10px] text-[var(--faint)]">
                        {result.hint}
                      </span>
                    ) : null}
                  </span>
                  {active ? (
                    <span className="shrink-0 rounded-md border border-[var(--border)] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-[var(--faint)]">
                      ↵
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--faint)]">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          naviguer
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          ouvrir
          <span className="mx-1 text-white/15">·</span>
          <Kbd>esc</Kbd>
          fermer
        </span>
      </div>
    </Modal>
  );
}
