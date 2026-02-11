import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View, Text } from "react-native";

import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionScreen from "./src/screens/TranscationScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import AddMonthScreen from "./src/screens/AddMonthScreen";

import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import Toast from "react-native-toast-message";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { initWallet } from "./src/storage/db";
import JoinWalletScreen from "./src/screens/JoinWalletScreen";

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        Montserrat: require("./assets/Montserrat-Regular.ttf"),
        MontserratBold: require("./assets/Montserrat-Bold.ttf"),
      });

      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    };

    loadFonts();
  }, []);

  useEffect(() => {
    initWallet();
  }, []);

  if (!fontsLoaded) return null;

  const toastConfig = {
    success: ({ text1, text2 }) => (
      <BlurView
        intensity={80}
        tint="light"
        style={{
          width: "92%",
          borderRadius: 20,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.9)",
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={26}
            color="#22c55e"
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#22c55e", fontWeight: "bold", fontSize: 15 }}
            >
              {text1}
            </Text>
            <Text style={{ color: "#ccc", marginTop: 2 }}>{text2}</Text>
          </View>
        </View>
      </BlurView>
    ),

    error: ({ text1 }) => (
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          width: "92%",
          borderRadius: 20,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.9)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Ionicons
            name="close-circle"
            size={26}
            color="#ef4444"
            style={{ marginRight: 12 }}
          />
          <Text style={{ color: "#ef4444", fontWeight: "bold", fontSize: 15 }}>
            {text1}
          </Text>
        </View>
      </BlurView>
    ),
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "black" },
          }}
        >
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          <Stack.Screen name="JoinWalletScreen" component={JoinWalletScreen} />
          <Stack.Screen
            name="TransactionScreen"
            component={TransactionScreen}
          />
          <Stack.Screen name="AddExpenseScreen" component={AddExpenseScreen} />
          <Stack.Screen name="AddMonthScreen" component={AddMonthScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      <Toast config={toastConfig} />
      <StatusBar translucent backgroundColor="black" barStyle="light-content" />
    </View>
  );
}
