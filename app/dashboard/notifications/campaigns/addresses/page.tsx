"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Pagination } from "@/components/ui/pagination";
import {
  useAchievePromotionalContactMutation,
  useCreatePromotionalContactMutation,
  useDeletePromotionalContactMutation,
  useGetPromotionalContactsQuery,
  useImportPromotionalContactsMutation,
  type PromotionalContact,
} from "@/lib/store/services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

function mutationErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string; errors?: string[] } };
  if (e?.data?.error) return e.data.error;
  if (e?.data?.errors?.length) return e.data.errors.join(", ");
  return fallback;
}

export default function CampaignAddressesPage() {
  const { admin } = useAuth();
  const canView = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.view === true;
  const canCreate = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.create === true;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"active" | "achieved">("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<PromotionalContact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching } = useGetPromotionalContactsQuery(
    { page, q: search || undefined, status },
    { skip: !canView }
  );
  const [createContact, { isLoading: adding }] = useCreatePromotionalContactMutation();
  const [importContacts, { isLoading: importing }] = useImportPromotionalContactsMutation();
  const [deleteContact, { isLoading: removing }] = useDeletePromotionalContactMutation();
  const [achieveContact, { isLoading: achieving }] = useAchievePromotionalContactMutation();
  const [exporting, setExporting] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-colors text-sm";

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ status });
      if (search) params.set("q", search);
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotional_contacts/export?${params}`, {
        credentials: "include",
        headers: { "X-Client-Platform": "web-super" },
      });
      if (!response.ok) {
        toast.error("Failed to export CSV");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `promotional-contacts-${status}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await createContact({ email: email.trim() }).unwrap();
      setEmail("");
      setPage(1);
      setStatus("active");
      toast.success("Address saved");
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to save address"));
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Upload a .csv file");
      return;
    }
    try {
      const result = await importContacts(file).unwrap();
      setPage(1);
      toast.success(
        `Imported ${result.imported.toLocaleString()}. ${result.duplicates.toLocaleString()} duplicates and ${result.invalid.toLocaleString()} invalid rows skipped.`
      );
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to import CSV"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAchieve = async (contact: PromotionalContact) => {
    try {
      await achieveContact(contact.id).unwrap();
      toast.success("Marked as achieved");
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to update address"));
    }
  };

  const handleRemove = async () => {
    if (!pendingRemoval) return;
    try {
      await deleteContact(pendingRemoval.id).unwrap();
      setPendingRemoval(null);
      toast.success("Address removed");
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to remove address"));
    }
  };

  if (!canView) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-display text-base font-semibold text-red-600">Access denied</p>
          <p className="text-sm text-slate-500 mt-2">You need the &quot;View Newsletters&quot; permission.</p>
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = data?.active_count ?? 0;

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Email list
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            {activeCount.toLocaleString()} active {activeCount === 1 ? "address" : "addresses"} will receive campaigns. Achieved addresses stay here and are left out of later sends.
          </p>
        </div>
        <Link href="/dashboard/notifications/campaigns" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Back to campaigns
        </Link>
      </div>

      <section className={`${panelClass} p-6 space-y-5`}>
        {canCreate && (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form onSubmit={(event) => void handleAdd(event)} className="flex flex-1 min-w-[16rem] gap-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="name@example.com"
                required
              />
              <button
                type="submit"
                disabled={adding}
                className="px-5 py-2.5 rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
              >
                {adding ? "Saving…" : "Add"}
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void handleImport(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-4 py-2.5 rounded-xl font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                {importing ? "Importing…" : "Upload CSV"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex gap-1 rounded-xl bg-slate-100/80 p-1">
            {([ "active", "achieved" ] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold capitalize transition-colors ${
                  status === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex gap-2 flex-1 sm:flex-initial"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className={inputClass}
              placeholder="Search email"
            />
            <button type="submit" className="px-4 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors">
              Search
            </button>
          </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">Loading addresses…</td>
                </tr>
              )}
              {!isLoading && data?.contacts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    {search ? "No addresses match that search." : status === "achieved" ? "No achieved addresses." : "No addresses saved yet."}
                  </td>
                </tr>
              )}
              {data?.contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 text-slate-900">{contact.email}</td>
                  <td className="py-3 pr-4 capitalize text-slate-500">{contact.source}</td>
                  <td className="py-3 text-right space-x-4">
                    {canCreate && status === "active" && (
                      <button
                        type="button"
                        onClick={() => void handleAchieve(contact)}
                        disabled={achieving}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                      >
                        Mark as achieved
                      </button>
                    )}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => setPendingRemoval(contact)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <Pagination
            currentPage={data.meta.current_page}
            totalPages={data.meta.total_pages}
            totalCount={data.meta.total_count}
            onPageChange={setPage}
          />
        )}
        {isFetching && !isLoading && <p className="text-xs text-slate-400">Updating list…</p>}
      </section>

      {pendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Delete address</h2>
              <p className="text-sm text-slate-500 mt-1">{pendingRemoval.email} will be removed from the list.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingRemoval(null)}
                disabled={removing}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={removing}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
