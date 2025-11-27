import { auth } from "../../config/firebase";
import Purchases from "react-native-purchases";
import { API_URL } from "@env";

/**
 * Accorde un entitlement promotionnel via l'API PHP sécurisée
 *
 * IMPORTANT: Cette fonction appelle l'API backend qui détient
 * la clé secrète RevenueCat. JAMAIS de clé secrète côté client.
 *
 * @param {string} entitlementIdentifier - L'identifiant de l'entitlement (ex: "premium", "pro")
 * @param {number} durationInDays - La durée en jours
 * @param {string} duration - La durée RevenueCat ("daily", "weekly", "monthly", "yearly")
 * @returns {Promise<{success: boolean, error?: string, data?: any}>}
 */
const grantPromotionalEntitlement = async (
  entitlementIdentifier,
  durationInDays,
  duration
) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: "Utilisateur non authentifié"
      };
    }

    // Valider les paramètres
    if (!entitlementIdentifier || !durationInDays || !duration) {
      return {
        success: false,
        error: "Paramètres manquants pour accorder l'entitlement promotionnel"
      };
    }

    // Récupérer l'ID utilisateur RevenueCat
    const customerInfo = await Purchases.getCustomerInfo();
    const appUserId = customerInfo.originalAppUserId;

    if (!appUserId) {
      return {
        success: false,
        error: "Impossible de récupérer l'ID utilisateur RevenueCat"
      };
    }

    console.log(
      `Tentative d'octroi de l'entitlement '${entitlementIdentifier}' pour ${duration} à l'utilisateur ${appUserId}`
    );

    // Appeler l'API PHP sécurisée (même format que Step6 et ForgotPassword)
    const response = await fetch(`${API_URL}/grant_entitlement.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appUserId,
        entitlementIdentifier,
        durationInDays,
        duration,
        userId: currentUser.uid,
      }),
    });

    const responseText = await response.text();
    console.log("API Response:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Error - Raw response:", responseText);
      return {
        success: false,
        error: `Réponse invalide du serveur: ${responseText.substring(0, 200)}`
      };
    }

    if (response.ok && result.success) {
      console.log("Entitlement promotionnel accordé avec succès:", result);

      // Rafraîchir les infos RevenueCat localement
      await Purchases.syncPurchases();

      return {
        success: true,
        data: result
      };
    } else {
      console.error("Échec de l'octroi de l'entitlement:", result.error);
      return {
        success: false,
        error: result.error || "Échec de l'octroi de l'entitlement"
      };
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'appel API pour accorder l'entitlement:",
      error
    );

    return {
      success: false,
      error: error.message || "Une erreur est survenue"
    };
  }
};

export default grantPromotionalEntitlement;
