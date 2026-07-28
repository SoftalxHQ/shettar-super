"use client";

import type { ReactNode } from "react";
import { Manrope, Syne } from "next/font/google";
import { AuthBrandMark } from "@/components/auth/auth-brand-mark";
import { cn } from "@/lib/utils";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-auth-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-auth-sans",
  display: "swap",
});

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
};

export function AuthShell({
  children,
  title,
  description,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        syne.variable,
        manrope.variable,
        "auth-shell relative flex min-h-screen w-full font-[family-name:var(--font-auth-sans)] text-slate-800 antialiased",
        className,
      )}
    >
      {/* Brand panel — equal split, content top / middle / bottom */}
      <aside className="auth-brand-panel relative hidden min-h-screen w-1/2 overflow-hidden bg-[#0B0F19] lg:flex lg:flex-col lg:justify-between">
        <div className="auth-brand-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <div className="auth-brand-drift pointer-events-none absolute -left-1/4 top-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-500/25 blur-[110px]" aria-hidden />
        <div className="auth-brand-drift-delayed pointer-events-none absolute -right-1/4 bottom-0 h-[22rem] w-[22rem] rounded-full bg-teal-400/10 blur-[100px]" aria-hidden />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="auth-brand-enter">
            <AuthBrandMark variant="hero" showTagline />
          </div>

          <div className="auth-brand-enter auth-brand-enter-delay max-w-md space-y-4">
            <p className="font-[family-name:var(--font-auth-display)] text-2xl font-semibold leading-snug tracking-tight text-white xl:text-[1.75rem]">
              Platform control for the Shettar network
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              Oversee businesses, payouts, support, and configuration from one secure console.
            </p>
          </div>

          <p className="auth-brand-enter auth-brand-enter-delay-2 relative z-10 text-[11px] font-medium tracking-wide text-white/50">
            Secured access · Admin only
          </p>
        </div>
      </aside>

      {/* Form panel — equal split, left-aligned form column */}
      <main className="relative flex min-h-screen w-full flex-col bg-[#F7F8FB] lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.06),_transparent_55%)]" aria-hidden />

        {/* Mobile brand strip */}
        <div className="relative z-10 border-b border-slate-200/80 bg-white/70 px-5 py-4 backdrop-blur-md lg:hidden">
          <AuthBrandMark variant="compact" showTagline />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="auth-form-enter mx-auto w-full max-w-[28rem] lg:mx-0">
            <div className="mb-8 hidden lg:block">
              <AuthBrandMark variant="compact" />
            </div>

            <header className="mb-8 space-y-2">
              <h1 className="font-[family-name:var(--font-auth-display)] text-[1.75rem] font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              ) : null}
            </header>

            <div className="space-y-6">{children}</div>

            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </div>

        <p className="relative z-10 px-5 pb-6 text-center text-[11px] font-medium tracking-wide text-slate-400 lg:px-12 lg:text-left xl:px-16">
          © {new Date().getFullYear()} Shettar · Admin console
        </p>
      </main>
    </div>
  );
}
