"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useGeneratePushNotificationSuggestionsMutation,
  type PushNotificationSuggestion,
} from "@/lib/store/services/api";

export interface PushNotificationAiModalProps {
  open: boolean;
  onClose: () => void;
  audienceLabel: string;
  context: {
    target_type: string;
    segment?: string | null;
    audience_label: string;
  };
  onInsert: (suggestion: PushNotificationSuggestion) => void;
}

function mutationErrorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string } };
  return e?.data?.error || fallback;
}

export function PushNotificationAiModal({
  open,
  onClose,
  audienceLabel,
  context,
  onInsert,
}: PushNotificationAiModalProps) {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<PushNotificationSuggestion[]>([]);
  const [generateSuggestions, { isLoading }] = useGeneratePushNotificationSuggestionsMutation();

  if (!open) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe the notification you want to generate");
      return;
    }

    try {
      const result = await generateSuggestions({
        prompt: prompt.trim(),
        context,
      }).unwrap();
      setSuggestions(result.suggestions);
    } catch (err) {
      toast.error(mutationErrorMessage(err, "Failed to generate suggestions"));
    }
  };

  const handleInsert = (suggestion: PushNotificationSuggestion) => {
    onInsert(suggestion);
    toast.success("Notification inserted");
    onClose();
    setPrompt("");
    setSuggestions([]);
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setSuggestions([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">AI assist</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Describe the push notification you want. We&apos;ll generate three options to choose from.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-border/50 px-4 py-3 text-sm text-muted-foreground">
            Audience: <span className="font-semibold text-foreground">{audienceLabel}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
              Your request
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors resize-none h-28 text-sm disabled:opacity-60"
              placeholder="e.g. Generate a push for tomorrow's public holiday encouraging early bookings"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isLoading}
            className="w-full px-5 py-3 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Generating…" : "Generate 3 options"}
          </button>

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Suggestions
              </p>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.title}-${index}`}
                  className="rounded-2xl border border-border/50 bg-slate-50/50 dark:bg-zinc-800/30 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold text-foreground">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInsert(suggestion)}
                      className="shrink-0 p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      aria-label={`Insert option ${index + 1}`}
                      title="Insert into form"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
