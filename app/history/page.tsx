"use client";

import useSWR from "swr";
import { useSession, signOut } from "next-auth/react";
import { getOrdersWh } from "@/services/ordersServices";
import { getDriverInfo } from "@/services/userServices";
import { useState, useMemo, useEffect } from "react";
import { ordersRef } from "@/lib/firebase";
import { onSnapshot, query, where } from "firebase/firestore";
import { serializeData } from "@/lib/serialize";
import {
  Loader2,
  MapPin,
  Calendar,
  CheckCircle2,
  Truck,
  Clock,
  Package,
  CalendarDays,
  DollarSign,
  ChevronDown,
  ChevronUp,
  User,
  AlertTriangle,
} from "lucide-react";
import { OrderData } from "@/types/productsTypes";

type SortOption = "date" | "value";

export default function HistoryPage() {
  const { data: session } = useSession();
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const { data: driver, isLoading: driverLoading } = useSWR(
    session?.user?.email ? ["driver-info", session.user.email] : null,
    ([, email]) => getDriverInfo(email),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (!driver?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFirestoreError(null);
    const q = query(ordersRef, where("driverId", "==", driver.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          return {
            ...d.data(),
            id: d.id,
            deleveratstamp: "",
          } as OrderData;
        });
        setOrders(serializeData(list));
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setFirestoreError(error.message || String(error));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driver?.id]);

  const processedOrders = useMemo(() => {
    if (!orders) return [];

    // 1. Filter: Only show "Delivered" orders in history
    let result = orders.filter((o) => o.status === "Delivered");

    // 2. Sort
    return [...result].sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    });
  }, [orders, sortBy]);

  // Loading state
  if (!session || driverLoading || (driver && isLoading)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background"
        dir="rtl"
      >
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
          جاري الوصول إلى
          <br />
          أرشيف المحطة...
        </p>
      </div>
    );
  }

  // Handle case where user is logged in but not registered in "drivers" collection
  if (session && !driverLoading && !driver) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-card border border-border rounded-[2rem] p-8 shadow-2xl shadow-primary/5">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-xl font-black text-foreground">الحساب غير مسجل كسائق</h1>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            البريد الإلكتروني <span className="font-bold text-foreground">{session?.user?.email}</span> غير مسجل في نظام السائقين لدينا.
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            يرجى تسجيل الخروج وتسجيل الدخول بالحساب المعتمد أو مراجعة إدارة ليبر بيتزا.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-8 w-full py-4 bg-destructive text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-destructive/10 hover:shadow-destructive/20"
          >
            تسجيل الخروج والمحاولة مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16" dir="rtl">
      <header className="bg-card px-4 py-3.5 border-b border-border shadow-sm">
        <div className="max-w-xl mx-auto flex flex-row items-center justify-between gap-3 text-center">
          <div className="text-right">
            <h1 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tighter">
              سجل <span className="text-primary">العمليات</span>
            </h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
              {driver?.name?.split(" ")[0] || "السائق"} • أرشيف المحطة
            </p>
          </div>

          <div className="bg-muted px-3 py-1 rounded-full border border-border flex items-center justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none mt-0.5">
              {processedOrders.length} مهمة منتهية
            </span>
          </div>
        </div>
      </header>

      {/* --- SORTING & FILTERS --- */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setSortBy("date")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all duration-300 ${
              sortBy === "date"
                ? "bg-card text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays size={12} />
            الأحدث
          </button>
          <button
            onClick={() => setSortBy("value")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all duration-300 ${
              sortBy === "value"
                ? "bg-card text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign size={12} />
            القيمة الأعلى
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {firestoreError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-5 text-right flex items-start gap-3 shadow-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black">فشل الاتصال المباشر بقاعدة البيانات</p>
              <p className="text-[10px] font-mono opacity-80 leading-normal">{firestoreError}</p>
              <p className="text-[9px] opacity-70">يرجى التأكد من اتصال الإنترنت وإعادة تحميل الصفحة.</p>
            </div>
          </div>
        )}

        {processedOrders.length > 0 ? (
          <OrderHistory orders={processedOrders} />
        ) : (
          <div className="py-20 text-center opacity-40">
            <Package className="mx-auto mb-4" size={40} />
            <p className="text-[9px] font-black uppercase tracking-widest text-foreground">
              لم يتم العثور على سجلات مطابقة
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderHistory({ orders }: { orders: OrderData[] }) {
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  return (
    <div className="space-y-3 pb-20">
      {orders.map((order) => {
        const isExpanded = expandedOrders.includes(order.id);

        return (
          <div
            key={order.id}
            className="bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/30 shadow-sm"
          >
            {/* --- COLLAPSIBLE HEADER --- */}
            <div
              onClick={() => toggleOrderExpansion(order.id)}
              className="p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <div
                    className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-tighter italic border ${
                      order.status === "Delivered"
                        ? "border-success/20 text-success bg-success/5"
                        : "border-primary/20 text-primary bg-primary/5"
                    }`}
                  >
                    {order.status === "Delivered" ? "تم التوصيل" : order.status}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={14} className="text-muted-foreground" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      العميل
                    </p>
                    <p className="text-xs sm:text-sm font-black text-foreground truncate uppercase tracking-tighter">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    الإجمالي
                  </p>
                  <p className="text-xs sm:text-sm font-black text-success">
                    {order.totalAmount.toLocaleString("en-US") || 0} ج.س
                  </p>
                </div>
              </div>
            </div>

            {/* --- EXPANDED CONTENT --- */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 sm:px-5 sm:pb-5 sm:space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Location & Time Grid */}
                <div className="pt-3.5 border-t border-dashed border-border space-y-4">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                        العنوان
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground italic leading-tight">
                        {order.shippingInfo?.city}،{" "}
                        {order.shippingInfo?.address}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-muted/50 p-2.5 rounded-xl border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">
                          وقت الطلب
                        </span>
                        <Calendar size={10} className="text-muted-foreground" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-foreground text-right">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}{" "}
                        {new Date(order.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="bg-success/5 p-2.5 rounded-xl border border-success/10">
                      <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <span className="text-[8px] font-black uppercase text-success/70">
                          وقت التوصيل
                        </span>
                        <Clock size={10} className="text-success/70" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-success text-right">
                        {order.deliveredAt
                          ? `${new Date(order.deliveredAt).toLocaleDateString("ar-EG")} ${new Date(
                              order.deliveredAt,
                            ).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "---"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products List */}
                <div className="bg-muted rounded-xl p-3 sm:p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      تفاصيل الفاتورة
                    </span>
                    <Package size={10} className="text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    {order.productsList.map((product: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-background/50 p-2.5 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-2 text-right">
                          <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded text-[9px] font-black">
                            {product.p_qu}x
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-foreground">
                            {product.p_name}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-black text-foreground">
                          {product.p_cost.toLocaleString()} ج.س
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
