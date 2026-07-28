"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth, type LoginResult } from "@/lib/auth-context";
import { toast } from "sonner";
import TwoFactorChallenge from "@/components/two-factor-challenge";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<LoginResult | null>(null);
  const { login, finalizeLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.requires_2fa && result.challenge_token) {
        setChallenge(result);
        return;
      }

      toast.success("Welcome back", {
        description: "Signed in to Shettar Super.",
      });
    } catch (error: unknown) {
      const err = error as {
        data?: { status?: { message?: string }; message?: string };
        message?: string;
      };
      toast.error("Sign-in failed", {
        description:
          err?.data?.status?.message ||
          err?.data?.message ||
          err?.message ||
          "Invalid email or password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isTwoFactor = challenge?.requires_2fa && challenge.challenge_token;

  const title = isTwoFactor
    ? challenge?.stage === "enroll"
      ? "Secure your account"
      : "Two-factor verification"
    : "Sign in";

  const description = isTwoFactor
    ? challenge?.stage === "enroll"
      ? "Two-factor authentication is required. Set up your authenticator app to continue."
      : "Enter the code from your authenticator app to finish signing in."
    : "Manage businesses, payouts, support, and platform configuration.";

  return (
    <AuthShell title={title} description={description}>
      {isTwoFactor ? (
        <TwoFactorChallenge
          stage={challenge!.stage === "enroll" ? "enroll" : "verify"}
          challengeToken={challenge!.challenge_token!}
          otpSecret={challenge!.otp_secret}
          qrSvg={challenge!.qr_svg}
          onComplete={(token, admin) => finalizeLogin(token, admin)}
          onCancel={() => {
            setChallenge(null);
            setPassword("");
          }}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@shettar.com"
                  autoComplete="email"
                  className="input h-12 pl-12 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="mb-1 flex items-center justify-between pl-0.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input h-12 pl-12 pr-12 text-sm font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-0.5">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
            />
            <label
              htmlFor="remember"
              className="select-none text-xs font-medium text-slate-500"
            >
              Keep me signed in
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="btn-primary group relative h-12 overflow-hidden disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <span
              className={`flex items-center gap-2 transition-all duration-300 ${
                isLoading ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              Sign in
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
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
        </form>
      )}
    </AuthShell>
  );
}
