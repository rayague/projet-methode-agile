"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Menu, PanelRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useChat } from "@/hooks/use-chat-store";
import { getModel, MODELS } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function ChatHeader({
  panelOpen,
  onOpenSidebar,
  onTogglePanel,
}: {
  panelOpen: boolean;
  onOpenSidebar: () => void;
  onTogglePanel: () => void;
}) {
  const { activeConversation, settings, updateSettings } = useChat();
  const [modelOpen, setModelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const model = getModel(settings.model);

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

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 px-3 sm:px-5">
      <IconButton
        label="Ouvrir le menu"
        onClick={onOpenSidebar}
        className="lg:hidden"
      >
        <Menu className="size-4.5" />
      </IconButton>

      <h1 className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">
        {activeConversation?.title ?? ""}
      </h1>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={modelOpen}
          onClick={() => setModelOpen((value) => !value)}
          className="focus-ring flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
        >
          {model.name}
          <ChevronDown
            className={cn(
              "size-3.5 text-[var(--faint)] transition-transform duration-200",
              modelOpen && "rotate-180",
            )}
          />
        </button>

        {modelOpen ? (
          <div
            role="menu"
            className="glass-strong absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-2xl p-1.5"
          >
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
                  }}
                  className={cn(
                    "focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-[rgba(var(--accent-rgb),0.1)]"
                      : "hover:bg-white/[0.05]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-[var(--text)]">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                      {item.description}
                    </span>
                  </span>
                  {active ? (
                    <Check className="size-3.5 shrink-0 text-[var(--accent)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <IconButton
        label={panelOpen ? "Masquer le panneau" : "Afficher le panneau"}
        onClick={onTogglePanel}
        active={panelOpen}
        className="hidden sm:inline-flex"
      >
        <PanelRight className="size-4" />
      </IconButton>
    </header>
  );
}
