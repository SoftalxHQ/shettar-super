"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post("/admins/password", {
        admin: { email }
      });
      setStep("reset");
      toast.success("Security Code Dispatched", {
        description: `Transmitted a 6-digit access token to ${email}.`,
      });
    } catch (error: any) {
      toast.error("Transmission Failed", {
        description: error.message || "Could not process recovery request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Security Mismatch", {
        description: "Password confirmation does not match.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.request("/admins/password", {
        method: "PUT",
        body: JSON.stringify({
          admin: {
            reset_password_token: otp,
            password: password,
            password_confirmation: confirmPassword
          }
        })
      });
      
      toast.success("Identity Reactivated", {
        description: "Your portal access has been restored with the new credentials.",
      });
      
      // Short delay before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast.error("Reset Failed", {
        description: error.message || "Invalid or expired security code.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-black dark:to-indigo-950 p-4 transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="auth-card relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-white/40">
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
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {step === "request" ? "Forgot Key?" : "Reset Access"}
          </h1>
          <p className="text-sm text-balance text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
            {step === "request" 
              ? "Provide your register admin email and we'll transmit a secure recovery link to your inbox."
              : `Enter the 6-digit code sent to ${email} and your new credentials.`}
          </p>
        </div>

        {step === "request" ? (
          <form onSubmit={handleRequestRecovery} className="space-y-6 mt-4">
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
                  Submit Transmission
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
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="form-group">
              <label className="label ml-1">Security Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="input h-14 text-center text-xl font-bold tracking-[0.5em] transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
                required
              />
            </div>

            <div className="form-group">
              <label className="label ml-1">New Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="input h-14 text-sm font-medium transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
                required
              />
            </div>

            <div className="form-group">
              <label className="label ml-1">Confirm Access Key</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input h-14 text-sm font-medium transition-all focus:ring-4 focus:ring-primary/5 border-slate-200"
                required
              />
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isLoading || !otp || !password}
                className="btn-primary group relative overflow-hidden h-14 rounded-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
              >
                <span className={`transition-all duration-300 ${isLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
                  Reactivate Portal Access
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
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-all px-4 py-2"
                >
                  Resend Security Code
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
