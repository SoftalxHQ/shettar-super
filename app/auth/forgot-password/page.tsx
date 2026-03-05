"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-black dark:to-indigo-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="auth-card relative z-10">
        {!isSubmitted ? (
          <>
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-6">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <img src="/logo.svg" alt="Abri Logo" className="w-8 h-8 invert" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter">ABRI<span className="text-primary">SUPER</span></span>
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
              <p className="text-muted-foreground">
                Enter your email to receive a recovery link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@shettar.com"
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : (
                  "Send Recovery Link"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-2xl mb-2">
              <svg
                className="w-12 h-12 text-green-500 animate-[bounce_1s_infinite]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Check your inbox</h2>
              <p className="text-muted-foreground">
                We've sent a recovery link to your email address. Please follow the instructions to reset your password.
              </p>
            </div>
            <Link
              href="/"
              className="btn-secondary inline-block"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
