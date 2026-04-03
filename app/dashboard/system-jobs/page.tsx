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

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-blue-100 text-blue-700",
  running:   "bg-indigo-100 text-indigo-700",
  scheduled: "bg-orange-100 text-orange-700",
  failed:    "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
  unknown:   "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[status] ?? STATUS_COLORS.unknown}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Job Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {job && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground font-medium">Class Name</p>
                <p className="font-mono font-semibold break-all">{job.class_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Queue</p>
                <p className="font-semibold">{job.queue_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Priority</p>
                <p className="font-semibold">{job.priority}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Status</p>
                <StatusBadge status={job.status} />
              </div>
              {job.active_job_id && (
                <div className="col-span-2">
                  <p className="text-muted-foreground font-medium">Active Job ID</p>
                  <p className="font-mono text-xs break-all">{job.active_job_id}</p>
                </div>
              )}
              {job.concurrency_key && (
                <div className="col-span-2">
                  <p className="text-muted-foreground font-medium">Concurrency Key</p>
                  <p className="font-mono text-xs break-all">{job.concurrency_key}</p>
                </div>
              )}
              {job.scheduled_at && (
                <div>
                  <p className="text-muted-foreground font-medium">Scheduled At</p>
                  <p className="font-semibold">{new Date(job.scheduled_at).toLocaleString()}</p>
                </div>
              )}
              {job.finished_at && (
                <div>
                  <p className="text-muted-foreground font-medium">Finished At</p>
                  <p className="font-semibold">{new Date(job.finished_at).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground font-medium">Created At</p>
                <p className="font-semibold">{new Date(job.created_at).toLocaleString()}</p>
              </div>
            </div>

            {parsedArgs !== null && (
              <div>
                <p className="text-muted-foreground font-medium text-sm mb-2">Arguments</p>
                <pre className="bg-slate-100 dark:bg-zinc-800 rounded-2xl p-4 text-xs overflow-x-auto font-mono">
                  {typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}
                </pre>
              </div>
            )}

            {job.status === "failed" && job.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <p className="text-red-700 dark:text-red-400 font-semibold text-sm mb-1">Error</p>
                <pre className="text-red-600 dark:text-red-300 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                  {typeof job.error === "string" ? job.error : JSON.stringify(job.error, null, 2)}
                </pre>
              </div>
            )}

            {canManage && (
              <div className="flex gap-3 pt-2">
                {job.status === "failed" && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                  >
                    Retry Job
                  </button>
                )}
                {job.status === "completed" && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl w-full max-w-sm p-8 space-y-6">
        <h2 className="text-xl font-bold">Delete Job</h2>
        <p className="text-muted-foreground text-sm">Are you sure you want to delete this completed job? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-sm font-semibold"
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass p-12 rounded-3xl text-center max-w-md">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to view System Jobs.</p>
        </div>
      </div>
    );
  }

  const dash = "—";
  const statsCards = [
    { label: "Total",     value: statsLoading ? dash : statsData?.total     ?? dash, color: "text-slate-600",  bg: "bg-slate-100"  },
    { label: "Pending",   value: statsLoading ? dash : statsData?.pending   ?? dash, color: "text-blue-600",   bg: "bg-blue-100"   },
    { label: "Running",   value: statsLoading ? dash : statsData?.running   ?? dash, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Scheduled", value: statsLoading ? dash : statsData?.scheduled ?? dash, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Failed",    value: statsLoading ? dash : statsData?.failed    ?? dash, color: "text-red-600",    bg: "bg-red-100"    },
    { label: "Completed", value: statsLoading ? dash : statsData?.completed ?? dash, color: "text-green-600",  bg: "bg-green-100"  },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Jobs</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage background job queue</p>
        </div>
        {can("system_jobs", "manage") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRetryAll}
              disabled={isRetryingAll}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRetryingAll ? "Retrying..." : "Retry All Failed"}
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="glass p-5 rounded-3xl">
            <div className={`inline-flex p-2 rounded-xl ${s.bg} ${s.color} mb-3`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search by class name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
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
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-zinc-800/50">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Class Name</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Queue</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Priority</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Created At</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || isFetching) && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm mt-3">Loading jobs...</p>
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-red-500">Failed to load jobs. Please try again.</td>
                </tr>
              )}
              {!isLoading && !isFetching && !isError && jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">No jobs found matching your filters.</td>
                </tr>
              )}
              {!isLoading && !isFetching && !isError && jobs.map((job: SystemJob) => (
                <tr key={job.id} className="border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs max-w-[200px] truncate block" title={job.class_name}>
                      {job.class_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{job.queue_name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{job.priority}</td>
                  <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJobId(job.id)}
                        className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-xs font-semibold"
                      >
                        View
                      </button>
                      {job.status === "failed" && can("system_jobs", "manage") && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl hover:opacity-90 transition-opacity text-xs font-semibold"
                        >
                          Retry
                        </button>
                      )}
                      {job.status === "completed" && can("system_jobs", "manage") && (
                        <button
                          onClick={() => setDeleteJobId(job.id)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-xs font-semibold"
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
          <div className="px-6 py-4 border-t border-border">
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
      <div className="glass p-6 rounded-3xl space-y-4">
        <div>
          <h2 className="text-xl font-bold">Recurring Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">Scheduled recurring jobs configured in the system</p>
        </div>
        {recurringLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : recurringTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recurring tasks configured</p>
        ) : (
          <div className="space-y-3">
            {recurringTasks.map((task) => (
              <div key={task.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-sm font-semibold truncate">{task.key}</p>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex-shrink-0">{task.schedule}</span>
                    {task.queue_name && (
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 rounded-full text-xs flex-shrink-0">{task.queue_name}</span>
                    )}
                  </div>
                  {task.class_name && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{task.class_name}</p>
                  )}
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  )}
                </div>
                {can("system_jobs", "manage") && (
                  <button
                    onClick={() => handleTrigger(task.key)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0 flex items-center gap-1"
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
