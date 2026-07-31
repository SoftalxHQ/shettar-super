"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  useLazyOctopusSearchQuery,
  useOctopusSearchProfileQuery,
  useOctopusSearchAnalyzeMutation,
  type OctopusSearchHit,
  type OctopusAiReport,
} from "@/lib/store/services/api";
import { OctopusAiPanel } from "@/components/octopus-ai-panel";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  accounts: "Customers",
  users: "Business users",
  members: "Members",
  businesses: "Businesses",
  bookings: "Bookings",
  transactions: "Transactions",
  support: "Support",
  activity: "Activity",
};

const CATEGORY_ORDER = [
  "accounts",
  "users",
  "members",
  "businesses",
  "bookings",
  "transactions",
  "support",
  "activity",
];

function OctopusSearchInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [input, setInput] = useState(initialQ);
  const [submittedQ, setSubmittedQ] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [report, setReport] = useState<OctopusAiReport | null>(null);
  const [booted, setBooted] = useState(false);

  const [triggerSearch, { data, isFetching, isError, error }] = useLazyOctopusSearchQuery();
  const [analyze, { isLoading: analyzing }] = useOctopusSearchAnalyzeMutation();

  const primaryAccountId = data?.primary_account_id ?? undefined;
  const { data: profileData } = useOctopusSearchProfileQuery(
    { account_id: primaryAccountId },
    { skip: !can("octopus_search", "view") || !primaryAccountId }
  );

  const runSearch = async (q: string) => {
    const query = q.trim();
    if (!query) {
      toast.error("Enter a name, email, phone, or ID to search");
      return;
    }
    setSubmittedQ(query);
    setReport(null);
    try {
      await triggerSearch({ q: query, page: 1, per_page: 50 }).unwrap();
    } catch (err) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Search failed");
    }
  };

  useEffect(() => {
    if (booted) return;
    setBooted(true);
    if (initialQ.trim()) void runSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, initialQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(input);
  };

  const handleAnalyze = async () => {
    if (!data?.hits?.length) {
      toast.error("Run a search before analyzing");
      return;
    }
    try {
      const result = await analyze({
        q: submittedQ,
        account_id: primaryAccountId,
        hits: data.hits,
      }).unwrap();
      setReport(result.report);
      setAiOpen(true);
    } catch (err) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "AI Analyzer failed");
    }
  };

  const grouped = useMemo(() => {
    const groups = data?.groups || {};
    return CATEGORY_ORDER.filter((key) => (groups[key]?.length || 0) > 0).map((key) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      hits: groups[key] as OctopusSearchHit[],
      count: data?.counts_by_category?.[key] || groups[key].length,
    }));
  }, [data]);

  if (!can("octopus_search", "view")) {
    return (
      <div className="dash-page">
        <p className="text-slate-500">You do not have permission to use Octopus Search.</p>
      </div>
    );
  }

  const profile = profileData?.profile;

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-slate-900">Octopus Search</h1>
          <p className="mt-1 text-sm text-slate-500">
            Global search across customers, bookings, payments, and support.
          </p>
        </div>
        {can("octopus_search", "analyze") && (
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={analyzing || !data?.hits?.length}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "AI Analyzer"}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-3xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search email, name, phone, booking ID, transaction code…"
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-28 text-lg text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-16px_rgba(15,23,42,0.18)] outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      {isFetching && <p className="text-sm text-slate-500">Searching…</p>}
      {isError && (
        <p className="text-sm text-rose-600">
          {(error as { data?: { error?: string } })?.data?.error || "Search failed"}
        </p>
      )}

      {data && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            <strong className="text-slate-800">{data.total_count}</strong> results
          </span>
          <span>·</span>
          <span>{data.took_ms} ms</span>
          <span>·</span>
          <span className="truncate">“{data.query}”</span>
        </div>
      )}

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unified customer profile</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{profile.identity.name || profile.identity.email}</h2>
              <p className="text-sm text-slate-500">
                {profile.identity.email}
                {profile.identity.phone ? ` · ${profile.identity.phone}` : ""}
                {` · ${profile.identity.member_id}`}
              </p>
            </div>
            <Link
              href={profile.identity.href}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Open account
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Identity</p>
              <p className="mt-2 text-sm text-slate-700">Status: {profile.identity.status}</p>
              <p className="text-sm text-slate-700">Wallet: {formatCurrency(profile.identity.wallet_balance)}</p>
              <p className="text-sm text-slate-700">Joined: {formatDate(profile.identity.created_at)}</p>
            </div>
            <Link href={profile.bookings.href} className="rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bookings</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.bookings.total}</p>
              <p className="text-sm text-slate-600">
                {profile.bookings.upcoming} upcoming · {profile.bookings.cancelled} cancelled · {profile.bookings.completed} completed
              </p>
            </Link>
            <Link href={profile.financial.href} className="rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Financial</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(profile.financial.total_spend)}</p>
              <p className="text-sm text-slate-600">
                {profile.financial.total_transactions} txns · {profile.financial.failed_payments} failed · {formatCurrency(profile.financial.refunds)} refunds
              </p>
            </Link>
          </div>
        </section>
      )}

      {grouped.map((section) => (
        <section key={section.key} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {section.label}{" "}
            <span className="font-normal text-slate-400">({section.count})</span>
          </h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {section.hits.map((hit) => (
              <Link
                key={`${hit.entity_type}-${hit.entity_id}`}
                href={hit.href}
                className="block px-5 py-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{hit.title}</p>
                    {hit.subtitle && <p className="text-sm text-slate-500">{hit.subtitle}</p>}
                    {hit.public_id && (
                      <p className="mt-1 font-mono text-xs text-slate-400">{hit.public_id}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {hit.status && (
                      <span className="mb-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {hit.status}
                      </span>
                    )}
                    <p>{hit.occurred_at ? formatDate(hit.occurred_at) : ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {data && data.total_count === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          No results for “{data.query}”.
        </p>
      )}

      <OctopusAiPanel open={aiOpen} onClose={() => setAiOpen(false)} report={report} query={submittedQ} />
    </div>
  );
}

export default function OctopusSearchPage() {
  return (
    <Suspense fallback={<div className="dash-page"><p className="text-slate-500">Loading…</p></div>}>
      <OctopusSearchInner />
    </Suspense>
  );
}
