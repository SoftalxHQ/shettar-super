"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.login(email, password);
      
      const adminData = response.data;
      login(response.token, response.data);
      
      toast.success("Welcome back!", {
        description: "Authenticated with Shettar Cloud Protocol.",
      });
    } catch (error: any) {
      toast.error("Access Denied", {
        description: error.message || "Invalid credentials provided.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-100 dark:from-indigo-950 dark:via-black dark:to-slate-900 p-4 transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-12 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-bounce" />
      </div>

      <div className="auth-card relative z-10 animate-in fade-in zoom-in-95 duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-white/40">
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
                <span className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] mt-1">PLATFORM CONTROL</span>
              </div>
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Admin Portal</h1>
          <p className="text-sm text-balance text-muted-foreground max-w-[280px] mx-auto">
            Log in to manage configurations, payouts, and business identities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="form-group">
              <label className="label ml-1">Email Address</label>
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

            <div className="form-group">
              <div className="flex items-center justify-between mb-1 pl-1">
                <label className="label">Access Key</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-all"
                >
                  Forgot Key?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12 pr-12 h-14 text-sm font-medium transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" 
            />
            <label htmlFor="remember" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
              Keep me authenticated
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="btn-primary group relative overflow-hidden h-14 rounded-2xl shadow-primary/20 hover:shadow-primary/40 active:shadow-none transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <span className={`flex items-center gap-3 transition-all duration-300 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
              Enter Dashboard 
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
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
        </form>

        <div className="flex flex-col items-center pt-6 gap-4">
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
            Secured by Shettar Cloud Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
