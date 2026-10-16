import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d1117",
      color: "#e6edf3",
      fontFamily: "var(--font2, sans-serif)",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{
        maxWidth: "460px",
        background: "rgba(22, 27, 34, 0.8)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "40px 30px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
      }}>
        <h1 style={{ fontSize: "64px", fontWeight: "800", color: "#f59e0b", margin: "0 0 10px 0" }}>404</h1>
        <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Page Not Found</h2>
        <p style={{ color: "#8b949e", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 24px",
            background: "#238636",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
