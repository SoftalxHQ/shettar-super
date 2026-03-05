"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login and redirect to dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-100 dark:from-indigo-950 dark:via-black dark:to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="auth-card relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <img src="/logo.svg" alt="Shettar Logo" className="w-8 h-8 invert" />
              </div>
              <span className="text-2xl font-black tracking-tighter">SHE<span className="text-primary">TTAR</span></span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">Shettar Super Admin Dashboard</p>
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

          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="label">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-primary hover:underline transition-all"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary group relative overflow-hidden"
          >
            <span className={isLoading ? "opacity-0" : "opacity-100 transition-opacity"}>
              Sign In
            </span>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Contact support if you're having trouble logging in.
          </p>
        </div>
      </div>
    </div>
  );
}
