"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { getOrdersWh } from "@/services/ordersServices";
import { getDriverInfo } from "@/services/userServices";
import { useState, useMemo } from "react";
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

  const { data: orders, isLoading } = useSWR(
    driver?.id ? ["driver-orders", driver.id] : null,
    async ([, driverId]) =>
      await getOrdersWh([{ field: "driverId", op: "==", val: driverId }]),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

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

  if (!session || isLoading || driverLoading) {
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

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <header className="sticky top-0 z-50 bg-card px-4 py-4 border-b border-border shadow-sm">
        <div className="max-w-xl mx-auto flex flex-row items-center justify-between gap-3 text-center">
          <div className="text-right">
            <h1 className="text-xl font-black text-foreground uppercase tracking-tighter">
              سجل <span className="text-primary">العمليات</span>
            </h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
              {driver?.name?.split(" ")[0] || "السائق"} • أرشيف المحطة
            </p>
          </div>

          <div className="bg-muted px-4 py-1.5 rounded-full border border-border flex items-center justify-center">
            <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none mt-0.5">
              {processedOrders.length} مهمة منتهية
            </span>
          </div>
        </div>
      </header>

      {/* --- SORTING & FILTERS --- */}
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex bg-muted p-1 rounded-2xl border border-border">
          <button
            onClick={() => setSortBy("date")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
              sortBy === "date"
                ? "bg-card text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays size={14} />
            الأحدث
          </button>
          <button
            onClick={() => setSortBy("value")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
              sortBy === "value"
                ? "bg-card text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign size={14} />
            القيمة الأعلى
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        {processedOrders.length > 0 ? (
          <OrderHistory orders={processedOrders} />
        ) : (
          <div className="py-20 text-center opacity-40">
            <Package className="mx-auto mb-4" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
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
    <div className="space-y-4 pb-20">
      {orders.map((order) => {
        const isExpanded = expandedOrders.includes(order.id);

        return (
          <div
            key={order.id}
            className="bg-card border border-border rounded-3xl overflow-hidden transition-all hover:border-primary/30 shadow-sm"
          >
            {/* --- COLLAPSIBLE HEADER --- */}
            <div
              onClick={() => toggleOrderExpansion(order.id)}
              className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <div
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter italic border ${
                      order.status === "Delivered"
                        ? "border-success/20 text-success bg-success/5"
                        : "border-primary/20 text-primary bg-primary/5"
                    }`}
                  >
                    {order.status === "Delivered" ? "تم التوصيل" : order.status}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      العميل
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    الإجمالي
                  </p>
                  <p className="text-sm font-black text-success">
                    {order.totalAmount.toLocaleString("en-US") || 0} ج.س
                  </p>
                </div>
              </div>
            </div>

            {/* --- EXPANDED CONTENT --- */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Location & Time Grid */}
                <div className="pt-4 border-t border-dashed border-border space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                        العنوان
                      </p>
                      <p className="text-[11px] text-muted-foreground italic leading-tight">
                        {order.shippingInfo?.city}،{" "}
                        {order.shippingInfo?.address}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 p-3 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">
                          وقت الطلب
                        </span>
                        <Calendar size={12} className="text-muted-foreground" />
                      </div>
                      <p className="text-[10px] font-bold text-foreground text-right">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}{" "}
                        {new Date(order.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="bg-success/5 p-3 rounded-2xl border border-success/10">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[8px] font-black uppercase text-success/70">
                          وقت التوصيل
                        </span>
                        <Clock size={12} className="text-success/70" />
                      </div>
                      <p className="text-[10px] font-bold text-success text-right">
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
                <div className="bg-muted rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      تفاصيل الفاتورة
                    </span>
                    <Package size={12} className="text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {order.productsList.map((product: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-background/50 p-2.5 rounded-xl border border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded-lg text-[9px] font-black">
                            {product.p_qu}x
                          </span>
                          <span className="text-[11px] font-bold text-foreground">
                            {product.p_name}
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-foreground">
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
