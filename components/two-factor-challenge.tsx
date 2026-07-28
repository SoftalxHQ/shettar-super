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

      if (result.backup_codes && result.backup_codes.length > 0) {
        setBackupCodes(result.backup_codes);
        setPendingAuth({ token: result.token, admin: result.data });
        return;
      }

      onComplete(result.token, result.data);
    } catch (error: unknown) {
      toast.error("Verification failed", {
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

  if (backupCodes && pendingAuth) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Save your recovery codes
          </p>
          <p className="text-xs leading-relaxed text-amber-800/80">
            Store these somewhere safe. Each code works once if you lose your authenticator. They
            will not be shown again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((bc) => (
            <code
              key={bc}
              className="select-all rounded-lg bg-slate-100 px-2 py-2.5 text-center font-mono text-sm font-semibold tracking-wider text-slate-800"
            >
              {bc}
            </code>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyBackupCodes}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={downloadBackupCodes}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Download
          </button>
        </div>

        <button
          type="button"
          onClick={() => onComplete(pendingAuth.token, pendingAuth.admin)}
          className="btn-primary h-12 w-full"
        >
          I&apos;ve saved my codes — continue
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleVerify}
      className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500"
    >
      {stage === "enroll" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs leading-relaxed text-slate-500">
            Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password),
            then enter the 6-digit code it shows.
          </p>
          {qrSvg && (
            <div
              className="mx-auto h-44 w-44 rounded-xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
          {otpSecret && (
            <div className="text-center">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Or enter this key manually
              </p>
              <code className="break-all font-mono text-xs font-semibold tracking-wider text-slate-700 select-all">
                {otpSecret}
              </code>
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="label">{useRecovery ? "Recovery code" : "Authentication code"}</label>
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
          placeholder={useRecovery ? "Enter a recovery code" : "000000"}
          maxLength={useRecovery ? 11 : 6}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="input h-12 text-center text-lg font-semibold tracking-[0.35em]"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="btn-primary group relative h-12 w-full overflow-hidden disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        <span
          className={`transition-all duration-300 ${
            isLoading ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {stage === "enroll" ? "Activate & continue" : "Verify & continue"}
        </span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </button>

      <div className="flex flex-col items-center gap-3 pt-1">
        {stage === "verify" && (
          <button
            type="button"
            onClick={() => {
              setUseRecovery((v) => !v);
              setCode("");
            }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {useRecovery ? "Use authenticator code instead" : "Use a recovery code instead"}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to sign in
        </button>
      </div>
    </form>
  );
}
