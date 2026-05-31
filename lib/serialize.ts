/**
 * Recursively serializes Firestore data to plain objects.
 * Converts Timestamp objects and Date instances to ISO strings,
 * which are safe for Server Components to pass to Client Components.
 */
export function serializeData<T>(val: T): T {
  if (val === null || val === undefined) {
    return val;
  }

  // Check for Firestore Timestamp
  if (typeof (val as any).toDate === "function") {
    return (val as any).toDate().toISOString() as any;
  }

  // Check for standard Date object
  if (val instanceof Date) {
    return val.toISOString() as any;
  }

  // Handle Arrays
  if (Array.isArray(val)) {
    return val.map((item) => serializeData(item)) as any;
  }

  // Handle Objects
  if (typeof val === "object") {
    const res: any = {};
    for (const key of Object.keys(val)) {
      res[key] = serializeData((val as any)[key]);
    }
    return res as T;
  }

  return val;
}
