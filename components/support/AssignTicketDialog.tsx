"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAssignSupportTicketMutation,
  useGetAssignableAdminsQuery,
  type AssignableAdmin,
} from "@/lib/store/services/api";

type AssignTicketDialogProps = {
  open: boolean;
  ticketId: number | string;
  ticketLabel?: string;
  currentAdminId?: number;
  onClose: () => void;
  onAssigned?: () => void;
};

export default function AssignTicketDialog({
  open,
  ticketId,
  ticketLabel,
  currentAdminId,
  onClose,
  onAssigned,
}: AssignTicketDialogProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const { data, isLoading, isError } = useGetAssignableAdminsQuery(undefined, { skip: !open });
  const [assignTicket, { isLoading: isAssigning }] = useAssignSupportTicketMutation();

  const admins = data?.admins ?? [];

  useEffect(() => {
    if (!open) {
      setSelectedAdminId("");
      return;
    }
    if (currentAdminId) {
      setSelectedAdminId(String(currentAdminId));
    }
  }, [open, currentAdminId]);

  const formatAdminLabel = (admin: AssignableAdmin) => {
    const name = `${admin.first_name} ${admin.last_name}`.trim();
    const title = admin.title ? ` — ${admin.title}` : "";
    return `${name}${title}`;
  };

  const handleAssign = async () => {
    if (!selectedAdminId) {
      toast.error("Select an admin staff member");
      return;
    }

    try {
      const result = await assignTicket({ id: ticketId, admin_id: selectedAdminId }).unwrap();
      const assignee = result.ticket.assigned_to;
      const assigneeName = assignee
        ? `${assignee.first_name} ${assignee.last_name}`.trim()
        : "selected admin";
      toast.success(`Ticket assigned to ${assigneeName}`);
      onAssigned?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err &&
        err.data && typeof err.data === "object" && "error" in err.data &&
        typeof err.data.error === "string"
          ? err.data.error
          : "Failed to assign ticket";
      toast.error(message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-2">Assign Ticket</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {ticketLabel
            ? `Choose an admin staff member for "${ticketLabel}".`
            : "Choose an admin staff member for this ticket."}
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground mb-6">Loading staff...</p>
        ) : isError ? (
          <p className="text-sm text-red-500 mb-6">Unable to load assignable staff.</p>
        ) : (
          <label className="block mb-6">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">Assign to</span>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="input w-full"
              disabled={isAssigning}
            >
              <option value="">Select admin staff</option>
              {currentAdminId ? (
                <option value={String(currentAdminId)}>Assign to me</option>
              ) : null}
              {admins
                .filter((admin) => admin.id !== currentAdminId)
                .map((admin) => (
                  <option key={admin.id} value={String(admin.id)}>
                    {formatAdminLabel(admin)}
                  </option>
                ))}
            </select>
          </label>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || isLoading || isError || !selectedAdminId}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
