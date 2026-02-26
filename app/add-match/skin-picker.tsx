import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useMemo, useEffect } from "react";
import { Skin } from "../_layout";

// ─── Constants ────────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

type Props = {
  skins: Skin[];
  value: string;
  onChange: (id: string) => void;
};

const { width, height: windowHeight } = Dimensions.get("window");
const COLS = 4;
const GRID_PADDING = 16;
const ITEM_GAP = 8;
const itemSize = (width - GRID_PADDING * 2 - ITEM_GAP * (COLS - 1)) / COLS;

export default function SkinPicker({ skins, value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredSkins = useMemo(
    () => skins.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [skins, search]
  );

  const handleSelect = (id: string) => {
    Keyboard.dismiss();
    onChange(id);
    setModalVisible(false);
    setSearch("");
  };

  const selectedSkin = skins.find((s) => s.id === value);
  // Shrink sheet height as keyboard appears so grid stays visible
  const sheetHeight = keyboardHeight > 0
    ? windowHeight - keyboardHeight - 40   // 40px breathing room above keyboard
    : windowHeight * 0.75;

  return (
    <View style={styles.wrapper}>

      {/* ── Toggle button ── */}
      <Pressable style={styles.toggleBtn} onPress={() => setModalVisible(true)}>
        {selectedSkin?.image ? (
          <Image source={{ uri: selectedSkin.image }} style={styles.toggleImage} />
        ) : (
          <View style={styles.toggleImagePlaceholder}>
            <Text style={styles.toggleImagePlaceholderText}>?</Text>
          </View>
        )}
        <View style={styles.toggleTextCol}>
          <Text style={styles.toggleLabel}>SKIN</Text>
          <Text style={styles.toggleName} numberOfLines={1}>
            {selectedSkin?.name ?? "Select Skin"}
          </Text>
        </View>
        <Text style={styles.toggleChevron}>›</Text>
      </Pressable>

      {/* ── Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          {/* inner Pressable prevents backdrop tap from closing when tapping inside */}
          <Pressable
            style={[styles.sheet, { height: sheetHeight }]}
            onPress={() => {}}
          >

            {/* Sheet handle */}
            <View style={styles.handle} />

            {/* Search */}
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search skins..."
                placeholderTextColor="#444"
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                  <Text style={styles.clearText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Results count */}
            <Text style={styles.resultsCount}>
              {filteredSkins.length} skin{filteredSkins.length !== 1 ? "s" : ""}
            </Text>

            {/* Grid */}
            <FlatList
              data={filteredSkins}
              keyExtractor={(item) => item.id}
              numColumns={COLS}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => {
                const isSelected = item.id === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.id)}
                    style={[styles.skinCell, isSelected && styles.skinCellSelected]}
                  >
                    <Image source={{ uri: item.image }} style={styles.skinImage} />
                    {isSelected && <View style={styles.skinSelectedDot} />}
                    <Text style={[styles.skinName, isSelected && styles.skinNameSelected]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.gridContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },

  // ── Toggle button ──
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    gap: 12,
  },
  toggleImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  toggleImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleImagePlaceholderText: {
    color: "#444",
    fontSize: 20,
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleLabel: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 3,
  },
  toggleName: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  toggleChevron: {
    color: "#444",
    fontSize: 22,
    lineHeight: 24,
  },

  // ── Backdrop ──
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  // ── Bottom sheet ──
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    paddingTop: 12,
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#2a2a38",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  // ── Search ──
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: "#444",
    fontSize: 12,
  },
  resultsCount: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 12,
  },

  // ── Grid ──
  gridContent: {
    paddingBottom: 20,
    gap: ITEM_GAP,
  },
  gridRow: {
    gap: ITEM_GAP,
  },
  skinCell: {
    width: itemSize,
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skinCellSelected: {
    borderColor: PURPLE,
    backgroundColor: "rgba(139,92,246,0.1)",
  },
  skinImage: {
    width: itemSize - 16,
    height: itemSize - 16,
    borderRadius: 6,
    marginBottom: 5,
  },
  skinSelectedDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  skinName: {
    color: "#555",
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  skinNameSelected: {
    color: "#a78bfa",
    fontWeight: "700",
  },
});