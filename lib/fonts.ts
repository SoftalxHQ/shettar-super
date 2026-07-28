import { Manrope, Syne } from "next/font/google";

export const fontDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-auth-display",
  display: "swap",
});

export const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-auth-sans",
  display: "swap",
});
