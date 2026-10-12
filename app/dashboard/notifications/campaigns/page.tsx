"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { NewsletterEditor } from "@/components/newsletter-editor";
import { EmailPreview } from "@/components/email-preview";
import {
  useCreateNewsletterMutation,
  useCreatePromotionalScrapeMutation,
  useDeleteNewsletterAssetMutation,
  useGetNewsletterQuery,
  useGetPromotionalContactsQuery,
  useGetPromotionalScrapeQuery,
  useResendNewsletterMutation,
  useSavePromotionalScrapeMutation,
  useSendNewsletterMutation,
  useStopPromotionalScrapeMutation,
  useTestNewsletterMutation,
  useUpdateNewsletterMutation,
  useUploadNewsletterAssetMutation,
} from "@/lib/store/services/api";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-700",
  sending: "bg-sky-50 text-sky-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-600",
};

function mutationErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string; errors?: string[] } };
  if (e?.data?.error) return e.data.error;
  if (e?.data?.errors?.length) return e.data.errors.join(", ");
  return fallback;
}

function formatCountdown(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function EmailCampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const { admin } = useAuth();
  const canView = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.view === true;
  const canCreate = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.create === true;
  const canSend = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.send === true;

  const { data: contactMeta } = useGetPromotionalContactsQuery({ page: 1, status: "active" }, { skip: !canView });
  const { data: existingDraft, refetch: refetchNewsletter } = useGetNewsletterQuery(draftId as string, { skip: !draftId });

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlBody, setHtmlBody] = useState("<p></p>");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [includeHeader, setIncludeHeader] = useState(false);
  const [newsletterId, setNewsletterId] = useState<number | null>(draftId ? Number(draftId) : null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<"send" | "resend">("send");
  const [pendingEstimate, setPendingEstimate] = useState<number | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testMode, setTestMode] = useState<"self" | "custom">("self");
  const [testEmail, setTestEmail] = useState("");

  const [lineOfBusiness, setLineOfBusiness] = useState("");
  const [country, setCountry] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [durationMenuOpen, setDurationMenuOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("60");
  const MAX_CUSTOM_MINUTES = 12 * 60;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const selectedRunRef = useRef<number | null>(null);
  const durationMenuRef = useRef<HTMLDivElement | null>(null);

  const [createNewsletter, { isLoading: creating }] = useCreateNewsletterMutation();
  const [updateNewsletter, { isLoading: updating }] = useUpdateNewsletterMutation();
  const [sendNewsletter, { isLoading: sending }] = useSendNewsletterMutation();
  const [resendNewsletter, { isLoading: resending }] = useResendNewsletterMutation();
  const [testNewsletter, { isLoading: testing }] = useTestNewsletterMutation();
  const [uploadAsset] = useUploadNewsletterAssetMutation();
  const [deleteAsset] = useDeleteNewsletterAssetMutation();
  const [createScrape, { isLoading: startingSearch }] = useCreatePromotionalScrapeMutation();
  const [stopScrape, { isLoading: stoppingSearch }] = useStopPromotionalScrapeMutation();
  const [saveScrape, { isLoading: savingFound }] = useSavePromotionalScrapeMutation();
  const [pollSearch, setPollSearch] = useState(false);

  const { data: scrapeData } = useGetPromotionalScrapeQuery(runId as number, {
    skip: runId == null,
    pollingInterval: pollSearch ? 2000 : 0,
  });
  const scrape = scrapeData?.scrape;

  const loaded = existingDraft?.newsletter;
  const loadedMatches = Boolean(draftId && loaded && String(loaded.id) === draftId && loaded.audience === "promotional");
  const newsletterStatus = loadedMatches ? loaded?.status : undefined;
  const isEditable = !draftId || (loadedMatches && (newsletterStatus === "draft" || newsletterStatus === "sent" || newsletterStatus === "failed"));
  const isResendable = loadedMatches && (newsletterStatus === "sent" || newsletterStatus === "failed");
  const isInProgress = loadedMatches && (newsletterStatus === "queued" || newsletterStatus === "sending");
  const isDraft = !draftId || newsletterStatus === "draft";
  const hydratedDraftIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draftId) {
      hydratedDraftIdRef.current = null;
      setSubject("");
      setPreviewText("");
      setHtmlBody("<p></p>");
      setCtaUrl("");
      setCtaLabel("");
      setIncludeHeader(false);
      setNewsletterId(null);
      return;
    }
    if (!loaded || String(loaded.id) !== draftId) return;
    if (loaded.audience !== "promotional") {
      toast.error("That email is not a promotional campaign");
      router.replace("/dashboard/notifications/campaigns");
      return;
    }
    if (hydratedDraftIdRef.current === draftId) return;

    hydratedDraftIdRef.current = draftId;
    setSubject(loaded.subject);
    setPreviewText(loaded.preview_text || "");
    setHtmlBody(loaded.html_body || "<p></p>");
    setCtaUrl((loaded.metadata?.cta_url as string) || loaded.cta_url || "");
    setCtaLabel((loaded.metadata?.cta_label as string) || loaded.cta_label || "");
    setIncludeHeader(loaded.include_header === true || loaded.metadata?.include_header === true);
    setNewsletterId(loaded.id);
  }, [draftId, loaded, router]);

  useEffect(() => {
    if (!scrape) return;
    setPollSearch(scrape.status === "queued" || scrape.status === "running");
    if (scrape.status !== "completed" && scrape.status !== "stopped") return;
    if (selectedRunRef.current === scrape.id) return;
    selectedRunRef.current = scrape.id;
    setSelectedEmails((scrape.results || []).filter((result) => result.valid).map((result) => result.email));
  }, [scrape]);

  useEffect(() => {
    if (!durationMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!durationMenuRef.current?.contains(event.target as Node)) {
        setDurationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [durationMenuOpen]);

  useEffect(() => {
    if (!pollSearch) return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pollSearch]);

  const payload = useMemo(
    () => ({
      subject: subject.trim(),
      preview_text: previewText.trim() || undefined,
      html_body: htmlBody,
      audience: "promotional" as const,
      target_type: "all" as const,
      include_header: includeHeader,
      metadata: {
        ...(ctaUrl.trim() ? { cta_url: ctaUrl.trim() } : {}),
        ...(ctaLabel.trim() ? { cta_label: ctaLabel.trim() } : {}),
        include_header: includeHeader,
      },
    }),
    [subject, previewText, htmlBody, ctaUrl, ctaLabel, includeHeader]
  );

  const savedCount = contactMeta?.active_count ?? 0;
  const draftReady = !draftId || loadedMatches;
  const editorKey = draftId ?? "new";
  const editorInitialContent = loadedMatches ? loaded?.html_body || "<p></p>" : "<p></p>";

  const saveDraft = async ({ notify = true }: { notify?: boolean } = {}) => {
    if (!canCreate) {
      toast.error("You do not have permission to save campaigns");
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
        return result.newsletter;
      }
      const result = await createNewsletter(payload).unwrap();
      setNewsletterId(result.newsletter.id);
      hydratedDraftIdRef.current = String(result.newsletter.id);
      router.replace(`/dashboard/notifications/campaigns?id=${result.newsletter.id}`);
      if (notify) toast.success("Draft created");
      return result.newsletter;
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to save"));
      return null;
    }
  };

  const persistCurrentDraft = async () => {
    if (canCreate) return saveDraft({ notify: false });
    return loadedMatches ? loaded ?? null : null;
  };

  const openTestModal = () => {
    if (!canSend) {
      toast.error("You do not have permission to send test emails");
      return;
    }
    setTestMode("self");
    setTestEmail("");
    setTestModalOpen(true);
  };

  const handleTestSend = async () => {
    if (!canSend) {
      toast.error("You do not have permission to send test emails");
      return;
    }
    const recipient = testMode === "self" ? undefined : testEmail.trim();
    if (testMode === "custom") {
      if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        toast.error("Enter a valid email address");
        return;
      }
    }

    const newsletter = await persistCurrentDraft();
    if (!newsletter) return;

    try {
      const result = await testNewsletter({
        id: newsletter.id,
        ...(recipient ? { email: recipient } : {}),
      }).unwrap();
      setTestModalOpen(false);
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

    const newsletter = await persistCurrentDraft();
    if (!newsletter) return;

    const refreshed = await refetchNewsletter();
    const estimate = refreshed.data?.newsletter?.recipient_estimate ?? newsletter.recipient_estimate;
    setPendingEstimate(typeof estimate === "number" ? estimate : savedCount);
    setSendModalMode(mode);
    setSendModalOpen(true);
  };

  const handleConfirmSend = async () => {
    const newsletter = await persistCurrentDraft();
    if (!newsletter) return;

    try {
      if (sendModalMode === "resend") {
        const result = await resendNewsletter(newsletter.id).unwrap();
        toast.success(result.message);
      } else {
        const result = await sendNewsletter(newsletter.id).unwrap();
        toast.success(result.message);
      }
      setSendModalOpen(false);
      router.push("/dashboard/notifications/campaigns/history");
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
        console.error("Failed to delete campaign image", err);
        toast.error("Failed to delete image from the server");
      }
    },
    [deleteAsset]
  );

  const startSearch = async (timeLimitSeconds: number) => {
    if (!lineOfBusiness.trim() || !country.trim()) {
      toast.error("Enter a line of business and country");
      return;
    }
    try {
      const result = await createScrape({
        line_of_business: lineOfBusiness.trim(),
        country: country.trim(),
        state: stateName.trim() || undefined,
        city: city.trim() || undefined,
        time_limit_seconds: timeLimitSeconds,
      }).unwrap();
      setDurationMenuOpen(false);
      setPollSearch(true);
      selectedRunRef.current = null;
      setSelectedEmails([]);
      setRunId(result.scrape.id);
      toast.success("Search started");
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to start search"));
    }
  };

  const handleCustomSearch = (event: FormEvent) => {
    event.preventDefault();
    const minutes = Number(customMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CUSTOM_MINUTES) {
      toast.error(`Enter a duration between 1 and ${MAX_CUSTOM_MINUTES} minutes (up to 12 hours)`);
      return;
    }
    void startSearch(minutes * 60);
  };

  const handleStopSearch = async () => {
    if (!runId) return;
    try {
      await stopScrape(runId).unwrap();
      setPollSearch(true);
      toast.success("Stopping search…");
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to stop search"));
    }
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails((current) => current.includes(email) ? current.filter((item) => item !== email) : [ ...current, email ]);
  };

  const handleSaveFound = async () => {
    if (!runId || selectedEmails.length === 0) return;
    try {
      const result = await saveScrape({ id: runId, emails: selectedEmails }).unwrap();
      toast.success(`Saved ${result.saved.toLocaleString()}. ${result.skipped.toLocaleString()} already on the list.`);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to save addresses"));
    }
  };

  const searching = startingSearch || scrape?.status === "queued" || scrape?.status === "running";
  const stopRequested = Boolean(scrape?.stop_requested_at);
  const canSaveFound = scrape?.status === "completed" || scrape?.status === "stopped";
  const showResults =
    scrape != null &&
    (scrape.status === "queued" ||
      scrape.status === "running" ||
      scrape.status === "completed" ||
      scrape.status === "stopped");
  const remainingSeconds = useMemo(() => {
    if (!scrape?.started_at || !scrape.time_limit_seconds) return null;
    const endsAt = new Date(scrape.started_at).getTime() + scrape.time_limit_seconds * 1000;
    return Math.max(0, Math.ceil((endsAt - nowMs) / 1000));
  }, [scrape?.started_at, scrape?.time_limit_seconds, nowMs]);

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
  const validResults = (scrape?.results || []).filter((result) => result.valid);
  const invalidResults = (scrape?.results || []).filter((result) => !result.valid);

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Email Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Find business emails for a place and line of work, then send one promotional email to every active address.
          </p>
          {newsletterStatus && newsletterStatus !== "draft" && (
            <span className={`inline-flex mt-3 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${STATUS_STYLES[newsletterStatus] || "bg-slate-100 text-slate-700"}`}>
              {newsletterStatus}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/notifications/campaigns/addresses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Email list
          </Link>
          <Link href="/dashboard/notifications/campaigns/history" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Campaign history
          </Link>
        </div>
      </div>

      <section className={`${panelClass} p-6 space-y-5`}>
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">Find emails</h2>
          <p className="text-sm text-slate-500 mt-1">
            Separate keywords with commas. Each keyword is searched on its own. Choose how long the search can run; addresses appear as they are validated.
          </p>
        </div>
        {canCreate && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <input value={lineOfBusiness} onChange={(event) => setLineOfBusiness(event.target.value)} className={inputClass} placeholder="Keywords, separated by commas" disabled={searching} />
            <input value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass} placeholder="Country" disabled={searching} />
            <input value={stateName} onChange={(event) => setStateName(event.target.value)} className={inputClass} placeholder="State (optional)" disabled={searching} />
            <input value={city} onChange={(event) => setCity(event.target.value)} className={inputClass} placeholder="City (optional)" disabled={searching} />
            {searching ? (
              <button
                type="button"
                onClick={() => void handleStopSearch()}
                disabled={stoppingSearch || stopRequested}
                className="px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {stopRequested || stoppingSearch ? "Stopping…" : "Stop"}
              </button>
            ) : (
              <div className="relative" ref={durationMenuRef}>
                <button
                  type="button"
                  onClick={() => setDurationMenuOpen((open) => !open)}
                  disabled={startingSearch}
                  className="w-full px-4 py-2.5 rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Find emails
                </button>
                {durationMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-full min-w-[16rem] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {[
                      { label: "5 min", seconds: 5 * 60 },
                      { label: "10 min", seconds: 10 * 60 },
                      { label: "30 min", seconds: 30 * 60 },
                      { label: "1 hour", seconds: 60 * 60 },
                      { label: "8 hours (overnight)", seconds: 8 * 60 * 60 },
                    ].map((option) => (
                      <button
                        key={option.seconds}
                        type="button"
                        onClick={() => void startSearch(option.seconds)}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                      >
                        {option.label}
                      </button>
                    ))}
                    <form onSubmit={handleCustomSearch} className="mt-1 flex gap-2 border-t border-slate-100 pt-2">
                      <input
                        type="number"
                        min={1}
                        max={MAX_CUSTOM_MINUTES}
                        value={customMinutes}
                        onChange={(event) => setCustomMinutes(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        placeholder="Minutes (max 720)"
                        aria-label="Custom minutes"
                      />
                      <button type="submit" className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        Run
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {scrape?.status === "failed" && (
          <p className="text-sm text-red-600">{scrape.error_message || "The search failed."}</p>
        )}
        {(scrape?.status === "stopped" || scrape?.status === "completed") && scrape.error_message && (
          <p className="text-sm text-slate-600">{scrape.error_message}.</p>
        )}
        {searching && (
          <p className="text-sm text-slate-600">
            {stopRequested
              ? "Stop requested. Finishing in-flight checks…"
              : scrape?.status === "queued"
                ? "Queued… The timer starts when the worker begins searching."
                : remainingSeconds != null
                  ? `Searching for ${formatCountdown(remainingSeconds)} more. Addresses appear below as they are validated.`
                  : "Searching… Addresses appear below as they are validated."}
          </p>
        )}
        {showResults && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {validResults.length.toLocaleString()} valid, {invalidResults.length.toLocaleString()} invalid
                {searching ? " so far" : ""}.
              </p>
              {canCreate && canSaveFound && validResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleSaveFound()}
                  disabled={savingFound || selectedEmails.length === 0}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {savingFound ? "Saving…" : `Save ${selectedEmails.length.toLocaleString()} to list`}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="py-2 pr-3" />
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Check</th>
                    <th className="py-2">Found on</th>
                  </tr>
                </thead>
                <tbody>
                  {(scrape?.results || []).map((result) => (
                    <tr key={result.id} className="border-t border-slate-100">
                      <td className="py-3 pr-3">
                        {result.valid && (
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(result.email)}
                            onChange={() => toggleEmail(result.email)}
                            aria-label={`Save ${result.email}`}
                          />
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-900">{result.email}</td>
                      <td className={`py-3 pr-4 ${result.valid ? "text-emerald-700" : "text-red-600"}`}>
                        {result.validation_detail}
                      </td>
                      <td className="py-3 text-slate-500 break-all">{result.source_url}</td>
                    </tr>
                  ))}
                  {(scrape?.results || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        {searching ? "Waiting for the first validated address…" : "No email addresses were found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {isInProgress && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          This campaign is currently {newsletterStatus}. It is open for review until delivery completes.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className={`${panelClass} p-6 space-y-5`}>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">Promotional email</h2>
            <p className="text-sm text-slate-500 mt-1">This send goes to every active saved address.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</label>
              <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!isEditable} className={inputClass} placeholder="Email subject" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Preview text</label>
              <input type="text" value={previewText} onChange={(event) => setPreviewText(event.target.value)} disabled={!isEditable} className={inputClass} placeholder="Inbox preheader (optional)" maxLength={200} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Button URL (optional)</label>
              <input type="url" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} disabled={!isEditable} className={inputClass} placeholder="https://shettar.com/..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Button label</label>
              <input type="text" value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} disabled={!isEditable} className={inputClass} placeholder="Learn more" />
            </div>
          </div>
          <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${isEditable ? "border-slate-200 bg-slate-50/80" : "border-slate-100 bg-slate-50 opacity-60"}`}>
            <input type="checkbox" checked={includeHeader} onChange={(event) => setIncludeHeader(event.target.checked)} disabled={!isEditable} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
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
              <div className="rounded-xl border border-slate-200 px-5 py-8 text-sm text-slate-500">Loading campaign…</div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {canCreate && isEditable && (
              <button type="button" onClick={() => void saveDraft()} disabled={saving} className="px-5 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : isDraft ? "Save draft" : "Save changes"}
              </button>
            )}
            {canSend && isEditable && (
              <button type="button" onClick={openTestModal} disabled={testing || saving} className="px-5 py-2.5 rounded-xl font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors">
                {testing ? "Sending…" : "Send test"}
              </button>
            )}
            {canSend && isDraft && isEditable && (
              <button type="button" onClick={() => void openSendModal("send")} disabled={queueing || saving} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {sending ? "Queueing…" : "Send campaign"}
              </button>
            )}
            {canSend && isResendable && isEditable && (
              <button type="button" onClick={() => void openSendModal("resend")} disabled={queueing || saving} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {resending ? "Queueing…" : "Resend campaign"}
              </button>
            )}
          </div>
        </div>
        <div className="xl:sticky xl:top-8 h-fit">
          <EmailPreview subject={subject} previewText={previewText} htmlBody={htmlBody} ctaUrl={ctaUrl} ctaLabel={ctaLabel} includeHeader={includeHeader} />
          <p className="text-xs text-slate-500 mt-3 text-center">Active recipients: {savedCount.toLocaleString()}</p>
        </div>
      </div>

      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">Send test</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose where to send a one-off preview.</p>
                </div>
                <button type="button" onClick={() => setTestModalOpen(false)} disabled={testing} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode("self")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    testMode === "self"
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Self
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode("custom")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    testMode === "custom"
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Custom
                </button>
              </div>
              {testMode === "self" ? (
                <p className="text-sm text-slate-600">
                  Send to your signed-in address
                  {admin?.email ? (
                    <>
                      : <span className="font-semibold text-slate-900">{admin.email}</span>
                    </>
                  ) : (
                    "."
                  )}
                </p>
              ) : (
                <input
                  type="email"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  className={inputClass}
                  placeholder="name@example.com"
                  autoFocus
                />
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setTestModalOpen(false)} disabled={testing} className="flex-1 px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => void handleTestSend()} disabled={testing || saving} className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {testing ? "Sending…" : "Send test"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      ? "A new delivery will be queued to the current active list."
                      : "This will queue the email for the active list."}
                  </p>
                </div>
                <button type="button" onClick={() => setSendModalOpen(false)} disabled={queueing} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 disabled:opacity-50">
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
                    {pendingEstimate !== null ? pendingEstimate.toLocaleString() : savedCount.toLocaleString()}
                  </span>{" "}
                  active addresses.
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSendModalOpen(false)} disabled={queueing} className="flex-1 px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => void handleConfirmSend()} disabled={queueing} className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
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
