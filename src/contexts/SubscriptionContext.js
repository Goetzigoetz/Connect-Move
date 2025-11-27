import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Purchases from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";

// Types d'abonnement
export const SUBSCRIPTION_TYPES = {
  GRATUIT: "gratuit",
  PREMIUM: "premium",
  PRO: "pro",
};

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(SUBSCRIPTION_TYPES.GRATUIT);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSubscription(SUBSCRIPTION_TYPES.GRATUIT);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fonction pour déterminer le type d'abonnement depuis les entitlements RevenueCat
  const getSubTypeFromEntitlements = (entitlements) => {
    if (!entitlements) return SUBSCRIPTION_TYPES.GRATUIT;
    if (entitlements.pro) return SUBSCRIPTION_TYPES.PRO;
    if (entitlements.premium) return SUBSCRIPTION_TYPES.PREMIUM;
    return SUBSCRIPTION_TYPES.GRATUIT;
  };

  // Fonction principale de synchronisation avec RevenueCat
  const syncWithRevenueCat = useCallback(async (forceSync = false) => {
    if (!user) {
      setSubscription(SUBSCRIPTION_TYPES.GRATUIT);
      setIsLoading(false);
      return SUBSCRIPTION_TYPES.GRATUIT;
    }

    try {
      // Vérifier si on a besoin de sync (cache de 5 minutes sauf si forcé)
      const now = Date.now();
      if (!forceSync && lastSyncTime && (now - lastSyncTime) < 5 * 60 * 1000) {
        return subscription;
      }

      // 1. Récupérer l'état depuis RevenueCat (source de vérité)
      const purchaserInfo = await Purchases.getCustomerInfo();
      const entitlements = purchaserInfo.entitlements.active;
      const revenueCatSub = getSubTypeFromEntitlements(entitlements);

      // 2. Mettre à jour l'état local
      setSubscription(revenueCatSub);
      setLastSyncTime(now);

      // 3. Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem("sub", revenueCatSub);

      // 4. Mettre à jour Firebase (pour la cohérence multi-appareil)
      try {
        await updateDoc(doc(db, "users", user.uid), {
          sub: revenueCatSub,
          subUpdatedAt: serverTimestamp(),
        });
      } catch (firebaseError) {
        console.warn("Erreur mise à jour Firebase sub:", firebaseError);
        // On continue même si Firebase échoue - RevenueCat reste la source de vérité
      }

      setIsLoading(false);
      return revenueCatSub;
    } catch (error) {
      console.error("Erreur syncWithRevenueCat:", error);

      // Fallback: essayer de récupérer depuis AsyncStorage
      try {
        const storedSub = await AsyncStorage.getItem("sub");
        if (storedSub) {
          setSubscription(storedSub);
        }
      } catch (storageError) {
        console.error("Erreur AsyncStorage fallback:", storageError);
      }

      setIsLoading(false);
      return subscription;
    }
  }, [user, lastSyncTime, subscription]);

  // Fonction pour restaurer les achats
  const restorePurchases = useCallback(async () => {
    if (!user) return { success: false, message: "Non connecté" };

    try {
      setIsLoading(true);

      // Restaurer via RevenueCat
      const customerInfo = await Purchases.restorePurchases();
      const entitlements = customerInfo.entitlements.active;
      const restoredSub = getSubTypeFromEntitlements(entitlements);

      // Mettre à jour partout
      setSubscription(restoredSub);
      await AsyncStorage.setItem("sub", restoredSub);

      await updateDoc(doc(db, "users", user.uid), {
        sub: restoredSub,
        subUpdatedAt: serverTimestamp(),
      });

      setLastSyncTime(Date.now());
      setIsLoading(false);

      const hasActiveSubscription = restoredSub !== SUBSCRIPTION_TYPES.GRATUIT;
      return {
        success: true,
        restored: hasActiveSubscription,
        subscription: restoredSub,
        message: hasActiveSubscription
          ? `Abonnement ${restoredSub} restauré avec succès`
          : "Aucun abonnement à restaurer",
      };
    } catch (error) {
      console.error("Erreur restorePurchases:", error);
      setIsLoading(false);
      return { success: false, message: "Erreur lors de la restauration" };
    }
  }, [user]);

  // Fonction appelée après un achat réussi
  const onPurchaseComplete = useCallback(async (customerInfo) => {
    if (!user) return;

    try {
      const entitlements = customerInfo.entitlements.active;
      const newSub = getSubTypeFromEntitlements(entitlements);

      // Mettre à jour partout immédiatement
      setSubscription(newSub);
      await AsyncStorage.setItem("sub", newSub);

      await updateDoc(doc(db, "users", user.uid), {
        sub: newSub,
        subUpdatedAt: serverTimestamp(),
      });

      setLastSyncTime(Date.now());
      return newSub;
    } catch (error) {
      console.error("Erreur onPurchaseComplete:", error);
      // Force une re-sync complète en cas d'erreur
      return await syncWithRevenueCat(true);
    }
  }, [user, syncWithRevenueCat]);

  // Fonction pour forcer une synchronisation complète
  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Synchroniser les achats avec RevenueCat (pour les achats hors app)
      await Purchases.syncPurchases();
    } catch (e) {
      console.warn("syncPurchases error:", e);
    }
    return await syncWithRevenueCat(true);
  }, [syncWithRevenueCat]);

  // Initialisation et login RevenueCat quand l'utilisateur change
  useEffect(() => {
    const initSubscription = async () => {
      if (!user) {
        setSubscription(SUBSCRIPTION_TYPES.GRATUIT);
        setIsLoading(false);
        return;
      }

      try {
        // Login RevenueCat avec l'UID Firebase
        await Purchases.logIn(user.uid);

        // Sync initial
        await syncWithRevenueCat(true);
      } catch (error) {
        console.error("Erreur initSubscription:", error);
        setIsLoading(false);
      }
    };

    initSubscription();
  }, [user]);

  // Écouter les changements Firebase en temps réel (pour sync multi-appareil)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const firebaseSub = snapshot.data()?.sub;
          // Si Firebase a une valeur différente, on force une re-sync avec RevenueCat
          if (firebaseSub && firebaseSub !== subscription) {
            syncWithRevenueCat(true);
          }
        }
      },
      (error) => {
        console.warn("Erreur listener Firebase sub:", error);
      }
    );

    return () => unsubscribe();
  }, [user, subscription, syncWithRevenueCat]);

  // Helpers
  const isPremium = subscription === SUBSCRIPTION_TYPES.PREMIUM;
  const isPro = subscription === SUBSCRIPTION_TYPES.PRO;
  const isPremiumOrPro = isPremium || isPro;
  const isGratuit = subscription === SUBSCRIPTION_TYPES.GRATUIT;

  const value = {
    // État
    subscription,
    isLoading,

    // Helpers booléens
    isPremium,
    isPro,
    isPremiumOrPro,
    isGratuit,

    // Actions
    syncWithRevenueCat,
    restorePurchases,
    onPurchaseComplete,
    forceRefresh,

    // Constantes
    SUBSCRIPTION_TYPES,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

export default SubscriptionContext;
