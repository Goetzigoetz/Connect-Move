// VerifyCodeScreen.js
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { API_URL } from "@env";
import Loader from "../../components/Loader";
import { useTranslation } from "react-i18next";
import { NavigatorRefreshContext } from "../../navigation/Navigator";
import { useContext } from "react";
import { useThemeContext } from "../../ThemeProvider";

const CELL_COUNT = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmail({ navigation, route }) {
  const { t } = useTranslation();
  const refreshNavigator = useContext(NavigatorRefreshContext);
  const { isDarkMode } = useThemeContext();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const email = route?.params?.email || auth.currentUser?.email;

  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (code.length === CELL_COUNT) {
      handleValidate();
    }
  }, [code]);

  const handleValidate = async () => {
    if (code.length < CELL_COUNT || isLoading) {
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        showMessage({
          message: t("error"),
          description: t("userNotIdentified"),
          type: "danger",
          icon: "danger",
        });
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        showMessage({
          message: t("error"),
          description: t("userNotFound"),
          type: "danger",
          icon: "danger",
        });
        setIsLoading(false);
        return;
      }

      const userData = snap.data();
      const { verificationCode, isActive } = userData;

      if (verificationCode === code) {
        // Vérifier si le compte est actif
        if (!isActive) {
          showMessage({
            message: t("error"),
            description: "Votre compte est bloqué",
            type: "danger",
            icon: "danger",
          });
          setIsLoading(false);
          navigation.replace("BloqueCompte");
          return;
        }

        await updateDoc(userRef, {
          emailVerified: true,
          verificationCode: null,
        });

        setIsLoading(false);

        showMessage({
          message: t("success"),
          description: t("emailVerified"),
          type: "success",
          icon: "success",
        });

        // Attendre un peu pour laisser le message s'afficher puis recharger le Navigator
        setTimeout(() => {
          // Forcer le Navigator à re-vérifier l'état d'onboarding
          // Cela va déclencher checkOnboardingStatus() qui verra emailVerified = true
          // et affichera MainTabs au lieu de VerifyEmail
          if (refreshNavigator) {
            refreshNavigator();
          }
        }, 1500);
        return;
      } else {
        showMessage({
          message: t("error"),
          description: t("incorrectCode"),
          type: "danger",
          icon: "danger",
        });
        setCode("");
      }
    } catch (e) {
      console.error(e);
      showMessage({
        message: t("error"),
        description: t("technicalError"),
        type: "danger",
        icon: "danger",
      });
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || resendTimer > 0) {
      return;
    }

    setCanResend(false);
    setResendTimer(RESEND_COOLDOWN);

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      const response = await fetch(`${API_URL}/mail_verification.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          codeVerification: newCode,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.primary,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          verificationCode: newCode,
        });
      }

      showMessage({
        message: t("codeResent"),
        description: t("codeResentDesc"),
        type: "success",
        icon: "success",
      });
    } catch (error) {
      console.error(error);
      showMessage({
        message: t("error"),
        description: t("codeResendFailed"),
        type: "danger",
        icon: "danger",
      });
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{ alignItems: "center", marginBottom: 40 }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name="mail-outline" size={48} color={COLORS.primary} />
            </View>

            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 28,
                marginBottom: 12,
                textAlign: "center",
                color: isDarkMode ? "#FFFFFF" : "#111827",
              }}
            >
              {t("verifyYourEmail")}
            </Text>

            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                textAlign: "center",
                lineHeight: 22,
                color: isDarkMode ? "#9CA3AF" : "#4B5563",
                paddingHorizontal: 16,
              }}
            >
              {t("enterVerificationCode")}
              {"\n"}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                {email}
              </Text>
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ marginBottom: 32, position: "relative" }}
          >
            <CodeField
              ref={ref}
              {...props}
              value={code}
              onChangeText={setCode}
              cellCount={CELL_COUNT}
              rootStyle={{ marginBottom: 8 }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus
              editable={!isLoading}
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  onLayout={getCellOnLayoutHandler(index)}
                  key={index}
                  style={{
                    flex: 1,
                    height: 64,
                    marginHorizontal: 4,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isFocused
                      ? COLORS.primary
                      : symbol
                      ? COLORS.primary + "40"
                      : (isDarkMode ? "#374151" : "#E5E7EB"),
                    backgroundColor: isFocused
                      ? COLORS.primary + "08"
                      : (isDarkMode ? "#1F2937" : "#F9FAFB"),
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: isFocused ? COLORS.primary : "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isFocused ? 0.15 : 0,
                    shadowRadius: 8,
                    elevation: isFocused ? 4 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontFamily: "Inter_700Bold",
                      color: symbol ? (isDarkMode ? "#F9FAFB" : "#111827") : (isDarkMode ? "#6B7280" : "#9CA3AF"),
                    }}
                  >
                    {symbol ?? (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />

            {isLoading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
                  borderRadius: 16,
                }}
              >
                <Loader />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    marginTop: 8,
                    color: COLORS.primary,
                  }}
                >
                  {t("verifying")}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(400)}
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                marginBottom: 12,
                color: isDarkMode ? "#9CA3AF" : "#4B5563",
              }}
            >
              {t("didNotReceiveCode")}
            </Text>

            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                marginBottom: 16,
                textAlign: "center",
                color: isDarkMode ? "#6B7280" : "#6B7280",
              }}
            >
              {t("checkSpamFolder")}
            </Text>

            <Pressable
              onPress={handleResendCode}
              disabled={!canResend || resendTimer > 0}
              style={({ pressed }) => ({
                opacity:
                  !canResend || resendTimer > 0 ? 0.5 : pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 15,
                  color:
                    !canResend || resendTimer > 0 ? "#9CA3AF" : COLORS.primary,
                }}
              >
                {resendTimer > 0
                  ? t("resendCodeTimer", { seconds: resendTimer })
                  : t("resendCode")}
              </Text>
            </Pressable>

            {resendTimer > 0 && (
              <View
                style={{
                  marginTop: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#FEF3C7",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: "#92400E",
                    textAlign: "center",
                  }}
                >
                  {t("pleaseWait")}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
