"use client";

import { Settings2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { useChat } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

export function UserCard({
  collapsed,
  onOpenProfile,
  onOpenSettings,
}: {
  collapsed: boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}) {
  const { settings } = useChat();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 p-2",
        collapsed && "flex-col",
      )}
    >
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label="Ouvrir le profil"
        className={cn(
          "focus-ring flex min-w-0 items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.05]",
          !collapsed && "flex-1",
        )}
      >
        <Avatar name={settings.displayName} size="sm" />
        {!collapsed ? (
          <span className="truncate text-[13px] text-[var(--text)]">
            {settings.displayName}
          </span>
        ) : null}
      </button>
      <IconButton
        label="Paramètres"
        size="sm"
        onClick={onOpenSettings}
        tooltipSide={collapsed ? "right" : "top"}
      >
        <Settings2 className="size-4" />
      </IconButton>
    </div>
  );
}
