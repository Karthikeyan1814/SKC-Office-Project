import { useUniversalTheme } from "../context/ThemeContext";
import { HiOutlineSwatch } from "react-icons/hi2";

function ThemeCustomizer() {
    const { setIsThemeModalOpen } = useUniversalTheme();
    const role = typeof window !== "undefined" ? localStorage.getItem("skc-role") : null;
    if (role !== "ADMIN") return null;

    return (
        <div style={{ marginTop: "15vh", textAlign: "center", padding: "40px" }}>
            <h2 style={{ color: "var(--primary)" }}>Universal Theme & Color System (Admin Control)</h2>
            <p style={{ color: "#64748b" }}>Choose predefined color schemes, categorized palettes, footer colors, and typography.</p>
            <button
                className="yellow-btn"
                onClick={() => setIsThemeModalOpen(true)}
                style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
                <HiOutlineSwatch size={18} /> Open Color & Font Customizer
            </button>
        </div>
    );
}

export default ThemeCustomizer;