"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthBrandMarkProps = {
  variant?: "hero" | "compact";
  href?: string;
  className?: string;
  showTagline?: boolean;
};

export function AuthBrandMark({
  variant = "compact",
  href = "/",
  className,
  showTagline = false,
}: AuthBrandMarkProps) {
  const isHero = variant === "hero";

  const content = (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <Image
        src="/shettar-logo.png"
        alt="Shettar"
        width={isHero ? 240 : 140}
        height={isHero ? 62 : 36}
        className={cn(
          "object-contain object-left",
          isHero ? "h-12 w-auto sm:h-14" : "h-8 w-auto",
        )}
        priority
      />
      {showTagline && (
        <span
          className={cn(
            "font-[family-name:var(--font-auth-sans)] font-medium tracking-[0.18em] uppercase",
            isHero
              ? "text-[11px] text-white/50"
              : "text-[10px] text-slate-400",
          )}
        >
          Platform control
        </span>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="inline-flex rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
