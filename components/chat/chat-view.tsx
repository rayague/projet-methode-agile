"use client";

import { useEffect, useRef } from "react";
import { Composer } from "@/components/chat/composer";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageItem } from "@/components/chat/message-item";
import { PhaseBar } from "@/components/chat/phase-bar";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/lib/types";

function placeholderFor(project: Project) {
  if (project.phase === "discovery") {
    return project.messages.some((m) => m.role === "user")
      ? "Répondez aux questions ou ajoutez des précisions…"
      : "Décrivez votre projet librement…";
  }
  if (project.phase === "synthesis") {
    return project.synthesisValidated
      ? "Synthèse validée : générez le backlog."
      : "Précisez ce qu’il faut corriger dans la synthèse…";
  }
  return "Ex. : découpe la US-03 en deux, ajoute une story pour l’export PDF…";
}

export function ChatView() {
  const { activeProject, setView } = useProjects();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = activeProject?.messages;
  const last = messages?.at(-1);

  // Follows the conversation as it is written.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [activeProject?.id, messages?.length, last?.content]);

  if (!activeProject || !messages) {
    return (
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
        <EmptyState />
      </div>
    );
  }

  const currentSynthesisId = messages.findLast((m) => m.kind === "synthesis")?.id;
  const locked = activeProject.phase === "synthesis" && activeProject.synthesisValidated;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-2 sm:px-6">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              currentSynthesis={message.id === currentSynthesisId}
              onOpenBacklog={() => setView("backlog")}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10 shrink-0 pt-2">
        <PhaseBar project={activeProject} />
        <Composer placeholder={placeholderFor(activeProject)} disabled={locked} />
      </div>
    </div>
  );
}
