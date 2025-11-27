import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

const CommentInput = ({ onPress, userAvatar }) => {
  const { isDarkMode } = useThemeContext();

  const handlePress = () => {
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDarkMode
            ? 'rgba(30, 41, 59, 0.5)'
            : '#F8FAFC',
          borderColor: isDarkMode
            ? 'rgba(249, 115, 22, 0.2)'
            : 'rgba(249, 115, 22, 0.15)',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.contentWrapper} pointerEvents="none">
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={20}
          color={isDarkMode ? '#94A3B8' : '#64748B'}
        />

        <Text
          style={[
            styles.placeholder,
            { color: isDarkMode ? '#94A3B8' : '#64748B' }
          ]}
        >
          {i18n.t("ajoutez_commentaire", { defaultValue: "Ajoutez un commentaire..." })}
        </Text>

        <MaterialCommunityIcons
          name="send"
          size={20}
          color="#F97316"
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  placeholder: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    letterSpacing: -0.3,
    marginHorizontal: 12,
  },
});

export default CommentInput;
