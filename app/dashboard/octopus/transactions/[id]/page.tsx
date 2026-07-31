"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetAdminTransactionQuery } from "@/lib/store/services/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

export default function OctopusTransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const { data, isLoading, isError } = useGetAdminTransactionQuery(id, {
    skip: !can("octopus_search", "view"),
  });

  if (!can("octopus_search", "view")) {
    return <div className="dash-page"><p className="text-slate-500">Forbidden</p></div>;
  }

  if (isLoading) return <div className="dash-page"><p className="text-slate-500">Loading…</p></div>;
  if (isError || !data?.transaction) {
    return <div className="dash-page"><p className="text-rose-600">Transaction not found</p></div>;
  }

  const t = data.transaction;

  return (
    <div className="dash-page space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/octopus" className="hover:text-slate-800">Octopus Search</Link>
        <span>/</span>
        <span className="text-slate-800">Transaction</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-400">{t.reference_code}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(Number(t.amount))}</h1>
            <p className="text-sm text-slate-500">{t.description || t.transaction_type}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{t.status}</span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Type</dt>
            <dd className="mt-1 text-sm text-slate-800">{t.transaction_type}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Payment method</dt>
            <dd className="mt-1 text-sm text-slate-800">{t.payment_method || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Created</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(t.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Customer</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {t.account && t.href_account ? (
                <Link href={t.href_account} className="text-indigo-600 hover:underline">
                  {t.account.name || t.account.email}
                </Link>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Business</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {t.business && t.href_business ? (
                <Link href={t.href_business} className="text-indigo-600 hover:underline">{t.business.name}</Link>
              ) : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
