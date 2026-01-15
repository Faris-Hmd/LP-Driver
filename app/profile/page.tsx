"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2,
  Truck,
  Hash,
  Phone,
  Calendar,
  Mail,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getDriverInfo } from "@/services/userServices";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DriverProfilePage() {
  const { data: session } = useSession();
  const [driverData, setDriverData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadDriverProfile = async () => {
      if (session?.user?.email) {
        try {
          const data = await getDriverInfo(session.user.email);
          setDriverData(data);
        } catch (error) {
          toast.error("خطأ في النظام: تعذر استرداد بيانات السائق.");
        } finally {
          setFetching(false);
        }
      } else if (session === null) {
        setFetching(false);
      }
    };

    if (session !== undefined) loadDriverProfile();
  }, [session]);

  if (fetching) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background"
        dir="rtl"
      >
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          جاري مزامنة المحطة...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background transition-colors duration-300"
      dir="rtl"
    >
      {/* --- FIXED HEADER --- */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md py-2.5 px-4 border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <User size={20} />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black text-foreground uppercase tracking-tighter">
                معلومات{" "}
                <span className="text-primary">
                  {driverData?.name?.split(" ")[0] || "السائق"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SIGN OUT BUTTON */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="group flex items-center gap-2 bg-muted hover:bg-destructive/10 px-4 py-2 rounded-2xl border border-border transition-all duration-200 active:scale-95"
            >
              <LogOut
                size={14}
                className="text-muted-foreground group-hover:text-destructive transition-colors"
              />
              <span className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-destructive">
                خروج
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* --- PAGE CONTENT --- */}
      <main className="max-w-xl mx-auto p-5 pb-32">
        <div className="bg-card rounded-3xl border border-border shadow-2xl shadow-primary/5 dark:shadow-none overflow-hidden mt-4">
          {/* Visual Identity Section */}
          <div className="p-8 bg-gradient-to-br from-secondary to-black dark:from-primary dark:to-primary/80 text-white relative">
            <Truck className="absolute -left-8 -bottom-8 w-44 h-44 opacity-10 rotate-12" />

            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex justify-between items-start">
                <Avatar className="h-20 w-20 rounded-3xl border-4 border-white/20 shadow-2xl">
                  <AvatarImage
                    src={session?.user?.image || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-secondary text-xl font-black italic">
                    {driverData?.name?.substring(0, 2).toUpperCase() || "LP"}
                  </AvatarFallback>
                </Avatar>

                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    النظام نشط
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-[0.4em]">
                  مشغل معتمد
                </p>
                <h2 className="text-3xl font-black tracking-tighter leading-none">
                  {driverData?.name || "تم رفض الوصول"}
                </h2>
                <div className="flex items-center gap-2 pt-2 justify-end">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-success text-[9px] font-black uppercase rounded-lg">
                    <ShieldCheck size={10} />
                    موثق
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Information */}
          <div className="p-8 grid grid-cols-1 gap-6 bg-card">
            <div className="grid grid-cols-2 gap-4">
              <MetricBox
                label="رقم المركبة"
                value={driverData?.vehicle || "غير معين"}
                icon={<Hash size={14} />}
              />
              <MetricBox
                label="خط الاتصال"
                value={driverData?.phone || "لا يوجد اتصال"}
                icon={<Phone size={14} />}
              />
            </div>

            <div className="h-px bg-border w-full" />

            <div className="space-y-4">
              <InfoRow
                icon={<Mail size={14} />}
                label="البريد الإلكتروني"
                value={session?.user?.email || "غير معروف"}
              />
              <InfoRow
                icon={<Calendar size={14} />}
                label="تاريخ التسجيل"
                value={
                  driverData?.updatedAt
                    ? new Date(driverData.updatedAt).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : "وحدة جديدة"
                }
              />
              <InfoRow
                icon={<Truck size={14} />}
                label="حالة الخدمة"
                value={
                  driverData?.status === "On Standby"
                    ? "في الانتظار"
                    : driverData?.status || "في الانتظار"
                }
              />
            </div>
          </div>

          {/* Footer of the card */}
          <div className="bg-muted p-6 border-t border-border text-center">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 bg-muted-foreground/30 rounded-full" />
              ملكية قسم الخدمات اللوجستية في ليبر بيتزا
              <span className="h-1.5 w-1.5 bg-muted-foreground/30 rounded-full" />
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

{
  /* --- REUSABLE SUB-COMPONENTS --- */
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-muted rounded-2xl border border-border group hover:border-primary/30 transition-colors text-right">
      <div className="flex items-center gap-2 text-primary mb-1 justify-end">
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
        {icon}
      </div>
      <p className="text-sm font-black text-foreground font-mono truncate">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[11px] font-bold text-foreground">{value}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
