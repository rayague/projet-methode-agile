"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={title}
      className="max-w-sm"
    >
      <div className="p-5">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.12)] text-[#fda4af]">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-[var(--text)]">
          {title}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
