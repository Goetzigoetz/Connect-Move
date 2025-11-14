import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
} from "@react-native-firebase/firestore";

import Purchases from 'react-native-purchases';
import { auth,db } from "../../config/firebase";

// Récupération du nom du plan actif depuis RevenueCat
export async function getActivePlanKey() {
  const customerInfo = await Purchases.getCustomerInfo();
  if (customerInfo?.entitlements?.active?.premium) return 'premium';
  if (customerInfo?.entitlements?.active?.pro) return 'pro';
  return 'gratuit';
}

// Récupère les features du plan courant depuis Firestore
export async function getPlanFeaturesFS() {
  const docRef = doc(db, "app_config", "plan_features");
  const docSnap = await getDoc(docRef);
  const data = docSnap.exists() ? docSnap.data() : {};
  const planKey = await getActivePlanKey();
  return data[planKey] || {};
}

// Vérifie si la feature est accessible (quota pas dépassé ou illimité)
export async function checkFeatureAccessFS(userId, featureKey) {
  const features = await getPlanFeaturesFS();
  const limit = features[featureKey];
  if (limit === null || limit === undefined) return true;

  const today = new Date().toISOString().slice(0, 10);
  const usageQuery = query(
    collection(db, "usage_logs"),
    where("user_id", "==", userId),
    where("feature_key", "==", featureKey),
    where("date", "==", today)
  );
  const usageSnapshot = await getDocs(usageQuery);

  let usedCount = 0;
  if (!usageSnapshot.empty) {
    usedCount = usageSnapshot.docs[0].data().used_count || 0;
  }
  return usedCount < limit;
}

// Incrémente le compteur d'usage pour une feature
export async function incrementFeatureUsageFS(userId, featureKey) {
  const today = new Date().toISOString().slice(0, 10);
  const usageLogsRef = collection(db, "usage_logs");
  const usageQuery = query(
    usageLogsRef,
    where("user_id", "==", userId),
    where("feature_key", "==", featureKey),
    where("date", "==", today)
  );
  const usageSnapshot = await getDocs(usageQuery);

  if (usageSnapshot.empty) {
    await addDoc(usageLogsRef, {
      user_id: userId,
      feature_key: featureKey,
      used_count: 1,
      date: today,
    });
  } else {
    const docRef = usageSnapshot.docs[0].ref;
    await docRef.update({
      used_count: increment(1),
    });
  }
}
