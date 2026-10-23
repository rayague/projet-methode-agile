"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { chunkReply, createMockReply } from "@/lib/mock-reply";
import { seedConversations } from "@/lib/seed";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import {
  loadConversations,
  loadSettings,
  saveConversations,
  saveSettings,
} from "@/lib/storage";
import type {
  Attachment,
  Conversation,
  Message,
  Settings,
} from "@/lib/types";
import { truncate, uid } from "@/lib/utils";

interface GeneratingState {
  conversationId: string;
  messageId: string;
}

interface StreamState {
  conversationId: string;
  messageId: string;
  chunks: string[];
  index: number;
  timer: number | null;
  startTimer: number | null;
}

interface ChatContextValue {
  hydrated: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeId: string | null;
  settings: Settings;
  generating: GeneratingState | null;
  isGenerating: boolean;
  newChat: () => void;
  selectChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  togglePin: (id: string) => void;
  sendMessage: (content: string, attachments?: Attachment[]) => void;
  stopGenerating: () => void;
  regenerate: (messageId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetConversations: () => void;
  restoreDemo: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const subscribeNoop = () => () => {};

const FINAL_CHUNK_DELAY = 480;
const STREAM_INTERVAL = 24;

export function ChatProvider({ children }: { children: ReactNode }) {
  // false during SSR and the hydration pass, true afterwards. The boot screen
  // is rendered until then, so state read from localStorage below never
  // reaches the server-rendered markup.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [conversations, setConversations] = useState<Conversation[]>(
    // The seed uses Date.now(), which Next forbids during prerender.
    () =>
      typeof window === "undefined"
        ? []
        : (loadConversations() ?? seedConversations()),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadSettings(),
  }));
  const [generating, setGenerating] = useState<GeneratingState | null>(null);
  const streamRef = useRef<StreamState | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    saveConversations(conversations);
  }, [conversations, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
    const root = document.documentElement;
    root.dataset.accent = settings.accent;
    root.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings, hydrated]);

  useEffect(() => {
    return () => {
      const state = streamRef.current;
      if (!state) return;
      if (state.timer !== null) window.clearInterval(state.timer);
      if (state.startTimer !== null) window.clearTimeout(state.startTimer);
      streamRef.current = null;
    };
  }, []);

  const clearStream = useCallback((finalize: boolean) => {
    const state = streamRef.current;
    if (!state) return;
    if (state.timer !== null) window.clearInterval(state.timer);
    if (state.startTimer !== null) window.clearTimeout(state.startTimer);
    streamRef.current = null;
    setGenerating(null);
    if (!finalize) return;
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== state.conversationId) return conversation;
        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === state.messageId
              ? {
                  ...message,
                  status: "complete" as const,
                  content: message.content || "Réponse interrompue.",
                }
              : message,
          ),
        };
      }),
    );
  }, []);

  const startStream = useCallback(
    (conversationId: string, messageId: string, reply: string) => {
      clearStream(true);
      const state: StreamState = {
        conversationId,
        messageId,
        chunks: chunkReply(reply),
        index: 0,
        timer: null,
        startTimer: null,
      };
      streamRef.current = state;
      setGenerating({ conversationId, messageId });

      state.startTimer = window.setTimeout(() => {
        if (streamRef.current !== state) return;
        state.timer = window.setInterval(() => {
          const current = streamRef.current;
          if (current !== state) return;
          const chunk = state.chunks[state.index];
          if (chunk === undefined) {
            if (state.timer !== null) window.clearInterval(state.timer);
            streamRef.current = null;
            setGenerating(null);
            setConversations((prev) =>
              prev.map((conversation) => {
                if (conversation.id !== conversationId) return conversation;
                return {
                  ...conversation,
                  updatedAt: Date.now(),
                  messages: conversation.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, status: "complete" as const }
                      : message,
                  ),
                };
              }),
            );
            return;
          }
          state.index += 1;
          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;
              return {
                ...conversation,
                updatedAt: Date.now(),
                messages: conversation.messages.map((message) =>
                  message.id === messageId
                    ? { ...message, content: message.content + chunk }
                    : message,
                ),
              };
            }),
          );
        }, STREAM_INTERVAL);
      }, FINAL_CHUNK_DELAY);
    },
    [clearStream],
  );

  const newChat = useCallback(() => {
    clearStream(true);
    setActiveId(null);
  }, [clearStream]);

  const selectChat = useCallback(
    (id: string) => {
      if (streamRef.current && streamRef.current.conversationId !== id) {
        clearStream(true);
      }
      setActiveId(id);
    },
    [clearStream],
  );

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, title: clean, updatedAt: Date.now() }
          : conversation,
      ),
    );
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      if (streamRef.current?.conversationId === id) {
        clearStream(false);
      }
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id),
      );
      setActiveId((current) => (current === id ? null : current));
    },
    [clearStream],
  );

  const togglePin = useCallback((id: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, pinned: !conversation.pinned }
          : conversation,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    (content: string, attachments: Attachment[] = []) => {
      const trimmed = content.trim();
      if (!trimmed && attachments.length === 0) return;
      if (streamRef.current) return;

      const now = Date.now();
      const targetId =
        activeId && conversations.some((item) => item.id === activeId)
          ? activeId
          : uid("conv");
      const fallbackTitle =
        trimmed || attachments[0]?.name || "Nouvelle conversation";

      const userMessage: Message = {
        id: uid("msg"),
        role: "user",
        content: trimmed,
        createdAt: now,
        status: "complete",
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      const assistantMessage: Message = {
        id: uid("msg"),
        role: "assistant",
        content: "",
        createdAt: now + 1,
        status: "streaming",
      };

      setConversations((current) => {
        const exists = current.some((item) => item.id === targetId);
        if (!exists) {
          const conversation: Conversation = {
            id: targetId,
            title: truncate(fallbackTitle),
            createdAt: now,
            updatedAt: now,
            pinned: false,
            messages: [userMessage, assistantMessage],
          };
          return [conversation, ...current];
        }
        return current.map((conversation) => {
          if (conversation.id !== targetId) return conversation;
          const shouldRename = conversation.messages.length === 0;
          return {
            ...conversation,
            title: shouldRename
              ? truncate(fallbackTitle)
              : conversation.title,
            updatedAt: now,
            messages: [...conversation.messages, userMessage, assistantMessage],
          };
        });
      });

      setActiveId(targetId);

      const prompt = [trimmed, ...attachments.map((file) => file.name)]
        .filter(Boolean)
        .join(" ");
      startStream(targetId, assistantMessage.id, createMockReply(prompt));
    },
    [activeId, conversations, startStream],
  );

  const stopGenerating = useCallback(() => {
    clearStream(true);
  }, [clearStream]);

  const regenerate = useCallback(
    (messageId: string) => {
      if (streamRef.current) return;
      const conversation = conversations.find(
        (item) => item.id === activeId,
      );
      if (!conversation) return;
      const index = conversation.messages.findIndex(
        (message) => message.id === messageId,
      );
      if (index < 0) return;
      const target = conversation.messages[index];
      if (target.role !== "assistant") return;
      const previousUser = [...conversation.messages.slice(0, index)]
        .reverse()
        .find((message) => message.role === "user");
      if (!previousUser) return;

      setConversations((current) =>
        current.map((item) => {
          if (item.id !== conversation.id) return item;
          return {
            ...item,
            updatedAt: Date.now(),
            messages: item.messages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    content: "",
                    status: "streaming" as const,
                    createdAt: Date.now(),
                  }
                : message,
            ),
          };
        }),
      );
      startStream(
        conversation.id,
        messageId,
        createMockReply(previousUser.content),
      );
    },
    [activeId, conversations, startStream],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const resetConversations = useCallback(() => {
    clearStream(false);
    setConversations([]);
    setActiveId(null);
  }, [clearStream]);

  const restoreDemo = useCallback(() => {
    clearStream(false);
    setConversations(seedConversations());
    setActiveId(null);
  }, [clearStream]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ??
      null,
    [conversations, activeId],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      hydrated,
      conversations,
      activeConversation,
      activeId,
      settings,
      generating,
      isGenerating: generating !== null,
      newChat,
      selectChat,
      renameChat,
      deleteChat,
      togglePin,
      sendMessage,
      stopGenerating,
      regenerate,
      updateSettings,
      resetConversations,
      restoreDemo,
    }),
    [
      hydrated,
      conversations,
      activeConversation,
      activeId,
      settings,
      generating,
      newChat,
      selectChat,
      renameChat,
      deleteChat,
      togglePin,
      sendMessage,
      stopGenerating,
      regenerate,
      updateSettings,
      resetConversations,
      restoreDemo,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
