"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVerifyTwoFactorMutation } from "@/lib/store/services/api";
import type { Admin } from "@/lib/store/slices/authSlice";

function verificationErrorMessage(error: unknown): string {
  const e = error as {
    data?: { status?: { message?: string }; message?: string; error?: string };
    message?: string;
  };

  return (
    e?.data?.status?.message ||
    e?.data?.message ||
    e?.data?.error ||
    e?.message ||
    "Invalid code. Please try again."
  );
}

interface TwoFactorChallengeProps {
  stage: "enroll" | "verify";
  challengeToken: string;
  otpSecret?: string;
  qrSvg?: string;
  onComplete: (token: string, admin: Admin) => void;
  onCancel: () => void;
}

export default function TwoFactorChallenge({
  stage,
  challengeToken,
  otpSecret,
  qrSvg,
  onComplete,
  onCancel,
}: TwoFactorChallengeProps) {
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ token: string; admin: Admin } | null>(null);
  const [verifyTwoFactor, { isLoading }] = useVerifyTwoFactorMutation();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyTwoFactor({
        challenge_token: challengeToken,
        code: code.trim(),
        recovery: useRecovery,
      }).unwrap();

      if (!result.token || !result.data) {
        throw new Error("Verification did not return an access token.");
      }

      // On enrollment, show recovery codes before completing login.
      if (result.backup_codes && result.backup_codes.length > 0) {
        setBackupCodes(result.backup_codes);
        setPendingAuth({ token: result.token, admin: result.data });
        return;
      }

      onComplete(result.token, result.data);
    } catch (error: unknown) {
      toast.error("Verification Failed", {
        description: verificationErrorMessage(error),
      });
      setCode("");
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success("Copied", { description: "Recovery codes copied to clipboard." });
    } catch {
      toast.error("Copy failed", { description: "Select and copy the codes manually." });
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob(
      [
        "Shettar Super - Two-Factor Recovery Codes\n",
        "Keep these somewhere safe. Each code can be used once.\n\n",
        backupCodes.join("\n"),
        "\n",
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shettar-super-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Recovery codes view (post-enrollment) ─────────────────────────────────
  if (backupCodes && pendingAuth) {
    return (
      <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
            Save your recovery codes
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            Store these somewhere safe. Each code works once and lets you sign in if you lose your
            authenticator. They will not be shown again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((bc) => (
            <code
              key={bc}
              className="text-center font-mono text-sm font-bold tracking-wider rounded-lg bg-slate-100 dark:bg-slate-800 py-2 px-2 select-all"
            >
              {bc}
            </code>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyBackupCodes}
            className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={downloadBackupCodes}
            className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Download
          </button>
        </div>

        <button
          type="button"
          onClick={() => onComplete(pendingAuth.token, pendingAuth.admin)}
          className="btn-primary h-14 rounded-2xl w-full shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
        >
          I&apos;ve saved my codes, continue
        </button>
      </div>
    );
  }

  // ── Challenge view (enroll setup + code entry, or verify) ──────────────────
  return (
    <form onSubmit={handleVerify} className="space-y-6 mt-4 animate-in fade-in slide-in-from-right-4 duration-500">
      {stage === "enroll" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password),
              then enter the 6-digit code it shows.
            </p>
            {qrSvg && (
              <div
                className="mx-auto w-44 h-44 [&>svg]:w-full [&>svg]:h-full bg-white rounded-xl p-2"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            {otpSecret && (
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                  Or enter this key manually
                </p>
                <code className="font-mono text-xs font-bold tracking-wider break-all select-all">
                  {otpSecret}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="label ml-1">
          {useRecovery ? "Recovery Code" : "Authentication Code"}
        </label>
        <input
          type="text"
          inputMode={useRecovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => {
            const next = e.target.value;
            setCode(
              useRecovery
                ? next.replace(/[^a-f0-9-]/gi, "").toLowerCase()
                : next.replace(/\D/g, "").slice(0, 6),
            );
          }}
          placeholder={useRecovery ? "Enter a recovery code" : "6-digit code"}
          maxLength={useRecovery ? 11 : 6}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          className="input h-14 text-center text-xl font-bold tracking-[0.4em] transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="btn-primary group relative overflow-hidden h-14 rounded-2xl w-full shadow-primary/20 hover:shadow-primary/40 active:shadow-none transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        <span className={`transition-all duration-300 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
          {stage === "enroll" ? "Activate & Continue" : "Verify & Enter"}
        </span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-300">
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>

      <div className="flex flex-col items-center gap-3">
        {stage === "verify" && (
          <button
            type="button"
            onClick={() => {
              setUseRecovery((v) => !v);
              setCode("");
            }}
            className="text-xs font-bold text-primary hover:underline transition-all"
          >
            {useRecovery ? "Use authenticator code instead" : "Use a recovery code instead"}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </button>
      </div>
    </form>
  );
}
