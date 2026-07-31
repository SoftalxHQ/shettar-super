"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetAdminReservationQuery } from "@/lib/store/services/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

export default function OctopusReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const { data, isLoading, isError } = useGetAdminReservationQuery(id, {
    skip: !can("octopus_search", "view"),
  });

  if (!can("octopus_search", "view")) {
    return <div className="dash-page"><p className="text-slate-500">Forbidden</p></div>;
  }

  if (isLoading) return <div className="dash-page"><p className="text-slate-500">Loading…</p></div>;
  if (isError || !data?.reservation) {
    return <div className="dash-page"><p className="text-rose-600">Reservation not found</p></div>;
  }

  const r = data.reservation;
  const name = [r.first_name, r.last_name].filter(Boolean).join(" ");

  return (
    <div className="dash-page space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/octopus" className="hover:text-slate-800">Octopus Search</Link>
        <span>/</span>
        <span className="text-slate-800">Booking</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-400">{r.booking_id}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{name || "Guest"}</h1>
            <p className="text-sm text-slate-500">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{r.status}</span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Stay</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {r.start_date ? formatDate(r.start_date) : "—"} → {r.end_date ? formatDate(r.end_date) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Amount</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatCurrency(Number(r.total_amount || 0))}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Business</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {r.business ? (
                <Link href={r.href_business} className="text-indigo-600 hover:underline">{r.business.name}</Link>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Room</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {r.room?.room_type || "—"}{r.room?.number ? ` · #${r.room.number}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Created</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(r.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Payment</dt>
            <dd className="mt-1 text-sm text-slate-800">{r.payment_method || "—"} · {r.booking_source || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {r.href_account && (
            <Link href={r.href_account} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
              View customer
            </Link>
          )}
          <Link href={r.href_business} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            View business
          </Link>
        </div>
      </div>
    </div>
  );
}
