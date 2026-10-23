"use client";

import { useMemo } from "react";
import { PanelLeftClose, PanelLeftOpen, SquarePen, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ConversationItem } from "@/components/sidebar/conversation-item";
import { IconButton } from "@/components/ui/icon-button";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const byRecent = (a: Project, b: Project) => b.updatedAt - a.updatedAt;

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onRequestDelete,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onRequestDelete: (project: Project) => void;
}) {
  const { projects, activeProject, newProject, selectProject, renameProject, togglePin } =
    useProjects();

  const groups = useMemo(
    () =>
      [
        { label: "Épinglés", items: projects.filter((p) => p.pinned).sort(byRecent) },
        { label: "Projets", items: projects.filter((p) => !p.pinned).sort(byRecent) },
      ].filter((group) => group.items.length > 0),
    [projects],
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-[var(--border)] bg-[#07070f]/95 transition-[transform,width] duration-300 ease-out lg:static lg:z-20 lg:translate-x-0",
          collapsed ? "w-[64px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <IconButton
              label="Déplier la barre latérale"
              onClick={onToggleCollapse}
              tooltipSide="right"
              className="hidden lg:inline-flex"
            >
              <PanelLeftOpen className="size-4" />
            </IconButton>
          ) : (
            <>
              <span className="flex min-w-0 items-center gap-2.5 px-1">
                <Logo size={26} />
                <span className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  XScrum <span className="accent-text">AI</span>
                </span>
              </span>
              <IconButton
                label="Réduire la barre latérale"
                size="sm"
                onClick={onToggleCollapse}
                className="hidden lg:inline-flex"
              >
                <PanelLeftClose className="size-4" />
              </IconButton>
              <IconButton label="Fermer le menu" size="sm" onClick={onCloseMobile} className="lg:hidden">
                <X className="size-4" />
              </IconButton>
            </>
          )}
        </div>

        <div className={cn("px-2", collapsed && "flex justify-center")}>
          {collapsed ? (
            <IconButton label="Nouveau projet" onClick={newProject} tooltipSide="right">
              <SquarePen className="size-4" />
            </IconButton>
          ) : (
            <button
              type="button"
              onClick={() => {
                newProject();
                onCloseMobile();
              }}
              className="focus-ring flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[13px] text-[var(--muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
            >
              <SquarePen className="size-4" />
              Nouveau projet
            </button>
          )}
        </div>

        <nav
          aria-label="Projets"
          className="scroll-area mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-3"
        >
          {collapsed ? null : groups.length === 0 ? (
            <p className="px-2.5 text-[12px] leading-5 text-[var(--faint)]">
              Vos projets apparaîtront ici.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="px-2.5 pb-1 text-[11px] text-[var(--faint)]">{group.label}</p>
                {group.items.map((project) => (
                  <ConversationItem
                    key={project.id}
                    conversation={project}
                    active={project.id === activeProject?.id}
                    onSelect={() => {
                      selectProject(project.id);
                      onCloseMobile();
                    }}
                    onRename={(title) => renameProject(project.id, title)}
                    onTogglePin={() => togglePin(project.id)}
                    onRequestDelete={() => onRequestDelete(project)}
                  />
                ))}
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}
