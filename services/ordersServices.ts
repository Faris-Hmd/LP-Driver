"use server";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  WhereFilterOp,
  QueryConstraint,
  orderBy,
} from "firebase/firestore";
import { db, ordersRef } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { OrderData } from "@/types/productsTypes";

/**
 * UPDATE: Uses Partial<OrderData> to allow updating only specific fields safely
 */
export async function upOrder(
  id: string,
  data: Partial<OrderData>,
): Promise<void> {
  await updateDoc(doc(ordersRef, id), data as any);
  revalidatePath("/orders");
}

type OrderFilter = {
  field: keyof OrderData;
  op: WhereFilterOp;
  val: any;
};
export async function getOrdersWh(
  filters: OrderFilter[],
): Promise<OrderData[]> {
  try {
    // 1. Map our filter objects into Firestore where() constraints
    const constraints: QueryConstraint[] = filters.map((f) =>
      where(f.field as string, f.op, f.val),
    );

    // 2. Create the query with all constraints spread into the function
    const q = query(ordersRef, ...constraints);

    // 3. Execute
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      return {
        ...d.data(),
        id: d.id,
        deleveratstamp: "",
      } as OrderData;
    });
  } catch (error) {
    console.error("Firestore Query Error:", error);
    return [];
  }
}
