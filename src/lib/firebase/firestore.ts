import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  DocumentData,
  doc,
  getDoc,
  setDoc,
deleteDoc,
} from "firebase/firestore";
import { app } from "./client";
import {
  NewPriceEntryInput,
  PriceEntry,
  CategoryId,
} from "@/types/priceEntry";
import { UserProfile } from "@/types/user";

const db = getFirestore(app);

// ---------- Collections & document helpers ----------

// пер-потребителни записи
const userEntriesCollection = (userId: string) =>
  collection(db, "users", userId, "entries");

// глобални записи
const globalEntriesCollection = collection(db, "entries");

// потребителски профил
const userDocRef = (userId: string) => doc(db, "users", userId);

// семейства
const familiesCollectionRef = collection(db, "families");
const familyMembersCollection = (familyId: string) =>
  collection(db, "families", familyId, "members");
const familyMemberDocRef = (familyId: string, userId: string) =>
  doc(db, "families", familyId, "members", userId);

// ---------- Price entries ----------

/**
 * Създава нов запис (entry) за даден потребител:
 * - 1) под users/{userId}/entries
 * - 2) в глобалната колекция entries
 */
export async function addPriceEntry(
  userId: string,
  data: NewPriceEntryInput
): Promise<string> {
  // ключ за продукта – за групиране и URL
  const productKey = data.productName.trim().toLowerCase();

  const baseData = {
    ...data,
    userId,
    productKey,
    date: Timestamp.fromDate(data.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 1) запис под потребителя
  const userDocRef = await addDoc(userEntriesCollection(userId), baseData);

  // 2) запис в глобалната колекция – пазим и userEntryId
  const globalDocRef = await addDoc(globalEntriesCollection, {
    ...baseData,
    userEntryId: userDocRef.id,
  });

  // 3) връзка обратно към глобалния запис
  await setDoc(
    userDocRef,
    { globalEntryId: globalDocRef.id },
    { merge: true }
  );

  return userDocRef.id;
}
/**
 * Изтрива запис на потребител + свързания глобален запис (ако има такъв).
 */
export async function deletePriceEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const userEntryRef = doc(db, "users", userId, "entries", entryId);
  const userSnap = await getDoc(userEntryRef);

  let globalEntryId: string | undefined;

  if (userSnap.exists()) {
    const data = userSnap.data() as any;
    globalEntryId = data.globalEntryId as string | undefined;
  }

  // 1) трием потребителския запис
  await deleteDoc(userEntryRef);

  // 2) ако знаем кой е глобалният запис – трием и него
  if (globalEntryId) {
    const globalRef = doc(db, "entries", globalEntryId);
    try {
      await deleteDoc(globalRef);
    } catch (err) {
      // ако вече е изтрит или няма права – не искаме да чупим UI
      console.error("Грешка при триене на глобален запис:", err);
    }
  }
}


/**
 * Взима всички записи за даден потребител, по избор филтрирани по категория
 */
export async function getPriceEntries(
  userId: string,
  options?: { category?: CategoryId }
): Promise<PriceEntry[]> {
  const colRef = userEntriesCollection(userId);

  let q;
  if (options?.category != null) {
    // само where, без orderBy – иначе иска индекс
    q = query(colRef, where("category", "==", options.category));
  } else {
    q = query(colRef, orderBy("date", "desc"));
  }

  const snapshot = await getDocs(q);
  const result = snapshot.docs.map((docSnap) =>
    mapDocToPriceEntry(docSnap.id, docSnap.data(), userId)
  );

  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
}

/**
 * Взима записи на всички потребители (от глобалната entries колекция),
 * по избор филтрирани по категория
 */
export async function getAllPriceEntries(
  options?: { category?: CategoryId }
): Promise<PriceEntry[]> {
  const colRef = globalEntriesCollection;

  let q;
  if (options?.category != null) {
    q = query(colRef, where("category", "==", options.category));
  } else {
    q = query(colRef, orderBy("date", "desc"));
  }

  const snapshot = await getDocs(q);

  const result = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const userId = data.userId as string;
    return mapDocToPriceEntry(docSnap.id, data, userId);
  });

  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
}
/**
 * Връща всички записи за даден продукт (по productKey) от глобалната колекция.
 * После на фронта ще филтрираме по обхват: "mine" | "family" | "all".
 */
export async function getProductEntriesByKey(
  productKey: string
): Promise<PriceEntry[]> {
  const colRef = globalEntriesCollection;

  // само where, без orderBy – за да не изисква индекс
  const q = query(colRef, where("productKey", "==", productKey));

  const snapshot = await getDocs(q);

  const result = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const userId = data.userId as string;
    return mapDocToPriceEntry(docSnap.id, data, userId);
  });

  // сортираме локално по дата във възходящ ред (за графиката)
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

/**
 * Взима записи за цялото семейство на даден потребител.
 * Ако няма familyId, връща само неговите записи.
 */
export async function getFamilyEntriesForUser(
  userId: string,
  options?: { category?: CategoryId }
): Promise<PriceEntry[]> {
  try {
    const profile = await getUserProfile(userId);
    const familyId = profile?.familyId;

    // ако няма семейство -> просто моите записи
    if (!familyId) {
      return getPriceEntries(userId, options);
    }

    const membersSnap = await getDocs(familyMembersCollection(familyId));
    const memberIds = membersSnap.docs.map((d) => d.id);

    // ако по някаква причина няма членове в колекцията, броим само мен
    if (memberIds.length === 0) {
      return getPriceEntries(userId, options);
    }

    // за всеки член на семейството взимаме неговите записи
    const allResults = await Promise.all(
      memberIds.map((memberId) =>
        getPriceEntries(memberId, options).catch((err) => {
          console.error(
            "Грешка при зареждане на записи за член на семейството",
            memberId,
            err
          );
          return [];
        })
      )
    );

    const flat = allResults.flat();
    flat.sort((a, b) => b.date.getTime() - a.date.getTime());
    return flat;
  } catch (err) {
    console.error("getFamilyEntriesForUser error, fallback към моите записи", err);
    // ако нещо гръмне (rules, permissions и т.н.) -> поне върни моите записи
    return getPriceEntries(userId, options);
  }
}


/**
 * Помощна функция – мапва Firestore данните към PriceEntry тип
 */
function mapDocToPriceEntry(
  id: string,
  data: DocumentData,
  userId: string
): PriceEntry {
  const dateField = data.date as Timestamp | undefined;
  const createdAtField = data.createdAt as Timestamp | undefined;
  const updatedAtField = data.updatedAt as Timestamp | undefined;

  return {
    id,
    userId,
    category: data.category as CategoryId,
    productName: data.productName ?? "",
    packageSize: data.packageSize ?? "",
    store: data.store ?? "",
    price: data.price ?? 0,
    date: dateField ? dateField.toDate() : new Date(0),
    createdAt: createdAtField ? createdAtField.toDate() : null,
    updatedAt: updatedAtField ? updatedAtField.toDate() : null,
    note: data.note ?? "",
  };
}

// ---------- User profiles ----------

export async function ensureUserProfile(user: {
  uid: string;
  email: string | null;
}): Promise<UserProfile> {
  const ref = userDocRef(user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email ?? "",
      createdAt: serverTimestamp(),
    });

    return {
      id: user.uid,
      email: user.email ?? "",
      familyId: null,
      createdAt: new Date(),
    };
  } else {
    const data = snap.data() as any;
    return {
      id: user.uid,
      email: data.email ?? user.email ?? "",
      familyId: data.familyId ?? null,
      createdAt: data.createdAt
        ? (data.createdAt as Timestamp).toDate()
        : null,
    };
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = userDocRef(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  return {
    id: userId,
    email: data.email ?? "",
    familyId: data.familyId ?? null,
    createdAt: data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : null,
  };
}

// ---------- Families ----------

/**
 * Създава семейство за даден потребител:
 * - families/{familyId}
 * - families/{familyId}/members/{userId}
 * - users/{userId}.familyId
 */
export async function createFamilyForUser(userId: string): Promise<string> {
  const familyRef = await addDoc(familiesCollectionRef, {
    ownerId: userId,
    createdAt: serverTimestamp(),
  });

  const familyId = familyRef.id;

  await setDoc(
    familyMemberDocRef(familyId, userId),
    { joinedAt: serverTimestamp() },
    { merge: true }
  );

  await setDoc(userDocRef(userId), { familyId }, { merge: true });

  return familyId;
}

/**
 * Присъединява потребител към съществуващо семейство
 */
export async function joinFamily(userId: string, familyId: string): Promise<void> {
  await setDoc(
    familyMemberDocRef(familyId, userId),
    { joinedAt: serverTimestamp() },
    { merge: true }
  );
  await setDoc(userDocRef(userId), { familyId }, { merge: true });
}
