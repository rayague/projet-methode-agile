"use client";

import { ChevronRight, CircleHelp, Settings2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { STATUS_LABELS } from "@/lib/settings";
import { useChat } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

export function UserCard({
  collapsed,
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
}: {
  collapsed: boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}) {
  const { settings } = useChat();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-[var(--border)] px-2 py-3">
        <Tooltip label={`${settings.displayName} · Profil`} side="right">
          <button
            type="button"
            onClick={onOpenProfile}
            className="focus-ring rounded-full"
            aria-label="Ouvrir le profil"
          >
            <Avatar
              name={settings.displayName}
              presence={settings.status}
              size="sm"
            />
          </button>
        </Tooltip>
        <IconButton
          label="Paramètres"
          size="sm"
          onClick={onOpenSettings}
          tooltipSide="right"
        >
          <Settings2 className="size-4" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] p-3">
      <div className="glass rounded-2xl p-2">
        <button
          type="button"
          onClick={onOpenProfile}
          className="focus-ring flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.05]"
        >
          <Avatar
            name={settings.displayName}
            presence={settings.status}
            size="sm"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[var(--text)]">
              {settings.displayName}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  settings.status === "online"
                    ? "bg-[var(--success)]"
                    : settings.status === "away"
                      ? "bg-[var(--warning)]"
                      : "bg-[var(--accent)]",
                )}
              />
              {STATUS_LABELS[settings.status]} · Plan Pro
            </span>
          </span>
          <ChevronRight className="size-4 text-[var(--faint)]" />
        </button>
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="focus-ring flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
          >
            <Settings2 className="size-3.5" />
            Paramètres
          </button>
          <IconButton
            label="Aide et raccourcis"
            size="sm"
            onClick={onOpenHelp}
            tooltipSide="top"
          >
            <CircleHelp className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
