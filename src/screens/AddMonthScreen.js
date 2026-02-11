import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { updateWallet } from "../storage/db";

const AddMonthScreen = ({ navigation }) => {
  const [date, setDate] = useState(new Date());
  const [income, setIncome] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const formattedMonth = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const saveMonth = async () => {
    if (!income) return;

    try {
      await updateWallet((db) => {
        if (!db.months) db.months = {};

        db.months[formattedMonth] = {
          income: Number(income),
          transactions: db.months[formattedMonth]?.transactions || [],
        };

        return db;
      });

      navigation.goBack();

      Toast.show({
        type: "success",
        text1: "Income Added",
        text2: "Your transaction was saved",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to save month",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* App Bar */}
            <View style={styles.appBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <Text style={styles.title}>Add Month</Text>

              <View style={{ width: 24 }} />
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.label}>Select Month & Year</Text>

              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.dateText}>{formattedMonth}</Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowPicker(false);
                    if (d) setDate(d);
                  }}
                />
              )}

              <Text style={styles.label}>Income</Text>

              <TextInput
                placeholder="Enter income"
                placeholderTextColor="#aaa"
                value={income}
                maxLength={7}
                onChangeText={setIncome}
                keyboardType="numeric"
                style={styles.input}
              />

              <TouchableOpacity style={styles.button} onPress={saveMonth}>
                <LinearGradient
                  colors={["#ff9966", "#ff5e62"]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddMonthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "MontserratBold",
  },
  card: {
    borderRadius: 25,
    padding: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 50,
  },
  label: {
    color: "white",
    fontFamily: "Montserrat",
    marginTop: 15,
    marginBottom: 5,
  },
  dateBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    padding: 14,
    marginTop: 5,
  },
  dateText: {
    color: "white",
    fontFamily: "Montserrat",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    padding: 12,
    color: "white",
    fontFamily: "Montserrat",
    marginTop: 5,
  },
  button: {
    marginTop: 25,
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "MontserratBold",
    fontSize: 16,
  },
});
