"use server";

import { driversRef } from "@/lib/firebase";
import { doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Driver, UserData } from "@/types/userTypes";
import { serializeData } from "@/lib/serialize";

/**
 * GET: Returns user data including shipping info
 */
export async function getUser(email: string): Promise<UserData | null> {
  if (!email) return null;
  console.log("get user from server", email);

  try {
    const snap = await getDoc(doc(driversRef, email));
    if (!snap.exists()) return null;

    const user = {
      ...snap.data(),
      email: snap.id,
    } as UserData;
    return serializeData(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export async function getDriverInfo(
  email: string | undefined,
): Promise<Driver | null> {
  if (!email) return null;
  console.log("get driver info from server", email);

  try {
    const snap = await getDocs(query(driversRef, where("email", "==", email)));
    if (!snap.docs.length) return null;

    const driver = {
      ...snap.docs[0].data(),
      id: snap.docs[0].id,
    } as Driver;
    return serializeData(driver);
  } catch (error) {
    console.error("Error fetching driver info:", error);
    return null;
  }
}

