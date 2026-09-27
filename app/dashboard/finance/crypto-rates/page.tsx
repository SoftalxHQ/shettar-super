"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { useGetCryptoFundingRatesQuery, useUpdateCryptoFundingRateMutation } from "@/lib/store/services/api";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500";

type FundingRate = {
  id: number;
  asset: string;
  label: string;
  reference_rate: number | null;
  executable_rate_override: number | null;
  executable_rate: number | null;
  provider_fee_ngn: number;
  network_cost_ngn: number;
  safety_buffer_ngn: number;
  credit_rate: number | null;
  rate_source: string | null;
};

type Draft = {
  executable_rate_override: string;
  provider_fee_ngn: string;
  network_cost_ngn: string;
  safety_buffer_ngn: string;
};

function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function draftFrom(rate: FundingRate): Draft {
  return {
    executable_rate_override: rate.executable_rate_override == null ? "" : String(rate.executable_rate_override),
    provider_fee_ngn: String(rate.provider_fee_ngn ?? 0),
    network_cost_ngn: String(rate.network_cost_ngn ?? 0),
    safety_buffer_ngn: String(rate.safety_buffer_ngn ?? 0),
  };
}

export default function CryptoRatesPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };
  const canView = can("finance", "view");
  const canEdit = can("configurations", "edit");

  const { data, isLoading, isError } = useGetCryptoFundingRatesQuery(undefined, { skip: !canView });
  const [updateRate, { isLoading: saving }] = useUpdateCryptoFundingRateMutation();
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!data?.rates) return;
    setDrafts((current) => {
      const next = { ...current };
      data.rates.forEach((rate) => {
        if (!next[rate.id]) next[rate.id] = draftFrom(rate);
      });
      return next;
    });
  }, [data]);

  if (!canView) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <h2 className="font-display text-xl font-semibold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to view crypto funding rates.</p>
        </div>
      </div>
    );
  }

  const save = async (rate: FundingRate) => {
    const draft = drafts[rate.id] ?? draftFrom(rate);
    setSavingId(rate.id);
    try {
      await updateRate({
        id: rate.id,
        executable_rate_override: draft.executable_rate_override.trim() || null,
        provider_fee_ngn: draft.provider_fee_ngn,
        network_cost_ngn: draft.network_cost_ngn,
        safety_buffer_ngn: draft.safety_buffer_ngn,
      }).unwrap();
      toast.success(`${rate.label} funding rate saved`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[rate.id];
        return next;
      });
    } catch {
      toast.error(`Could not save the ${rate.label} rate`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="dash-page space-y-6">
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
          Crypto Rates
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Wallet credit uses the executable Naira price of each coin, minus the provider fee, network cost, and safety buffer.
          Leave the executable rate blank to use the CoinGecko price. A deposit keeps the rate locked for it.
        </p>
      </div>

      {isLoading ? (
        <div className={`${panelClass} p-8 text-sm text-slate-500`}>Loading rates…</div>
      ) : isError ? (
        <div className={`${panelClass} p-8 text-sm text-rose-600`}>Could not load crypto funding rates.</div>
      ) : (
        <div className="grid gap-4">
          {(data?.rates ?? []).map((rate) => {
            const draft = drafts[rate.id] ?? draftFrom(rate);
            const setField = (field: keyof Draft, value: string) => {
              setDrafts((current) => ({
                ...current,
                [rate.id]: { ...(current[rate.id] ?? draftFrom(rate)), [field]: value },
              }));
            };
            return (
              <section key={rate.id} className={`${panelClass} p-5 md:p-6 space-y-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-900">{rate.label}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      CoinGecko reference {money(rate.reference_rate)}
                      {rate.rate_source === "admin_override" ? " · using your executable rate" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={labelClass}>Credit rate</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{money(rate.credit_rate)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Executable rate (₦ per 1 {rate.asset})</span>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      placeholder="Use CoinGecko"
                      disabled={!canEdit}
                      value={draft.executable_rate_override}
                      onChange={(event) => setField("executable_rate_override", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Provider fee</span>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      disabled={!canEdit}
                      value={draft.provider_fee_ngn}
                      onChange={(event) => setField("provider_fee_ngn", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Network cost</span>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      disabled={!canEdit}
                      value={draft.network_cost_ngn}
                      onChange={(event) => setField("network_cost_ngn", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Safety buffer</span>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      disabled={!canEdit}
                      value={draft.safety_buffer_ngn}
                      onChange={(event) => setField("safety_buffer_ngn", event.target.value)}
                    />
                  </label>
                </div>

                {canEdit ? (
                  <button
                    type="button"
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={saving && savingId === rate.id}
                    onClick={() => void save(rate)}
                  >
                    {saving && savingId === rate.id ? "Saving…" : "Save rate"}
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
