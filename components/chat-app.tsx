"use client";

import { useEffect, useState } from "react";
import { BacklogView } from "@/components/backlog/backlog-view";
import { Logo } from "@/components/brand/logo";
import { ChatView } from "@/components/chat/chat-view";
import { AppBackground } from "@/components/layout/app-background";
import { ChatHeader } from "@/components/layout/chat-header";
import { Sidebar } from "@/components/layout/sidebar";
import { ConfirmDialog } from "@/components/overlays/confirm-dialog";
import { ProjectsProvider, useProjects } from "@/hooks/use-projects";
import type { Project } from "@/lib/types";

function BootScreen() {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center">
      <Logo size={48} className="animate-pulse" />
    </div>
  );
}

function AppShell() {
  const { hydrated, activeProject, view, deleteProject } = useProjects();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const showBacklog = view === "backlog" && !!activeProject?.backlog;

  return (
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
            onRequestDelete={setPendingDelete}
          />
          <main className="relative z-10 flex min-w-0 flex-1 flex-col">
            <ChatHeader
              onOpenSidebar={() => {
                setCollapsed(false);
                setMobileOpen(true);
              }}
            />
            {showBacklog ? <BacklogView /> : <ChatView />}
          </main>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer ce projet ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.title} », sa synthèse et son backlog seront supprimés de ce navigateur. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteProject(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

export function ChatApp() {
  return (
    <ProjectsProvider>
      <AppShell />
    </ProjectsProvider>
  );
}
