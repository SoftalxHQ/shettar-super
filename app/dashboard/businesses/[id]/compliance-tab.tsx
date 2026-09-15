"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  useRecordBusinessPartnerAgreementMutation,
  usePurgeBusinessPartnerAgreementSignedCopyMutation,
  type BusinessDetail,
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { normalizeApiMediaUrl } from "@/lib/media-url";
import { buildPartnerAgreementPreviewHtml } from "@/lib/partner-agreement-preview";

type ComplianceTabProps = {
  business: BusinessDetail;
  businessId: string;
};

type DocViewer = {
  title: string;
  previewUrl: string;
  /** Revoke blob URL when closing (filled HTML or streamed PDF). */
  revokeOnClose?: boolean;
} | null;

/** Served from shettar-super/public — not the Business portal host. */
const SYSTEM_DOCUMENTS = [
  {
    key: "partner_agreement_template",
    title: "Business Partner Agreement (blank)",
    path: "/legal/Shettar-Business-Partner-Agreement-v1.pdf",
  },
  {
    key: "system_requirements",
    title: "System Requirements",
    path: "/docs/Shettar-Business-System-Requirements.pdf",
  },
] as const;

export default function ComplianceTab({ business, businessId }: ComplianceTabProps) {
  const agreement = business.partner_agreement;
  const signed = agreement?.signed ?? business.partner_agreement_signed ?? false;

  const [fullName, setFullName] = useState(agreement?.signed_by_name ?? "");
  const [role, setRole] = useState(agreement?.signed_by_role ?? "");
  const [signedAt, setSignedAt] = useState(
    agreement?.signed_at ? agreement.signed_at.slice(0, 10) : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [viewer, setViewer] = useState<DocViewer>(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);

  const [recordAgreement, { isLoading: isRecording }] = useRecordBusinessPartnerAgreementMutation();
  const [purgeCopy, { isLoading: isPurging }] = usePurgeBusinessPartnerAgreementSignedCopyMutation();

  const signedCopyRemoteUrl = agreement?.signed_copy_url
    ? normalizeApiMediaUrl(agreement.signed_copy_url) || agreement.signed_copy_url
    : null;

  // Prefer authenticated API stream → blob URL for reliable in-modal PDF preview.
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadSignedCopy() {
      if (!signedCopyRemoteUrl) {
        setSignedPreviewUrl(null);
        return;
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
      const streamUrl = `${apiBase}/api/v1/admin/businesses/${encodeURIComponent(businessId)}/partner_agreement/signed_copy`;

      try {
        const res = await fetch(streamUrl, {
          credentials: "include",
          headers: { "X-Client-Platform": "web-super" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const pdfBlob =
          blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        setSignedPreviewUrl(objectUrl);
      } catch {
        if (cancelled) return;
        try {
          const res = await fetch(signedCopyRemoteUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setSignedPreviewUrl(objectUrl);
        } catch {
          if (!cancelled) setSignedPreviewUrl(null);
        }
      }
    }

    void loadSignedCopy();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [signedCopyRemoteUrl, businessId]);

  const openLocalDoc = (title: string, path: string) => {
    setViewerLoading(true);
    setViewer({ title, previewUrl: path });
  };

  const openFilledSignedAgreement = () => {
    if (!signed) {
      toast.error("This business has not signed the partner agreement yet");
      return;
    }
    const logoUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/shettar-logo.png`
        : "/shettar-logo.png";
    const html = buildPartnerAgreementPreviewHtml(
      {
        businessName: business.name,
        businessId: business.business_unique_id,
        address: business.address,
        effectiveDateLabel: agreement?.signed_at
          ? formatDate(agreement.signed_at)
          : formatDate(new Date().toISOString()),
        agreementId: business.business_unique_id,
        signed: true,
        signedByName: agreement?.signed_by_name,
        signedByRole: agreement?.signed_by_role,
        commissionRate: agreement?.commission_rate ?? business.commission_rate,
        maximumWithdrawalCommission: agreement?.maximum_withdrawal_commission,
        primaryContactName: agreement?.primary_contact_name,
        primaryContactTitle: agreement?.primary_contact_title,
        primaryContactEmail: agreement?.primary_contact_email,
        primaryContactPhone: agreement?.primary_contact_phone,
      },
      logoUrl
    );
    const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    setViewerLoading(true);
    setViewer({
      title: "Signed partner agreement",
      previewUrl: blobUrl,
      revokeOnClose: true,
    });
  };

  const openSignedCopy = () => {
    if (!signedPreviewUrl) {
      toast.error("Uploaded signed PDF is not available to preview yet");
      return;
    }
    setViewerLoading(true);
    setViewer({
      title: "Uploaded signed PDF (offline)",
      previewUrl: signedPreviewUrl,
    });
  };

  const closeViewer = () => {
    if (viewer?.revokeOnClose && viewer.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(viewer.previewUrl);
    }
    setViewer(null);
    setViewerLoading(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !role.trim()) {
      toast.error("Full name and role are required");
      return;
    }
    try {
      await recordAgreement({
        id: businessId,
        full_name: fullName.trim(),
        role: role.trim(),
        signed_at: signedAt || undefined,
        file,
      }).unwrap();
      toast.success("Partner agreement recorded");
      setFile(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { error?: string } }).data?.error || "Failed to record agreement")
          : "Failed to record agreement";
      toast.error(message);
    }
  };

  const handlePurge = async () => {
    if (!confirm("Remove the uploaded signed PDF? The agreement will stay marked as signed.")) return;
    try {
      await purgeCopy(businessId).unwrap();
      toast.success("Signed copy removed");
      if (viewer?.title === "Uploaded signed PDF (offline)") closeViewer();
    } catch {
      toast.error("Failed to remove signed copy");
    }
  };

  const sourceLabel =
    agreement?.source === "offline"
      ? "Offline / email"
      : agreement?.source === "portal"
        ? "Business portal"
        : signed
          ? "—"
          : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Partner agreement</h3>
            <p className="text-xs text-slate-500 mt-0.5">Status shown in the Business portal</p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              signed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {signed ? "Signed" : "Pending"}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Signer name</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{agreement?.signed_by_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{agreement?.signed_by_role || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Signed at</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {agreement?.signed_at ? formatDateTime(agreement.signed_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Source</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{sourceLabel || "—"}</dd>
          </div>
          {agreement?.recorded_by_admin_name && (
            <div className="col-span-2">
              <dt className="text-xs text-slate-500">Recorded by admin</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{agreement.recorded_by_admin_name}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-slate-500">Version</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{agreement?.version || "1.0"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
        <ul className="space-y-2">
          {SYSTEM_DOCUMENTS.map((doc) => (
            <li key={doc.key}>
              <button
                type="button"
                onClick={() => openLocalDoc(doc.title, doc.path)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left"
              >
                <span className="font-medium text-slate-800">{doc.title}</span>
                <span className="text-xs font-semibold text-indigo-600">View</span>
              </button>
            </li>
          ))}
          <li>
            {signed ? (
              <button
                type="button"
                onClick={openFilledSignedAgreement}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 px-3.5 py-2.5 text-sm hover:bg-emerald-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-slate-800">Signed partner agreement</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filled with {agreement?.signed_by_name || "signer"} ·{" "}
                    {agreement?.signed_at ? formatDate(agreement.signed_at) : "—"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">View</span>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-3.5 py-2.5">
                <p className="text-sm font-medium text-slate-800">Signed partner agreement</p>
                <p className="text-xs text-slate-500 mt-0.5">Available after the business signs (portal or offline)</p>
              </div>
            )}
          </li>
          <li>
            {signedCopyRemoteUrl ? (
              <div className="rounded-xl border border-slate-200 px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Uploaded signed PDF (offline)</p>
                    <p className="text-xs text-slate-500">{agreement?.signed_copy_filename || "PDF"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openSignedCopy}
                    disabled={!signedPreviewUrl}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    View
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {isPurging ? "Removing…" : "Remove uploaded PDF"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-3.5 py-2.5">
                <p className="text-sm font-medium text-slate-800">Uploaded signed PDF (offline)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optional scan of a paper/email PDF — upload below if you have one
                </p>
              </div>
            )}
          </li>
        </ul>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          {signed ? "Update offline signature / upload" : "Record offline / email-signed agreement"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Use when the partner signed a paper or emailed PDF. Name and role update the same fields the
          Business portal displays. The uploaded PDF stays admin-only and can be viewed in the documents panel.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-600">Signer full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="As written on the signed copy"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-600">Role / title</span>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="e.g. Owner, General Manager"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-600">Signed date (optional)</span>
            <input
              type="date"
              value={signedAt}
              onChange={(e) => setSignedAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-600">Signed PDF (optional)</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isRecording}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isRecording ? "Saving…" : signed ? "Update signature" : "Record agreement"}
            </button>
          </div>
        </form>
      </div>

      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeViewer}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{viewer.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{business.name}</p>
              </div>
              <button
                type="button"
                onClick={closeViewer}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                aria-label="Close document viewer"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative flex-1 min-h-[70vh] bg-slate-100">
              {viewerLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading document…</p>
                  </div>
                </div>
              )}
              <iframe
                title={viewer.title}
                src={viewer.previewUrl}
                className="w-full h-full min-h-[70vh] border-0"
                onLoad={() => setViewerLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
