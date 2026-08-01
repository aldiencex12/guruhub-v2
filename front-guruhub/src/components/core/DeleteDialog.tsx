"use client";

import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  loading?: boolean;
  onDelete: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title = "Hapus Data",
  itemName = "item ini",
  loading = false,
  onDelete,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        <span>
          Apakah Anda yakin ingin menghapus <strong>{itemName}</strong>? Tindakan ini dapat dibatalkan melalui fitur arsip jika didukung.
        </span>
      }
      confirmText="Hapus"
      cancelText="Batal"
      variant="destructive"
      loading={loading}
      onConfirm={onDelete}
    />
  );
}
