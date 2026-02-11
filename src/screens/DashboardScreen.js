import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Share,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import {
  deleteMonthFromWallet,
  listenToWallet,
  updateWallet,
} from "../storage/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

const DashboardScreen = ({ navigation }) => {
  const [monthsData, setMonthsData] = useState({});

  useEffect(() => {
    let unsubscribe;

    const start = async () => {
      unsubscribe = await listenToWallet((wallet) => {
        setMonthsData(wallet.months || {});
      });
    };

    start();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  const dashboardData = Object.keys(monthsData)
    .sort((a, b) => {
      const [mA, yA] = a.split(" ");
      const [mB, yB] = b.split(" ");

      return new Date(yB, monthMap[mB]) - new Date(yA, monthMap[mA]);
    })
    .map((month) => {
      const income = Number(monthsData[month].income || 0);
      const transactions = monthsData[month].transactions || [];

      const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);

      return {
        id: month,
        month,
        income,
        expense,
        extra: income - expense,
      };
    });

  const goToJoinWallet = async () => {
    navigation.navigate("JoinWalletScreen");
  };

  const deleteMonth = (monthName) => {
    Alert.alert(
      "Delete Month",
      `Are you sure you want to delete ${monthName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMonthFromWallet(monthName);

            Toast.show({
              type: "success",
              text1: "Month deleted successfully",
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

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
          navigation.navigate("TransactionScreen", { month: item.month });
          Haptics.selectionAsync();
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
                ₹ {Number(item.expense).toLocaleString("en-IN")}
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

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();

      const margin = 50;
      let y = height - margin;

      /* ================= HELPERS ================= */

      const bg = () => {
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0, 0, 0),
        });
      };

      const newPage = () => {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        y = height - margin;
        bg();
      };

      const space = (need = 24) => {
        if (y < margin + need) newPage();
      };

      const right = (text, size = 11) =>
        width - margin - font.widthOfTextAtSize(text, size);

      const divider = () => {
        space(20);
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 1,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 18;
      };

      bg();

      /* ================= HEADER ================= */

      page.drawText("MoneyMate", {
        x: margin,
        y,
        size: 28,
        font: bold,
        color: rgb(1, 1, 1),
      });

      y -= 32;

      page.drawText("Expense Report", {
        x: margin,
        y,
        size: 14,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });

      const dateTxt = new Date().toDateString();
      page.drawText(dateTxt, {
        x: right(dateTxt, 10),
        y,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      y -= 40;

      /* ================= DATA ================= */

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals = {};

      for (const month of Object.keys(monthsData)) {
        const { income = 0, transactions = [] } = monthsData[month];
        totalIncome += Number(income);

        space(140);

        /* ===== MONTH START DIVIDER ===== */
        divider();

        /* ===== MONTH CARD ===== */
        page.drawRectangle({
          x: margin - 15,
          y: y - 35,
          width: width - (margin - 15) * 2,
          height: 42,
          color: rgb(0.12, 0.12, 0.12),
        });

        page.drawText(month.toUpperCase(), {
          x: margin,
          y: y - 22,
          size: 16,
          font: bold,
          color: rgb(1, 1, 1),
        });

        y -= 60;

        const grouped = {};
        transactions.forEach((t) => {
          grouped[t.category] ??= [];
          grouped[t.category].push(t);
        });

        let monthExpense = 0;

        for (const cat of Object.keys(grouped)) {
          space(60);

          /* CATEGORY (YELLOW) */
          page.drawText(cat, {
            x: margin,
            y,
            size: 13,
            font: bold,
            color: rgb(1, 0.85, 0.3),
          });

          y -= 16;

          let catTotal = 0;

          for (const t of grouped[cat]) {
            space(22);

            const amt = Number(t.amount);
            catTotal += amt;
            monthExpense += amt;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

            page.drawText(t.title, {
              x: margin + 10,
              y,
              size: 11,
              font,
              color: rgb(0.85, 0.85, 0.85),
            });

            const amtText = `Rs. ${amt.toLocaleString("en-IN")}`;
            page.drawText(amtText, {
              x: right(amtText),
              y,
              size: 11,
              font,
              color: rgb(1, 1, 1),
            });

            y -= 16;
          }

          /* SUBTOTAL (BLUE) */
          y -= 4;
          page.drawText(`Subtotal  Rs. ${catTotal.toLocaleString("en-IN")}`, {
            x: margin + 10,
            y,
            size: 11,
            font: bold,
            color: rgb(0.4, 0.7, 1),
          });

          y -= 26;
        }

        totalExpense += monthExpense;

        /* ===== MONTH SUMMARY ===== */

        space(70);

        page.drawText(
          `Income   Rs. ${Number(income).toLocaleString("en-IN")}`,
          {
            x: margin,
            y,
            size: 12,
            font: bold,
            color: rgb(0.3, 1, 0.6),
          },
        );

        y -= 18;

        page.drawText(`Expense  Rs. ${monthExpense.toLocaleString("en-IN")}`, {
          x: margin,
          y,
          size: 12,
          font: bold,
          color: rgb(1, 0.3, 0.4),
        });

        y -= 18;

        const monthBalance = Number(income) - monthExpense;
        page.drawText(`Balance  Rs. ${monthBalance.toLocaleString("en-IN")}`, {
          x: margin,
          y,
          size: 13,
          font: bold,
          color: monthBalance >= 0 ? rgb(0.3, 0.8, 1) : rgb(1, 0.4, 0.4),
        });

        y -= 40;
      }

      /* ================= OVERALL SUMMARY ================= */

      space(120);
      divider();

      page.drawText("OVERALL SUMMARY", {
        x: margin,
        y,
        size: 18,
        font: bold,
        color: rgb(1, 1, 1),
      });

      y -= 30;

      for (const cat of Object.keys(categoryTotals)) {
        space(22);

        page.drawText(cat, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.8, 0.8, 0.8),
        });

        const txt = `Rs. ${categoryTotals[cat].toLocaleString("en-IN")}`;
        page.drawText(txt, {
          x: right(txt),
          y,
          size: 11,
          font: bold,
          color: rgb(1, 1, 1),
        });

        y -= 16;
      }

      y -= 20;

      const finalBalance = totalIncome - totalExpense;

      page.drawText(
        `Total Income   Rs. ${totalIncome.toLocaleString("en-IN")}`,
        { x: margin, y, size: 12, font: bold, color: rgb(0.3, 1, 0.6) },
      );

      y -= 18;

      page.drawText(
        `Total Expense  Rs. ${totalExpense.toLocaleString("en-IN")}`,
        { x: margin, y, size: 12, font: bold, color: rgb(1, 0.3, 0.4) },
      );

      y -= 22;

      page.drawText(
        `Final Balance  Rs. ${finalBalance.toLocaleString("en-IN")}`,
        {
          x: margin,
          y,
          size: 16,
          font: bold,
          color: finalBalance >= 0 ? rgb(0.3, 0.8, 1) : rgb(1, 0.4, 0.4),
        },
      );

      /* ================= FOOTER ================= */

      pdfDoc.getPages().forEach((p, i) => {
        p.drawText(`Page ${i + 1}`, {
          x: p.getWidth() / 2 - 15,
          y: 18,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      });

      const base64 = await pdfDoc.saveAsBase64();
      const uri = FileSystem.documentDirectory + "MoneyMate_Report.pdf";

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      await Sharing.shareAsync(uri);
    } catch (e) {
      console.log("PDF ERROR", e);
    }
  };

  const shareWalletCode = async () => {
    const walletId = await AsyncStorage.getItem("CURRENT_WALLET_ID");
    if (!walletId) return;

    await Clipboard.setStringAsync(walletId);

    await Share.share({
      message:
        "Join my MoneyMate wallet 💰\n\n" +
        "Open app → Join Wallet → Paste this code 👇\n\n" +
        walletId,
    });
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
              <Ionicons name="download-outline" size={23} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={shareWalletCode}
            >
              <Ionicons name="share-social-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* JOIN / PEOPLE */}
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={goToJoinWallet}
            >
              <Ionicons name="people-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </GlassView>

        {/* Month List */}
        <FlatList
          data={dashboardData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 150 }} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            (navigation.navigate("AddMonthScreen"),
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
          }}
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
