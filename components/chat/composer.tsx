"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  FileText,
  Globe,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Square,
  UploadCloud,
  X,
} from "lucide-react";
import { VoiceRecorder } from "@/components/overlays/voice-recorder";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { useChat } from "@/hooks/use-chat-store";
import type { Attachment } from "@/lib/types";
import { cn, formatBytes, uid } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

export function Composer() {
  const { sendMessage, stopGenerating, isGenerating } = useChat();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => window.clearInterval(timer));
      map.clear();
    };
  }, []);

  const uploading = attachments.some(
    (attachment) => (attachment.progress ?? 100) < 100,
  );
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !uploading;

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      toast({
        title: "Limite atteinte",
        description: `Vous pouvez joindre jusqu’à ${MAX_FILES} fichiers.`,
        variant: "error",
      });
      return;
    }

    const accepted = files.slice(0, room).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 10 Mo.`,
          variant: "error",
        });
        return false;
      }
      return true;
    });

    const next = accepted.map<Attachment>((file) => ({
      id: uid("file"),
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      url: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
      progress: 0,
    }));

    if (next.length === 0) return;
    setAttachments((current) => [...current, ...next]);

    next.forEach((attachment) => {
      let progress = 0;
      const timer = window.setInterval(() => {
        progress = Math.min(100, progress + 18 + Math.random() * 24);
        setAttachments((current) =>
          current.map((item) =>
            item.id === attachment.id ? { ...item, progress } : item,
          ),
        );
        if (progress >= 100) {
          window.clearInterval(timer);
          timers.current.delete(attachment.id);
        }
      }, 140);
      timers.current.set(attachment.id, timer);
    });
  };

  const removeAttachment = (id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearInterval(timer);
      timers.current.delete(id);
    }
    setAttachments((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return current.filter((item) => item.id !== id);
    });
  };

  const submit = () => {
    if (!canSend || isGenerating) return;
    const payload = attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
    }));
    attachments.forEach((attachment) => {
      if (attachment.url) URL.revokeObjectURL(attachment.url);
    });
    sendMessage(text, payload);
    setText("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "0px";
  };

  const onDrop = (event: DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl px-3 pb-3 sm:px-5 sm:pb-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "glass-strong relative overflow-hidden rounded-[24px] p-1.5 transition-colors duration-200",
          dragging && "border-[rgba(var(--accent-rgb),0.55)]",
        )}
      >
        <AnimatePresence>
          {dragging ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-[rgba(var(--accent-rgb),0.6)] bg-[#07070f]/92 backdrop-blur-md"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)]">
                <UploadCloud className="size-5" />
              </span>
              <p className="text-xs font-medium text-[var(--text)]">
                Déposez vos fichiers ici
              </p>
              <p className="text-[10px] text-[var(--faint)]">
                PDF, images et documents · 10 Mo maximum
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-1.5 pb-1 pt-1">
            {attachments.map((attachment) => {
              const isImage = attachment.type.startsWith("image/");
              const Icon = isImage ? ImageIcon : FileText;
              const progress = attachment.progress ?? 100;
              return (
                <div
                  key={attachment.id}
                  className="group/file relative flex w-40 items-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.04] p-1.5 pr-6"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-medium text-[var(--text)]">
                      {attachment.name}
                    </span>
                    {progress < 100 ? (
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full accent-gradient transition-[width] duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                    ) : (
                      <span className="block text-[9px] text-[var(--faint)]">
                        {formatBytes(attachment.size)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label={`Retirer ${attachment.name}`}
                    className="focus-ring absolute right-1 top-1 rounded-md p-0.5 text-[var(--faint)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text)]"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Demandez-moi n’importe quoi sur votre projet…"
          aria-label="Votre message"
          className="scroll-area max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-3.5 pt-2.5 text-[13.5px] leading-6 text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
        />

        <div className="flex items-center gap-1 px-1 pb-0.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <IconButton
            label="Joindre un fichier"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </IconButton>
          <IconButton
            label="Dicter un message"
            size="sm"
            onClick={() => setVoiceOpen(true)}
            active={voiceOpen}
          >
            <Mic className="size-4" />
          </IconButton>
          <button
            type="button"
            aria-pressed={webSearch}
            onClick={() => setWebSearch((value) => !value)}
            className={cn(
              "focus-ring ml-0.5 hidden h-8 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition-colors sm:flex",
              webSearch
                ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:bg-white/[0.05] hover:text-[var(--text)]",
            )}
          >
            <Globe className="size-3.5" />
            Recherche web
          </button>

          <span className="ml-auto hidden items-center gap-1.5 pr-1 text-[10px] text-[var(--faint)] md:flex">
            <Kbd>Entrée</Kbd>
            <span>pour envoyer</span>
          </span>

          {isGenerating ? (
            <button
              type="button"
              onClick={stopGenerating}
              aria-label="Arrêter la génération"
              className="focus-ring ml-1 flex size-9 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-white/[0.08] text-[var(--text)] transition-colors hover:bg-white/[0.14]"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Envoyer le message"
              className="accent-gradient focus-ring ml-1 flex size-9 items-center justify-center rounded-xl text-white shadow-[0_10px_26px_-10px_var(--accent-glow)] transition-all duration-200 hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </form>

      <p className="mt-2 text-center text-[10px] leading-relaxed text-[var(--faint)]">
        XScrum AI peut se tromper. Vérifiez les informations importantes.
        <span className="mx-1 text-white/15">·</span>
        <span className="text-[var(--muted)]">Données locales, aucune fuite.</span>
      </p>

      <VoiceRecorder
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onComplete={(transcript) => {
          setText((current) =>
            current ? `${current.trimEnd()} ${transcript}` : transcript,
          );
          setVoiceOpen(false);
          toast({
            title: "Transcription ajoutée",
            description: "Vous pouvez la relire avant d’envoyer.",
            variant: "success",
          });
          window.setTimeout(() => textareaRef.current?.focus(), 80);
        }}
      />
    </div>
  );
}
