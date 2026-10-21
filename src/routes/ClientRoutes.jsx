import { useState, useEffect } from "react";
import PortalTopBar from "../components/PortalTopBar";
import Footer from "../components/Footer";
import "../styles/AdminRoute.css";
import Sidebar from "../components/Sidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { HiOutlineKey, HiOutlineShieldExclamation, HiOutlineCheck, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

export default function ClientRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTempPass, setIsTempPass] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const temp = localStorage.getItem("skc-temppass");
    if (temp === "true") {
      setIsTempPass(true);
      setShowModal(true);
    }

    // Verify client active status
    api.get("/Client/Status")
      .then((res) => {
        const isDeact = res.data?.isDeactivated || !res.data?.active;
        if (isDeact) {
          localStorage.setItem("skc-deactivated", "true");
          if (res.data?.reconsultationRequested) {
            localStorage.setItem("skc-reconsultation-requested", "true");
          }
          if (location.pathname !== "/Client") {
            navigate("/Client", { replace: true });
          }
        } else {
          localStorage.setItem("skc-deactivated", "false");
          localStorage.setItem("skc-reconsultation-requested", "false");
        }
      })
      .catch(() => {});
  }, [location.pathname, navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdating(true);
    try {
      await api.post("/Client/ChangePassword", { newPassword });
      toast.success("Password changed successfully! Temporary password removed.");
      localStorage.setItem("skc-temppass", "false");
      setIsTempPass(false);
      setShowModal(false);
    } catch {
      toast.error("Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-route-container">
      <PortalTopBar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="admin-body-layout">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="admin-child-route">
        {/* Banner if temp pass was closed without changing */}
        {isTempPass && !showModal && (
          <div style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "10px",
            padding: "12px 18px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            color: "#92400e",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HiOutlineShieldExclamation size={22} color="#d97706" />
              <span>
                <strong>Action Recommended:</strong> You are currently using a temporary password. Please change it to secure your account.
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "6px 14px",
                background: "#d97706",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Set Permanent Password
            </button>
          </div>
        )}

        <Outlet />
        <Footer />
        </main>
      </div>

      {/* Force / Suggest Change Password Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "460px",
            padding: "30px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            textAlign: "center",
            fontFamily: "var(--font2, sans-serif)",
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}>
              <HiOutlineKey size={30} />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700", color: "#111827" }}>
              Set Your New Password
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>
              You logged in using a temporary password assigned by the office. Please set your private, permanent password now.
            </p>

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  New Password
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter new secure password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    title={showNewPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                    }}
                  >
                    {showNewPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                    }}
                  >
                    {showConfirmPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Remind Me Later
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    flex: 2,
                    padding: "10px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: updating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <HiOutlineCheck size={18} />
                  {updating ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
