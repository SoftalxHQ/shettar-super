"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { NewsletterEditor } from "@/components/newsletter-editor";
import { EmailPreview } from "@/components/email-preview";
import {
  useCreateNewsletterMutation,
  useGetNewsletterQuery,
  useResendNewsletterMutation,
  useSendNewsletterMutation,
  useTestNewsletterMutation,
  useUpdateNewsletterMutation,
  useUploadNewsletterAssetMutation,
  useDeleteNewsletterAssetMutation,
} from "@/lib/store/services/api";

const CUSTOMER_SEGMENTS = [
  { value: "verified", label: "Verified customers" },
  { value: "unverified", label: "Unverified customers" },
  { value: "has_booking", label: "Customers with bookings" },
  { value: "suspended", label: "Suspended customers" },
] as const;

const BUSINESS_SEGMENTS = [
  { value: "all", label: "All active businesses" },
  { value: "verified", label: "Verified businesses" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "suspended", label: "Suspended businesses" },
] as const;

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-700",
  sending: "bg-sky-50 text-sky-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-600",
};

function chipClass(active: boolean) {
  return `px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60 ${
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 bg-slate-100/80"
  }`;
}

function mutationErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string; errors?: string[] } };
  if (e?.data?.error) return e.data.error;
  if (e?.data?.errors?.length) return e.data.errors.join(", ");
  return fallback;
}

export default function NewsletterComposerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const { admin } = useAuth();
  const canView = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.view === true;
  const canCreate = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.create === true;
  const canSend = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.send === true;

  const { data: existingDraft, refetch: refetchNewsletter } = useGetNewsletterQuery(draftId as string, { skip: !draftId });

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlBody, setHtmlBody] = useState("<p></p>");
  const [audience, setAudience] = useState<"customers" | "businesses">("customers");
  const [targetType, setTargetType] = useState<"all" | "segment">("all");
  const [segment, setSegment] = useState("verified");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [includeHeader, setIncludeHeader] = useState(false);
  const [newsletterId, setNewsletterId] = useState<number | null>(draftId ? Number(draftId) : null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<"send" | "resend">("send");
  const [pendingEstimate, setPendingEstimate] = useState<number | null>(null);

  const [createNewsletter, { isLoading: creating }] = useCreateNewsletterMutation();
  const [updateNewsletter, { isLoading: updating }] = useUpdateNewsletterMutation();
  const [sendNewsletter, { isLoading: sending }] = useSendNewsletterMutation();
  const [resendNewsletter, { isLoading: resending }] = useResendNewsletterMutation();
  const [testNewsletter, { isLoading: testing }] = useTestNewsletterMutation();
  const [uploadAsset] = useUploadNewsletterAssetMutation();
  const [deleteAsset] = useDeleteNewsletterAssetMutation();

  const newsletterStatus = existingDraft?.newsletter?.status;
  const isEditable = !newsletterStatus || newsletterStatus === "draft" || newsletterStatus === "sent" || newsletterStatus === "failed";
  const isResendable = newsletterStatus === "sent" || newsletterStatus === "failed";
  const isInProgress = newsletterStatus === "queued" || newsletterStatus === "sending";
  const isDraft = !newsletterStatus || newsletterStatus === "draft";

  const hydratedDraftIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draftId) {
      hydratedDraftIdRef.current = null;
      return;
    }
    if (!existingDraft?.newsletter) return;
    if (hydratedDraftIdRef.current === draftId) return;

    hydratedDraftIdRef.current = draftId;
    const n = existingDraft.newsletter;
    setSubject(n.subject);
    setPreviewText(n.preview_text || "");
    setHtmlBody(n.html_body || "<p></p>");
    setAudience(n.audience);
    setTargetType(n.target_type === "segment" ? "segment" : "all");
    if (n.target_type === "segment" && n.target_value) setSegment(n.target_value);
    setCtaUrl((n.metadata?.cta_url as string) || n.cta_url || "");
    setCtaLabel((n.metadata?.cta_label as string) || n.cta_label || "");
    setIncludeHeader(n.include_header === true || n.metadata?.include_header === true);
    setNewsletterId(n.id);
  }, [draftId, existingDraft?.newsletter]);

  const segments = audience === "customers" ? CUSTOMER_SEGMENTS : BUSINESS_SEGMENTS;

  const payload = useMemo(
    () => ({
      subject: subject.trim(),
      preview_text: previewText.trim() || undefined,
      html_body: htmlBody,
      audience,
      target_type: targetType,
      target_value: targetType === "segment" ? segment : undefined,
      include_header: includeHeader,
      metadata: {
        ...(ctaUrl.trim() ? { cta_url: ctaUrl.trim() } : {}),
        ...(ctaLabel.trim() ? { cta_label: ctaLabel.trim() } : {}),
        include_header: includeHeader,
      },
    }),
    [subject, previewText, htmlBody, audience, targetType, segment, ctaUrl, ctaLabel, includeHeader]
  );

  const recipientEstimate = existingDraft?.newsletter?.recipient_estimate;
  const draftReady = !draftId || Boolean(existingDraft?.newsletter);
  const editorKey = draftId ?? "new";
  const editorInitialContent = existingDraft?.newsletter?.html_body ?? "<p></p>";

  const saveDraft = async ({ notify = true }: { notify?: boolean } = {}) => {
    if (!canCreate) {
      toast.error("You do not have permission to save newsletters");
      return null;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return null;
    }

    try {
      if (newsletterId) {
        const result = await updateNewsletter({ id: newsletterId, newsletter: payload }).unwrap();
        if (notify) toast.success(isDraft ? "Draft saved" : "Changes saved");
        return result.newsletter.id;
      }
      const result = await createNewsletter(payload).unwrap();
      setNewsletterId(result.newsletter.id);
      router.replace(`/dashboard/notifications/newsletter?id=${result.newsletter.id}`);
      if (notify) toast.success("Draft created");
      return result.newsletter.id;
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to save"));
      return null;
    }
  };

  const persistCurrentDraft = async () => {
    if (canCreate) return saveDraft({ notify: false });
    return newsletterId;
  };

  const handleTestSend = async () => {
    if (!canSend) {
      toast.error("You do not have permission to send test emails");
      return;
    }
    const id = await persistCurrentDraft();
    if (!id) return;

    try {
      const result = await testNewsletter(id).unwrap();
      toast.success(result.message);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to send test email"));
    }
  };

  const openSendModal = async (mode: "send" | "resend") => {
    if (!canSend) {
      toast.error("You do not have permission to send campaigns");
      return;
    }
    if (!htmlBody || htmlBody === "<p></p>") {
      toast.error("Email body is required");
      return;
    }

    const id = await persistCurrentDraft();
    if (!id) return;

    const refreshed = await refetchNewsletter();
    const estimate = refreshed.data?.newsletter?.recipient_estimate ?? recipientEstimate ?? null;
    setPendingEstimate(typeof estimate === "number" ? estimate : null);
    setSendModalMode(mode);
    setSendModalOpen(true);
  };

  const handleConfirmSend = async () => {
    const id = await persistCurrentDraft();
    if (!id) return;

    try {
      if (sendModalMode === "resend") {
        const result = await resendNewsletter(id).unwrap();
        toast.success(result.message);
      } else {
        const result = await sendNewsletter(id).unwrap();
        toast.success(result.message);
      }
      setSendModalOpen(false);
      router.push("/dashboard/notifications/newsletter/history");
    } catch (err) {
      toast.error(mutationErrorMessage(err, sendModalMode === "resend" ? "Failed to resend campaign" : "Failed to queue campaign"));
    }
  };

  const handleUploadImage = useCallback(
    async (file: File) => {
      const result = await uploadAsset(file).unwrap();
      return { url: result.url, assetId: result.asset_id };
    },
    [uploadAsset]
  );

  const handleDeleteImageAsset = useCallback(
    async (assetId: string) => {
      try {
        await deleteAsset(assetId).unwrap();
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 404) return;
        console.error("Failed to delete newsletter image", err);
        toast.error("Failed to delete image from the server");
      }
    },
    [deleteAsset]
  );

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

  const saving = creating || updating;
  const queueing = sending || resending;
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-colors text-sm disabled:opacity-60";

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Email Newsletters
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Compose rich HTML email campaigns for customer segments or business owners.
          </p>
          {newsletterStatus && newsletterStatus !== "draft" && (
            <span
              className={`inline-flex mt-3 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                STATUS_STYLES[newsletterStatus] || "bg-slate-100 text-slate-700"
              }`}
            >
              {newsletterStatus}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/notifications/newsletter/history"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View history →
        </Link>
      </div>

      {isInProgress && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          This newsletter is currently {newsletterStatus}. Editing is disabled until delivery completes.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className={`${panelClass} p-6 space-y-5`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!isEditable}
                className={inputClass}
                placeholder="Email subject"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Preview text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                disabled={!isEditable}
                className={inputClass}
                placeholder="Inbox preheader (optional)"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Audience</label>
            <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1">
              {(
                [
                  { value: "customers", label: "Customers" },
                  { value: "businesses", label: "Business owners" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={!isEditable}
                  onClick={() => {
                    setAudience(value);
                    setTargetType("all");
                    setSegment(value === "customers" ? "verified" : "all");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                    audience === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Targeting</label>
            <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1">
              {(
                [
                  { value: "all", label: audience === "customers" ? "All customers" : "All businesses" },
                  { value: "segment", label: "Segment" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={!isEditable}
                  onClick={() => setTargetType(value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                    targetType === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {targetType === "segment" && (
            <div className="flex flex-wrap gap-1.5">
              {segments.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={!isEditable}
                  onClick={() => setSegment(s.value)}
                  className={chipClass(segment === s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Button URL (optional)</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={!isEditable}
                className={inputClass}
                placeholder="https://shettar.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Button label</label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                disabled={!isEditable}
                className={inputClass}
                placeholder="Learn more"
              />
            </div>
          </div>

          <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isEditable ? "border-slate-200 bg-slate-50/80" : "border-slate-100 bg-slate-50 opacity-60"}`}>
            <input
              type="checkbox"
              checked={includeHeader}
              onChange={(e) => setIncludeHeader(e.target.checked)}
              disabled={!isEditable}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">Include Shettar header</span>
              <span className="block text-xs text-slate-500 mt-0.5">Adds the purple Shettar logo band at the top of the email. Off by default.</span>
            </span>
          </label>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Email body</label>
            {draftReady ? (
              <NewsletterEditor
                editorKey={editorKey}
                initialContent={editorInitialContent}
                onChange={setHtmlBody}
                onUploadImage={handleUploadImage}
                onDeleteImageAsset={handleDeleteImageAsset}
                disabled={!canCreate || !isEditable}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 px-5 py-8 text-sm text-slate-500">
                Loading draft…
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {canCreate && isEditable && (
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : isDraft ? "Save draft" : "Save changes"}
              </button>
            )}
            {canSend && isEditable && (
              <button
                type="button"
                onClick={() => void handleTestSend()}
                disabled={testing || saving}
                className="px-5 py-2.5 rounded-xl font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                {testing ? "Sending…" : "Send test to me"}
              </button>
            )}
            {canSend && isDraft && isEditable && (
              <button
                type="button"
                onClick={() => void openSendModal("send")}
                disabled={queueing || saving}
                className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {sending ? "Queueing…" : "Send campaign"}
              </button>
            )}
            {canSend && isResendable && isEditable && (
              <button
                type="button"
                onClick={() => void openSendModal("resend")}
                disabled={queueing || saving}
                className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {resending ? "Queueing…" : "Resend campaign"}
              </button>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-8 h-fit">
          <EmailPreview
            subject={subject}
            previewText={previewText}
            htmlBody={htmlBody}
            ctaUrl={ctaUrl}
            ctaLabel={ctaLabel}
            includeHeader={includeHeader}
          />
          {typeof recipientEstimate === "number" && (
            <p className="text-xs text-slate-500 mt-3 text-center">
              Estimated recipients: {recipientEstimate.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    {sendModalMode === "resend" ? "Resend campaign" : "Send campaign"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {sendModalMode === "resend"
                      ? "A new delivery will be queued using the current content and audience."
                      : "This will queue the newsletter for delivery."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  disabled={queueing}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5 space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">{subject || "(No subject)"}</p>
                <p className="text-sm text-slate-500">
                  {sendModalMode === "resend" ? "Resend to" : "Send to"} approximately{" "}
                  <span className="font-semibold text-slate-900">
                    {pendingEstimate !== null ? pendingEstimate.toLocaleString() : "an unknown number of"}
                  </span>{" "}
                  recipients.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  disabled={queueing}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmSend()}
                  disabled={queueing}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {queueing ? "Queueing…" : sendModalMode === "resend" ? "Resend" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
