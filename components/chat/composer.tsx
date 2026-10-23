"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";

export function Composer({ placeholder, disabled = false }: { placeholder: string; disabled?: boolean }) {
  const { send, stop, busy } = useProjects();
  const [text, setText] = useState("");
  const [empty, setEmpty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [text]);

  const submit = () => {
    if (busy || disabled) return;
    if (!text.trim()) {
      setEmpty(true);
      textareaRef.current?.focus();
      return;
    }
    send(text);
    setText("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-5 sm:pb-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "glass-strong flex items-end gap-2 rounded-[22px] p-1.5 transition-colors",
          empty && "border-[rgba(251,113,133,0.45)]",
          disabled && "opacity-60",
        )}
      >
        <textarea
          id="composer-input"
          ref={textareaRef}
          value={text}
          disabled={disabled}
          onChange={(event) => {
            setText(event.target.value);
            if (empty) setEmpty(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label="Votre message"
          aria-invalid={empty}
          aria-describedby={empty ? "composer-hint" : undefined}
          className="scroll-area max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-6 text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none disabled:cursor-not-allowed"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Arrêter"
            className="focus-ring mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-white/[0.08] text-[var(--text)] transition-colors hover:bg-white/[0.14]"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled}
            aria-label="Envoyer"
            className="accent-gradient focus-ring mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-[filter] hover:brightness-110 disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>
      <p
        id="composer-hint"
        role={empty ? "alert" : undefined}
        className={cn(
          "mt-2 text-center text-[11px]",
          empty ? "text-[#fda4af]" : "text-[var(--faint)]",
        )}
      >
        {empty
          ? "Votre message est vide : écrivez quelques mots avant d’envoyer."
          : "XScrum AI peut se tromper : relisez la synthèse et le backlog."}
      </p>
    </div>
  );
}
