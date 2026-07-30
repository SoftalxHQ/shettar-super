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
  mode?: "assign" | "reassign";
  onClose: () => void;
  onAssigned?: () => void;
};

export default function AssignTicketDialog({
  open,
  ticketId,
  ticketLabel,
  currentAdminId,
  mode = "assign",
  onClose,
  onAssigned,
}: AssignTicketDialogProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const { data, isLoading, isError } = useGetAssignableAdminsQuery(undefined, { skip: !open });
  const [assignTicket, { isLoading: isAssigning }] = useAssignSupportTicketMutation();
  const isReassign = mode === "reassign";

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
      toast.success(
        isReassign
          ? `Ticket reassigned to ${assigneeName}`
          : `Ticket assigned to ${assigneeName}`
      );
      onAssigned?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err &&
        err.data && typeof err.data === "object" && "error" in err.data &&
        typeof err.data.error === "string"
          ? err.data.error
          : isReassign
            ? "Failed to reassign ticket"
            : "Failed to assign ticket";
      toast.error(message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-12px_rgba(15,23,42,0.2)]">
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900 mb-2">
          {isReassign ? "Reassign Ticket" : "Assign Ticket"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
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
            <span className="text-[13px] font-medium text-slate-600 mb-2 block">
              {isReassign ? "Reassign to" : "Assign to"}
            </span>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="input w-full rounded-xl border-slate-200"
              disabled={isAssigning}
            >
              <option value="">Select admin staff</option>
              {currentAdminId ? (
                <option value={String(currentAdminId)}>
                  {isReassign ? "Reassign to me" : "Assign to me"}
                </option>
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || isLoading || isError || !selectedAdminId}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isAssigning
              ? isReassign
                ? "Reassigning..."
                : "Assigning..."
              : isReassign
                ? "Reassign"
                : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
