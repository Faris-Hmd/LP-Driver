import React from "react";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";
import ScrollTop from "@/components/ScrollTop";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "ليبر بيتزا - السائق",
  description: "لوحة تحكم السائق - ليبر بيتزا",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.className} antialiased flex flex-col transition-colors duration-300`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ScrollTop />
            <main className="w-full grow min-h-screen">
              <NavBar />
              <Toaster position="top-center" expand />
              <div className="pt-0.5"></div>
              {children}
            </main>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
