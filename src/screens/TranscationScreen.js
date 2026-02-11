import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { getDB, updateWallet, listenToWallet } from "../storage/db";

const TransactionScreen = ({ navigation, route }) => {
  const { month } = route.params;
  const [monthIncome, setMonthIncome] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      unsubscribe = await listenToWallet((db) => {
        if (db.months?.[month]) {
          setTransactions(db.months[month].transactions || []);
          setMonthIncome(db.months[month].income || 0);
        } else {
          setTransactions([]);
          setMonthIncome(0);
        }
      });
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [month]);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = monthIncome - totalExpense;

  const openModal = (item) => {
    setSelected(item);
    setModalVisible(true);
  };

  const deleteItem = async () => {
    await updateWallet((db) => {
      if (!db.months?.[month]) return db;

      db.months[month].transactions = db.months[month].transactions.filter(
        (t) => t.id !== selected.id,
      );

      return db;
    });

    setModalVisible(false);

    Toast.show({
      type: "success",
      text1: "Transaction deleted",
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <BlurView intensity={70} tint="dark" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 20, fontFamily: "Montserrat" }}>
                {item.categoryIcon}
              </Text>
            </View>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subText}>{item.category}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.amount,
              { color: item.type === "income" ? "green" : "red" },
            ]}
          >
            ₹ {Number(item.amount).toLocaleString("en-IN")}
          </Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.monthText}>{month}</Text>

          <View></View>
        </View>

        {/* Summary */}
        <BlurView intensity={80} tint="dark" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={styles.summaryAmount}>
            {" "}
            ₹ {Number(balance).toLocaleString("en-IN")}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.rowBetween}>
            <Text style={styles.subLabel}>Income</Text>
            <Text style={[styles.subAmount, { color: "green" }]}>
              ₹ {Number(monthIncome).toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.subLabel}>Expense</Text>
            <Text style={[styles.subAmount, { color: "red" }]}>
              ₹ {Number(totalExpense).toLocaleString("en-IN")}
            </Text>
          </View>
        </BlurView>

        {/* List */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListFooterComponent={<View style={{ height: 150 }} />}
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            navigation.navigate("AddExpenseScreen", { month });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <LinearGradient
            colors={["#ff9966", "#ff5e62"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom Sheet */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalSafe}>
              <View style={styles.dragIndicator} />

              <View style={styles.modalContent}>
                {selected && (
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalDate}>{selected.date}</Text>
                      <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity
                          onPress={() => {
                            setModalVisible(false);
                            navigation.navigate("AddExpenseScreen", {
                              month,
                              expense: selected,
                            });
                            Haptics.selectionAsync();
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={22}
                            color="green"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ marginLeft: 10 }}
                          onPress={() => setModalVisible(false)}
                        >
                          <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.modalDivider} />

                    {/* Category */}
                    <View style={styles.detailRow}>
                      <View style={styles.categoryIconBox}>
                        <Text
                          style={{ fontSize: 26, fontFamily: "Montserrat" }}
                        >
                          {selected.categoryIcon}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>
                          {selected.category}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag" size={22} color="white" />
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>Title</Text>
                        <Text style={styles.detailValue}>{selected.title}</Text>
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={22} color="white" />
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: "red", fontSize: 18 },
                          ]}
                        >
                          ₹ {Number(selected.amount).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    {/* Account Type */}
                    <View style={styles.detailRow}>
                      <Ionicons name="wallet" size={22} color="white" />
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>Account</Text>
                        <Text style={styles.detailValue}>
                          {selected.accountType}
                        </Text>
                      </View>
                    </View>

                    {/* Notes */}
                    {selected.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Notes</Text>
                        <Text style={styles.notesText}>{selected.notes}</Text>
                      </View>
                    ) : null}

                    {/* Image */}
                    {selected.image ? (
                      <TouchableOpacity
                        onPress={() => setImagePreview(selected.image)}
                      >
                        <Image
                          source={{ uri: selected.image }}
                          style={styles.receiptImage}
                        />
                      </TouchableOpacity>
                    ) : null}

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButtonFull}
                      onPress={deleteItem}
                    >
                      <Ionicons name="trash" size={20} color="red" />
                      <Text style={styles.deleteText}>Delete Expense</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
        <Modal visible={!!imagePreview} transparent animationType="fade">
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.imageClose}
              onPress={() => setImagePreview(null)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <Image
              source={{ uri: imagePreview }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default TransactionScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "100%",
    height: "80%",
  },

  imageClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },

  monthText: {
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
  modalSafe: {
    backgroundColor: "#111",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  categoryIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dragIndicator: {
    width: 45,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    marginBottom: 15,
  },

  notesBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 15,
    borderRadius: 15,
    marginTop: 5,
  },

  notesLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 6,
    fontFamily: "Montserrat",
  },

  notesText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Montserrat",
  },

  receiptImage: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    marginTop: 20,
  },

  deleteButtonFull: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    padding: 15,
    borderRadius: 15,
    marginTop: 30,
  },

  deleteText: {
    color: "red",
    fontWeight: "600",
    fontFamily: "MontserratBold",
    marginLeft: 10,
    fontSize: 16,
  },

  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    overflow: "hidden",
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  summaryLabel: { color: "#aaa", fontSize: 14, fontFamily: "Montserrat" },
  summaryAmount: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "MontserratBold",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  subLabel: { color: "white", fontFamily: "Montserrat" },
  subAmount: { fontWeight: "600", fontFamily: "MontserratBold" },

  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.2)",
  },

  row: { flexDirection: "row", justifyContent: "space-between" },
  leftSection: { flexDirection: "row" },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "MontserratBold",
  },
  subText: { color: "#aaa", fontSize: 13, fontFamily: "Montserrat" },
  date: { color: "gray", fontSize: 12, fontFamily: "Montserrat" },

  amount: { fontSize: 16, fontWeight: "600", fontFamily: "MontserratBold" },

  fab: { position: "absolute", bottom: 30, right: 25 },
  fabGradient: { padding: 18, borderRadius: 50 },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalDate: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },

  modalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
  },

  detailLabel: { color: "gray", fontSize: 13, fontFamily: "Montserrat" },
  detailValue: { color: "white", fontSize: 16, fontFamily: "Montserrat" },

  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
  },

  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "green",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },

  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 10,
  },
});
