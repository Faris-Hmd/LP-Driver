"use client";

import { usePathname } from "next/navigation";
import { Home, History, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { title: "الرئيسية", href: "/", icon: Home },
  { title: "السجل", href: "/history", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-xl border-b border-border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex justify-between items-center"
        dir="rtl"
      >
        {/* Right Side: Brand & Main Links */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="group flex items-center gap-3 active:scale-95 transition-all duration-300 hover:opacity-90"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-6 transition-all duration-300 ring-2 ring-white/10">
                <img
                  src="/logo.png"
                  alt="Liper Pizza Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black text-foreground tracking-tight flex items-baseline">
                ليبر<span className="text-primary ml-0.5">بيتزا</span>
              </span>
              <span className="text-[9px] font-black text-primary/70 uppercase tracking-[0.25em] mt-0.5">
                نظام السائق
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Elegant Pill Style */}
          <div className="hidden md:flex items-center bg-muted/30 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50">
            {NAV_ITEMS.filter((item) => item.href !== pathname).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href as any}
                  className="relative px-6 py-2.5 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/50 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-primary hover:bg-background hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex items-center gap-2.5 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon
                    size={15}
                    className="relative z-10 group-hover:scale-110 transition-transform duration-300"
                    strokeWidth={2.5}
                  />
                  <span className="relative z-10">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Left Side: Theme & Profile */}
        <div className="flex items-center gap-4">
          {/* Mobile Navigation - Only show the other link */}
          <div className="flex md:hidden items-center gap-2">
            {NAV_ITEMS.filter((item) => item.href !== pathname).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href as any}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted/40 border border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-background transition-all duration-300"
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="h-8 w-px bg-border/60 hidden sm:block mx-1" />

          <ModeToggle />

          {session?.user ? (
            <Link
              href="/profile"
              className="group relative h-10 w-10 flex items-center justify-center transition-all duration-300 active:scale-90"
            >
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Avatar className="h-10 w-10 overflow-hidden rounded-2xl border-2 border-border group-hover:border-primary/50 shadow-sm flex items-center justify-center bg-card transition-all duration-300 relative z-10">
                <AvatarImage
                  src={session.user?.image || ""}
                  className="object-cover h-full w-full"
                />
                <AvatarFallback className="text-[11px] font-black text-primary uppercase bg-primary/5 w-full h-full flex items-center justify-center">
                  {session.user?.name?.substring(0, 2) || "DR"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="group relative h-10 px-6 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300" />
              <LogIn size={15} className="relative z-10" />
              <span className="relative z-10">تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
