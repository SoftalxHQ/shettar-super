import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abri Super | Platform Management",
  description: "Enterprise oversight and support for the Abri property network.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-zinc-950">
      <body className={`${inter.variable} font-sans antialiased text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-950`}>
        {children}
      </body>
    </html>
  );
}
