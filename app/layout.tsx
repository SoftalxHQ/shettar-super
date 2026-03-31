import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shettar Super | Platform Management",
  description: "Enterprise oversight and support for the Shettar property network.",
  icons: {
    icon: "/favicon.png",
  },
};

import { AuthProvider } from "@/lib/auth-context";
import { ReduxProvider } from "@/lib/store/provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-zinc-950">
      <body className={`${inter.variable} font-sans antialiased text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-950`}>
        <ReduxProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReduxProvider>
        <Toaster 
          position="top-center" 
          expand={false}
          theme="system"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
              padding: '1.25rem',
            },
            className: 'shettar-toast',
          }}
        />
      </body>
    </html>
  );
}


