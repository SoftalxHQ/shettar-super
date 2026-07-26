"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useGetDesktopReleasesQuery,
  useUpdateDesktopReleaseMutation,
  type DesktopRelease,
} from "@/lib/store/services/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { Pagination } from "@/components/ui/pagination";

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

  const { data, isLoading, isFetching } = useGetDesktopReleasesQuery(
    { page, channel: channel || undefined },
    { refetchOnMountOrArgChange: true, skip: !can("desktop_releases", "view") },
  );
  const [updateRelease, { isLoading: isUpdating }] = useUpdateDesktopReleaseMutation();

  const releases = data?.releases ?? [];
  const meta = data?.meta;

  if (!can("desktop_releases", "view")) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Desktop Releases</h1>
        <p className="text-muted-foreground mt-2">You don&apos;t have permission to access this section.</p>
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Desktop Releases</h1>
          <p className="text-muted-foreground mt-1">
            Shettar Business installers registered from CI. Creates stay CI-only.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && releases.length === 0 && (
        <div className="glass rounded-3xl p-8 text-center text-muted-foreground">
          No desktop releases registered yet.
        </div>
      )}

      {!isLoading && releases.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-semibold">v{release.version}</td>
                    <td className="px-4 py-3 capitalize">{release.channel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          release.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {release.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(release.published_at)}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={release.notes ?? undefined}>
                      {release.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {can("desktop_releases", "edit") && (
                        <>
                          <button
                            type="button"
                            onClick={() => openNotes(release)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Edit notes
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleActive(release)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {release.active ? "Deactivate" : "Activate"}
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Edit notes · v{editing.version} ({editing.channel})
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                ✕
              </button>
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void saveNotes()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
              >
                {isUpdating ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
