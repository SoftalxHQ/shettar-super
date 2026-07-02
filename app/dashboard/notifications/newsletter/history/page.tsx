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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-100 text-amber-800",
  sending: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Access denied</p>
          <Link href="/dashboard" className="text-sm text-primary mt-4 inline-block">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const actionBusy = deleting || resending || retrying;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Newsletter History</h1>
          <p className="text-muted-foreground mt-2">Past email campaigns and delivery status.</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/notifications/newsletter"
            className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90"
          >
            New newsletter
          </Link>
        )}
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 font-bold">Subject</th>
                <th className="px-6 py-4 font-bold">Audience</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Sent</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Loading…</td>
                </tr>
              )}
              {!isLoading && data?.newsletters?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No newsletters yet.</td>
                </tr>
              )}
              {data?.newsletters?.map((newsletter) => (
                <tr key={newsletter.id} className="border-b border-border/30 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <Link
                      href={
                        isEditable(newsletter)
                          ? `/dashboard/notifications/newsletter?id=${newsletter.id}`
                          : "#"
                      }
                      className={`font-semibold ${isEditable(newsletter) ? "hover:text-primary" : "cursor-default"}`}
                    >
                      {newsletter.subject}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {newsletter.admin?.name || newsletter.admin?.email || "Admin"}
                    </p>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {newsletter.audience}
                    {newsletter.target_type === "segment" && newsletter.target_value && (
                      <span className="text-muted-foreground"> · {newsletter.target_value}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${STATUS_STYLES[newsletter.status] || ""}`}>
                      {newsletter.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {newsletter.sent_count.toLocaleString()}
                    {newsletter.failed_count > 0 && (
                      <span className="text-red-500 text-xs ml-1">({newsletter.failed_count} failed)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(newsletter.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canCreate && isEditable(newsletter) && (
                        <Link
                          href={`/dashboard/notifications/newsletter?id=${newsletter.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                        >
                          Edit
                        </Link>
                      )}
                      {canSend && isRetryable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setRetryTarget(newsletter)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-950/60"
                        >
                          Retry
                        </button>
                      )}
                      {canSend && isResendable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setResendTarget(newsletter)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          Resend
                        </button>
                      )}
                      {canSend && isDeletable(newsletter) && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(newsletter)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
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
          <div className="px-6 py-4 border-t border-border/50">
            <Pagination
              currentPage={data.meta.current_page}
              totalPages={data.meta.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {retryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black">Retry delivery</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  The previous delivery did not finish. This will queue the campaign again.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-border/50 px-5 py-4 space-y-2">
                <p className="text-sm font-semibold">{retryTarget.subject}</p>
                <p className="text-sm text-muted-foreground capitalize">Status: {retryTarget.status}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRetryTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRetry()}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {retrying ? "Queueing…" : "Retry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black">Resend campaign</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Queue a new delivery using the saved content and audience.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-border/50 px-5 py-4 space-y-2">
                <p className="text-sm font-semibold">{resendTarget.subject}</p>
                <p className="text-sm text-muted-foreground">
                  Resend to approximately{" "}
                  <span className="font-bold text-foreground">
                    {resendTarget.recipient_estimate.toLocaleString()}
                  </span>{" "}
                  recipients.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResendTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {resending ? "Queueing…" : "Resend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black">Delete newsletter</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This permanently removes the newsletter record. This cannot be undone.
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-5 py-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">{deleteTarget.subject}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={actionBusy}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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
