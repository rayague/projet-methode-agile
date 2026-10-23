"use client";

import { useCallback, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { ChatView } from "@/components/chat/chat-view";
import { ChatHeader } from "@/components/layout/chat-header";
import { ContextPanel } from "@/components/layout/context-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { AppBackground } from "@/components/layout/app-background";
import { CommandPalette } from "@/components/overlays/command-palette";
import { ConfirmDialog } from "@/components/overlays/confirm-dialog";
import { ProfileDialog } from "@/components/overlays/profile-dialog";
import { SettingsDialog } from "@/components/overlays/settings-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ChatProvider, useChat } from "@/hooks/use-chat-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Conversation } from "@/lib/types";

function BootScreen() {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.3),transparent_70%)] blur-2xl" />
        <Logo size={56} className="relative animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight text-[var(--text)]">
          XScrum <span className="accent-text">AI</span>
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[var(--faint)]">
          Chargement de votre espace
        </p>
      </div>
      <div className="h-1 w-36 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full w-1/2 animate-pulse rounded-full accent-gradient" />
      </div>
    </div>
  );
}

function AppShell() {
  const { hydrated, settings, newChat, deleteChat } = useChat();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelPreference, setPanelPreference] = useState<boolean | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(
    null,
  );
  const panelOpen = panelPreference ?? isDesktop;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (modifier && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newChat();
        setMobileOpen(false);
        toast({
          title: "Nouvelle conversation",
          description: "Vous pouvez commencer à écrire.",
          variant: "info",
        });
        return;
      }
      if (modifier && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if (modifier && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setPanelPreference((current) => !(current ?? isDesktop));
        return;
      }
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, newChat, toast, isDesktop]);

  const openMobileSidebar = useCallback(() => {
    setCollapsed(false);
    setMobileOpen(true);
  }, []);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
      <div className="relative flex h-dvh w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
        <AppBackground />

        {!hydrated ? (
          <BootScreen />
        ) : (
          <>
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed((value) => !value)}
              mobileOpen={mobileOpen}
              onCloseMobile={() => setMobileOpen(false)}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenHelp={() => setPaletteOpen(true)}
              onRequestDelete={(conversation) =>
                setPendingDelete(conversation)
              }
            />

            <main className="relative z-10 flex min-w-0 flex-1 flex-col">
              <ChatHeader
                panelOpen={panelOpen}
                onOpenSidebar={openMobileSidebar}
                onOpenPalette={() => setPaletteOpen(true)}
                onTogglePanel={() => setPanelPreference(!panelOpen)}
              />
              <ChatView />
            </main>

            <ContextPanel
              open={panelOpen}
              onClose={() => setPanelPreference(false)}
            />
          </>
        )}

        {paletteOpen ? (
          <CommandPalette
            open
            onClose={() => setPaletteOpen(false)}
            onNewChat={() => {
              newChat();
              setMobileOpen(false);
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
          />
        ) : null}

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        <ProfileDialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Supprimer cette conversation ?"
          description={
            pendingDelete
              ? `« ${pendingDelete.title} » sera définitivement supprimée de cet espace. Cette action est irréversible.`
              : ""
          }
          confirmLabel="Supprimer"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete) {
              deleteChat(pendingDelete.id);
              toast({
                title: "Conversation supprimée",
                description: pendingDelete.title,
                variant: "success",
              });
            }
            setPendingDelete(null);
          }}
        />
      </div>
    </MotionConfig>
  );
}

export function ChatApp() {
  return (
    <ToastProvider>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </ToastProvider>
  );
}
