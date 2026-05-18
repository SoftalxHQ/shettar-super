"use client";

export type CommissionTier = {
  min_rooms: number;
  max_rooms: number | null;
  amount: number;
};

export const DEFAULT_MARKETER_TIERS: CommissionTier[] = [
  { min_rooms: 0, max_rooms: 10, amount: 20_000 },
  { min_rooms: 11, max_rooms: 20, amount: 40_000 },
  { min_rooms: 21, max_rooms: 49, amount: 40_000 },
  { min_rooms: 50, max_rooms: null, amount: 60_000 },
];

export function tierLabel(tier: CommissionTier): string {
  if (tier.max_rooms == null) return `${tier.min_rooms}+ rooms`;
  if (tier.min_rooms === tier.max_rooms) return `${tier.min_rooms} rooms`;
  return `${tier.min_rooms}–${tier.max_rooms} rooms`;
}

type Props = {
  tiers: CommissionTier[];
  onChange: (tiers: CommissionTier[]) => void;
  readOnly?: boolean;
};

export function MarketerCommissionTiersEditor({ tiers, onChange, readOnly }: Props) {
  const updateTier = (index: number, field: keyof CommissionTier, raw: string) => {
    if (readOnly) return;
    const next = tiers.map((t, i) => {
      if (i !== index) return t;
      if (field === "max_rooms") {
        const trimmed = raw.trim();
        return { ...t, max_rooms: trimmed === "" ? null : parseInt(trimmed, 10) || 0 };
      }
      if (field === "min_rooms") {
        return { ...t, min_rooms: parseInt(raw, 10) || 0 };
      }
      return { ...t, amount: parseFloat(raw) || 0 };
    });
    onChange(next);
  };

  const addTier = () => {
    if (readOnly) return;
    const last = tiers[tiers.length - 1];
    const nextMin = last?.max_rooms != null ? last.max_rooms + 1 : (last?.min_rooms ?? 0) + 10;
    onChange([...tiers, { min_rooms: nextMin, max_rooms: null, amount: 0 }]);
  };

  const removeTier = (index: number) => {
    if (readOnly || tiers.length <= 1) return;
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {tiers.map((tier, index) => (
        <div
          key={index}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl"
        >
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Min rooms</label>
            <input
              type="number"
              min={0}
              value={tier.min_rooms}
              readOnly={readOnly}
              onChange={(e) => updateTier(index, "min_rooms", e.target.value)}
              className="input read-only:opacity-70"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Max rooms</label>
            <input
              type="number"
              min={0}
              value={tier.max_rooms ?? ""}
              placeholder="No limit"
              readOnly={readOnly}
              onChange={(e) => updateTier(index, "max_rooms", e.target.value)}
              className="input read-only:opacity-70"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Commission (₦)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={tier.amount}
              readOnly={readOnly}
              onChange={(e) => updateTier(index, "amount", e.target.value)}
              className="input read-only:opacity-70"
            />
          </div>
          {!readOnly && tiers.length > 1 && (
            <button
              type="button"
              onClick={() => removeTier(index)}
              className="px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={addTier}
          className="text-sm font-bold text-primary hover:underline"
        >
          + Add tier
        </button>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {tiers.map((tier, i) => (
          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-semibold">
            {tierLabel(tier)} → ₦{tier.amount.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}
