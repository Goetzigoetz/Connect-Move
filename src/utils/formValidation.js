import i18n from "../../i18n";

/**
 * Validation des champs du formulaire de création d'événement
 */

export const validateStep1 = (data) => {
  const errors = {};

  // Validation du titre
  if (!data.title || !data.title.trim()) {
    errors.title = i18n.t("titre_obligatoire");
  } else if (data.title.length < 3) {
    errors.title = i18n.t("titre_min_3");
  } else if (data.title.length > 100) {
    errors.title = i18n.t("titre_max_100");
  }

  // Validation de la description
  if (!data.description || !data.description.trim()) {
    errors.description = i18n.t("description_obligatoire");
  } else if (data.description.length < 10) {
    errors.description = i18n.t("description_min_10");
  } else if (data.description.length > 500) {
    errors.description = i18n.t("description_max_500");
  }

  // Validation du nombre de participants
  if (!data.maxParticipants || data.maxParticipants < 2) {
    errors.maxParticipants = i18n.t("participants_min_2");
  }

  // Validation du prix (si pro)
  if (data.price !== undefined && data.price !== null) {
    const priceNum = Number(data.price);
    if (isNaN(priceNum)) {
      errors.price = i18n.t("prix_valide");
    } else if (priceNum < 0) {
      errors.price = i18n.t("prix_negatif");
    } else if (priceNum > 1000) {
      errors.price = i18n.t("prix_max_1000");
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep2 = (data) => {
  const errors = {};

  // Validation de la date
  if (!data.date || !data.date.trim()) {
    errors.date = i18n.t("date_obligatoire");
  } else {
    // Vérifier que la date est dans le futur
    const [day, month, year] = data.date.split("/");
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.date = i18n.t("date_passee");
    }
  }

  // Validation de l'heure
  if (!data.time || !data.time.trim()) {
    errors.time = i18n.t("heure_obligatoire");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep3 = (data) => {
  const errors = {};

  // Validation de la catégorie
  if (!data.categoryId || !data.categoryId.trim()) {
    errors.categoryId = i18n.t("selectionner_categorie");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep4 = (data) => {
  const errors = {};

  // Validation de l'adresse
  if (!data.location || !data.location.trim()) {
    errors.location = i18n.t("adresse_obligatoire");
  } else if (data.location.length < 5) {
    errors.location = i18n.t("adresse_courte");
  }

  // Validation des coordonnées
  if (!data.coordinates || !data.coordinates.latitude || !data.coordinates.longitude) {
    errors.coordinates = i18n.t("adresse_coordonnees");
  }

  // Validation du nom du lieu (optionnel mais si présent doit être valide)
  if (data.endPointName && data.endPointName.length > 100) {
    errors.endPointName = i18n.t("nom_lieu_max_100");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep5 = (data) => {
  const errors = {};

  // Les images sont optionnelles, mais si présentes doivent être valides
  if (data.images && data.images.length > 4) {
    errors.images = i18n.t("images_max_4");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validation complète de toutes les étapes
 */
export const validateAllSteps = (formData, userSUB) => {
  const step1Validation = validateStep1({
    ...formData,
    price: userSUB === 'pro' ? formData.price : undefined
  });

  const step2Validation = validateStep2(formData);
  const step3Validation = validateStep3(formData);
  const step4Validation = validateStep4(formData);
  const step5Validation = validateStep5(formData);

  const allErrors = {
    ...step1Validation.errors,
    ...step2Validation.errors,
    ...step3Validation.errors,
    ...step4Validation.errors,
    ...step5Validation.errors,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    stepValidations: {
      step1: step1Validation.isValid,
      step2: step2Validation.isValid,
      step3: step3Validation.isValid,
      step4: step4Validation.isValid,
      step5: step5Validation.isValid,
    },
  };
};
