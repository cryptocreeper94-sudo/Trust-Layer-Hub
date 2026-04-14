import { useColorScheme } from "react-native";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DarkColors = {
  background: "#06060a",
  surface: "rgba(6, 6, 10, 0.65)",
  surfaceSolid: "#06060a",
  primary: "#00ffff",
  secondary: "#9333ea",
  accent: "#00ffff",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.4)",
  textMuted: "rgba(255, 255, 255, 0.3)",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  gradientCyan: ["#06b6d4", "#2563eb"] as const,
  gradientCyanPurple: ["#22d3ee", "#a855f7"] as const,
  gradientGlow: ["rgba(0,255,255,0.15)", "rgba(147,51,234,0.15)", "rgba(0,255,255,0.15)"] as const,
  tabActive: "#00ffff",
  tabInactive: "rgba(255, 255, 255, 0.35)",
};

const LightColors = {
  background: "#f5f7fa",
  surface: "rgba(255, 255, 255, 0.78)",
  surfaceSolid: "#ffffff",
  primary: "#0891b2",
  secondary: "#7c3aed",
  accent: "#0891b2",
  textPrimary: "#1a1a2e",
  textSecondary: "rgba(26, 26, 46, 0.65)",
  textTertiary: "rgba(26, 26, 46, 0.4)",
  textMuted: "rgba(26, 26, 46, 0.3)",
  border: "rgba(0, 0, 0, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.06)",
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
  gradientCyan: ["#0891b2", "#1d4ed8"] as const,
  gradientCyanPurple: ["#06b6d4", "#7c3aed"] as const,
  gradientGlow: ["rgba(8,145,178,0.1)", "rgba(124,58,237,0.1)", "rgba(8,145,178,0.1)"] as const,
  tabActive: "#0891b2",
  tabInactive: "rgba(26, 26, 46, 0.35)",
};

type ThemeMode = "dark" | "light" | "system";

interface ThemeContextType {
  colors: typeof DarkColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DarkColors,
  mode: "dark",
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem("tlhub-theme").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem("tlhub-theme", newMode);
  };

  const isDark =
    mode === "dark" ? true :
    mode === "light" ? false :
    systemScheme !== "light";

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColors() {
  return useContext(ThemeContext);
}

// Default export for backward compatibility — always returns dark colors
// Components should migrate to useThemeColors() for light mode support
const Colors = DarkColors;
export default Colors;
