"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { getOrdersWh, upOrder } from "@/services/ordersServices";
import { getDriverByEmail } from "@/services/driversServices";
import { ordersRef } from "@/lib/firebase";
import { onSnapshot, query, where } from "firebase/firestore";
import { serializeData } from "@/lib/serialize";
import { OrderData } from "@/types/productsTypes";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  MessageSquare,
  Loader2,
  User,
  ChevronLeft,
  Navigation,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const getNavigationUrl = (shippingInfo: any) => {
  if (!shippingInfo) return null;
  const link = shippingInfo.googleMapsLink;
  if (typeof link === "string" && link.trim().length > 0) {
    return link.trim();
  }
  const lat = Number(shippingInfo.latitude);
  const lng = Number(shippingInfo.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const addr = shippingInfo.address;
  const city = shippingInfo.city;
  if (
    (typeof addr === "string" && addr.trim().length > 0) ||
    (typeof city === "string" && city.trim().length > 0)
  ) {
    const queryParts = [addr, city]
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    if (queryParts.length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(", "))}`;
    }
  }
  return null;
};

export default function DriverTaskPage() {
  const { data: session, status: authStatus } = useSession();

  const [orderToConfirm, setOrderToConfirm] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [expandedProductLists, setExpandedProductLists] = useState<string[]>(
    [],
  );

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const toggleProductExpansion = (orderId: string) => {
    setExpandedProductLists((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const { data: driver, isLoading: driverLoading } = useSWR(
    session?.user?.email ? `driver-email-${session.user.email}` : null,
    () => getDriverByEmail(session?.user?.email as string),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (!driver?.id) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    setFirestoreError(null);
    const q = query(
      ordersRef,
      where("driverId", "==", driver.id)
    );

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
        setOrdersLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setFirestoreError(error.message || String(error));
        toast.error("حدث خطأ أثناء الاتصال المباشر بالطلبات");
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driver?.id]);

  const handleFinalHandover = async () => {
    if (!orderToConfirm) return;
    setIsSubmitting(true);
    try {
      await upOrder(orderToConfirm.id, {
        status: "Delivered",
        deliveredAt: new Date().toISOString(),
        deleveratstamp: new Date(),
      });
      toast.success("تم التسليم بنجاح");
      setOrderToConfirm(null);
    } catch (error) {
      toast.error("خطأ في الإرسال");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading session or driver details
  if (authStatus === "loading" || driverLoading || (driver && ordersLoading)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-background"
        dir="rtl"
      >
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          جاري المزامنة...
        </p>
      </div>
    );
  }

  // Handle case where user is logged in but not registered in "drivers" collection
  if (authStatus === "authenticated" && !driverLoading && !driver) {
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

  const activeOrders =
    orders?.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled",
    ) || [];

  return (
    <div
      className="min-h-screen bg-background pb-16 transition-colors duration-500"
      dir="rtl"
    >
      {/* --- CONFIRMATION MODAL --- */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
            <div className="p-5 text-center">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground uppercase tracking-tighter">
                  تسليم الطلب إلى:
                </h3>
                <p className="text-lg font-black text-primary uppercase leading-tight">
                  {orderToConfirm.customer_name || "عميل زائر"}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                  رقم الطلب: #{orderToConfirm.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                <button
                  disabled={isSubmitting}
                  onClick={handleFinalHandover}
                  className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  تأكيد التسليم
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => setOrderToConfirm(null)}
                  className="w-full py-2.5 text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="bg-card px-4 py-3.5 border-b border-border">
        <div className="max-w-xl mx-auto flex flex-row items-center justify-between gap-3 text-center">
          <h1 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tighter">
            {driver?.name?.split(" ")[0] || "السائق"}{" "}
            <span className="text-primary">العمليات</span>
          </h1>
          <div className="bg-muted px-3 py-1 rounded-full border border-border flex items-center justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none mt-0.5">
              {activeOrders.length} مهام نشطة
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
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

        <section className="space-y-3">
          <h2 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
            المهام النشطة
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-black text-foreground uppercase tracking-tighter">
                لا توجد مهام نشطة حالياً
              </p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const isExpanded = expandedOrders.includes(order.id);
              const isProductsExpanded = expandedProductLists.includes(
                order.id,
              );

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm transition-all"
                >
                  {/* --- COLLAPSIBLE TOP SECTION --- */}
                  <div
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="p-4 sm:p-5 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        مهمة رقم #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp
                            size={14}
                            className="text-muted-foreground"
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">
                            المستلم
                          </p>
                          <p className="text-xs sm:text-sm font-black text-foreground truncate uppercase tracking-tighter text-right">
                            {order.customer_name || "عميل زائر"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                          الإجمالي
                        </p>
                        <p className="text-xs sm:text-sm font-black text-success">
                          {order.totalAmount.toLocaleString("en-US") || 0} ج.س
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- EXPANDABLE CONTENT --- */}
                  {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="px-4 pb-4 space-y-4 sm:px-5 sm:pb-5 sm:space-y-5">
                        {/* Location Details */}
                        <div className="flex items-start gap-2.5 pt-3.5 border-t border-dashed border-border">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <MapPin size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">
                              العنوان:{" "}
                              <span className="text-primary font-bold">
                                {order.shippingInfo?.city || "مدينة غير معروفة"}
                              </span>
                            </p>
                            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground leading-snug text-right">
                              {order.shippingInfo?.address || "لا يوجد عنوان"}
                            </p>

                            {/* Map Navigation Link */}
                            {(() => {
                              const navUrl = getNavigationUrl(order.shippingInfo);
                              if (!navUrl) return null;
                              return (
                                <div className="flex justify-start">
                                  <a
                                    href={navUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-tight hover:bg-primary hover:text-white transition-all"
                                  >
                                    <Navigation size={9} /> بدء الملاحة
                                  </a>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Collapsible Product List (Nested) */}
                        <div className="border-t border-dashed border-border pt-3.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProductExpansion(order.id);
                            }}
                            className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors mb-2"
                          >
                            <span className="flex items-center gap-1.5">
                              قائمة المنتجات ({order.productsList?.length || 0})
                            </span>
                            {isProductsExpanded ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>

                          {isProductsExpanded && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                              {order.productsList &&
                              order.productsList.length > 0 ? (
                                order.productsList.map(
                                  (product: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-muted/50 p-2.5 rounded-xl border border-border/50"
                                    >
                                      <div className="flex items-center gap-2.5 text-right">
                                        <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                                          {product.p_qu}x
                                        </span>
                                        <p className="text-[10px] sm:text-[11px] font-bold text-foreground">
                                          {product.p_name}
                                        </p>
                                      </div>
                                      <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground font-mono">
                                        {Number(product.p_cost) *
                                          Number(product.p_qu)}{" "}
                                        ج.س
                                      </span>
                                    </div>
                                  ),
                                )
                              ) : (
                                <p className="text-[9px] font-bold text-center text-muted-foreground py-2 italic">
                                  لا توجد منتجات مسجلة لهذا الطلب
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Comms Grid */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                          <Link
                            href={`tel:${order.shippingInfo?.phone}`}
                            className="py-2.5 rounded-xl bg-muted border border-border text-center text-[9px] sm:text-[10px] font-black uppercase text-foreground flex items-center justify-center gap-1.5"
                          >
                            <Phone size={10} /> مكالمة صوتية
                          </Link>
                          <Link
                            href={`https://wa.me/${(order.shippingInfo?.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            className="py-2.5 rounded-xl bg-success text-white text-center text-[9px] sm:text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-success/10"
                          >
                            <MessageSquare size={10} /> واتساب
                          </Link>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <button
                        onClick={() => setOrderToConfirm(order)}
                        className="w-full py-3 bg-secondary text-white font-black text-[10px] sm:text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-1.5 hover:bg-black transition-all border-t border-border"
                      >
                        إتمام التسليم <ChevronLeft size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
