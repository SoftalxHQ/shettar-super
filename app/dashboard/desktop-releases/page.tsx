"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useGetDesktopReleasesQuery,
  useUpdateDesktopReleaseMutation,
  useDeleteDesktopReleaseMutation,
  type DesktopRelease,
} from "@/lib/store/services/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function DesktopReleasesPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState<string>("");
  const [editing, setEditing] = useState<DesktopRelease | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<DesktopRelease | null>(null);

  const { data, isLoading, isFetching } = useGetDesktopReleasesQuery(
    { page, channel: channel || undefined },
    { refetchOnMountOrArgChange: true, skip: !can("desktop_releases", "view") },
  );
  const [updateRelease, { isLoading: isUpdating }] = useUpdateDesktopReleaseMutation();
  const [deleteRelease, { isLoading: isDeleting }] = useDeleteDesktopReleaseMutation();

  const releases = data?.releases ?? [];
  const meta = data?.meta;

  if (!can("desktop_releases", "view")) {
    return (
      <div className="dash-page space-y-6">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Desktop Releases
          </h1>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to access this section.</p>
        </div>
      </div>
    );
  }

  const toggleActive = async (release: DesktopRelease) => {
    if (!can("desktop_releases", "edit")) {
      toast.error("You don't have permission to edit releases");
      return;
    }
    try {
      await updateRelease({
        id: release.id,
        desktop_release: { active: !release.active },
      }).unwrap();
      toast.success(release.active ? "Release deactivated" : "Release activated");
    } catch {
      toast.error("Failed to update release");
    }
  };

  const openNotes = (release: DesktopRelease) => {
    setEditing(release);
    setNotesDraft(release.notes ?? "");
  };

  const saveNotes = async () => {
    if (!editing) return;
    try {
      await updateRelease({
        id: editing.id,
        desktop_release: { notes: notesDraft },
      }).unwrap();
      toast.success("Notes updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update notes");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (!can("desktop_releases", "edit")) {
      toast.error("You don't have permission to delete releases");
      return;
    }
    try {
      await deleteRelease(confirmDelete.id).unwrap();
      toast.success(`Deleted v${confirmDelete.version} (${confirmDelete.channel})`);
      setConfirmDelete(null);
    } catch (error) {
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(message || "Failed to delete release");
    }
  };

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Desktop Releases
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Shettar Business installers registered from CI. Delete outdated builds to free S3 space.
            The latest active release per channel cannot be deleted.
          </p>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && releases.length === 0 && (
        <div className={`${panelClass} p-8 text-center text-sm text-slate-500`}>
          No desktop releases registered yet.
        </div>
      )}

      {!isLoading && releases.length > 0 && (
        <div className={`${panelClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Version</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Channel</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Published</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Notes</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">v{release.version}</td>
                    <td className="px-5 py-3.5 capitalize text-slate-600">{release.channel}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          release.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {release.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{formatDate(release.published_at)}</td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-600" title={release.notes ?? undefined}>
                      {release.notes || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {can("desktop_releases", "edit") && (
                        <>
                          <button
                            type="button"
                            onClick={() => openNotes(release)}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            Edit notes
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleActive(release)}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            {release.active ? "Deactivate" : "Activate"}
                          </button>
                          {release.latest ? (
                            <span className="text-sm text-slate-400" title="Deactivate or publish a newer release first">
                              Latest
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(release)}
                              className="text-sm font-semibold text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          onPageChange={setPage}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={`${panelClass} w-full max-w-lg p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
                Edit notes · v{editing.version} ({editing.channel})
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                ✕
              </button>
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void saveNotes()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdating ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={`${panelClass} w-full max-w-md p-6 space-y-4`}>
            <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
              Delete v{confirmDelete.version} ({confirmDelete.channel})
            </h2>
            <p className="text-sm text-slate-500">
              This removes the release record and deletes its installers and updater files from S3.
              This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
