import { useState } from "react";
import { useUniversalTheme } from "../context/ThemeContext";
import {
  HiOutlineSwatch,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineSparkles,
} from "react-icons/hi2";
import "../styles/ThemeCustomizerModal.css";

export default function ThemeCustomizerModal() {
  const {
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
  } = useUniversalTheme();

  const [activeTab, setActiveTab] = useState("presets"); // presets | customize | fonts

  if (!isThemeModalOpen) return null;

  const ensureHex = (val, fallback = "#18092d") => {
    if (typeof val === "string" && val.startsWith("#") && (val.length === 7 || val.length === 4)) {
      return val;
    }
    return fallback;
  };

  return (
    <div className="theme-modal-backdrop" onClick={() => setIsThemeModalOpen(false)}>
      <div className="theme-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="theme-modal-header">
          <div className="theme-modal-title-box">
            <span className="theme-modal-icon-badge">
              <HiOutlineSwatch size={20} />
            </span>
            <div>
              <h3>Universal Theme & Color Settings (Admin Control)</h3>
              <p>Configure project-wide color schemes, footer colors, floor backgrounds, and typography.</p>
            </div>
          </div>
          <button className="theme-modal-close-btn" onClick={() => setIsThemeModalOpen(false)}>
            <HiOutlineXMark size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="theme-modal-tabs">
          <button
            className={`theme-tab-btn ${activeTab === "presets" ? "active" : ""}`}
            onClick={() => setActiveTab("presets")}
          >
            🎨 Predefined Color Themes
          </button>
          <button
            className={`theme-tab-btn ${activeTab === "customize" ? "active" : ""}`}
            onClick={() => setActiveTab("customize")}
          >
            🖌️ Categorized Color Tuning
          </button>
          <button
            className={`theme-tab-btn ${activeTab === "fonts" ? "active" : ""}`}
            onClick={() => setActiveTab("fonts")}
          >
            🔤 Font & Typography Themes
          </button>
        </div>

        {/* Body content */}
        <div className="theme-modal-body">
          {activeTab === "presets" && (
            <div className="theme-presets-grid">
              {COLOR_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`theme-preset-card ${isSelected ? "selected" : ""}`}
                    onClick={() => selectColorTheme(theme.id)}
                  >
                    <div className="theme-preset-color-strip">
                      {theme.preview.map((colorHex, idx) => (
                        <span key={idx} style={{ background: colorHex }} />
                      ))}
                    </div>
                    <div className="theme-preset-info">
                      <div className="theme-preset-name">
                        {theme.name}
                        {isSelected && <HiOutlineCheck className="check-icon" size={16} />}
                      </div>
                      <span className="theme-preset-badge">
                        Primary: {theme.colors.primary}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "customize" && (
            <div className="theme-custom-tuning">
              <p className="tuning-instruction">
                Categorized project color tokens. Any adjustment automatically updates across the Home page, portals, floor background, footer, and navigation.
              </p>

              <div className="tuning-fields-grid">
                {/* Primary Brand Color */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Primary Brand Color</label>
                    <span>Main buttons, active badges, portal headers (--primary)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.primary, "#1e1b4b")}
                      onChange={(e) => updateIndividualColor("primary", e.target.value)}
                    />
                    <code>{customColors.primary}</code>
                  </div>
                </div>

                {/* Accent / Gold Highlight */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Accent & Golden Highlights</label>
                    <span>Key titles, stars, attention pills (--gold, --accent)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.accent, "#f59e0b")}
                      onChange={(e) => updateIndividualColor("accent", e.target.value)}
                    />
                    <code>{customColors.accent}</code>
                  </div>
                </div>

                {/* Footer Background Color */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Footer Background Color</label>
                    <span>Bottom footer section surface and ambiance (--footer-bg)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.footerColor || customColors.footerBg, "#18092d")}
                      onChange={(e) => updateIndividualColor("footerColor", e.target.value)}
                    />
                    <code>{customColors.footerColor || ensureHex(customColors.footerBg, "#18092d")}</code>
                  </div>
                </div>

                {/* Floor / Page Background */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Floor & Page Background</label>
                    <span>Page backdrop, portal layout ground & containers (--page-floor, --floor-bg)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.floorBg || customColors.bodyBg, "#f8fafc")}
                      onChange={(e) => updateIndividualColor("floorBg", e.target.value)}
                    />
                    <code>{customColors.floorBg || "#f8fafc"}</code>
                  </div>
                </div>

                {/* Card Background */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Card & Container Background</label>
                    <span>Executive cards, modal dialogs (--card-bg, --dark-card)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.cardBg, "#ffffff")}
                      onChange={(e) => updateIndividualColor("cardBg", e.target.value)}
                    />
                    <code>{customColors.cardBg}</code>
                  </div>
                </div>

                {/* Text Light */}
                <div className="tuning-field-row">
                  <div className="field-info">
                    <label>Typography Light Text</label>
                    <span>Headings and high-contrast labels (--text-light)</span>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={ensureHex(customColors.textLight, "#f8fafc")}
                      onChange={(e) => updateIndividualColor("textLight", e.target.value)}
                    />
                    <code>{customColors.textLight}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fonts" && (
            <div className="theme-fonts-grid">
              {FONT_THEMES.map((font) => {
                const isSelected = selectedFontId === font.id;
                return (
                  <div
                    key={font.id}
                    className={`theme-font-card ${isSelected ? "selected" : ""}`}
                    onClick={() => selectFontTheme(font.id)}
                  >
                    <div className="font-card-header">
                      <h4 style={{ fontFamily: font.font1 }}>Sri Kathiravan & Co.</h4>
                      {isSelected && <HiOutlineCheck className="check-icon" size={16} />}
                    </div>
                    <p style={{ fontFamily: font.font2 }} className="font-preview-text">
                      Statutory GST Advisory, Notice Compliance & Appeal Litigation Support
                    </p>
                    <div className="font-theme-label">
                      <strong>{font.name}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="theme-modal-footer">
          <button className="reset-default-btn" onClick={resetToDefault}>
            <HiOutlineArrowPath size={15} /> Reset to Default (Royal Indigo & Gold)
          </button>
          <button className="apply-theme-btn" onClick={() => setIsThemeModalOpen(false)}>
            <HiOutlineSparkles size={16} /> Save & Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}
