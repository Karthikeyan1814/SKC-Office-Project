import { useState, useEffect } from "react";
import { HiOutlineUserCircle, HiOutlineStar, HiOutlineSparkles, HiOutlineTrophy, HiOutlineShieldCheck, HiOutlineCalendarDays } from "react-icons/hi2";
import api from "../../api/axiosInstance";

const PLAN_CONFIG = {
  SILVER: {
    color: "#94a3b8",
    glow: "0 0 40px rgba(148,163,184,0.6), 0 0 80px rgba(148,163,184,0.3)",
    border: "linear-gradient(135deg, #94a3b8, #cbd5e1, #94a3b8)",
    bg: "linear-gradient(135deg, #1e293b, #0f172a)",
    shimmer: "linear-gradient(105deg, transparent 30%, rgba(148,163,184,0.4) 50%, transparent 70%)",
    label: "Silver",
    icon: HiOutlineStar,
  },
  GOLD: {
    color: "#f59e0b",
    glow: "0 0 40px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.4)",
    border: "linear-gradient(135deg, #f59e0b, #fbbf24, #d97706)",
    bg: "linear-gradient(135deg, #1c1400, #0f0c00)",
    shimmer: "linear-gradient(105deg, transparent 30%, rgba(245,158,11,0.5) 50%, transparent 70%)",
    label: "Gold",
    icon: HiOutlineSparkles,
  },
  PLATINUM: {
    color: "#a855f7",
    glow: "0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(168,85,247,0.4), 0 0 120px rgba(99,102,241,0.3)",
    border: "linear-gradient(135deg, #a855f7, #818cf8, #f59e0b, #a855f7)",
    bg: "linear-gradient(135deg, #120020, #08000f)",
    shimmer: "linear-gradient(105deg, transparent 20%, rgba(168,85,247,0.4) 40%, rgba(129,140,248,0.4) 60%, transparent 80%)",
    label: "Platinum",
    icon: HiOutlineTrophy,
  },
};

export default function ClientProfile() {
  const name = localStorage.getItem("skc-name") || "Client";
  const role = localStorage.getItem("skc-role") || "CLIENT";
  const clientId = localStorage.getItem("skc-id") || "";

  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/Client/Membership/Status");
        setMembership(res.data);
      } catch {
        setMembership({ membershipStatus: "NONE", isActive: false });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const isActiveMember = membership?.isActive && membership?.membershipStatus === "MEMBER";
  const plan = membership?.membershipPlan && isActiveMember ? PLAN_CONFIG[membership.membershipPlan] || PLAN_CONFIG.SILVER : null;
  const PlanIcon = plan?.icon || null;

  // Days until expiry
  const daysLeft = membership?.membershipExpiry
    ? Math.max(0, Math.ceil((new Date(membership.membershipExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="client-profile-root" style={{ padding: "24px", fontFamily: "'Inter', sans-serif", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .profile-card-shimmer {
          background-size: 300% auto;
          animation: shimmer 3s linear infinite;
        }
        .membership-card {
          position: relative;
          border-radius: 20px;
          padding: 32px;
          overflow: hidden;
          animation: float 4s ease-in-out infinite;
        }
        .membership-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 22px;
          padding: 2px;
          z-index: -1;
        }
        .membership-card-shimmer {
          position: absolute;
          inset: 0;
          background-size: 300% auto;
          animation: shimmer 3s linear infinite;
          opacity: 0.15;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .client-profile-root {
            padding: 10px 4px !important;
          }
          .client-profile-card {
            padding: 18px 14px !important;
            border-radius: 14px !important;
          }
          .membership-card {
            padding: 20px 16px !important;
          }
        }
        @media (max-width: 480px) {
          .client-profile-root {
            padding: 6px 2px !important;
          }
          .client-profile-card {
            padding: 14px 10px !important;
          }
        }
      `}</style>

      <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#111827", marginBottom: "8px", fontSize: "20px", fontWeight: 800 }}>
        <HiOutlineUserCircle size={26} color="#4f46e5" /> My Account
      </h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "28px" }}>
        Your portal profile and membership status.
      </p>

      {/* ── BASE PROFILE CARD ─────────────────────── */}
      <div className="client-profile-card" style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: isActiveMember ? `${plan.glow}, 0 8px 32px rgba(0,0,0,0.08)` : "0 2px 16px rgba(0,0,0,0.07)",
        marginBottom: "24px",
        border: isActiveMember ? `3px solid ${plan.color}` : "1px solid #e5e7eb",
        transition: "all 0.4s ease",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "24px" }}>
          {/* Avatar */}
          <div style={{
            width: "66px", height: "66px", borderRadius: "50%",
            background: plan ? plan.bg : "#f0f4ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontWeight: "800",
            color: plan ? plan.color : "#4f46e5",
            boxShadow: plan ? plan.glow : "none",
            border: plan ? `2px solid ${plan.color}` : "2px solid #e0e7ff",
            flexShrink: 0,
            animation: plan ? "glow-pulse 2s ease-in-out infinite" : "none",
          }}>
            {name[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#111827" }}>{name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", background: "#dbeafe", color: "#1e40af", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                {role}
              </span>
              {isActiveMember && plan && (
                <span style={{
                  padding: "3px 10px",
                  background: `${plan.color}20`,
                  color: plan.color,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <PlanIcon size={12} /> {plan.label} Member
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
          <div><span style={{ color: "#6b7280" }}>Account ID:</span> <strong>#{clientId || "1"}</strong></div>
          <div><span style={{ color: "#6b7280" }}>Security:</span> <strong>Protected SSL &amp; AWS S3 Encryption</strong></div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <HiOutlineShieldCheck size={16} color="#22c55e" />
            <span style={{ color: "#6b7280" }}>Portal Status:</span>
            <strong style={{ color: "#22c55e" }}>Active Member</strong>
          </div>
        </div>
      </div>

      {/* ── MEMBERSHIP CARD ───────────────────────── */}
      {!loading && (
        isActiveMember ? (
          <div
            className="membership-card"
            style={{
              background: plan.bg,
              boxShadow: plan.glow,
              border: `1px solid ${plan.color}60`,
              marginBottom: "24px",
            }}
          >
            {/* Shimmer overlay */}
            <div
              className="membership-card-shimmer profile-card-shimmer"
              style={{ backgroundImage: plan.shimmer }}
            />

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                  <p style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", margin: "0 0 4px", textTransform: "uppercase" }}>
                    Sri Kathiravan &amp; Co
                  </p>
                  <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: plan.color, letterSpacing: "-0.5px" }}>
                    {plan.label} Membership
                  </h2>
                </div>
                <PlanIcon size={52} color={plan.color} style={{ opacity: 0.9 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 3px", fontWeight: 600 }}>MEMBER NAME</p>
                  <p style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: 700, margin: 0 }}>{name}</p>
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 3px", fontWeight: 600 }}>VALID UNTIL</p>
                  <p style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: 700, margin: 0 }}>
                    {membership.membershipExpiry
                      ? new Date(membership.membershipExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 3px", fontWeight: 600 }}>DAYS LEFT</p>
                  <p style={{ color: daysLeft < 30 ? "#ef4444" : plan.color, fontSize: "14px", fontWeight: 800, margin: 0 }}>
                    {daysLeft} days
                  </p>
                </div>
              </div>

              {/* Features unlocked */}
              <div style={{ borderTop: `1px solid ${plan.color}30`, paddingTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["24/7 Support", "Priority Response", "Expert Guidance", "Portal Access"].map((f) => (
                  <span key={f} style={{
                    padding: "4px 10px",
                    background: `${plan.color}15`,
                    color: plan.color,
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: `1px solid ${plan.color}30`,
                  }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* No membership */
          <div style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            borderRadius: "16px",
            padding: "28px",
            border: "1px dashed rgba(255,255,255,0.1)",
            textAlign: "center",
            marginBottom: "24px",
          }}>
            <HiOutlineTrophy size={40} color="#374151" style={{ marginBottom: "12px" }} />
            <h3 style={{ color: "#94a3b8", margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>No Active Membership</h3>
            <p style={{ color: "#475569", fontSize: "13px", margin: "0 0 16px" }}>
              Unlock premium features by applying for a membership plan.
            </p>
            <a
              href="/membership"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "linear-gradient(135deg, var(--primary, #4f46e5), var(--primary-hover, #7c3aed))",
                color: "#fff",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              View Membership Plans
            </a>
          </div>
        )
      )}

      {/* ── ACCOUNT DETAILS ───────────────────────── */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h4 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, color: "#374151" }}>Account Security</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#6b7280" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineShieldCheck size={16} color="#22c55e" />
            Data encrypted at rest in AWS S3
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineShieldCheck size={16} color="#22c55e" />
            JWT-based session authentication
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineCalendarDays size={16} color="#6366f1" />
            Account since: {new Date().toLocaleDateString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
