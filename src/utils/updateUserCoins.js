
import {  doc, updateDoc, increment } from "@react-native-firebase/firestore";
import { auth,db } from '../../config/firebase';

const updateUserCoins = async (userId, amount) => {
  if (!userId || typeof userId !== 'string') {
    console.error("L'ID utilisateur est invalide.");
    throw new Error("L'ID utilisateur est invalide.");
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    console.error("Le montant est invalide.");
    throw new Error("Le montant est invalide.");
  }

  const userDocRef = doc(db, "users", userId);

  try {
    await updateDoc(userDocRef, {
      pieces: increment(amount)
    });
    console.log(`Nombre de pièces mis à jour pour l'utilisateur ${userId}. Montant ajouté/retiré : ${amount}`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des pièces pour l'utilisateur ${userId}:`, error);
    throw error;
  }
};


export default updateUserCoins; 
