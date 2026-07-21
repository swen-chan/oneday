"use client";

import { useEffect } from "react";
import { AdminManagement } from "./AdminManagement";
import type { AdminAccount } from "./adminAccounts";

export function AdminManagementDialog({
  brandId,
  accounts,
  onAccountsChange,
  onClose,
}: {
  brandId: string;
  accounts: readonly AdminAccount[];
  onAccountsChange: (accounts: AdminAccount[]) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-8 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="管理员权限"
        className="max-h-full w-full max-w-5xl overflow-y-auto rounded-3xl border border-line bg-bg p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            aria-label="关闭管理员权限"
            onClick={onClose}
            className="rounded-full border border-line bg-white px-3 py-2 text-xs text-ink-muted transition hover:border-brand hover:text-brand"
          >
            关闭
          </button>
        </div>
        <AdminManagement
          brandId={brandId}
          isOwner
          accounts={accounts}
          onAccountsChange={onAccountsChange}
        />
      </div>
    </div>
  );
}
