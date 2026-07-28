"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useDeleteNewsletterMutation,
  useGetNewslettersQuery,
  useResendNewsletterMutation,
  useRetryNewsletterDeliveryMutation,
  type Newsletter,
} from "@/lib/store/services/api";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-700",
  sending: "bg-sky-50 text-sky-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-600",
};

function mutationErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string; errors?: string[] } };
  if (e?.data?.error) return e.data.error;
  if (e?.data?.errors?.length) return e.data.errors.join(", ");
  return fallback;
}

function isEditable(newsletter: Newsletter) {
  return newsletter.editable ?? (newsletter.status === "draft" || newsletter.status === "sent" || newsletter.status === "failed");
}

function isResendable(newsletter: Newsletter) {
  return newsletter.resendable ?? (newsletter.status === "sent" || newsletter.status === "failed");
}

function isRetryable(newsletter: Newsletter) {
  if (newsletter.retryable != null) return newsletter.retryable;
  if (newsletter.status === "failed") return true;
  if (newsletter.status === "sending") {
    return Date.now() - new Date(newsletter.updated_at).getTime() > 2 * 60 * 1000;
  }
  if (newsletter.status === "queued") {
    return Date.now() - new Date(newsletter.updated_at).getTime() > 10 * 60 * 1000;
  }
  return false;
}

function isDeletable(newsletter: Newsletter) {
  if (newsletter.deletable != null) return newsletter.deletable;
  if (newsletter.status === "queued") return false;
  if (newsletter.status === "sending") return isRetryable(newsletter);
  return true;
}

export default function NewsletterHistoryPage() {
  const { admin } = useAuth();
  const canView = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.view === true;
  const canCreate = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.create === true;
  const canSend = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.send === true;

  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetNewslettersQuery({ page }, { skip: !canView });

  const [deleteNewsletter, { isLoading: deleting }] = useDeleteNewsletterMutation();
  const [resendNewsletter, { isLoading: resending }] = useResendNewsletterMutation();
  const [retryNewsletterDelivery, { isLoading: retrying }] = useRetryNewsletterDeliveryMutation();

  const [resendTarget, setResendTarget] = useState<Newsletter | null>(null);
  const [retryTarget, setRetryTarget] = useState<Newsletter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Newsletter | null>(null);

  const handleResend = async () => {
    if (!resendTarget) return;
    try {
      const result = await resendNewsletter(resendTarget.id).unwrap();
      toast.success(result.message);
      setResendTarget(null);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to resend newsletter"));
    }
  };

  const handleRetry = async () => {
    if (!retryTarget) return;
    try {
      const result = await retryNewsletterDelivery(retryTarget.id).unwrap();
      toast.success(result.message);
      setRetryTarget(null);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to retry delivery"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteNewsletter(deleteTarget.id).unwrap();
      toast.success(result.message);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to delete newsletter"));
    }
  };

  if (!canView) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-display text-base font-semibold text-red-600">Access denied</p>
          <Link href="/dashboard" className="text-sm text-indigo-600 mt-4 inline-block font-medium">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const actionBusy = deleting || resending || retrying;

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Newsletter History
          </h1>
          <p className="text-sm text-slate-500 mt-2">Past email campaigns and delivery status.</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/notifications/newsletter"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
          >
            New newsletter
          </Link>
        )}
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Audience</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sent</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">Loading…</td>
                </tr>
              )}
              {!isLoading && data?.newsletters?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No newsletters yet.</td>
                </tr>
              )}
              {data?.newsletters?.map((newsletter) => (
                <tr key={newsletter.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={
                        isEditable(newsletter)
                          ? `/dashboard/notifications/newsletter?id=${newsletter.id}`
                          : "#"
                      }
                      className={`font-semibold text-slate-900 ${isEditable(newsletter) ? "hover:text-indigo-600" : "cursor-default"}`}
                    >
                      {newsletter.subject}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      by {newsletter.admin?.name || newsletter.admin?.email || "Admin"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-slate-700">
                    {newsletter.audience}
                    {newsletter.target_type === "segment" && newsletter.target_value && (
                      <span className="text-slate-400"> · {newsletter.target_value}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${STATUS_STYLES[newsletter.status] || ""}`}>
                      {newsletter.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-slate-900">
                    {newsletter.sent_count.toLocaleString()}
                    {newsletter.failed_count > 0 && (
                      <span className="text-red-600 text-xs ml-1">({newsletter.failed_count} failed)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {new Date(newsletter.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {canCreate && isEditable(newsletter) && (
                        <Link
                          href={`/dashboard/notifications/newsletter?id=${newsletter.id}`}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Edit
                        </Link>
                      )}
                      {canSend && isRetryable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setRetryTarget(newsletter)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                      {canSend && isResendable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setResendTarget(newsletter)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Resend
                        </button>
                      )}
                      {canSend && isDeletable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(newsletter)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.total_pages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100">
            <Pagination
              currentPage={data.meta.current_page}
              totalPages={data.meta.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {retryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">Retry delivery</h2>
                <p className="text-sm text-slate-500 mt-1">
                  The previous delivery did not finish. This will queue the campaign again.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{retryTarget.subject}</p>
                <p className="text-sm text-slate-500 capitalize">Status: {retryTarget.status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRetryTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRetry()}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {retrying ? "Queueing…" : "Retry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">Resend campaign</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Queue a new delivery using the saved content and audience.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{resendTarget.subject}</p>
                <p className="text-sm text-slate-500">
                  Resend to approximately{" "}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {resendTarget.recipient_estimate.toLocaleString()}
                  </span>{" "}
                  recipients.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResendTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {resending ? "Queueing…" : "Resend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">Delete newsletter</h2>
                <p className="text-sm text-slate-500 mt-1">
                  This permanently removes the newsletter record. This cannot be undone.
                </p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm font-semibold text-red-700">{deleteTarget.subject}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={actionBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
