"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import type { Attachment, Message } from "@/lib/types";
import { cn, formatBytes, formatTime } from "@/lib/utils";

function AttachmentPill({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/[0.12] bg-black/20 px-2 py-1.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-[var(--muted)]">
        <Icon className="size-3" />
      </span>
      <span className="min-w-0">
        <span className="block max-w-40 truncate text-[10px] font-medium text-[#dce2f0]">
          {attachment.name}
        </span>
        <span className="block text-[9px] text-white/40">
          {formatBytes(attachment.size)}
        </span>
      </span>
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "focus-ring flex size-7 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]"
            : "text-[var(--faint)] hover:bg-white/[0.06] hover:text-[var(--muted)]",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5 py-1.5" aria-label="L’assistant écrit">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </span>
  );
}

export function MessageItem({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: Message;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const { settings } = useChat();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const isUser = message.role === "user";
  const streaming = message.status === "streaming";
  const spacing = settings.density === "compact" ? "py-2" : "py-3.5";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({
        title: "Copie impossible",
        description: "Le presse-papiers n’est pas accessible dans ce contexte.",
        variant: "error",
      });
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={cn("flex justify-end", spacing)}
      >
        <div className="max-w-[88%] sm:max-w-[76%]">
          <div className="rounded-2xl rounded-br-md border border-[rgba(var(--accent-rgb),0.24)] bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.2),rgba(var(--accent-2-rgb),0.07))] px-4 py-3 shadow-[0_18px_50px_-30px_var(--accent-glow)]">
            {message.attachments?.length ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {message.attachments.map((attachment) => (
                  <AttachmentPill key={attachment.id} attachment={attachment} />
                ))}
              </div>
            ) : null}
            {message.content ? (
              <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-[#e8ebf5]">
                {message.content}
              </p>
            ) : null}
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 pr-1">
            {settings.timestamps ? (
              <span className="text-[10px] tabular-nums text-[var(--faint)]">
                {formatTime(message.createdAt)}
              </span>
            ) : null}
            <span className="flex items-center gap-1 text-[10px] text-[var(--faint)]">
              <Check className="size-3 text-[var(--success)]" />
              Envoyé
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group flex gap-3", spacing)}
    >
      <div className="mt-0.5 shrink-0">
        <Logo size={30} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--text)]">
            XScrum AI
          </span>
          <span className="rounded-md border border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.1)] px-1.5 py-px text-[8px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            Assistant agile
          </span>
          {settings.timestamps ? (
            <span className="text-[10px] tabular-nums text-[var(--faint)]">
              {formatTime(message.createdAt)}
            </span>
          ) : null}
        </div>

        {streaming && !message.content ? (
          <TypingDots />
        ) : (
          <MarkdownLite content={message.content} />
        )}

        {streaming && message.content ? (
          <span className="mt-1 flex">
            <span className="h-3.5 w-1.5 animate-caret rounded-full accent-gradient" />
          </span>
        ) : null}

        {!streaming ? (
          <div className="mt-1.5 flex items-center gap-0.5">
            <ActionButton label={copied ? "Copié" : "Copier"} onClick={copy}>
              {copied ? (
                <Check className="size-3.5 text-[var(--success)]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </ActionButton>
            <ActionButton
              label="Régénérer la réponse"
              onClick={() => {
                if (canRegenerate && !streaming) onRegenerate();
              }}
              active={false}
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  (!canRegenerate || streaming) && "opacity-40",
                )}
              />
            </ActionButton>
            <span className="mx-1 h-3.5 w-px bg-[var(--border)]" />
            <ActionButton
              label="Réponse utile"
              active={feedback === "up"}
              onClick={() => {
                setFeedback(feedback === "up" ? null : "up");
                if (feedback !== "up") {
                  toast({
                    title: "Merci pour votre retour",
                    description: "Cela nous aide à améliorer les réponses.",
                    variant: "success",
                  });
                }
              }}
            >
              <ThumbsUp className="size-3.5" />
            </ActionButton>
            <ActionButton
              label="Réponse à améliorer"
              active={feedback === "down"}
              onClick={() => {
                setFeedback(feedback === "down" ? null : "down");
                if (feedback !== "down") {
                  toast({
                    title: "Retour enregistré",
                    description: "Nous allons travailler cette réponse.",
                    variant: "info",
                  });
                }
              }}
            >
              <ThumbsDown className="size-3.5" />
            </ActionButton>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
