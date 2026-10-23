"use client";

import { useState } from "react";
import {
  Check,
  Cpu,
  Database,
  Download,
  Gauge,
  Palette,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import {
  ACCENTS,
  getModel,
  MODELS,
  STATUS_LABELS,
} from "@/lib/settings";
import type { Density, PresenceStatus } from "@/lib/types";
import { cn, downloadFile } from "@/lib/utils";

type SettingsTab = "general" | "appearance" | "model" | "data";

const TABS: { id: SettingsTab; label: string; icon: typeof Cpu }[] = [
  { id: "general", label: "Général", icon: UserRound },
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "model", label: "Modèle", icon: Cpu },
  { id: "data", label: "Données", icon: Database },
];

const STATUS_OPTIONS: PresenceStatus[] = ["online", "away", "focus"];

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-white/[0.02] px-3.5 py-3">
      <div>
        <p className="text-xs font-medium text-[var(--text)]">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--faint)]">
          {description}
        </p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    conversations,
    settings,
    updateSettings,
    resetConversations,
    restoreDemo,
  } = useChat();
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>("general");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const model = getModel(settings.model);

  const messageCount = conversations.reduce(
    (sum, conversation) => sum + conversation.messages.length,
    0,
  );
  const fileCount = conversations.reduce(
    (sum, conversation) =>
      sum +
      conversation.messages.reduce(
        (inner, message) => inner + (message.attachments?.length ?? 0),
        0,
      ),
    0,
  );

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "XScrum AI",
      settings,
      conversations,
    };
    downloadFile(
      `xscrum-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
    );
    toast({
      title: "Export prêt",
      description: "Toutes vos conversations ont été exportées en JSON.",
      variant: "success",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Paramètres"
      className="max-w-3xl"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Paramètres
          </h2>
          <p className="mt-0.5 text-[10px] text-[var(--faint)]">
            Personnalisez votre espace. Les changements sont enregistrés
            automatiquement.
          </p>
        </div>
        <IconButton label="Fermer les paramètres" onClick={onClose} size="sm">
          <X className="size-4" />
        </IconButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <nav className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--border)] p-2 sm:w-44 sm:flex-col sm:border-b-0 sm:border-r">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "focus-ring flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors sm:w-full",
                  active
                    ? "bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "general" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                  Identité
                </h3>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[var(--muted)]">
                      Nom affiché
                    </span>
                    <input
                      value={settings.displayName}
                      onChange={(event) =>
                        updateSettings({ displayName: event.target.value })
                      }
                      className="focus-ring h-9 w-full rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 text-xs text-[var(--text)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[var(--muted)]">
                      Adresse e-mail
                    </span>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(event) =>
                        updateSettings({ email: event.target.value })
                      }
                      className="focus-ring h-9 w-full rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 text-xs text-[var(--text)]"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                  Statut
                </h3>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((status) => {
                    const active = settings.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateSettings({ status })}
                        className={cn(
                          "focus-ring flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors",
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

              <div className="rounded-2xl border border-[rgba(var(--accent-rgb),0.2)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-2-rgb),0.05))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                      XScrum Pro
                      <span className="rounded-md border border-white/15 bg-white/10 px-1.5 py-px text-[8px] uppercase tracking-wider text-white">
                        Actif
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Conversations illimitées, modèles avancés et export
                      complet.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      toast({
                        title: "Abonnement à jour",
                        description:
                          "Votre plan Pro est actif jusqu’au 12 décembre.",
                        variant: "info",
                      })
                    }
                  >
                    Gérer
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "appearance" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                  Accent lumineux
                </h3>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {ACCENTS.map((accent) => {
                    const active = settings.accent === accent.id;
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => updateSettings({ accent: accent.id })}
                        className={cn(
                          "focus-ring relative flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                          active
                            ? "border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--accent-rgb),0.1)]"
                            : "border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05]",
                        )}
                      >
                        <span
                          className="size-8 shrink-0 rounded-full border border-white/20 shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-medium text-[var(--text)]">
                            {accent.label}
                          </span>
                          <span className="block truncate text-[9px] text-[var(--faint)]">
                            {accent.hint}
                          </span>
                        </span>
                        {active ? (
                          <Check className="size-3.5 shrink-0 text-[var(--accent)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                  Densité
                </h3>
                <div className="mt-2.5">
                  <Segmented<Density>
                    value={settings.density}
                    onChange={(density) => updateSettings({ density })}
                    options={[
                      { value: "comfortable", label: "Confortable" },
                      { value: "compact", label: "Compacte" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <SettingRow
                  title="Horodatage des messages"
                  description="Afficher l’heure à côté de chaque message."
                  checked={settings.timestamps}
                  onChange={(timestamps) => updateSettings({ timestamps })}
                />
                <SettingRow
                  title="Réduire les animations"
                  description="Limiter les transitions et les effets de mouvement."
                  checked={settings.reduceMotion}
                  onChange={(reduceMotion) =>
                    updateSettings({ reduceMotion })
                  }
                />
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                  Aperçu
                </p>
                <div className="mt-2.5 flex justify-end">
                  <span className="rounded-2xl rounded-br-md border border-[rgba(var(--accent-rgb),0.24)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.2),rgba(var(--accent-2-rgb),0.07))] px-3 py-2 text-[11px] text-[#e8ebf5]">
                    Prépare le sprint 4
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="size-6 rounded-lg accent-gradient opacity-80" />
                  <span className="h-2 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "model" ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                Modèle actif
              </h3>
              {MODELS.map((item) => {
                const active = item.id === settings.model;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSettings({ model: item.id })}
                    className={cn(
                      "focus-ring flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-[rgba(var(--accent-rgb),0.35)] bg-[rgba(var(--accent-rgb),0.08)]"
                        : "border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                        active
                          ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]"
                          : "border-[var(--border)] bg-white/[0.03] text-[var(--faint)]",
                      )}
                    >
                      <Sparkles className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text)]">
                          {item.name}
                        </span>
                        <span className="rounded border border-[var(--border)] bg-white/[0.04] px-1.5 py-px text-[8px] uppercase tracking-wider text-[var(--faint)]">
                          {item.badge}
                        </span>
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-[var(--muted)]">
                        {item.description}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2 text-[9px] text-[var(--faint)]">
                        <span className="flex items-center gap-1">
                          <Gauge className="size-2.5" />
                          {item.speed}
                        </span>
                        <span className="text-white/20">·</span>
                        <span>{item.context} tokens</span>
                      </span>
                    </span>
                    {active ? (
                      <Check className="mt-1 size-4 shrink-0 text-[var(--accent)]" />
                    ) : null}
                  </button>
                );
              })}

              <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--text)]">
                    Créativité
                  </p>
                  <span className="rounded-md border border-[var(--border)] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[var(--faint)]">
                  Plus la valeur est haute, plus les réponses sont variées.
                </p>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(event) =>
                    updateSettings({
                      temperature: Number(event.target.value),
                    })
                  }
                  aria-label="Créativité du modèle"
                  className="range mt-3"
                />
                <div className="mt-1.5 flex justify-between text-[9px] text-[var(--faint)]">
                  <span>Précis</span>
                  <span>Équilibré</span>
                  <span>Créatif</span>
                </div>
                <p className="mt-3 text-[10px] text-[var(--faint)]">
                  Modèle sélectionné :{" "}
                  <span className="text-[var(--muted)]">{model.name}</span>
                </p>
              </div>
            </div>
          ) : null}

          {tab === "data" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Conversations", value: conversations.length },
                  { label: "Messages", value: messageCount },
                  { label: "Fichiers", value: fileCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 text-center"
                  >
                    <p className="text-lg font-semibold text-[var(--text)]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--faint)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3.5">
                <p className="text-xs font-medium text-[var(--text)]">
                  Export de vos données
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--faint)]">
                  Téléchargez l’intégralité de vos conversations et préférences
                  au format JSON.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={exportData}>
                    <Download className="size-3.5" />
                    Exporter en JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      restoreDemo();
                      toast({
                        title: "Démo restaurée",
                        description:
                          "Les conversations d’exemple ont été réinitialisées.",
                        variant: "info",
                      });
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                    Restaurer la démo
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.05)] p-3.5">
                <p className="text-xs font-medium text-[#fecdd3]">
                  Zone sensible
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#fda4af]/70">
                  La suppression efface définitivement l’historique stocké dans
                  ce navigateur. Les préférences sont conservées.
                </p>
                {confirmDelete ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-[#fda4af]">
                      Confirmer la suppression ?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        resetConversations();
                        setConfirmDelete(false);
                        toast({
                          title: "Historique supprimé",
                          description:
                            "Toutes les conversations ont été effacées.",
                          variant: "success",
                        });
                      }}
                    >
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    className="mt-3"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer toutes les conversations
                  </Button>
                )}
              </div>

              <p className="text-[10px] leading-relaxed text-[var(--faint)]">
                Vos données restent stockées localement dans ce navigateur.
                Aucune requête réseau n’est effectuée par cette interface de
                démonstration.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
