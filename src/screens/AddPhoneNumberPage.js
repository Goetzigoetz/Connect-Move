import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  PhoneAuthProvider,
  updatePhoneNumber,
  linkWithCredential,
  signInWithPhoneNumber,
} from "@react-native-firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const AddPhoneNumberPage = ({ navigation }) => {
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("phone"); // "phone" / "code"
  const [resendTimer, setResendTimer] = useState(0);
  const refs = useRef([]);
  const user = auth.currentUser;

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

  const handleSendCode = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 9) {
      showMessage({
        message: "Veuillez entrer un numéro français valide.",
        type: "danger",
      });
      return;
    }

    const formattedNumber = `+33${phoneNumber
      .replace(/\s/g, "")
      .replace(/^0/, "")}`;
    setLoading(true);

    try {
      // Envoi code sans recaptcha (Firebase gère en interne)
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber);
      showMessage({
        message: "Un code de vérification vous a été envoyé par SMS.",
        type: "success",
      });
      setConfirmationResult(confirmation);
      setStep("code");
      setResendTimer(90);
    } catch (error) {
      console.log(error);
      showMessage({ message: error.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerifyParam) => {
    const codeToVerify =
      typeof codeToVerifyParam === "string" ? codeToVerifyParam : code.join("");
    if (!/^\d{6}$/.test(codeToVerify)) {
      showMessage({
        message: "Le code doit contenir 6 chiffres.",
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
        showMessage({ message: "Aucun utilisateur connecté.", type: "danger" });
        setLoading(false);
        return;
      }

      try {
        // Tentative de mise à jour du numéro
        await updatePhoneNumber(user, credential);
      } catch (error) {
        if (
          error.code === "auth/account-exists-with-different-credential" ||
          error.code === "auth/credential-already-in-use"
        ) {
          // ici le lien automatique échoue
          showMessage({
            message:
              "Ce numéro de téléphone est déjà lié à un autre compte. Veuillez vous connecter avec ce compte ou utiliser un autre numéro.",
            type: "danger",
          });
          console.error("Crédential déjà utilisé par un autre compte :", error);
          return;
        } else if (error.code === "auth/invalid-verification-code") {
          showMessage({
            message: "Code de vérification invalide.",
            type: "danger",
          });
          return;
        } else {
          throw error;
        }
      }

      const formattedNumber = `+33${phoneNumber
        .replace(/\s/g, "")
        .replace(/^0/, "")}`;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await updateDoc(userDocRef, { phoneNumber: formattedNumber });
      } else {
        // Si le document n'existe pas, on peut le créer
        await setDoc(userDocRef, { phoneNumber: formattedNumber });
      }

      showMessage({
        message: "Votre numéro de téléphone a été vérifié et mis à jour.",
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur vérification code :", error);
      showMessage({
        message: error.message || "Le code est invalide ou expiré.",
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
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
      >
        <Animated.View
          entering={FadeInDown.duration(100)}
          className="flex-1 px-6 pt-8"
        >
          {/* Titre */}
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {step === "phone" ? "Numéro de téléphone" : "Vérification du code"}
          </Text>

          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-500 dark:text-gray-400 text-lg mb-8"
          >
            {step === "phone"
              ? "Vous allez recevoir un code de vérification par SMS"
              : "Saisissez le code reçu"}
          </Text>

          {step === "phone" ? (
            <Animated.View entering={FadeInDown.delay(100)}>
              <View className="py-3 bg-gray-50 dark:bg-gray-800 rounded px-4 mb-2 border border-gray-300 dark:border-gray-700">
                <View className="flex-row items-center space-x-3">
                  <Image
                    source={require("../../assets/img/fr.png")}
                    className="w-8 h-6 mr-2"
                  />
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="text-gray-900 dark:text-white text-xl"
                  >
                    {i18n.t("+33")}
                  </Text>

                  <TextInput
                    style={{ fontFamily: "Inter_400Regular", marginTop: -5 }}
                    placeholder="6 12 34 56 78"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(text) =>
                      setPhoneNumber(text.replace(/\D/g, ""))
                    }
                    className="pt-2 flex-1 text-xl -mb-2 px-2 rounded text-gray-900 dark:text-white"
                  />
                </View>
              </View>
              {user && user?.phoneNumber && (
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-gray-400 dark:text-gray-400 text-lg mb-8 px-2"
                >
                  Numéro actuel: {auth.currentUser?.phoneNumber}
                </Text>
              )}
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
                  <Text className="text-white font-semibold text-base">
                    {i18n.t("OK")}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View className="space-y-6">
              {/* Inputs Code */}
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

              <Pressable
                style={{
                  backgroundColor: COLORS.primary,
                  opacity: loading || code.some((c) => c === "") ? 0.5 : 1,
                }}
                onPress={() => handleVerifyCode(code.join(""))}
                disabled={loading || code.some((c) => c === "")}
                className="mt-5 py-3 rounded flex-row items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {i18n.t("Vérifier")}
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
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AddPhoneNumberPage;
