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
      metadata: {
        ...(ctaUrl.trim() ? { cta_url: ctaUrl.trim() } : {}),
        ...(ctaLabel.trim() ? { cta_label: ctaLabel.trim() } : {}),
      },
    }),
    [subject, previewText, htmlBody, audience, targetType, segment, ctaUrl, ctaLabel]
  );

  const recipientEstimate = existingDraft?.newsletter?.recipient_estimate;
  const draftReady = !draftId || Boolean(existingDraft?.newsletter);
  const editorKey = draftId ?? "new";
  const editorInitialContent = existingDraft?.newsletter?.html_body ?? "<p></p>";

  const saveDraft = async () => {
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
        toast.success(isDraft ? "Draft saved" : "Changes saved");
        return result.newsletter.id;
      }
      const result = await createNewsletter(payload).unwrap();
      setNewsletterId(result.newsletter.id);
      router.replace(`/dashboard/notifications/newsletter?id=${result.newsletter.id}`);
      toast.success("Draft created");
      return result.newsletter.id;
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to save"));
      return null;
    }
  };

  const handleTestSend = async () => {
    if (!canSend) {
      toast.error("You do not have permission to send test emails");
      return;
    }
    const id = newsletterId || (await saveDraft());
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

    const id = newsletterId || (await saveDraft());
    if (!id) return;

    const refreshed = await refetchNewsletter();
    const estimate = refreshed.data?.newsletter?.recipient_estimate ?? recipientEstimate ?? null;
    setPendingEstimate(typeof estimate === "number" ? estimate : null);
    setSendModalMode(mode);
    setSendModalOpen(true);
  };

  const handleConfirmSend = async () => {
    const id = newsletterId;
    if (!id) return;

    try {
      if (sendModalMode === "resend") {
        await saveDraft();
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
      return result.url;
    },
    [uploadAsset]
  );

  if (!canView) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Access denied</p>
          <p className="text-sm text-muted-foreground mt-2">You need the &quot;View Newsletters&quot; permission.</p>
          <Link href="/dashboard" className="text-sm text-primary mt-4 inline-block">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const saving = creating || updating;
  const queueing = sending || resending;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Newsletters</h1>
          <p className="text-muted-foreground mt-2">
            Compose rich HTML email campaigns for customer segments or business owners.
          </p>
          {newsletterStatus && newsletterStatus !== "draft" && (
            <span className="inline-flex mt-3 px-3 py-1 rounded-lg text-xs font-bold capitalize bg-slate-100 dark:bg-zinc-800">
              Status: {newsletterStatus}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/notifications/newsletter/history"
          className="text-sm font-semibold text-primary hover:underline"
        >
          View history →
        </Link>
      </div>

      {isInProgress && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-5 py-4 text-sm text-amber-900 dark:text-amber-100">
          This newsletter is currently {newsletterStatus}. Editing is disabled until delivery completes.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="glass rounded-3xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!isEditable}
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 text-sm disabled:opacity-60"
                placeholder="Email subject"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Preview text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                disabled={!isEditable}
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 text-sm disabled:opacity-60"
                placeholder="Inbox preheader (optional)"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Audience</label>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                    audience === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Targeting</label>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                    targetType === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {targetType === "segment" && (
            <div className="flex flex-wrap gap-2">
              {segments.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={!isEditable}
                  onClick={() => setSegment(s.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 ${
                    segment === s.value
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-slate-100 dark:bg-zinc-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Button URL (optional)</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={!isEditable}
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 text-sm disabled:opacity-60"
                placeholder="https://shettar.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Button label</label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                disabled={!isEditable}
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 text-sm disabled:opacity-60"
                placeholder="Learn more"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email body</label>
            {draftReady ? (
              <NewsletterEditor
                editorKey={editorKey}
                initialContent={editorInitialContent}
                onChange={setHtmlBody}
                onUploadImage={handleUploadImage}
                disabled={!canCreate || !isEditable}
              />
            ) : (
              <div className="rounded-2xl border border-border/50 px-5 py-8 text-sm text-muted-foreground">
                Loading draft…
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {canCreate && isEditable && (
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="px-6 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : isDraft ? "Save draft" : "Save changes"}
              </button>
            )}
            {canSend && isEditable && (
              <button
                type="button"
                onClick={() => void handleTestSend()}
                disabled={testing || saving}
                className="px-6 py-3 rounded-2xl font-bold border border-primary text-primary hover:bg-primary/5 disabled:opacity-50"
              >
                {testing ? "Sending…" : "Send test to me"}
              </button>
            )}
            {canSend && isDraft && isEditable && (
              <button
                type="button"
                onClick={() => void openSendModal("send")}
                disabled={queueing || saving}
                className="px-6 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "Queueing…" : "Send campaign"}
              </button>
            )}
            {canSend && isResendable && isEditable && (
              <button
                type="button"
                onClick={() => void openSendModal("resend")}
                disabled={queueing || saving}
                className="px-6 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
          />
          {typeof recipientEstimate === "number" && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Estimated recipients: {recipientEstimate.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    {sendModalMode === "resend" ? "Resend campaign" : "Send campaign"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sendModalMode === "resend"
                      ? "A new delivery will be queued using the current content and audience."
                      : "This will queue the newsletter for delivery."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  disabled={queueing}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-border/50 px-5 py-4 space-y-2">
                <p className="text-sm font-semibold">{subject || "(No subject)"}</p>
                <p className="text-sm text-muted-foreground">
                  {sendModalMode === "resend" ? "Resend to" : "Send to"} approximately{" "}
                  <span className="font-bold text-foreground">
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
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmSend()}
                  disabled={queueing}
                  className="flex-1 px-5 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
