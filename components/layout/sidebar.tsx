"use client";

import { useMemo, type ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SquarePen,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ConversationItem } from "@/components/sidebar/conversation-item";
import { UserCard } from "@/components/sidebar/user-card";
import { IconButton } from "@/components/ui/icon-button";
import { useChat } from "@/hooks/use-chat-store";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

function byRecent(a: Conversation, b: Conversation) {
  return b.updatedAt - a.updatedAt;
}

function SidebarAction({
  icon,
  label,
  collapsed,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  if (collapsed) {
    return (
      <IconButton label={label} onClick={onClick} tooltipSide="right">
        {icon}
      </IconButton>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[13px] text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
    >
      {icon}
      {label}
    </button>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenSearch,
  onOpenSettings,
  onOpenProfile,
  onRequestDelete,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
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

  const groups = useMemo(() => {
    const pinned = conversations.filter((item) => item.pinned).sort(byRecent);
    const recent = conversations.filter((item) => !item.pinned).sort(byRecent);
    return [
      { label: "Épinglés", items: pinned },
      { label: "Récents", items: recent },
    ].filter((group) => group.items.length > 0);
  }, [conversations]);

  const handleSelect = (id: string) => {
    selectChat(id);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-[var(--border)] bg-[#07070f]/95 transition-[transform,width] duration-300 ease-out lg:static lg:z-20 lg:translate-x-0",
          collapsed ? "w-[64px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <IconButton
              label="Déplier la barre latérale"
              onClick={onToggleCollapse}
              tooltipSide="right"
              className="hidden lg:inline-flex"
            >
              <PanelLeftOpen className="size-4" />
            </IconButton>
          ) : (
            <>
              <span className="flex min-w-0 items-center gap-2.5 px-1">
                <Logo size={26} />
                <span className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  XScrum <span className="accent-text">AI</span>
                </span>
              </span>
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
            </>
          )}
        </div>

        <div
          className={cn(
            "flex flex-col gap-0.5 px-2",
            collapsed && "items-center",
          )}
        >
          <SidebarAction
            icon={<SquarePen className="size-4" />}
            label="Nouveau chat"
            collapsed={collapsed}
            onClick={() => {
              newChat();
              onCloseMobile();
            }}
          />
          <SidebarAction
            icon={<Search className="size-4" />}
            label="Rechercher"
            collapsed={collapsed}
            onClick={onOpenSearch}
          />
        </div>

        <nav
          aria-label="Historique des conversations"
          className="scroll-area mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-3"
        >
          {collapsed
            ? null
            : groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-2.5 pb-1 text-[11px] text-[var(--faint)]">
                    {group.label}
                  </p>
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
              ))}
        </nav>

        <UserCard
          collapsed={collapsed}
          onOpenProfile={onOpenProfile}
          onOpenSettings={onOpenSettings}
        />
      </aside>
    </>
  );
}
