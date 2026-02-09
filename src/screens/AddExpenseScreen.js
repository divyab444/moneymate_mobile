import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
const STORAGE_KEY = "MONEY_MATE_DB";

const categories = [
  { id: "1", name: "Grocery", icon: "🛒" },
  { id: "2", name: "Parents", icon: "🏡" },
  { id: "3", name: "Shopping", icon: "👕" },
  { id: "4", name: "House Rent", icon: "🏠" },
  { id: "5", name: "Entertainment", icon: "🎬" },
  { id: "6", name: "Transport", icon: "🚗" },
  { id: "7", name: "Savings", icon: "💰" },
  { id: "8", name: "Given to Friends", icon: "🧑‍🤝‍🧑" },
  { id: "9", name: "Education", icon: "🎓" },
  { id: "10", name: "Petrol", icon: "⛽" },
  { id: "11", name: "Spend myself", icon: "🧍‍♂️" },
  { id: "12", name: "Borrowed from Friends", icon: "🤝" },
  { id: "13", name: "Restaurant", icon: "🍽️" },
  { id: "14", name: "Health", icon: "🩺" },
  { id: "15", name: "Other", icon: "📦" },
];

export default function AddExpenseScreen({ navigation, route }) {
  const { month, expense } = route.params;
  const isEdit = !!expense;

  const [selectedCategory, setSelectedCategory] = useState(
    expense
      ? categories.find((c) => c.name === expense.category)
      : categories[0],
  );
  const [showGrid, setShowGrid] = useState(false);

  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [title, setTitle] = useState(expense ? expense.title : "");
  const [notes, setNotes] = useState(expense ? expense.notes : "");
  const [accountType, setAccountType] = useState(
    expense ? expense.accountType : "Transaction",
  );
  const [image, setImage] = useState(expense ? expense.image : null);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveExpense = async () => {
    if (!title || !amount) return;

    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const db = json ? JSON.parse(json) : { months: {} };

    if (!db.months[month]) return;

    if (isEdit) {
      // ✏️ UPDATE EXISTING
      db.months[month].transactions = db.months[month].transactions.map((t) =>
        t.id === expense.id
          ? {
              ...t,
              title,
              amount: Number(amount),
              category: selectedCategory.name,
              categoryIcon: selectedCategory.icon,
              notes,
              accountType,
              image,
            }
          : t,
      );
    } else {
      // ➕ ADD NEW
      const newExpense = {
        id: Date.now().toString(),
        title,
        amount: Number(amount),
        type: "expense",
        category: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        notes,
        accountType,
        image,
        date: new Date().toDateString(),
      };

      db.months[month].transactions.push(newExpense);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    navigation.goBack();
    Toast.show({
      type: "success",
      text1: "Expense Added",
      text2: "Your transaction was saved",
    });
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? "Edit Expense" : "New Expense"}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* CATEGORY */}
          <Text style={styles.label}>Choose Category</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Text style={styles.dropdownText}>
              {selectedCategory.icon} {selectedCategory.name}
            </Text>
            <Ionicons
              name={showGrid ? "chevron-up" : "chevron-down"}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          {showGrid && (
            <View style={styles.gridContainer}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory.id === item.id && styles.categorySelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowGrid(false);
                  }}
                >
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text style={styles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Title</Text>
          <TextInput
            placeholder="Expense Name"
            placeholderTextColor="#888"
            style={styles.input}
            value={title}
            maxLength={20}
            onChangeText={setTitle}
            blurOnSubmit={false}
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            placeholder="Enter amount"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            maxLength={7}
            onChangeText={setAmount}
            blurOnSubmit={false}
          />

          <Text style={styles.label}>Account Type</Text>
          <View style={styles.segmentContainer}>
            {["Transaction", "Cash"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.segment,
                  accountType === item && styles.segmentActive,
                ]}
                onPress={() => setAccountType(item)}
              >
                <Text
                  style={
                    accountType === item
                      ? styles.segmentTextActive
                      : styles.segmentText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            placeholder="Add notes"
            placeholderTextColor="#888"
            style={[styles.input, { height: 90 }]}
            multiline
            value={notes}
            onChangeText={setNotes}
            blurOnSubmit={false}
          />

          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="white" />
            <Text
              style={{
                color: "white",
                marginLeft: 8,
                fontFamily: "Montserrat",
              }}
            >
              Take Photo
            </Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image }} style={styles.preview} />}

          <TouchableOpacity style={{ marginTop: 30 }} onPress={saveExpense}>
            <LinearGradient
              colors={["#ff9966", "#ff5e62"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {isEdit ? "Update Expense" : "Add Expense"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 250 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
  label: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",

    marginTop: 20,
    marginBottom: 8,
    fontFamily: "MontserratBold",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dropdownText: { color: "white", fontSize: 15, fontFamily: "Montserrat" },
  /* GRID */ gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    fontFamily: "Montserrat",
  },
  categoryCard: {
    width: "30%",
    margin: "1.66%",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  categorySelected: { borderWidth: 2, borderColor: "#ff5e62" },
  categoryIcon: { fontSize: 26, fontFamily: "Montserrat" },
  categoryName: {
    color: "white",
    fontFamily: "Montserrat",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 15,
    padding: 16,
    color: "white",
    borderWidth: 1,
    fontFamily: "Montserrat",
    borderColor: "rgba(255,255,255,0.15)",
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 30,
    overflow: "hidden",
  },
  segment: { flex: 1, padding: 12, alignItems: "center" },
  segmentActive: { backgroundColor: "#ff5e62" },
  segmentText: { color: "#aaa", fontFamily: "Montserrat" },
  segmentTextActive: {
    color: "white",
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
  cameraBtn: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  preview: { height: 150, borderRadius: 15, marginTop: 15 },
  button: { padding: 18, borderRadius: 20, alignItems: "center" },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
});
