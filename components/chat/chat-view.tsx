"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { EmptyState } from "@/components/chat/empty-state";
import { Composer } from "@/components/chat/composer";
import { MessageItem } from "@/components/chat/message-item";
import { useChat } from "@/hooks/use-chat-store";
import { formatDate } from "@/lib/utils";

export function ChatView() {
  const {
    activeConversation,
    sendMessage,
    regenerate,
    isGenerating,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messages = activeConversation?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const lastId = lastMessage?.id;
  const lastContent = lastMessage?.content;
  const lastStatus = lastMessage?.status;
  const conversationId = activeConversation?.id;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const handleScroll = () => {
      const distance =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      stickToBottom.current = distance < 140;
      setShowScrollButton(distance > 320);
    };
    element.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => element.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    stickToBottom.current = true;
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [conversationId]);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: lastStatus === "streaming" ? "auto" : "smooth",
    });
  }, [messages.length, lastId, lastContent, lastStatus]);

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    stickToBottom.current = true;
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 sm:px-5">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={sendMessage} />
          ) : (
            <>
              <div className="mb-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border)]" />
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--faint)]">
                  {activeConversation
                    ? formatDate(activeConversation.createdAt)
                    : null}
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border)]" />
              </div>
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  canRegenerate={
                    !isGenerating &&
                    message.role === "assistant" &&
                    message.id === lastId
                  }
                  onRegenerate={() => regenerate(message.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-[#05050a] via-[#05050a]/80 to-transparent" />
        <Composer />
      </div>

      <AnimatePresence>
        {showScrollButton && messages.length > 0 ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToBottom}
            aria-label="Revenir au dernier message"
            className="glass focus-ring absolute bottom-[142px] left-1/2 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full text-[var(--muted)] shadow-lg transition-colors hover:text-[var(--text)]"
          >
            <ArrowDown className="size-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
