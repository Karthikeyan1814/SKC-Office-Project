import { createContext, useContext, useState, useEffect } from "react";

// Predefined Curated Color Themes
export const COLOR_THEMES = [
  {
    id: "royal-indigo",
    name: "Royal Indigo & Gold (Default)",
    preview: ["#1e1b4b", "#f59e0b", "#18092d"],
    colors: {
      primary: "#1e1b4b",
      primaryHover: "#2e1065",
      accent: "#f59e0b",
      accentLight: "#fcd34d",
      navBg: "linear-gradient(135deg, rgba(26, 11, 46, 0.98) 0%, rgba(40, 16, 68, 0.98) 100%)",
      footerBg: "linear-gradient(180deg, #18092d 0%, #0d041a 100%)",
      footerColor: "#18092d",
      floorBg: "#f8fafc",
      bodyBg: "#f8fafc",
      cardBg: "#ffffff",
      cardBg2: "#f1f5f9",
      textLight: "#f8fafc",
      textMuted: "#94a3b8",
      lite: "rgba(124, 58, 237, 0.15)",
    },
  },
  {
    id: "executive-navy",
    name: "Executive Navy & Amber",
    preview: ["#0f172a", "#fbbf24", "#1e293b"],
    colors: {
      primary: "#0f172a",
      primaryHover: "#1e293b",
      accent: "#f59e0b",
      accentLight: "#fde68a",
      navBg: "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)",
      footerBg: "linear-gradient(180deg, #0f172a 0%, #080d1a 100%)",
      footerColor: "#0f172a",
      floorBg: "#f8fafc",
      bodyBg: "#f8fafc",
      cardBg: "#ffffff",
      cardBg2: "#f1f5f9",
      textLight: "#f8fafc",
      textMuted: "#94a3b8",
      lite: "rgba(59, 130, 246, 0.15)",
    },
  },
  {
    id: "emerald-wealth",
    name: "Emerald Advisory & Jade",
    preview: ["#064e3b", "#10b981", "#042f2e"],
    colors: {
      primary: "#064e3b",
      primaryHover: "#047857",
      accent: "#10b981",
      accentLight: "#6ee7b7",
      navBg: "linear-gradient(135deg, rgba(4, 47, 46, 0.98) 0%, rgba(6, 78, 59, 0.98) 100%)",
      footerBg: "linear-gradient(180deg, #042f2e 0%, #021a19 100%)",
      footerColor: "#042f2e",
      floorBg: "#f0fdf4",
      bodyBg: "#f0fdf4",
      cardBg: "#ffffff",
      cardBg2: "#ecfdf5",
      textLight: "#f0fdf4",
      textMuted: "#a7f3d0",
      lite: "rgba(16, 185, 129, 0.15)",
    },
  },
  {
    id: "amethyst-velvet",
    name: "Amethyst Royal & Rose",
    preview: ["#4a044e", "#f472b6", "#2e0839"],
    colors: {
      primary: "#4a044e",
      primaryHover: "#701a75",
      accent: "#f472b6",
      accentLight: "#fbcfe8",
      navBg: "linear-gradient(135deg, rgba(46, 8, 57, 0.98) 0%, rgba(74, 4, 78, 0.98) 100%)",
      footerBg: "linear-gradient(180deg, #2e0839 0%, #17031c 100%)",
      footerColor: "#2e0839",
      floorBg: "#fdf2f8",
      bodyBg: "#fdf2f8",
      cardBg: "#ffffff",
      cardBg2: "#fce7f3",
      textLight: "#fdf2f8",
      textMuted: "#f5d0fe",
      lite: "rgba(244, 114, 182, 0.15)",
    },
  },
];

// Predefined Font Themes
export const FONT_THEMES = [
  {
    id: "default-sans",
    name: "Modern Professional (Google Sans & Nunito)",
    font1: "'Google Sans', sans-serif",
    font2: "'Nunito', sans-serif",
  },
  {
    id: "inter-tech",
    name: "Clean Executive (Outfit & Inter)",
    font1: "'Outfit', 'Inter', sans-serif",
    font2: "'Inter', sans-serif",
  },
  {
    id: "serif-prestige",
    name: "Prestigious Legal (Playfair & Nunito)",
    font1: "'Playfair Display', Georgia, serif",
    font2: "'Nunito', sans-serif",
  },
  {
    id: "jakarta-modern",
    name: "High Impact (Plus Jakarta & Inter)",
    font1: "'Plus Jakarta Sans', sans-serif",
    font2: "'Inter', sans-serif",
  },
];

const STORAGE_KEY = "skc_universal_theme_config";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [selectedThemeId, setSelectedThemeId] = useState("royal-indigo");
  const [selectedFontId, setSelectedFontId] = useState("default-sans");
  const [customColors, setCustomColors] = useState(COLOR_THEMES[0].colors);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Apply CSS variables to root & DOM
  const applyThemeToDOM = (colors, fontObj) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-hover", colors.primaryHover || colors.primary);
    root.style.setProperty("--gold", colors.accent);
    root.style.setProperty("--gold-light", colors.accentLight || colors.accent);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--nav-bg", colors.navBg || colors.primary);
    root.style.setProperty("--footer-bg", colors.footerBg || colors.navBg || colors.primary);
    root.style.setProperty("--footer-color", colors.footerColor || colors.primary);
    root.style.setProperty("--floor-bg", colors.floorBg || colors.bodyBg || "#f8fafc");
    root.style.setProperty("--page-floor", colors.floorBg || colors.bodyBg || "#f8fafc");
    root.style.setProperty("--dark-bg", colors.bodyBg || "#0d0d1a");
    root.style.setProperty("--dark-card", colors.cardBg || "#ffffff");
    root.style.setProperty("--dark-card2", colors.cardBg2 || colors.cardBg || "#f1f5f9");
    root.style.setProperty("--card-bg", colors.cardBg || "#ffffff");
    root.style.setProperty("--lite", colors.lite || `${colors.primary}26`);
    root.style.setProperty("--text-light", colors.textLight || "#f8fafc");
    root.style.setProperty("--text-muted", colors.textMuted || "#94a3b8");

    if (fontObj) {
      root.style.setProperty("--font1", fontObj.font1);
      root.style.setProperty("--font2", fontObj.font2);
      if (typeof document !== "undefined" && document.body) {
        document.body.style.fontFamily = fontObj.font2;
      }
    }

    if (typeof document !== "undefined" && document.body) {
      document.body.style.backgroundColor = colors.floorBg || colors.bodyBg || "#f8fafc";
    }
  };

  // Sync theme from storage
  const syncThemeFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeId) setSelectedThemeId(parsed.themeId);
        if (parsed.fontId) setSelectedFontId(parsed.fontId);
        if (parsed.colors) {
          setCustomColors(parsed.colors);
          const font = FONT_THEMES.find((f) => f.id === parsed.fontId) || FONT_THEMES[0];
          applyThemeToDOM(parsed.colors, font);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse saved theme settings:", e);
    }
    // Apply default
    applyThemeToDOM(COLOR_THEMES[0].colors, FONT_THEMES[0]);
  };

  // Load from localStorage on mount & listen to changes
  useEffect(() => {
    syncThemeFromStorage();
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        syncThemeFromStorage();
      }
    };
    const handleCustomChange = () => syncThemeFromStorage();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("skc-theme-changed", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("skc-theme-changed", handleCustomChange);
    };
  }, []);

  // Save changes
  const saveThemeConfig = (themeId, fontId, colors) => {
    setSelectedThemeId(themeId);
    setSelectedFontId(fontId);
    setCustomColors(colors);
    const font = FONT_THEMES.find((f) => f.id === fontId) || FONT_THEMES[0];
    applyThemeToDOM(colors, font);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId,
        fontId,
        colors,
      })
    );
    window.dispatchEvent(new Event("skc-theme-changed"));
  };

  const selectColorTheme = (themeId) => {
    const found = COLOR_THEMES.find((t) => t.id === themeId);
    if (found) {
      saveThemeConfig(themeId, selectedFontId, found.colors);
    }
  };

  const selectFontTheme = (fontId) => {
    saveThemeConfig(selectedThemeId, fontId, customColors);
  };

  const updateIndividualColor = (key, value) => {
    const updated = { ...customColors, [key]: value };
    // If updating primary, also update navBg if it's based on it
    if (key === "primary" && (!updated.navBg || !updated.navBg.includes("linear-gradient"))) {
      updated.navBg = value;
    }
    if (key === "footerColor") {
      updated.footerBg = value;
    }
    if (key === "floorBg") {
      updated.bodyBg = value;
    }
    saveThemeConfig("custom", selectedFontId, updated);
  };

  const resetToDefault = () => {
    saveThemeConfig("royal-indigo", "default-sans", COLOR_THEMES[0].colors);
  };

  return (
    <ThemeContext.Provider
      value={{
        selectedThemeId,
        selectedFontId,
        customColors,
        isThemeModalOpen,
        setIsThemeModalOpen,
        selectColorTheme,
        selectFontTheme,
        updateIndividualColor,
        resetToDefault,
        COLOR_THEMES,
        FONT_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useUniversalTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useUniversalTheme must be used within a ThemeProvider");
  }
  return context;
}
