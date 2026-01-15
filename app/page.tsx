"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { getOrdersWh, upOrder } from "@/services/ordersServices";
import { getDriverByEmail } from "@/services/driversServices";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

  const {
    data: orders,
    isLoading: ordersLoading,
    mutate: mutateOrders,
  } = useSWR(
    driver?.id ? `driver-orders-${driver.id}` : null,
    () =>
      getOrdersWh([{ field: "driverId", op: "==", val: driver?.id as string }]),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

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
      mutateOrders();
    } catch (error) {
      toast.error("خطأ في الإرسال");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authStatus === "loading" || driverLoading || ordersLoading) {
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

  const activeOrders =
    orders?.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled",
    ) || [];

  return (
    <div
      className="min-h-screen bg-background pb-20 transition-colors duration-500"
      dir="rtl"
    >
      {/* --- CONFIRMATION MODAL --- */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl border border-border">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tighter">
                  تسليم الطلب إلى:
                </h3>
                <p className="text-xl font-black text-primary uppercase leading-tight">
                  {orderToConfirm.customer_name || "عميل زائر"}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                  رقم الطلب: #{orderToConfirm.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <div className="mt-8 space-y-2">
                <button
                  disabled={isSubmitting}
                  onClick={handleFinalHandover}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  تأكيد التسليم
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => setOrderToConfirm(null)}
                  className="w-full py-3 text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="bg-card px-4 py-4 border-b border-border sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex flex-row items-center justify-between gap-3 text-center">
          <h1 className="text-xl font-black text-foreground uppercase tracking-tighter">
            {driver?.name?.split(" ")[0] || "السائق"}{" "}
            <span className="text-primary">العمليات</span>
          </h1>
          <div className="bg-muted px-4 py-1.5 rounded-full border border-border flex items-center justify-center">
            <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none mt-0.5">
              {activeOrders.length} مهام نشطة
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
            المهام النشطة
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center border border-border">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <p className="text-sm font-black text-foreground uppercase tracking-tighter">
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
                  className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm transition-all"
                >
                  {/* --- COLLAPSIBLE TOP SECTION --- */}
                  <div
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="p-5 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                        مهمة رقم #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp
                            size={16}
                            className="text-muted-foreground"
                          />
                        ) : (
                          <ChevronDown
                            size={16}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">
                            المستلم
                          </p>
                          <p className="text-sm font-black text-foreground truncate uppercase tracking-tighter text-right">
                            {order.customer_name || "عميل زائر"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                          الإجمالي
                        </p>
                        <p className="text-sm font-black text-success">
                          {order.totalAmount.toLocaleString("en-US") || 0} ج.س
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- EXPANDABLE CONTENT --- */}
                  {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="px-5 pb-5 space-y-5">
                        {/* Location Details */}
                        <div className="flex items-start gap-3 pt-4 border-t border-dashed border-border">
                          <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5 text-right">
                              العنوان:{" "}
                              <span className="text-primary">
                                {order.shippingInfo?.city || "مدينة غير معروفة"}
                              </span>
                            </p>
                            <p className="text-[11px] font-bold text-muted-foreground leading-snug text-right">
                              {order.shippingInfo?.address || "لا يوجد عنوان"}
                            </p>

                            {/* Map Navigation Link */}
                            {order.shippingInfo?.googleMapsLink && (
                              <div className="flex justify-start">
                                <a
                                  href={order.shippingInfo.googleMapsLink}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-primary hover:text-white transition-all"
                                >
                                  <Navigation size={10} /> بدء الملاحة
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Product List (Nested) */}
                        <div className="border-t border-dashed border-border pt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProductExpansion(order.id);
                            }}
                            className="w-full flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors mb-2"
                          >
                            <span className="flex items-center gap-2">
                              قائمة المنتجات ({order.productsList?.length || 0})
                            </span>
                            {isProductsExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>

                          {isProductsExpanded && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                              {order.productsList &&
                              order.productsList.length > 0 ? (
                                order.productsList.map(
                                  (product: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border/50"
                                    >
                                      <div className="flex items-center gap-3 text-right">
                                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                                          {product.p_qu}x
                                        </span>
                                        <p className="text-[11px] font-bold text-foreground">
                                          {product.p_name}
                                        </p>
                                      </div>
                                      <span className="text-[10px] font-black text-muted-foreground font-mono">
                                        {Number(product.p_cost) *
                                          Number(product.p_qu)}{" "}
                                        ج.س
                                      </span>
                                    </div>
                                  ),
                                )
                              ) : (
                                <p className="text-[10px] font-bold text-center text-muted-foreground py-2 italic">
                                  لا توجد منتجات مسجلة لهذا الطلب
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Comms Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Link
                            href={`tel:${order.shippingInfo?.phone}`}
                            className="py-3 rounded-2xl bg-muted border border-border text-center text-[10px] font-black uppercase text-foreground flex items-center justify-center gap-2"
                          >
                            <Phone size={12} /> مكالمة صوتية
                          </Link>
                          <Link
                            href={`https://wa.me/${(order.shippingInfo?.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            className="py-3 rounded-2xl bg-success text-white text-center text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-success/10"
                          >
                            <MessageSquare size={12} /> واتساب
                          </Link>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <button
                        onClick={() => setOrderToConfirm(order)}
                        className="w-full py-4 bg-secondary text-white font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-black transition-all border-t border-border"
                      >
                        إتمام التسليم <ChevronLeft size={14} />
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
