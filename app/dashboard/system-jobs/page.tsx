"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useGetSystemJobsQuery,
  useGetSystemJobQuery,
  useGetSystemJobStatsQuery,
  useDeleteSystemJobMutation,
  useRetrySystemJobMutation,
  useRetryAllFailedJobsMutation,
  useDeleteAllCompletedJobsMutation,
  useGetRecurringTasksQuery,
  useTriggerRecurringTaskMutation,
  type SystemJob,
} from "@/lib/store/services/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-blue-50 text-blue-700",
  running:   "bg-indigo-50 text-indigo-700",
  scheduled: "bg-orange-50 text-orange-700",
  failed:    "bg-red-50 text-red-600",
  completed: "bg-emerald-50 text-emerald-700",
  unknown:   "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_COLORS[status] ?? STATUS_COLORS.unknown}`}>
      {status.toUpperCase()}
    </span>
  );
}

function JobDetailModal({ jobId, onClose, canManage, onRetrySuccess }: { jobId: number; onClose: () => void; canManage: boolean; onRetrySuccess?: () => void }) {
  const { data, isLoading } = useGetSystemJobQuery(jobId);
  const [retryJob] = useRetrySystemJobMutation();
  const [deleteJob] = useDeleteSystemJobMutation();

  const job = data?.job;

  const handleRetry = async () => {
    try {
      await retryJob(jobId).unwrap();
      toast.success("Job queued for retry");
      onRetrySuccess?.();
      onClose();
    } catch {
      toast.error("Failed to retry job");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(jobId).unwrap();
      toast.success("Job deleted");
      onClose();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  let parsedArgs: unknown = null;
  if (job?.arguments) {
    try { parsedArgs = JSON.parse(job.arguments); } catch { parsedArgs = job.arguments; }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Job Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {job && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Class Name</p>
                <p className="font-mono font-semibold text-slate-900 break-all">{job.class_name}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Queue</p>
                <p className="font-semibold text-slate-900">{job.queue_name}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Priority</p>
                <p className="font-semibold text-slate-900">{job.priority}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Status</p>
                <StatusBadge status={job.status} />
              </div>
              {job.active_job_id && (
                <div className="col-span-2">
                  <p className="text-slate-500 font-medium">Active Job ID</p>
                  <p className="font-mono text-xs break-all text-slate-700">{job.active_job_id}</p>
                </div>
              )}
              {job.concurrency_key && (
                <div className="col-span-2">
                  <p className="text-slate-500 font-medium">Concurrency Key</p>
                  <p className="font-mono text-xs break-all text-slate-700">{job.concurrency_key}</p>
                </div>
              )}
              {job.scheduled_at && (
                <div>
                  <p className="text-slate-500 font-medium">Scheduled At</p>
                  <p className="font-semibold text-slate-900">{new Date(job.scheduled_at).toLocaleString()}</p>
                </div>
              )}
              {job.finished_at && (
                <div>
                  <p className="text-slate-500 font-medium">Finished At</p>
                  <p className="font-semibold text-slate-900">{new Date(job.finished_at).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500 font-medium">Created At</p>
                <p className="font-semibold text-slate-900">{new Date(job.created_at).toLocaleString()}</p>
              </div>
            </div>

            {parsedArgs !== null && (
              <div>
                <p className="text-slate-500 font-medium text-sm mb-2">Arguments</p>
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs overflow-x-auto font-mono text-slate-700">
                  {typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}
                </pre>
              </div>
            )}

            {job.status === "failed" && job.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-semibold text-sm mb-1">Error</p>
                <pre className="text-red-600 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                  {typeof job.error === "string" ? job.error : JSON.stringify(job.error, null, 2)}
                </pre>
              </div>
            )}

            {canManage && (
              <div className="flex gap-3 pt-2">
                {job.status === "failed" && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold"
                  >
                    Retry Job
                  </button>
                )}
                {job.status === "completed" && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    Delete Job
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ onConfirm, onCancel }: { jobId: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} w-full max-w-sm p-6 space-y-4`}>
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Delete Job</h2>
        <p className="text-slate-500 text-sm">Are you sure you want to delete this completed job? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SystemJobsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const { data: statsData, isLoading: statsLoading } = useGetSystemJobStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data, isLoading, isFetching, isError, refetch } = useGetSystemJobsQuery({
    page,
    status: statusFilter,
    search: search || undefined,
  }, { refetchOnMountOrArgChange: true });

  const [retryJob] = useRetrySystemJobMutation();
  const [deleteJob] = useDeleteSystemJobMutation();
  const [retryAllFailed, { isLoading: isRetryingAll }] = useRetryAllFailedJobsMutation();
  const [deleteAllCompleted, { isLoading: isDeletingAll }] = useDeleteAllCompletedJobsMutation();
  const { data: recurringData, isLoading: recurringLoading } = useGetRecurringTasksQuery();
  const [triggerRecurring] = useTriggerRecurringTaskMutation();

  const recurringTasks = recurringData?.recurring_tasks ?? [];

  const handleRetryAll = async () => {
    try {
      const result = await retryAllFailed().unwrap();
      toast.success(result.message);
      refetch();
    } catch {
      toast.error("Failed to retry all failed jobs");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const result = await deleteAllCompleted().unwrap();
      toast.success(result.message);
      refetch();
    } catch {
      toast.error("Failed to delete completed jobs");
    }
  };

  const handleTrigger = async (key: string) => {
    try {
      const result = await triggerRecurring(key).unwrap();
      toast.success(result.message);
    } catch {
      toast.error(`Failed to trigger task: ${key}`);
    }
  };

  const jobs = data?.jobs ?? [];
  const meta = data?.meta;

  const handleRetry = async (id: number) => {
    try {
      await retryJob(id).unwrap();
      toast.success("Job queued for retry");
      refetch();
    } catch {
      toast.error("Failed to retry job");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteJobId) return;
    try {
      await deleteJob(deleteJobId).unwrap();
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setDeleteJobId(null);
    }
  };

  if (!can("system_jobs", "view")) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className={`${panelClass} p-12 text-center max-w-md`}>
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-xl font-semibold tracking-tight text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500">You don&apos;t have permission to view System Jobs.</p>
        </div>
      </div>
    );
  }

  const dash = "—";
  const statsCards = [
    { label: "Total",     value: statsLoading ? dash : statsData?.total     ?? dash },
    { label: "Pending",   value: statsLoading ? dash : statsData?.pending   ?? dash },
    { label: "Running",   value: statsLoading ? dash : statsData?.running   ?? dash },
    { label: "Scheduled", value: statsLoading ? dash : statsData?.scheduled ?? dash },
    { label: "Failed",    value: statsLoading ? dash : statsData?.failed    ?? dash },
    { label: "Completed", value: statsLoading ? dash : statsData?.completed ?? dash },
  ];

  return (
    <div className="dash-page space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">System Jobs</h1>
          <p className="text-sm text-slate-500 mt-2">Monitor and manage background job queue</p>
        </div>
        {can("system_jobs", "manage") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRetryAll}
              disabled={isRetryingAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRetryingAll ? "Retrying..." : "Retry All Failed"}
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeletingAll ? "Deleting..." : "Delete All Completed"}
            </button>
          </div>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((s) => (
          <div key={s.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{s.label}</p>
            <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-2.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${panelClass} p-5 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
            <input
              type="text"
              className="input rounded-xl border-slate-200"
              placeholder="Search by class name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
            <select
              className="input rounded-xl border-slate-200"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${panelClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Class Name</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Queue</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Priority</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Created At</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || isFetching) && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm mt-3">Loading jobs...</p>
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-red-600">Failed to load jobs. Please try again.</td>
                </tr>
              )}
              {!isLoading && !isFetching && !isError && jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No jobs found matching your filters.</td>
                </tr>
              )}
              {!isLoading && !isFetching && !isError && jobs.map((job: SystemJob) => (
                <tr key={job.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs max-w-[200px] truncate block text-slate-900" title={job.class_name}>
                      {job.class_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{job.queue_name}</td>
                  <td className="px-6 py-4 text-slate-500">{job.priority}</td>
                  <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJobId(job.id)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold"
                      >
                        View
                      </button>
                      {job.status === "failed" && can("system_jobs", "manage") && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold"
                        >
                          Retry
                        </button>
                      )}
                      {job.status === "completed" && can("system_jobs", "manage") && (
                        <button
                          onClick={() => setDeleteJobId(job.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-xs font-semibold"
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

        {meta && meta.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200">
            <Pagination
              currentPage={meta.current_page}
              totalPages={meta.total_pages}
              totalCount={meta.total_count}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedJobId !== null && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          canManage={can("system_jobs", "manage")}
          onRetrySuccess={refetch}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteJobId !== null && (
        <DeleteConfirmDialog
          jobId={deleteJobId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteJobId(null)}
        />
      )}

      {/* Recurring Tasks */}
      <div className={`${panelClass} p-5 space-y-4`}>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Recurring Tasks</h2>
          <p className="text-sm text-slate-500 mt-1">Scheduled recurring jobs configured in the system</p>
        </div>
        {recurringLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : recurringTasks.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No recurring tasks configured</p>
        ) : (
          <div className="space-y-3">
            {recurringTasks.map((task) => (
              <div key={task.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-sm font-semibold truncate text-slate-900">{task.key}</p>
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md text-[11px] font-semibold flex-shrink-0">{task.schedule}</span>
                    {task.queue_name && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold flex-shrink-0">{task.queue_name}</span>
                    )}
                  </div>
                  {task.class_name && (
                    <p className="text-xs text-slate-500 mt-1 font-mono truncate">{task.class_name}</p>
                  )}
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  )}
                </div>
                {can("system_jobs", "manage") && (
                  <button
                    onClick={() => handleTrigger(task.key)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
