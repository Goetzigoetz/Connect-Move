
import moment from "moment";
import { db } from "../../config/firebase";
import { addDoc, collection } from "@react-native-firebase/firestore";


export default async function sendNotifs(user, message) {
  console.log("=== sendNotifs appelé ===");
  console.log("user:", JSON.stringify(user, null, 2));
  console.log("message:", JSON.stringify(message, null, 2));

  // Vérification des paramètres requis
  if (!user || !user.id) {
    console.error("sendNotifs: user ou user.id manquant", { user, message });
    return;
  }

  if (!message || !message.title || !message.desc) {
    console.error("sendNotifs: message incomplet", { user, message });
    return;
  }

  // Préparer la notification push
  const MESSAGE = {
    to: user.expoPushToken,
    sound: "default",
    title: `${message.title}`,
    body: `${message.desc}`,
  };

  // Données à enregistrer dans Firestore
  const DATA_TO_ADD = {
    title: `${message.title}`,
    text: `${message.desc}`,
    userId: `${user.id}`,
    isNew: true,
    type: message.type || null,
    createdAt: moment().format(),
  };

  console.log("DATA_TO_ADD:", JSON.stringify(DATA_TO_ADD, null, 2));

  // 1. Enregistrer dans Firestore (notification in-app)
  try {
    console.log("Tentative d'enregistrement Firestore...");
    const notifRef = await addDoc(collection(db, "notifications"), DATA_TO_ADD);
    console.log("✅ Notification Firestore enregistrée avec ID:", notifRef.id, "pour userId:", user.id);
  } catch (firestoreError) {
    console.error("❌ Erreur Firestore addDoc:", firestoreError);
    console.error("Firestore error code:", firestoreError?.code);
    console.error("Firestore error message:", firestoreError?.message);
  }

  // 2. Envoi de la notification push si token disponible (indépendant de Firestore)
  if (user.expoPushToken) {
    try {
      console.log("Tentative d'envoi push notification...");
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(MESSAGE),
      });

      const result = await response.json();
      console.log("✅ Notification push envoyée:", result);
    } catch (pushError) {
      console.error("❌ Erreur push notification:", pushError);
    }
  } else {
    console.log("⚠️ Pas de token Expo pour userId:", user.id);
  }

  console.log("=== sendNotifs terminé ===");
}
