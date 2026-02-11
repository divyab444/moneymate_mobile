import React, { useState, useEffect,useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { BlurView } from "expo-blur";
import { initWallet } from "../storage/db";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

const JoinWalletScreen = ({ navigation }) => {
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const readClipboard = async () => {
      const text = await Clipboard.getStringAsync();
      if (text && text.startsWith("wallet_")) {
        setWalletId(text);
      }
    };

    readClipboard();
  }, []);

  
useFocusEffect(
  useCallback(() => {
    setWalletId("");
  }, [])
);

  const isDisabled =
    loading || !walletId.trim() || !walletId.trim().startsWith("wallet_");

  const joinWallet = async () => {
    try {
      setLoading(true);

      await AsyncStorage.setItem("CURRENT_WALLET_ID", walletId.trim());
      await initWallet();

       setWalletId("");

      Toast.show({
        type: "success",
        text1: "Wallet Joined",
        text2: "Shared wallet connected",
      });

      navigation.goBack();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to join wallet",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Ionicons name="people-outline" size={60} color="#fff" />

          <Text style={styles.title}>Join a Shared Wallet</Text>
          <Text style={styles.subtitle}>
            Paste the wallet code shared by your partner or family member.
          </Text>

          <BlurView intensity={80} tint="dark" style={styles.inputCard}>
            <TextInput
              placeholder="wallet_xxxxxxxxxx"
              placeholderTextColor="#777"
              value={walletId}
              onChangeText={setWalletId}
              autoCapitalize="none"
              style={styles.input}
            />
          </BlurView>
          <TouchableOpacity
            onPress={joinWallet}
            disabled={isDisabled}
            style={{
              width: "100%",
              marginTop: 25,
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            <LinearGradient
              colors={["#ff9966", "#ff5e62"]}
              style={styles.gradientButton}
            >
              <Text style={styles.gradientButtonText}>
                {loading ? "Joining..." : "Join Wallet"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.tip}>
            Once joined, all expenses sync in real time for everyone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default JoinWalletScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  title: {
    fontSize: 22,
    color: "white",
    fontFamily: "MontserratBold",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    fontFamily: "Montserrat",
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 6,
  },

  gradientButtonText: {
    color: "white",
    fontSize: 15,
    fontFamily: "MontserratBold",
  },

  inputCard: {
    width: "100%",
    borderRadius: 18,
    marginTop: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: "white",
    fontFamily: "Montserrat",
  },

  tip: {
    color: "#777",
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 18,
    fontFamily: "Montserrat",
  },
});
