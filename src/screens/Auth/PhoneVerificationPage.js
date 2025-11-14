import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { createUniqueUsername } from "../../utils/allFunctions";
import { COLORS } from "../../styles/colors";
import i18n from "../../../i18n";
import { signInWithPhoneNumber } from "@react-native-firebase/auth";
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { auth, db } from "../../../config/firebase";

const PhoneVerificationPage = ({ navigation }) => {
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("phone"); // "phone" ou "code"
  const [resendTimer, setResendTimer] = useState(0);
  const refs = useRef([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: "" });
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendCode = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 9) {
      showMessage({
        message: "Veuillez entrer un numéro français valide.",
        type: "danger",
      });
      return;
    }
    const formattedNumber = `+33${phoneNumber.replace(/\s/g, "").replace(/^0/, "")}`;
    setLoading(true);

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber);
      showMessage({
        message: "Un code de vérification vous a été envoyé par sms.",
        type: "success",
      });
      setConfirmationResult(confirmation);
      setStep("code");
      setResendTimer(90);
    } catch (error) {
      console.log(error);
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerify) => {
    if (codeToVerify.length !== 6 || codeToVerify.some((c) => c === "")) {
      showMessage({
        message: "Le code doit contenir 6 chiffres.",
        type: "danger",
      });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(codeToVerify.join(""));
      const userId = userCredential.user.uid;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          interests: [],
          username: createUniqueUsername("xyzabcde"),
          showMyProfile: true,
          phoneNumber: userCredential.user.phoneNumber,
          createdAt: moment().format(),
        });
      }
      showMessage({
        message: "Connexion réussie !",
        type: "success",
      });
      navigation.replace("Home");
    } catch (error) {
      console.error("Erreur lors de la vérification du code :", error);
      showMessage({
        message: "Le code est invalide ou expiré. Veuillez réessayer.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setCode(Array(6).fill(""));
    setStep("phone");
    setResendTimer(0);
    showMessage({
      message: "Veuillez renvoyer votre numéro de téléphone pour recevoir un nouveau code.",
      type: "info",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View entering={FadeInDown.duration(100)} className="flex-1 px-6 pt-8">
          {/* Header */}
          <View className="mb-8">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {step === "phone" ? "Numéro de téléphone" : "Vérification du code"}
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-500 dark:text-gray-400 text-lg"
            >
              {step === "phone"
                ? "Vous allez recevoir un code de vérification par SMS"
                : "Saisissez le code de vérification reçu par SMS"}
            </Text>
          </View>

          {step === "phone" ? (
            <Animated.View entering={FadeInDown.delay(100)}>
              <View className="py-3 bg-gray-50 dark:bg-gray-800 rounded px-4 mb-6 border border-gray-300 dark:border-gray-700">
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center rounded px-3 py-2">
                    <Image
                      source={require("../../../assets/img/fr.png")}
                      className="w-8 h-6 mr-2"
                    />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="text-gray-900 dark:text-white text-xl"
                    >
                      {i18n.t("+33")}
                    </Text>
                  </View>

                  <TextInput
                    style={{ fontFamily: "Inter_400Regular", marginTop: -5 }}
                    placeholder="6 12 34 56 78"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
                    className="flex-1 -mb-2 text-xl px-2 rounded text-gray-900 dark:text-white"
                  />
                </View>
              </View>

              <Pressable
                style={{
                  backgroundColor: COLORS.primary,
                  opacity: loading || phoneNumber.length < 9 ? 0.5 : 1,
                }}
                onPress={handleSendCode}
                disabled={loading || phoneNumber.length < 9}
                className="py-3 rounded flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">{i18n.t("OK")}</Text>
                )}
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100)} className="space-y-6">
              <View className="flex-row justify-between px-4">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (!refs.current) refs.current = [];
                      refs.current[index] = ref;
                    }}
                    style={{ width: 45, height: 56, fontSize: 24 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded text-center text-gray-900 dark:text-white font-bold border border-gray-300 dark:border-gray-700"
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => {
                      const newCode = [...code];
                      newCode[index] = text;
                      setCode(newCode);

                      if (text && index < 5) {
                        refs.current[index + 1]?.focus();
                      } else if (text && index === 5) {
                        handleVerifyCode(newCode);
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

              <Pressable
                style={{
                  backgroundColor: COLORS.primary,
                  opacity: loading || code.some((c) => c === "") ? 0.5 : 1,
                }}
                onPress={() => handleVerifyCode(code)}
                disabled={loading || code.some((c) => c === "")}
                className="mt-5 py-3 rounded flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {i18n.t("verifier")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleResendCode}
                disabled={resendTimer > 0}
                className="py-3 items-center justify-center"
              >
                <Text
                  className={`${
                    resendTimer > 0
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {resendTimer > 0
                    ? `Renvoyer le code dans ${resendTimer}s`
                    : "Renvoyer le code"}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-500 dark:text-gray-400 text-sm text-center mt-8"
          >
            {i18n.t(
              "en_continuant_vous_acceptez_de_recevoir_des_sms_de_verification"
            )}
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default PhoneVerificationPage;
