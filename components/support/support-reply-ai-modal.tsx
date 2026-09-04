"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSuggestSupportReplyMutation } from "@/lib/store/services/api";

export function SupportReplyAiModal({
  open,
  onClose,
  ticketId,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  ticketId: number | string;
  onInsert: (reply: string) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [draft, setDraft] = useState("");
  const [suggestReply, { isLoading }] = useSuggestSupportReplyMutation();

  if (!open) return null;

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast.error("Describe how you want the reply to sound");
      return;
    }

    try {
      const result = await suggestReply({
        id: ticketId,
        instruction: instruction.trim(),
      }).unwrap();
      setDraft(result.reply);
    } catch (err) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to draft a reply");
    }
  };

  const handleInsert = () => {
    if (!draft.trim()) return;
    onInsert(draft);
    toast.success("Draft inserted — review before sending");
    handleClose();
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setInstruction("");
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">AI reply assist</h2>
              <p className="text-sm text-slate-500 mt-1">
                The AI reads this ticket and the chat, then drafts a reply for you to review.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">How should we reply?</span>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isLoading}
              className="w-full input min-h-[88px] resize-y rounded-xl border-slate-200 text-sm disabled:opacity-60"
              placeholder="e.g. Apologize for the delay and ask for the booking ID"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Drafting…" : "Generate draft"}
          </button>

          {draft && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Draft</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3">
                {draft}
              </p>
              <button
                type="button"
                onClick={handleInsert}
                className="w-full px-4 py-2.5 rounded-xl font-semibold border border-slate-200 text-slate-800 hover:bg-slate-50"
              >
                Insert into reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
