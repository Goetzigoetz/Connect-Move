import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FORM_STORAGE_KEY = '@event_form_draft';

/**
 * Vérifie si les données du formulaire contiennent des informations saisies par l'utilisateur
 * @param {Object} formData - Les données du formulaire
 * @returns {boolean} True si le formulaire contient des données utilisateur
 */
const hasActualData = (formData) => {
  return (
    (formData.title && formData.title.trim().length > 0) ||
    (formData.description && formData.description.trim().length > 0) ||
    (formData.date && formData.date.length > 0) ||
    (formData.time && formData.time.length > 0) ||
    (formData.categoryId && formData.categoryId.length > 0) ||
    (formData.location && formData.location.length > 0) ||
    (formData.endPointName && formData.endPointName.trim().length > 0) ||
    (formData.images && formData.images.length > 0) ||
    (formData.price && Number(formData.price) > 0) ||
    (formData.maxParticipants && Number(formData.maxParticipants) !== 2)
  );
};

/**
 * Hook personnalisé pour sauvegarder automatiquement les données du formulaire
 * @param {Object} formData - Les données du formulaire à sauvegarder
 * @param {boolean} shouldSave - Indique si la sauvegarde automatique est activée
 */
export const useFormPersistence = (formData, shouldSave = true) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!shouldSave) return;

    // Debounce: attendre 1 seconde après la dernière modification avant de sauvegarder
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        // Ne sauvegarder que si le formulaire contient des données réelles
        if (!hasActualData(formData)) {
          console.log('Aucune donnée utilisateur à sauvegarder');
          return;
        }

        const dataToSave = {
          ...formData,
          savedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('Formulaire sauvegardé automatiquement');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du formulaire:', error);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, shouldSave]);
};

/**
 * Récupère le brouillon sauvegardé du formulaire
 * @returns {Promise<Object|null>} Les données sauvegardées ou null
 */
export const getFormDraft = async () => {
  try {
    const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('Brouillon récupéré:', parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du brouillon:', error);
    return null;
  }
};

/**
 * Supprime le brouillon sauvegardé
 */
export const clearFormDraft = async () => {
  try {
    await AsyncStorage.removeItem(FORM_STORAGE_KEY);
    console.log('Brouillon supprimé');
  } catch (error) {
    console.error('Erreur lors de la suppression du brouillon:', error);
  }
};

/**
 * Vérifie si un brouillon existe
 * @returns {Promise<boolean>}
 */
export const hasDraft = async () => {
  try {
    const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
    return savedData !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification du brouillon:', error);
    return false;
  }
};
