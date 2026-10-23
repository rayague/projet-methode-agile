"use client";

import {
  Check,
  Crown,
  HardDrive,
  LogOut,
  MessageSquare,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import { STATUS_LABELS } from "@/lib/settings";
import type { PresenceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: PresenceStatus[] = ["online", "away", "focus"];

export function ProfileDialog({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const { settings, updateSettings, conversations } = useChat();
  const { toast } = useToast();
  const messageCount = conversations.reduce(
    (sum, conversation) => sum + conversation.messages.length,
    0,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Profil utilisateur"
      className="max-w-md"
    >
      <div className="relative h-28 shrink-0 overflow-hidden">
        <div className="absolute inset-0 accent-gradient opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.16)_50%,transparent_60%)]" />
        <div className="absolute right-3 top-3">
          <IconButton
            label="Fermer le profil"
            onClick={onClose}
            size="sm"
            className="bg-black/20 text-white hover:bg-black/30 hover:text-white"
          >
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="absolute bottom-3 left-5 flex items-end gap-3">
          <Avatar
            name={settings.displayName}
            presence={settings.status}
            size="xl"
            className="ring-4 ring-[#0b0b14]"
          />
        </div>
      </div>

      <div className="px-5 pb-5 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--text)]">
              {settings.displayName}
            </h2>
            <p className="truncate text-xs text-[var(--muted)]">
              {settings.email}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.12)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            <Crown className="size-3" />
            Pro
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Chats", value: conversations.length },
            { label: "Messages", value: messageCount },
            { label: "Plan", value: "Pro" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-white/[0.025] px-2 py-2.5 text-center"
            >
              <p className="text-sm font-semibold text-[var(--text)]">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--faint)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
            Statut
          </p>
          <div className="mt-2 flex gap-1.5">
            {STATUSES.map((status) => {
              const active = settings.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateSettings({ status })}
                  className={cn(
                    "focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--text)]"
                      : "border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:bg-white/[0.05]",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      status === "online"
                        ? "bg-[var(--success)]"
                        : status === "away"
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--accent)]",
                    )}
                  />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-2.5 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3.5">
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <MessageSquare className="size-3" />
                Messages ce mois
              </span>
              <span className="font-mono text-[var(--faint)]">68 %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[68%] rounded-full accent-gradient" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <HardDrive className="size-3" />
                Stockage des fichiers
              </span>
              <span className="font-mono text-[var(--faint)]">22 %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[22%] rounded-full bg-[var(--accent-2)] opacity-80" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            <Settings2 className="size-3.5" />
            Paramètres du compte
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              toast({
                title: "Plan Pro actif",
                description:
                  "Votre abonnement est à jour. Aucune action requise.",
                variant: "info",
              })
            }
          >
            <Sparkles className="size-3.5" />
            Avantages
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--faint)]">
            <Check className="size-3 text-[var(--success)]" />
            Session sécurisée localement
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              toast({
                title: "Déconnexion simulée",
                description:
                  "Aucune session réelle n’est active dans cette démo.",
                variant: "info",
              });
            }}
            className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[#fda4af]"
          >
            <LogOut className="size-3" />
            Se déconnecter
          </button>
        </div>
      </div>
    </Modal>
  );
}
