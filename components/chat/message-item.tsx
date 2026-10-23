"use client";

import { memo } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { SynthesisCard } from "@/components/chat/synthesis-card";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types";

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5 py-2" aria-label="L’assistant réfléchit">
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

export const MessageItem = memo(function MessageItem({
  message,
  currentSynthesis,
  onOpenBacklog,
}: {
  message: Message;
  currentSynthesis: boolean;
  onOpenBacklog: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end py-3">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[rgba(var(--accent-rgb),0.16)] px-4 py-2.5 text-[14px] leading-6 text-[#eceefa]">
          {message.content}
        </p>
      </div>
    );
  }

  const streaming = message.status === "streaming";

  return (
    <div className="flex gap-3 py-3">
      <Logo size={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {message.status === "error" ? (
          <p className="flex items-start gap-2 rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-3 py-2 text-[13px] text-[#fecdd3]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {message.content}
          </p>
        ) : streaming && !message.content ? (
          <TypingDots />
        ) : (
          <MarkdownLite content={message.content} />
        )}

        {message.kind === "synthesis" && message.synthesis ? (
          <SynthesisCard synthesis={message.synthesis} current={currentSynthesis} />
        ) : null}

        {message.kind === "backlog" ? (
          <Button variant="primary" size="sm" className="mt-3" onClick={onOpenBacklog}>
            Voir le backlog <ArrowRight className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
});
