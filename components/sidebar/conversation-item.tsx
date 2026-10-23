"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageSquare, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";
import type { Conversation } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

export function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onTogglePin,
  onRequestDelete,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onTogglePin: () => void;
  onRequestDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const submit = () => {
    if (draft.trim()) onRename(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-white/[0.05] px-2 py-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") {
              setDraft(conversation.title);
              setEditing(false);
            }
          }}
          onBlur={submit}
          maxLength={80}
          aria-label="Renommer la conversation"
          className="focus-ring min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-[13px] text-[var(--text)] outline-none"
        />
        <button
          type="button"
          onClick={submit}
          aria-label="Valider le nouveau nom"
          className="focus-ring rounded-md p-1 text-[var(--success)] hover:bg-white/[0.06]"
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(conversation.title);
            setEditing(false);
          }}
          aria-label="Annuler le renommage"
          className="focus-ring rounded-md p-1 text-[var(--muted)] hover:bg-white/[0.06]"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <motion.div layout="position" className="group/item relative">
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={() => {
          setDraft(conversation.title);
          setEditing(true);
        }}
        className={cn(
          "focus-ring relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-200",
          active
            ? "border border-white/[0.09] bg-white/[0.07]"
            : "border border-transparent hover:bg-white/[0.045]",
        )}
      >
        {active ? (
          <span className="absolute -left-px top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full accent-gradient" />
        ) : null}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            active
              ? "border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)]"
              : "border-white/[0.06] bg-white/[0.035] text-[var(--faint)] group-hover/item:text-[var(--muted)]",
          )}
        >
          <MessageSquare className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[13px] leading-5 transition-colors",
              active
                ? "font-medium text-[var(--text)]"
                : "text-[var(--muted)] group-hover/item:text-[var(--text)]",
            )}
          >
            {conversation.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--faint)]">
            {conversation.pinned ? (
              <Pin className="size-2.5 text-[var(--accent)]" />
            ) : null}
            <span className="truncate">
              {formatRelative(conversation.updatedAt)}
            </span>
          </span>
        </span>
      </button>

      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[#0b0b14]/95 p-0.5 opacity-0 shadow-lg transition-opacity duration-150 group-hover/item:opacity-100 group-focus-within/item:opacity-100">
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={
            conversation.pinned ? "Désépingler la conversation" : "Épingler la conversation"
          }
          className="focus-ring rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text)]"
        >
          {conversation.pinned ? (
            <PinOff className="size-3.5" />
          ) : (
            <Pin className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(conversation.title);
            setEditing(true);
          }}
          aria-label="Renommer la conversation"
          className="focus-ring rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text)]"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onRequestDelete}
          aria-label="Supprimer la conversation"
          className="focus-ring rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(251,113,133,0.14)] hover:text-[#fda4af]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
