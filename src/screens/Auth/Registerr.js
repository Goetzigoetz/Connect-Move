import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { auth, db } from "../../../config/firebase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Keyboard } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import moment from "moment";
import { SafeAreaView } from "react-native";
import BackButton from "../../components/Buttons/BackButton";
import {
  BUTTON_CLASS,
  BUTTON_OUTLINE_CLASS,
  INPUT_CLASS,
} from "../../styles/constants";

export default function Registerr({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton onPress={navigation.goBack} />,
      headerTitle: "",
    });
  }, []);

  const register = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (res) => {
        
        const myRef = doc(db, "users", res.user.uid);
        setDoc(
          myRef,
          {
            firstName: firstName,
            lastName: lastName,
            email: email,
            pieceRecto: "",
            pieceVerso: "",
            createdAt: moment().format(),
          },
          { merge: true }
        );
        updateProfile(auth.currentUser, {
          displayName: firstName + " " + lastName,
        });

        navigation.popToTop();
      })
      .catch(async (error) => {
        
        switch (error.code) {
          case "auth/invalid-email":
            Alert.alert("L'adresse Email est invalide");
            break;
          case "auth/operation-not-allowed":
            Alert.alert("Opération non autorisée");
            break;
          case "auth/weak-password":
            Alert.alert("Mot de passe trop faible");
            break;
          default:
            Alert.alert("Une erreur est survenue");
            console.log(error);
            break;
        }
      });
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled
        contentContainerStyle={{ paddingBottom: "50%" }}
      >
        <View className="flex-1 flex-col justify-between">
          <View
            className="flex flex-col justify-end px-10 pt-10"
            // imageStyle={{ height: "100%" }}
            source={require("../../../assets/img/plaque_imma_login.jpg")}
            // resizeMode="cover"
          >
            <View className="">
              <Text
                className="text-2xl text-black"
                style={{ fontFamily:"Inter_700Bold" }}
              >
                INSCRIPTION
              </Text>
              <Text className="text-sm text-gray-700">
                Inscrivez-vous pour pourvoir profiter de nos offres
              </Text>
            </View>
          </View>
          <View className="flex-1 px-10 py-10">
            <View>
              <Text
                className="text-sm text-black mb-3"
                style={{ fontFamily:"Inter_700Bold" }}
              >
                Nom
              </Text>
              <TextInput
                className={INPUT_CLASS}
                placeholder="Votre nom"
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                }}
              />
            </View>
            <View className="mt-5">
              <Text
                className="text-sm text-black mb-3"
                style={{ fontFamily:"Inter_700Bold" }}
              >
                Prénom
              </Text>
              <TextInput
                className={INPUT_CLASS}
                placeholder="Votre prénom"
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                }}
              />
            </View>
            <View className="mt-5">
              <Text
                className="text-sm text-black mb-3"
                style={{ fontFamily:"Inter_700Bold" }}
              >
                Email
              </Text>
              <TextInput
                className={INPUT_CLASS}
                placeholder="exemple@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                }}
              />
            </View>
            <View className="mt-5">
              <Text
                className="text-sm text-black mb-3"
                style={{ fontFamily:"Inter_700Bold" }}
              >
                Mot de passe
              </Text>
              <View className="relative">
                <TextInput
                  className={INPUT_CLASS}
                  placeholder="******"
                  secureTextEntry={passwordVisibility}
                  onChangeText={(val) => {
                    setPassword(val);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisibility(!passwordVisibility)}
                >
                  <Ionicons
                    name={passwordVisibility ? "eye" : "eye-off"}
                    size={25}
                    color="gray"
                    style={{ position: "absolute", right: 20, top: -40 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View className="mt-14">
              <TouchableOpacity
                className={BUTTON_CLASS}
                disabled={
                  isLoading ||
                  email.length <= 7 ||
                  password.length <= 6 ||
                  firstName < 3 ||
                  lastName < 3
                    ? true
                    : false
                }
                onPress={register}
                style={{
                  opacity:
                    isLoading ||
                    email.length <= 7 ||
                    password.length <= 6 ||
                    firstName < 3 ||
                    lastName < 3
                      ? 0.5
                      : 1,
                }}
              >
                <Text
                  className="text-sm text-white"
                  style={{ fontFamily:"Inter_700Bold" }}
                >
                  Créer un compte
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={navigation.goBack}
                className={BUTTON_OUTLINE_CLASS}
              >
                <Text
                  className="text-sm text-blue-500"
                  style={{ fontFamily:"Inter_700Bold" }}
                >
                  Ou se connecter
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("HowItsWork")}>
              <Text
                className="text-xs underline text-gray-700 mt-10 text-center w-5/6 mx-auto"
                style={{ fontFamily:"Inter_300Light" }}
              >
                En vous inscrivant vous acceptez les termes & conditions de la
                plateforme
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
