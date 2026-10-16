import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/ClientPortal.css";
import {
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineIdentification,
} from "react-icons/hi2";

const TIERS = [
  {
    id: "SILVER",
    name: "Silver Card",
    badge: "ESSENTIAL",
    badgeColor: "#64748b",
    price: "₹299",
    duration: "1 Month",
    accent: "#94a3b8",
    icon: HiOutlineStar,
    desc: "Perfect for foundational business compliance and standard document archiving.",
    features: [
      "Standard Document Vault Access",
      "GST Notice Response Guidance",
      "Email & Portal Notifications",
      "Verified Audit Record Download",
    ],
  },
  {
    id: "GOLD",
    name: "Gold Card",
    badge: "MOST POPULAR",
    badgeColor: "#d97706",
    price: "₹699",
    duration: "6 Months",
    accent: "#f59e0b",
    icon: HiOutlineSparkles,
    desc: "Our most requested package with 24/7 private meeting schedules and live CA chat.",
    features: [
      "Everything in Silver Plan",
      "24/7 Priority Meeting Booking",
      "Live Chat Documentation Support",
      "Permanent Expiration-Free Downloads",
      "Direct Notice Defense Advisory",
    ],
  },
  {
    id: "PLATINUM",
    name: "Platinum Card",
    badge: "MAX PRIVILEGE",
    badgeColor: "#9333ea",
    price: "₹999",
    duration: "12 Months (Annual Renewal)",
    accent: "#a855f7",
    icon: HiOutlineTrophy,
    desc: "Complete VIP audit desk with dedicated Chartered Accountant and permanent vault for uploaded files (1-year term, annual renewal required).",
    features: [
      "All Gold Benefits Included",
      "Dedicated Chartered Accountant Desk",
      "Unlimited 1-on-1 Consultations",
      "Zero-Queue Live Audit Verification",
      "Permanent Storage for Uploaded Files",
      "1-Year VIP Status (Annual Renewal)",
    ],
  },
];

export default function ClientMembershipRequest() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState("GOLD");
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: localStorage.getItem("skc-name") || "",
    email: "",
    mobile: "",
    companyName: "",
    notes: "",
  });

  // Fetch current client profile and membership status
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const memRes = await api.get("/Client/Membership/Status");
        const mem = memRes.data;
        setCurrentMembership(mem);

        const isMemberActive = mem?.isActive && mem?.membershipStatus === "MEMBER";
        const hasExpired = mem?.membershipExpiry ? new Date(mem.membershipExpiry) < new Date() : false;

        // If client already holds an active unexpired membership, pre-select next upgrade tier
        if (isMemberActive && !hasExpired) {
          const currentPlan = (mem?.membershipPlan || "").toUpperCase();
          if (currentPlan === "SILVER") setSelectedTier("GOLD");
          else if (currentPlan === "GOLD") setSelectedTier("PLATINUM");
          else setSelectedTier("PLATINUM");
        }
      } catch {
        setCurrentMembership(null);
      }

      // Try fetching profile or stored user
      try {
        const profRes = await api.get("/Client/Profile");
        if (profRes.data) {
          setFormData((prev) => ({
            ...prev,
            name: profRes.data.name || prev.name,
            email: profRes.data.email || prev.email,
            mobile: profRes.data.mobile || prev.mobile,
            companyName: profRes.data.companyName || "",
          }));
        }
      } catch {
        // Fallback from localStorage
        const storedUser = localStorage.getItem("skc-user") || "";
        if (storedUser.includes("@")) {
          setFormData((prev) => ({ ...prev, email: storedUser }));
        } else if (/^\d+$/.test(storedUser)) {
          setFormData((prev) => ({ ...prev, mobile: storedUser }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const activeTier = TIERS.find((t) => t.id === selectedTier) || TIERS[1];
  const isExpired = currentMembership?.membershipExpiry
    ? new Date(currentMembership.membershipExpiry) < new Date()
    : false;
  const isCurrentlyActive = currentMembership?.isActive && currentMembership?.membershipStatus === "MEMBER" && !isExpired;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please provide your full name");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please provide a valid registered email address");
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length < 10) {
      toast.error("Please provide a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/Membership/Request", {
        fullName: formData.name.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        businessName: (formData.companyName || "").trim() || "Client Portal",
        companyName: (formData.companyName || "").trim() || "Client Portal",
        planType: selectedTier,
        message: (formData.notes || "").trim() || "Requested via Client Portal",
        notes: (formData.notes || "").trim() || "Requested via Client Portal",
      });

      toast.success(`🎉 ${activeTier.name} request dispatched successfully!`);
      setSubmittedSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        err.message ||
        "Failed to submit request. Please verify your details.";
      if (err.response?.data?.status === "duplicate") {
        toast.success(err.response.data.message || "Your membership application is already under administrative review.");
        setSubmittedSuccess(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="client-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Loading membership privileges & client profile...</p>
      </div>
    );
  }

  return (
    <div className="client-page-container">
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="client-hero-card">
        <div>
          <span
            className="client-hero-tag"
            style={{
              background: "rgba(245, 158, 11, 0.2)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.4)",
            }}
          >
            <HiOutlineSparkles size={14} /> VIP MEMBERSHIP PORTAL
          </span>
          <h1 className="client-hero-title">
            {isExpired
              ? "Renew Your Membership Package"
              : isCurrentlyActive
              ? "Upgrade or Extend Your Membership"
              : "Request Official Membership Tier"}
          </h1>
          <p className="client-hero-sub">
            {isExpired
              ? `Your ${currentMembership?.membershipPlan || "VIP"} Card membership period has concluded. Choose a renewal tier below to maintain uninterrupted consultation bandwidth and document vault privileges.`
              : isCurrentlyActive
              ? `You are currently an active ${currentMembership.membershipPlan} member. Select an elevated tier to upgrade your executive privileges, or extend your active coverage.`
              : "Unlock 24/7 dedicated meeting booking, real-time GST notice support, and permanent expiration-free document downloads."}
          </p>
        </div>

        <div className="client-hero-actions">
          <Link to="/Client/Membership" className="btn-client-outline">
            <HiOutlineArrowLeft size={16} /> View Current Perks
          </Link>
        </div>
      </div>

      {/* ── EXPIRED MEMBERSHIP NOTICE BANNER ──────────────────── */}
      {isExpired && (
        <div
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            border: "1.5px solid #fed7aa",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ea580c",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HiOutlineClock size={20} />
            </span>
            <div>
              <h4 style={{ margin: "0 0 3px 0", fontSize: "15px", fontWeight: "800", color: "#9a3412" }}>
                Annual Membership Term Concluded: {currentMembership?.membershipPlan} Card
              </h4>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#c2410c" }}>
                Term ended on:{" "}
                {currentMembership?.membershipExpiry
                  ? new Date(currentMembership.membershipExpiry).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Annual term finished"}{" "}
                • Select a renewal package below to re-activate your VIP privileges.
              </p>
            </div>
          </div>
          <span
            style={{
              padding: "4px 12px",
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "800",
              border: "1px solid #fecaca",
            }}
          >
            RENEWAL REQUIRED
          </span>
        </div>
      )}

      {/* ── CURRENT MEMBERSHIP STATUS BANNER (If Active) ──────── */}
      {isCurrentlyActive && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "16px",
            padding: "18px 22px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#22c55e",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HiOutlineShieldCheck size={22} />
            </span>
            <div>
              <h4 style={{ margin: "0 0 3px 0", fontSize: "15px", fontWeight: "800", color: "#166534" }}>
                Active Status: {currentMembership.membershipPlan} Member
              </h4>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#15803d" }}>
                Valid through:{" "}
                {currentMembership.membershipExpiry
                  ? new Date(currentMembership.membershipExpiry).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }) + " (Annual Renewal Required)"
                  : "1-Year Term (Annual Renewal Required)"}
              </p>
            </div>
          </div>
          <span
            style={{
              padding: "5px 12px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "800",
              border: "1px solid #86efac",
            }}
          >
            ✓ ACTIVE PRIVILEGES
          </span>
        </div>
      )}

      {/* ── ALREADY ACTIVE MEMBERSHIP VIEW (No Form Shown) ──── */}
      {isCurrentlyActive ? (
        <div className="client-req-card" style={{ padding: "30px 24px" }}>
          <div
            style={{
              background: currentMembership.membershipPlan === "PLATINUM"
                ? "linear-gradient(135deg, #2e1065 0%, #3b0764 100%)"
                : currentMembership.membershipPlan === "GOLD"
                ? "linear-gradient(135deg, #78350f 0%, #451a03 100%)"
                : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "28px 24px",
              color: "#ffffff",
              boxShadow: "0 10px 28px rgba(0,0,0,0.15)",
              marginBottom: "24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    marginBottom: "10px",
                  }}
                >
                  <HiOutlineSparkles size={13} /> ACTIVE VIP MEMBERSHIP
                </span>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", letterSpacing: "-0.4px" }}>
                  {currentMembership.membershipPlan} Card Member
                </h2>
                <p style={{ margin: 0, opacity: 0.85, fontSize: "13px", maxWidth: "480px", lineHeight: 1.5 }}>
                  Your enterprise account holds an active, verified VIP membership with Sri Kathiravan & Co.
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  textAlign: "right",
                  minWidth: "170px",
                }}
              >
                <div style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.8, fontWeight: "700", letterSpacing: "0.5px" }}>
                  Membership Validity
                </div>
                <div style={{ fontSize: "15px", fontWeight: "800", marginTop: "4px" }}>
                  {currentMembership.membershipExpiry
                    ? `${new Date(currentMembership.membershipExpiry).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })} (1-Year Term)`
                    : "1-Year Term (Annual Renewal)"}
                </div>
                <div style={{ fontSize: "11px", color: "#86efac", marginTop: "4px", fontWeight: "700" }}>
                  ✓ Status: Fully Active
                </div>
              </div>
            </div>

            {/* Privileges Grid */}
            <div
              style={{
                marginTop: "26px",
                paddingTop: "22px",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
                <span>Priority Document Vault</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
                <span>24/7 Meeting Scheduling</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
                <span>GST & Notice Advisory</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
                <span>
                  {currentMembership.membershipPlan === "PLATINUM"
                    ? "Permanent Expiration-Free Files"
                    : "Direct Audit Consultation"}
                </span>
              </div>
            </div>
          </div>

          {/* Reassurance Notice */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "14px",
              padding: "18px 22px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#22c55e",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HiOutlineCheckBadge size={24} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "700", color: "#166534" }}>
                No Application Required
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#15803d", lineHeight: 1.5 }}>
                Since you already hold an active membership, you do not need to fill out a membership application again. All privileges are in full effect.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "flex-start" }}>
            <Link to="/Client/Files" className="btn-client-gold" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Open Document Vault <HiOutlineArrowRight size={16} />
            </Link>
            <Link to="/Client/Appointments" className="btn-client-outline" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Schedule Consultation <HiOutlineArrowRight size={16} />
            </Link>
            <Link to="/Client/Membership" className="btn-client-outline" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              View Membership Details <HiOutlineArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : submittedSuccess ? (
        /* ── SUCCESS STATE VIEW (For new applicants) ─────────────── */
        <div className="client-req-card" style={{ textAlign: "center", padding: "60px 30px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              boxShadow: "0 4px 20px rgba(245, 158, 11, 0.25)",
            }}
          >
            <HiOutlineSparkles size={36} />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: "0 0 10px 0" }}>
            Application Dispatched Successfully!
          </h2>
          <p style={{ color: "#475569", fontSize: "15px", maxWidth: "600px", margin: "0 auto 26px auto", lineHeight: 1.6 }}>
            Your request for <strong>{activeTier.name}</strong> has been routed to the SKC Administrator desk.
            Once verified, your digital membership card with automated QR credentials will be delivered to your registered email{" "}
            <strong>({formData.email})</strong>.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <Link to="/Client/Membership" className="btn-client-gold">
              Go to Membership Hub <HiOutlineArrowRight size={16} />
            </Link>
            <button
              onClick={() => setSubmittedSuccess(false)}
              className="btn-client-outline"
              style={{ color: "#334155", borderColor: "#cbd5e1" }}
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        /* ── INTERACTIVE APPLICATION WORKFLOW (Only when NOT active) ── */
        <div className="client-req-card">
          <div style={{ marginBottom: "26px" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
              <HiOutlineIdentification size={24} color="#d97706" /> Step 1: Select Your Membership Tier
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Choose the package that aligns with your business audit frequency and compliance demands.
            </p>
          </div>

          {/* Tier Selector Grid */}
          <div className="tier-select-grid">
            {TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              const IconComp = tier.icon;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`tier-card-option ${isSelected ? "selected" : ""}`}
                >
                  <span className="tier-badge-pill" style={{ background: tier.badgeColor }}>
                    {tier.badge}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: isSelected ? "rgba(245, 158, 11, 0.15)" : "#f8fafc",
                        color: isSelected ? "#d97706" : tier.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComp size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                        {tier.name}
                      </h4>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                        {tier.duration} Access
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "32px", fontWeight: "900", color: isSelected ? "#d97706" : "#0f172a", marginBottom: "8px" }}>
                    {tier.price}
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginLeft: "6px" }}>
                      / term
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                    {tier.desc}
                  </p>

                  <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {tier.features.map((feat, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#334155" }}>
                        <span style={{ color: isSelected ? "#d97706" : "#10b981", fontWeight: "bold" }}>✓</span>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Step */}
          <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "30px", marginTop: "10px" }}>
            <div style={{ marginBottom: "22px" }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                <HiOutlineCheckBadge size={24} color="#059669" /> Step 2: Confirm Client Particulars
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Your portal profile information has been automatically loaded below for swift processing.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                <div className="form-group-lux">
                  <label className="form-label-lux">Full Name / Authorized Signatory *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="form-input-lux"
                  />
                </div>

                <div className="form-group-lux">
                  <label className="form-label-lux">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@example.com"
                    className="form-input-lux"
                  />
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Automated QR welcome credentials will be sent to this email.
                  </span>
                </div>

                <div className="form-group-lux">
                  <label className="form-label-lux">Registered Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="form-input-lux"
                  />
                </div>

                <div className="form-group-lux">
                  <label className="form-label-lux">Business / Trade Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Company or Enterprise Name"
                    className="form-input-lux"
                  />
                </div>
              </div>

              <div className="form-group-lux" style={{ marginTop: "10px" }}>
                <label className="form-label-lux">Specific Audit Requirements / Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mention if you require priority GST filings, income tax defense, or specific CA advisory..."
                  className="form-input-lux"
                />
              </div>

              {/* Summary Box */}
              <div
                style={{
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "1.5px solid #fde68a",
                  borderRadius: "16px",
                  padding: "18px 24px",
                  margin: "24px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Selected Package Summary
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#78350f" }}>
                    {activeTier.name} — {activeTier.price} ({activeTier.duration})
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#92400e", fontWeight: "700" }}>
                  <HiOutlineShieldCheck size={20} color="#b45309" /> Instant Desk Verification
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-submit-lux"
              >
                <HiOutlinePaperAirplane size={18} />
                {submitting ? "Transmitting Application..." : `Submit ${activeTier.name} Application`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
