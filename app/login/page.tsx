"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Lock, Loader2, LogIn, ShieldCheck } from "lucide-react";

export default function UserInfo() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle redirect in useEffect to avoid "render while updating" warnings
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-[60vh] gap-4"
        dir="rtl"
      >
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
          جاري التحقق من الجلسة...
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-[80vh] px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 transition-all">
        {/* Icon Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 ring-8 ring-primary/5">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter">
            دخول <span className="text-primary">آمن</span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
            تسجيل الدخول مطلوب
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-muted border border-border rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-success mt-0.5" />
            <p className="text-xs text-muted-foreground font-medium leading-relaxed text-right">
              سجل الدخول باستخدام حساب جوجل المعتمد للوصول إلى لوحة التحكم وسجل
              الطلبات.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => signIn("google")}
          className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
        >
          <LogIn
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-xs font-black uppercase tracking-widest">
            المتابعة باستخدام جوجل
          </span>
        </button>

        {/* Footer */}
        <p className="text-center mt-8 text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
          اتصال مشفر • v2.0.4
        </p>
      </div>
    </div>
  );
}
