import React, { useState, useCallback ,useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Share
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { listenToWallet } from "../storage/db";
const STORAGE_KEY = "MONEY_MATE_DB";

const DashboardScreen = ({ navigation }) => {
  const [data, setData] = useState([]);


  useEffect(() => {
  let unsubscribe;

  const start = async () => {
    unsubscribe = await listenToWallet((data) => {
      setData(data.months || {});
    });
  };

  start();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);

  const deleteMonth = async (monthName) => {
  
    Alert.alert(
      "Delete Month",
      `Are you sure you want to delete ${monthName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            if (!json) return;

            const db = JSON.parse(json);

            // 🔥 delete full month data
            delete db.months[monthName];

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));

            // reload dashboard
            loadDashboard();
            Toast.show({
              type: "error",
              text1: "Your Transaction was deleted succesfully!",
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };
  
const generateInviteLink = async () => {
  const walletId = await AsyncStorage.getItem("CURRENT_WALLET_ID");
  console.log("🚀 ~ DashboardScreen.js:66 ~ walletId:", walletId)


  if (!walletId) return;

  const link = `moneymate://join?wallet=${walletId}`;
  console.log("🚀 ~ DashboardScreen.js:72 ~ link:", link)

  await Share.share({
    message: `Join my MoneyMate wallet 💰\n\n${link}`,
  });
};

  const loadDashboard = async () => {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) {
      setData([]);
      return;
    }

    const db = JSON.parse(json);
    const months = db.months || {};

    const monthMap = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const result = Object.keys(months)
      .sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");

        const dateA = new Date(Number(yearA), monthMap[monthA]);
        const dateB = new Date(Number(yearB), monthMap[monthB]);

        return dateB - dateA; // Latest first
      })
      .map((month) => {
        const transactions = months[month].transactions || [];
        const income = Number(months[month].income || 0);

        const expense = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          id: month,
          month,
          income,
          expence: expense,
          extra: income - expense,
        };
      });

    setData(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const GlassView = ({ children, style, intensity = 70 }) => {
    if (Platform.OS === "android") {
      return (
        <View style={[style, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          {children}
        </View>
      );
    }

    return (
      <BlurView intensity={intensity} tint="dark" style={style}>
        {children}
      </BlurView>
    );
  };

  const renderItem = ({ item }) => {
    const firstLetter = item.month.charAt(0);

    return (
      <TouchableOpacity
        onPress={() => {
          (navigation.navigate("TransactionScreen", {
            month: item.month,
          }),
            Haptics.selectionAsync());
        }}
      >
        <GlassView intensity={70} style={styles.card}>
          {/* Top Row */}
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </View>
              <Text style={styles.monthText}>{item.month}</Text>
            </View>

            {/* Delete Button */}
            <TouchableOpacity onPress={() => deleteMonth(item.month)}>
              <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Bottom Section */}
          <View style={styles.bottomRow}>
            <View style={styles.column}>
              <Text style={styles.label}>Income</Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  marginTop: 5,
                  fontWeight: "600",
                  fontFamily: "MontserratBold",
                }}
              >
                ₹ {Number(item.income).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.column}>
              <Text style={styles.label}>Expense</Text>
              <Text
                style={{
                  color: "red",
                  fontSize: 15,
                  marginTop: 5,
                  fontWeight: "600",
                  fontFamily: "MontserratBold",
                }}
              >
                ₹ {Number(item.expence).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.column}>
              <Text style={styles.label}>Extra</Text>
              <Text
                style={[
                  styles.value,
                  { color: item.extra < 0 ? "#ff4d4d" : "green" },
                ]}
              >
                ₹ {Number(item.extra).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </GlassView>
      </TouchableOpacity>
    );
  };

  const generatePDF = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;

      const db = JSON.parse(json);
      const months = db.months || {};

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();

      const margin = 50;
      let y = height - margin;

      const addPage = () => {
        page = pdfDoc.addPage();
        const size = page.getSize();
        width = size.width;
        height = size.height;
        y = height - margin;

        drawDarkBackground();
      };

      const drawDarkBackground = () => {
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: height,
          color: rgb(0.05, 0.05, 0.08),
        });
      };

      const rightAlign = (text, size = 11) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        return width - margin - textWidth;
      };

      const drawDivider = () => {
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.6,
          color: rgb(0.25, 0.25, 0.3),
        });
        y -= 18;
      };

      const drawSectionCard = (title) => {
        if (y < 120) addPage();

        page.drawRectangle({
          x: margin - 15,
          y: y - 35,
          width: width - (margin - 15) * 2,
          height: 45,
          color: rgb(0.12, 0.12, 0.18),
        });

        page.drawText(title, {
          x: margin,
          y: y - 15,
          size: 14,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        y -= 60;
      };

      // Draw first page background
      drawDarkBackground();

      // ===== HEADER =====
      page.drawText("MoneyMate", {
        x: margin,
        y,
        size: 26,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      y -= 30;

      page.drawText("Premium Financial Report", {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.7, 0.7, 0.8),
      });

      page.drawText("Generated: " + new Date().toLocaleDateString(), {
        x: rightAlign("Generated: " + new Date().toLocaleDateString(), 10),
        y,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.7),
      });

      y -= 40;

      let grandIncome = 0;
      let grandExpense = 0;
      let globalCategoryTotals = {};

      Object.keys(months).forEach((month) => {
        const income = Number(months[month].income || 0);
        const transactions = months[month].transactions || [];

        let monthExpense = 0;
        grandIncome += income;

        drawSectionCard(month);

        const grouped = {};

        transactions.forEach((t) => {
          if (!grouped[t.category]) grouped[t.category] = [];
          grouped[t.category].push(t);
        });

        Object.keys(grouped).forEach((category) => {
          let categoryTotal = 0;

          page.drawText(category, {
            x: margin,
            y,
            size: 12,
            font: boldFont,
            color: rgb(0.8, 0.8, 0.9),
          });

          y -= 18;

          grouped[category].forEach((item) => {
            const amount = Number(item.amount);
            monthExpense += amount;

            if (!globalCategoryTotals[category])
              globalCategoryTotals[category] = 0;

            globalCategoryTotals[category] += amount;
            categoryTotal += amount;

            page.drawText(item.title, {
              x: margin + 10,
              y,
              size: 11,
              font,
              color: rgb(0.85, 0.85, 0.9),
            });

            const amountText = "Rs. " + amount.toLocaleString("en-IN");

            page.drawText(amountText, {
              x: rightAlign(amountText),
              y,
              size: 11,
              font,
              color: rgb(1, 1, 1),
            });

            y -= 18;
          });

          const subtotalText = "Rs. " + categoryTotal.toLocaleString("en-IN");

          page.drawText("Subtotal", {
            x: margin + 10,
            y,
            size: 11,
            font: boldFont,
            color: rgb(0.6, 0.6, 0.7),
          });

          page.drawText(subtotalText, {
            x: rightAlign(subtotalText),
            y,
            size: 11,
            font: boldFont,
            color: rgb(1, 1, 1),
          });

          y -= 25;
        });

        grandExpense += monthExpense;

        drawDivider();

        const incomeText = "Rs. " + income.toLocaleString("en-IN");
        const expenseText = "Rs. " + monthExpense.toLocaleString("en-IN");
        const balance = income - monthExpense;
        const balanceText = "Rs. " + balance.toLocaleString("en-IN");

        page.drawText("Income", {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 1, 0.6),
        });

        page.drawText(incomeText, {
          x: rightAlign(incomeText),
          y,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 1, 0.6),
        });

        y -= 20;

        page.drawText("Expense", {
          x: margin,
          y,
          size: 12,
          font: boldFont,
          color: rgb(1, 0.3, 0.4),
        });

        page.drawText(expenseText, {
          x: rightAlign(expenseText),
          y,
          size: 12,
          font: boldFont,
          color: rgb(1, 0.3, 0.4),
        });

        y -= 20;

        page.drawText("Balance", {
          x: margin,
          y,
          size: 13,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        page.drawText(balanceText, {
          x: rightAlign(balanceText),
          y,
          size: 13,
          font: boldFont,
          color: balance >= 0 ? rgb(0.3, 1, 0.6) : rgb(1, 0.3, 0.4),
        });

        y -= 40;
      });

      // ===== OVERALL SUMMARY =====
      drawSectionCard("Overall Summary");

      Object.keys(globalCategoryTotals).forEach((cat) => {
        const totalText =
          "Rs. " + globalCategoryTotals[cat].toLocaleString("en-IN");

        page.drawText(cat, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.8, 0.8, 0.9),
        });

        page.drawText(totalText, {
          x: rightAlign(totalText),
          y,
          size: 11,
          font,
          color: rgb(1, 1, 1),
        });

        y -= 18;
      });

      y -= 10;
      drawDivider();

      const finalBalance = grandIncome - grandExpense;

      const totalIncomeText = "Rs. " + grandIncome.toLocaleString("en-IN");
      const totalExpenseText = "Rs. " + grandExpense.toLocaleString("en-IN");
      const finalBalanceText = "Rs. " + finalBalance.toLocaleString("en-IN");

      page.drawText("Total Income", {
        x: margin,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 1, 0.6),
      });

      page.drawText(totalIncomeText, {
        x: rightAlign(totalIncomeText),
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 1, 0.6),
      });

      y -= 20;

      page.drawText("Total Expense", {
        x: margin,
        y,
        size: 12,
        font: boldFont,
        color: rgb(1, 0.3, 0.4),
      });

      page.drawText(totalExpenseText, {
        x: rightAlign(totalExpenseText),
        y,
        size: 12,
        font: boldFont,
        color: rgb(1, 0.3, 0.4),
      });

      y -= 20;

      page.drawText("Final Balance", {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      page.drawText(finalBalanceText, {
        x: rightAlign(finalBalanceText),
        y,
        size: 14,
        font: boldFont,
        color: finalBalance >= 0 ? rgb(0.3, 1, 0.6) : rgb(1, 0.3, 0.4),
      });

      // Page numbers
      const pages = pdfDoc.getPages();
      pages.forEach((p, i) => {
        const { width: w } = p.getSize();
        p.drawText(`Page ${i + 1} of ${pages.length}`, {
          x: w / 2 - 40,
          y: 20,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.6),
        });
      });

      const base64 = await pdfDoc.saveAsBase64();

      const fileUri = FileSystem.documentDirectory + "MoneyMate_Report.pdf";

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: "base64",
      });

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.log("PDF ERROR:", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* App Bar */}
        <GlassView intensity={80} style={styles.appBar}>
          <Text style={styles.title}>MoneyMate</Text>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={generatePDF}>
              <Ionicons name="download-outline" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 15 }} onPress={generateInviteLink}>
              <Ionicons name="people-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </GlassView>

        {/* Month List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 150 }} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (navigation.navigate("AddMonthScreen"),
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))}
        >
          <LinearGradient
            colors={["#ff9966", "#ff5e62"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  appBar: {
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    fontFamily: "MontserratBold",
  },
  listContainer: {
    padding: 15,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "MontserratBold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  label: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "Montserrat",
  },
  value: {
    color: "white",
    fontSize: 15,
    marginTop: 5,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
  monthText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "MontserratBold",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
  },
  fabGradient: {
    padding: 18,
    borderRadius: 50,
    elevation: 10,
  },
});
