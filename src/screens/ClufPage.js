import React, { useLayoutEffect } from "react";
import { useThemeContext } from "../ThemeProvider";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";

export default function ClufPage({ navigation }) {
  const { isDarkMode } = useThemeContext();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem("clufAccepted", "true");
            navigation.goBack();
          }}
          style={{
            marginRight: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#10B981",
              marginLeft: 4,
              fontFamily: "Inter_500Medium",
            }}
          >
            {i18n.t("accepter")}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  const titleStyle = {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    color: isDarkMode ? "#FFFFFF" : "#111827",
    marginBottom: 8,
  };

  const bodyStyle = {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: isDarkMode ? "#D1D5DB" : "#374151",
    marginBottom: 16,
    lineHeight: 24,
  };

  const sectionTitleStyle = {
    fontFamily: "Inter_500Medium",
    fontWeight: "600",
    color: isDarkMode ? "#FFFFFF" : "#111827",
    marginBottom: 8,
  };

  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraHeight={200}
      style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : "#F3F4F6" }}
    >
      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDarkMode ? "#374151" : "#E5E7EB",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={titleStyle}>
              {i18n.t("contrat_de_licence_utilisateur_final_cluf")}
            </Text>
            <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
          </View>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              marginBottom: 16,
            }}
          >
            {i18n.t("cluf_maj_date")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("ce_contrat_de_licence_utilisateur_final_cluf_constitue_un_accord_legal_entre_toi_utilisateur_et_connect_move_concedant_de_licence_concernant_lutilisation_de_lapplication_mobile_connect_move")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_objet")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("lapplication_connect_move_est_concedee_sous_licence_non_vendue")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_octroi_licence")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("connect_move_taccorde_une_licence_personnelle_non_exclusive_non_transferable_et_revocable_dutilisation_de_lapplication_sur_tes_appareils_pour_un_usage_strictement_personnel_et_non_commercial_conformement_a_ce_cluf")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_propriete_intellectuelle")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("tous_les_droits_titres_et_interets_relatifs_a_lapplication_y_compris_son_code_ses_contenus_et_ses_elements_graphiques_restent_la_propriete_exclusive_de_connect_move")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_restrictions_utilisation")}
          </Text>
          <Text style={bodyStyle}>
            Tu t'engages à ne pas :{"\n"}- Copier, modifier, distribuer, vendre,
            louer ou transférer tout ou partie de l'application à des tiers.
            {"\n"}- Pratiquer l'ingénierie inverse, décompiler, désassembler ou
            tenter d'obtenir le code source de l'application.
            {"\n"}- Utiliser l'application à des fins illégales ou contraires
            aux lois en vigueur.
            {"\n"}- Utiliser l'application d'une manière susceptible de porter
            atteinte à Connect & Move ou à des tiers.
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_limitation_responsabilite")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("lapplication_est_fournie_telle_quelle_sans_garantie_daucune_sorte")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_resiliation")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("ce_cluf_est_en_vigueur_jusqua_sa_resiliation")}
            {i18n.t("connect_move_peut_resilier_la_licence_a_tout_moment_en_cas_de_non_respect_des_termes_du_cluf")}
            {i18n.t("en_cas_de_resiliation_tu_dois_cesser_toute_utilisation_de_lapplication_et_la_supprimer_de_tes_appareils")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_modifications")}
          </Text>
          <Text style={bodyStyle}>
            {i18n.t("connect_move_se_reserve_le_droit_de_modifier_le_cluf_a_tout_moment")}
            {i18n.t("toute_modification_sera_publiee_sur_cette_page")}
            {i18n.t("il_tappartient_de_consulter_regulierement_le_cluf")}
          </Text>
          <Text style={sectionTitleStyle}>
            {i18n.t("cluf_droit_applicable")}
          </Text>
          <Text style={[bodyStyle, { marginBottom: 8 }]}>
            {i18n.t("ce_cluf_est_regi_par_le_droit_francais")}
            {i18n.t("tout_litige_relatif_a_son_interpretation_ou_a_son_execution_releve_des_tribunaux_competents")}
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
