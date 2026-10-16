import { useNavigate } from "react-router-dom";
import { HiOutlineShieldExclamation } from "react-icons/hi2";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("skc-role");

  const handleRedirect = () => {
    if (role === "ADMIN") navigate("/Admin");
    else if (role === "STAFF") navigate("/Staff");
    else if (role === "CLIENT") navigate("/Client");
    else navigate("/SignIn");
  };

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
        <HiOutlineShieldExclamation size={60} color="#ef4444" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>Access Restricted</h2>
        <p style={{ color: "#8b949e", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          You do not have the required permissions to access this page. Please switch to an authorized account.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={handleRedirect}
            style={{
              padding: "10px 20px",
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => navigate("/SignIn")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "#e6edf3",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
