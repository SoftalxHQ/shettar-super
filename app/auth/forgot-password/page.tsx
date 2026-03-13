"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-black dark:to-indigo-950 p-4 transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="auth-card relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-white/40">
        {!isSubmitted ? (
          <>
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-6">
                <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 duration-300">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
                    <img src="/logo.svg" alt="Shettar Logo" className="w-9 h-9 invert" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-2xl font-black tracking-tighter uppercase italic">
                      Shettar<span className="text-primary font-bold">Super</span>
                    </span>
                  </div>
                </Link>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Forgot Key?</h1>
              <p className="text-sm text-balance text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                Provide your register admin email and we'll transmit a secure recovery link to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="form-group">
                <label className="label ml-1">Admin Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@shettar.com"
                    className="input pl-12 h-14 text-sm font-medium transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="btn-primary group relative overflow-hidden h-14 rounded-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <span className={`transition-all duration-300 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
                    Send Recovery Link
                  </span>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/"
                    className="text-xs font-bold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 group/back px-4 py-2"
                  >
                    <svg className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Nevermind, I remember now
                  </Link>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-8 py-6 animate-in zoom-in-95 duration-500">
            <div className="relative inline-flex items-center justify-center p-6 bg-green-500/10 rounded-[2rem] border border-green-500/20 group overflow-hidden">
               <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
               <svg
                className="relative w-16 h-16 text-green-500 animate-in slide-in-from-top-4 duration-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Transmission Sent</h2>
              <p className="text-sm text-balance text-muted-foreground leading-relaxed">
                Check <strong className="text-primary">{email}</strong>. We've dispatched a secure node with instructions to reactivate your portal access.
              </p>
            </div>

            <div className="pt-4 flex flex-col items-center gap-4">
               <Link
                href="/"
                className="w-full btn-secondary h-14 rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all"
              >
                Back to Sign In
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                Nodes expire in 15 minutes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
