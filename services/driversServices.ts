"use server";

import { driversRef } from "@/lib/firebase";
import { getDocs, query, where } from "firebase/firestore";
import { Driver } from "@/types/userTypes";

/**
 * GET DRIVER BY EMAIL
 */
export async function getDriverByEmail(email: string): Promise<Driver | null> {
  try {
    const q = query(driversRef, where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...d.data(), id: d.id } as Driver;
  } catch (error) {
    console.error("Error fetching driver by email:", error);
    return null;
  }
}
