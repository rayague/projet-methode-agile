"use client";

import { useEffect, useMemo, useState } from "react";
import { AudioLines, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const TRANSCRIPTS = [
  "Peux-tu me préparer un ordre du jour pour la planification du prochain sprint ?",
  "Résume les décisions de la dernière rétrospective et propose trois actions concrètes avec des responsables.",
  "Aide-moi à découper cette user story en tâches techniques plus petites et estimables.",
  "Transforme ces notes en compte rendu structuré avec les décisions et les prochaines étapes.",
];

type Phase = "recording" | "review";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function VoiceRecorder({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (transcript: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("recording");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");

  const bars = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => {
        const wave = Math.sin(index * 0.7) * 0.35 + 0.5;
        const noise = ((index * 37) % 23) / 46;
        return Math.min(1, Math.max(0.18, wave + noise));
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setPhase("recording");
      setElapsed(0);
      setTranscript("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "recording") return;
    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, phase]);

  const stop = () => {
    setPhase("review");
    setTranscript(
      TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)],
    );
  };

  const restart = () => {
    setPhase("recording");
    setElapsed(0);
    setTranscript("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Dictée vocale"
      className="max-w-md"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]">
            <AudioLines className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">
              Dicter un message
            </p>
            <p className="text-[10px] text-[var(--faint)]">
              {phase === "recording"
                ? "Enregistrement en cours"
                : "Vérifiez la transcription"}
            </p>
          </div>
        </div>
        <IconButton label="Fermer" onClick={onClose} size="sm">
          <X className="size-4" />
        </IconButton>
      </div>

      <div className="p-5">
        <div className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-medium text-[var(--muted)]">
              <span
                className={cn(
                  "size-2 rounded-full",
                  phase === "recording"
                    ? "animate-pulse bg-[var(--danger)] shadow-[0_0_10px_var(--danger)]"
                    : "bg-[var(--success)]",
                )}
              />
              {phase === "recording" ? "Micro actif" : "Transcription prête"}
            </span>
            <span className="font-mono text-xs tabular-nums text-[var(--muted)]">
              {formatDuration(elapsed)}
            </span>
          </div>

          <div className="mt-4 flex h-16 items-center justify-center gap-[3px] overflow-hidden">
            {bars.map((height, index) => (
              <span
                key={index}
                className={cn(
                  "w-1 shrink-0 rounded-full accent-gradient",
                  phase === "recording" && "wave-bar",
                )}
                style={{
                  height: `${Math.round(height * 100)}%`,
                  animationDelay: `${(index % 11) * 80}ms`,
                  animationDuration: `${900 + (index % 7) * 90}ms`,
                  opacity: phase === "recording" ? 0.9 : 0.55,
                }}
              />
            ))}
          </div>
        </div>

        {phase === "review" ? (
          <div className="mt-4">
            <label
              htmlFor="voice-transcript"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]"
            >
              Transcription
            </label>
            <textarea
              id="voice-transcript"
              data-autofocus
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={3}
              className="focus-ring w-full resize-none rounded-xl border border-[var(--border)] bg-white/[0.03] p-3 text-[13px] leading-6 text-[var(--text)]"
            />
          </div>
        ) : (
          <p className="mt-5 text-center text-xs text-[var(--muted)]">
            Parlez naturellement, la transcription apparaîtra à l’arrêt.
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          {phase === "recording" ? (
            <>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={stop}
              >
                <Square className="size-3.5 fill-current" />
                Arrêter
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={restart}>
                <RotateCcw className="size-3.5" />
                Recommencer
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => onComplete(transcript.trim())}
                disabled={!transcript.trim()}
              >
                <Sparkles className="size-3.5" />
                Insérer le texte
              </Button>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-[var(--faint)]">
          Démo · transcription simulée localement, aucun audio n’est envoyé.
        </p>
      </div>
    </Modal>
  );
}
