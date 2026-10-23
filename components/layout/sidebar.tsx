"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ConversationItem } from "@/components/sidebar/conversation-item";
import { UserCard } from "@/components/sidebar/user-card";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/use-chat-store";
import type { Conversation } from "@/lib/types";
import { cn, groupConversation } from "@/lib/utils";

const GROUP_ORDER = [
  "Aujourd’hui",
  "Hier",
  "7 derniers jours",
  "Plus ancien",
];

function byRecent(a: Conversation, b: Conversation) {
  return b.updatedAt - a.updatedAt;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenProfile,
  onOpenHelp,
  onRequestDelete,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
  onRequestDelete: (conversation: Conversation) => void;
}) {
  const {
    conversations,
    activeId,
    newChat,
    selectChat,
    renameChat,
    togglePin,
  } = useChat();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? conversations.filter((conversation) => {
          if (conversation.title.toLowerCase().includes(normalized)) return true;
          return conversation.messages.some((message) =>
            message.content.toLowerCase().includes(normalized),
          );
        })
      : conversations;

    const pinned = filtered.filter((item) => item.pinned).sort(byRecent);
    const regular = filtered.filter((item) => !item.pinned).sort(byRecent);
    const buckets = new Map<string, Conversation[]>();
    regular.forEach((conversation) => {
      const label = groupConversation(conversation.updatedAt);
      const bucket = buckets.get(label) ?? [];
      bucket.push(conversation);
      buckets.set(label, bucket);
    });

    const result: { label: string; items: Conversation[] }[] = [];
    if (pinned.length > 0) result.push({ label: "Épinglés", items: pinned });
    GROUP_ORDER.forEach((label) => {
      const items = buckets.get(label);
      if (items?.length) result.push({ label, items });
    });
    return result;
  }, [conversations, query]);

  const ordered = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [conversations],
  );

  const handleSelect = (id: string) => {
    selectChat(id);
    onCloseMobile();
  };

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/65 lg:hidden"
            onClick={onCloseMobile}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-[var(--border)] bg-[#07070f]/95 transition-[transform,width] duration-300 ease-out lg:static lg:z-20 lg:translate-x-0",
          collapsed ? "w-[76px]" : "w-[288px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-3 px-4 pb-3 pt-5",
            collapsed ? "flex-col gap-2 px-2" : "justify-between",
          )}
        >
          <button
            type="button"
            onClick={newChat}
            className="focus-ring flex min-w-0 items-center gap-3 rounded-xl"
            aria-label="XScrum AI — Nouvelle conversation"
          >
            <Logo size={collapsed ? 34 : 38} />
            {!collapsed ? (
              <span className="min-w-0 text-left">
                <span className="block text-[15px] font-semibold tracking-tight text-[var(--text)]">
                  XScrum <span className="accent-text">AI</span>
                </span>
                <span className="block text-[9px] font-medium uppercase tracking-[0.22em] text-[var(--faint)]">
                  Assistant agile
                </span>
              </span>
            ) : null}
          </button>
          {collapsed ? (
            <IconButton
              label="Déplier la barre latérale"
              size="sm"
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex"
            >
              <PanelLeftOpen className="size-4" />
            </IconButton>
          ) : (
            <div className="flex items-center gap-1">
              <IconButton
                label="Réduire la barre latérale"
                size="sm"
                onClick={onToggleCollapse}
                className="hidden lg:inline-flex"
              >
                <PanelLeftClose className="size-4" />
              </IconButton>
              <IconButton
                label="Fermer le menu"
                size="sm"
                onClick={onCloseMobile}
                className="lg:hidden"
              >
                <X className="size-4" />
              </IconButton>
            </div>
          )}
        </div>

        <div className={cn("px-3", collapsed && "px-2")}>
          <button
            type="button"
            onClick={() => {
              newChat();
              onCloseMobile();
            }}
            className={cn(
              "accent-gradient focus-ring group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-3 text-[13px] font-semibold text-white shadow-[0_12px_34px_-12px_var(--accent-glow)] transition-all duration-200 hover:brightness-110 active:scale-[0.99]",
              collapsed ? "size-11 px-0" : "h-11",
            )}
          >
            <Plus className="size-4" />
            {!collapsed ? (
              <>
                <span>Nouveau chat</span>
                <span className="ml-auto rounded-md border border-white/20 bg-black/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/80">
                  ⌘N
                </span>
              </>
            ) : null}
          </button>
        </div>

        {!collapsed ? (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--faint)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setQuery("");
                }}
                placeholder="Rechercher un chat…"
                aria-label="Rechercher dans les conversations"
                className="focus-ring h-9 w-full rounded-xl border border-[var(--border)] bg-white/[0.035] pl-9 pr-12 text-xs text-[var(--text)] placeholder:text-[var(--faint)] transition-colors hover:bg-white/[0.05]"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <Kbd>⌘K</Kbd>
              </span>
            </div>
          </div>
        ) : null}

        <nav
          aria-label="Historique des conversations"
          className="scroll-area mt-2 flex-1 overflow-y-auto px-2.5 pb-3"
        >
          {collapsed ? (
            <div className="mt-2 flex flex-col items-center gap-1.5">
              {ordered.map((conversation) => (
                <Tooltip
                  key={conversation.id}
                  label={conversation.title}
                  side="right"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(conversation.id)}
                    aria-label={conversation.title}
                    className={cn(
                      "focus-ring flex size-10 items-center justify-center rounded-xl border transition-colors",
                      conversation.id === activeId
                        ? "border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]"
                        : "border-transparent text-[var(--faint)] hover:bg-white/[0.05] hover:text-[var(--muted)]",
                    )}
                  >
                    <MessageSquare className="size-4" />
                  </button>
                </Tooltip>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="mt-10 px-4 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.03] text-[var(--faint)]">
                <Search className="size-4" />
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Aucune conversation trouvée
              </p>
              <p className="mt-1 text-[11px] text-[var(--faint)]">
                Essayez un autre mot-clé.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        active={conversation.id === activeId}
                        onSelect={() => handleSelect(conversation.id)}
                        onRename={(title) => renameChat(conversation.id, title)}
                        onTogglePin={() => togglePin(conversation.id)}
                        onRequestDelete={() => onRequestDelete(conversation)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        <UserCard
          collapsed={collapsed}
          onOpenProfile={onOpenProfile}
          onOpenSettings={onOpenSettings}
          onOpenHelp={onOpenHelp}
        />
      </aside>
    </>
  );
}
