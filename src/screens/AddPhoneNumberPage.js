import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import {
  PhoneAuthProvider,
  updatePhoneNumber,
} from "@react-native-firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";

const { width } = Dimensions.get("window");

const AddPhoneNumberPage = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();
  const user = auth.currentUser;

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [countryCode, setCountryCode] = useState("33");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("phone");
  const [resendTimer, setResendTimer] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (step === "code" && refs.current[0]) {
      refs.current[0].focus();
    }
  }, [step]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const formatPhoneNumber = (number) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "");
    // Remove leading zero if present
    const withoutLeadingZero = cleaned.replace(/^0/, "");
    return `+${countryCode}${withoutLeadingZero}`;
  };

  const handleCountryCodeChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    setCountryCode(cleaned);
  };

  const handlePhoneNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    setPhoneNumber(cleaned);
  };

  const phoneNumberValid = phoneNumber.length >= 8 && phoneNumber.length <= 15;
  const countryCodeValid = countryCode.length >= 1 && countryCode.length <= 3;

  const handleSendCode = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 6) {
      showMessage({
        message: t("phone_number_invalid"),
        type: "danger",
      });
      return;
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    setLoading(true);

    try {
      const confirmation = await auth.signInWithPhoneNumber(formattedNumber);
      showMessage({
        message: t("code_sent_success"),
        type: "success",
      });
      setConfirmationResult(confirmation);
      setStep("code");
      setResendTimer(90);
    } catch (error) {
      console.log(error);
      showMessage({
        message: error.message || t("error_sending_code"),
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerifyParam) => {
    const codeToVerify =
      typeof codeToVerifyParam === "string" ? codeToVerifyParam : code.join("");
    if (!/^\d{6}$/.test(codeToVerify)) {
      showMessage({
        message: t("code_must_be_6_digits"),
        type: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        codeToVerify
      );

      if (!user) {
        showMessage({ message: t("no_user_connected"), type: "danger" });
        setLoading(false);
        return;
      }

      try {
        await updatePhoneNumber(user, credential);
      } catch (error) {
        if (
          error.code === "auth/account-exists-with-different-credential" ||
          error.code === "auth/credential-already-in-use"
        ) {
          showMessage({
            message: t("phone_already_used"),
            type: "danger",
          });
          console.error("Credential already used:", error);
          setLoading(false);
          return;
        } else if (error.code === "auth/invalid-verification-code") {
          showMessage({
            message: t("invalid_verification_code"),
            type: "danger",
          });
          setLoading(false);
          return;
        } else {
          throw error;
        }
      }

      const formattedNumber = formatPhoneNumber(phoneNumber);
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await updateDoc(userDocRef, { phoneNumber: formattedNumber });
      } else {
        await setDoc(userDocRef, { phoneNumber: formattedNumber });
      }

      showMessage({
        message: t("phone_verified_success"),
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error verifying code:", error);
      showMessage({
        message: error.message || t("code_invalid_or_expired"),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendTimer(90);
    handleSendCode();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={150}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={step === "phone" ? 0.5 : 1}
              width={width - 48}
              height={6}
              color={COLORS.primary}
              unfilledColor={isDarkMode ? "#27272A" : "rgba(0, 0, 0, 0.1)"}
              borderWidth={0}
              borderRadius={3}
            />
            <Text style={[styles.stepText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
              {step === "phone" ? "1/2" : "2/2"}
            </Text>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : "#18181B" }]}>
              {step === "phone" ? t("add_phone_number") : t("verification_code")}
            </Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
              {step === "phone"
                ? t("phone_verification_description")
                : t("enter_code_received")}
            </Text>
          </View>

          {step === "phone" ? (
            <>
              {/* Phone Input Row */}
              <View style={styles.phoneInputRow}>
                {/* Country Code Box */}
                <View
                  style={[
                    styles.countryCodeInputWrapper,
                    {
                      borderColor:
                        countryCode.length === 0
                          ? isDarkMode ? "#27272A" : "rgba(0, 0, 0, 0.1)"
                          : countryCodeValid
                          ? "#10B981"
                          : "#EF4444",
                    },
                  ]}
                >
                  <Text style={styles.plusSymbol}>+</Text>
                  <TextInput
                    style={[styles.countryCodeInput, { color: isDarkMode ? "#18181B" : "#18181B" }]}
                    placeholder="33"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="numeric"
                    value={countryCode}
                    onChangeText={handleCountryCodeChange}
                    maxLength={3}
                  />
                </View>

                {/* Phone Number Box */}
                <View
                  style={[
                    styles.phoneNumberInputWrapper,
                    {
                      borderColor:
                        phoneNumber.length === 0
                          ? isDarkMode ? "#27272A" : "rgba(0, 0, 0, 0.1)"
                          : phoneNumberValid
                          ? "#10B981"
                          : "#EF4444",
                    },
                  ]}
                >
                  <Ionicons name="call-outline" size={22} color="#71717A" />
                  <TextInput
                    style={[styles.phoneNumberInput, { color: isDarkMode ? "#18181B" : "#18181B" }]}
                    placeholder="612345678"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    maxLength={15}
                  />
                </View>
              </View>

              {/* Current Phone Number Info */}
              {user?.phoneNumber && (
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.infoText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    {t("current_number")}: {user.phoneNumber}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    opacity: loading || !phoneNumberValid || !countryCodeValid ? 0.5 : 1,
                  },
                ]}
                onPress={handleSendCode}
                disabled={loading || !phoneNumberValid || !countryCodeValid}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: COLORS.primary }]}>
                    {t("send_code")}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Code Inputs */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (!refs.current) refs.current = [];
                      refs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      {
                        borderColor: digit
                          ? "#10B981"
                          : isDarkMode ? "#27272A" : "rgba(0, 0, 0, 0.1)",
                        color: isDarkMode ? "#18181B" : "#18181B",
                      },
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0}
                    onChangeText={(text) => {
                      const newCode = [...code];
                      newCode[index] = text;
                      setCode(newCode);

                      if (text && index < 5) {
                        refs.current[index + 1]?.focus();
                      } else if (text && index === 5) {
                        handleVerifyCode(newCode.join(""));
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (
                        nativeEvent.key === "Backspace" &&
                        !code[index] &&
                        index > 0
                      ) {
                        refs.current[index - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    opacity: loading || code.some((c) => c === "") ? 0.5 : 1,
                  },
                ]}
                onPress={() => handleVerifyCode(code.join(""))}
                disabled={loading || code.some((c) => c === "")}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: COLORS.primary }]}>
                    {t("verify")}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resendTimer > 0}
                style={styles.resendButton}
              >
                <Text
                  style={[
                    styles.resendText,
                    {
                      color: resendTimer > 0
                        ? "#A1A1AA"
                        : COLORS.primary,
                    },
                  ]}
                >
                  {resendTimer > 0
                    ? t("resend_code_in", { seconds: resendTimer })
                    : t("resend_code")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  // Progress bar
  progressContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  stepText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginTop: 12,
  },
  // Title section
  titleSection: {
    alignItems: "flex-start",
    marginBottom: 40,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: "left",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
  },
  // Phone input row
  phoneInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  countryCodeInputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plusSymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "#18181B",
    marginRight: 2,
  },
  countryCodeInput: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    flex: 1,
    textAlign: "center",
    padding: 0,
  },
  phoneNumberInputWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phoneNumberInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    flex: 1,
    marginLeft: 12,
    padding: 0,
  },
  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  // Submit button
  submitButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: 0.2,
  },
  // Code inputs
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  codeInput: {
    width: 45,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Resend button
  resendButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  resendText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});

export default AddPhoneNumberPage;
