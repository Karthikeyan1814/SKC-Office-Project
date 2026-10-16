import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TiTick } from "react-icons/ti";
import {
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import "../styles/MemberShip.css";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";

const PLANS = [
  {
    tier: "SILVER",
    icon: HiOutlineStar,
    label: "Silver",
    tagline: "Perfect Start",
    price: "₹299",
    duration: "1 Month",
    color: "#94a3b8",
    glow: "0 0 30px rgba(148,163,184,0.4)",
    border: "rgba(148,163,184,0.5)",
    bg: "linear-gradient(135deg, #1e293b, #0f172a)",
    features: [
      "24/7 Expert Support",
      "GST Notice Guidance",
      "Income Tax Assistance",
      "Unlimited Doubt Clarification",
      "Priority Response",
    ],
  },
  {
    tier: "GOLD",
    icon: HiOutlineSparkles,
    label: "Gold",
    tagline: "Most Popular",
    price: "₹699",
    duration: "6 Months",
    color: "#f59e0b",
    glow: "0 0 40px rgba(245,158,11,0.5)",
    border: "rgba(245,158,11,0.6)",
    bg: "linear-gradient(135deg, #292400, #1a1700)",
    features: [
      "Everything in Silver",
      "24/7 Timeline Meeting Booking",
      "Documentation Support",
      "Live Chat to Admin",
      "Expiration-Free File Downloads",
    ],
    badge: "POPULAR",
  },
  {
    tier: "PLATINUM",
    icon: HiOutlineTrophy,
    label: "Platinum",
    tagline: "Maximum Value",
    price: "₹999",
    duration: "12 Months",
    color: "#a855f7",
    glow: "0 0 50px rgba(168,85,247,0.5)",
    border: "rgba(168,85,247,0.6)",
    bg: "linear-gradient(135deg, #1a0033, #0d0019)",
    features: [
      "Everything in Gold",
      "Dedicated Senior Chartered Accountant",
      "Unlimited 1-on-1 Consultations",
      "Lifetime Expiration-Free Vault",
      "Zero-Wait Admin Desk Support",
    ],
    badge: "BEST VALUE",
  },
];

export default function Membership() {
  const [selectedPlan, setSelectedPlan] = useState("GOLD");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    businessName: "",
    businessType: "",
    location: "",
    gstnumber: "",
    pannumber: "",
    message: "",
  });

  const [emailStatus, setEmailStatus] = useState("idle"); // idle | checking | ok | not_found
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Popup Modal state for verification feedback
  const [verifyModal, setVerifyModal] = useState(null); // { isOpen: boolean, type: 'VERIFIED' | 'UNREGISTERED', name?: string, email?: string }

  const plan = PLANS.find((p) => p.tier === selectedPlan);

  // Verify email function
  const runEmailCheck = async (emailToCheck, showModalOnResult = false) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      if (showModalOnResult) toast.error("Please enter a valid email address");
      return false;
    }
    setCheckingEmail(true);
    setEmailStatus("checking");

    try {
      const res = await api.get(`/Membership/CheckEmail?email=${encodeURIComponent(emailToCheck.trim())}`);
      if (res.data?.registered) {
        setEmailStatus("ok");
        setClientInfo(res.data);
        if (!form.fullName && res.data.name) {
          setForm((prev) => ({ ...prev, fullName: res.data.name }));
        }
        if (showModalOnResult) {
          setVerifyModal({
            isOpen: true,
            type: "VERIFIED",
            name: res.data.name || "Valued Client",
            email: emailToCheck.trim(),
          });
        }
        return true;
      } else {
        setEmailStatus("not_found");
        setClientInfo(null);
        if (showModalOnResult) {
          setVerifyModal({
            isOpen: true,
            type: "UNREGISTERED",
            email: emailToCheck.trim(),
          });
        }
        return false;
      }
    } catch {
      setEmailStatus("error");
      if (showModalOnResult) toast.error("Could not reach verification server. Please try again.");
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounce check while typing
  useEffect(() => {
    if (!form.email || !form.email.includes("@")) {
      setEmailStatus("idle");
      return;
    }
    const timer = setTimeout(() => {
      runEmailCheck(form.email, false);
    }, 800);
    return () => clearTimeout(timer);
  }, [form.email]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.email.includes("@")) {
      toast.error("Please provide your registered email address.");
      return;
    }

    // If not yet verified as ok, run the check right now
    if (emailStatus !== "ok") {
      const isRegistered = await runEmailCheck(form.email, true);
      if (!isRegistered) {
        // Modal is shown by runEmailCheck
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post("/Membership/Request", { ...form, planType: selectedPlan });
      setSubmitted(true);
      toast.success("Membership request submitted! We will contact you within 24 hours.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit request. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="member-page">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="member-hero-section">
        <div className="member-hero-badge">Sri Kathiravan &amp; Co Membership</div>
        <h1 className="member-hero-title">
          Expert Tax Guidance —<br />
          <span className="member-hero-accent">Anytime You Need It</span>
        </h1>
        <p className="member-hero-sub">
          One membership. Unlimited confidence. Professional guidance 365 days a year.
        </p>
        <div className="member-hero-stats">
          <div className="member-stat"><span>24/7</span><p>Support</p></div>
          <div className="member-stat"><span>3</span><p>Plan Tiers</p></div>
          <div className="member-stat"><span>365</span><p>Days Coverage</p></div>
        </div>
      </section>

      {/* ── PLAN CARDS ───────────────────────────────────────── */}
      <section className="member-plans-section">
        <h2 className="member-section-title">Choose Your Membership Tier</h2>
        <div className="member-plans-grid">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPlan === p.tier;
            return (
              <div
                key={p.tier}
                className={`member-plan-card ${isSelected ? "selected" : ""}`}
                style={{
                  background: p.bg,
                  borderColor: isSelected ? p.color : "rgba(255,255,255,0.08)",
                  boxShadow: isSelected ? p.glow : "none",
                }}
                onClick={() => setSelectedPlan(p.tier)}
              >
                {p.badge && (
                  <div className="member-plan-badge" style={{ background: p.color }}>
                    {p.badge}
                  </div>
                )}
                <div className="member-plan-icon-wrap" style={{ color: p.color }}>
                  <Icon size={28} />
                </div>
                <h3 className="member-plan-name">{p.label}</h3>
                <p className="member-plan-tagline">{p.tagline}</p>
                <div className="member-plan-price-row">
                  <span className="member-plan-price" style={{ color: p.color }}>{p.price}</span>
                  <span className="member-plan-duration">/ {p.duration}</span>
                </div>
                <ul className="member-plan-features">
                  {p.features.map((f, i) => (
                    <li key={i}>
                      <TiTick className="feature-tick" style={{ color: p.color }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`member-plan-select-btn ${isSelected ? "active" : ""}`}
                  style={{
                    borderColor: p.color,
                    background: isSelected ? p.color : "transparent",
                    color: isSelected ? "#000" : p.color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(p.tier);
                  }}
                >
                  {isSelected ? "Selected Tier" : `Choose ${p.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── APPLICATION FORM ─────────────────────────────────── */}
      <section className="member-apply-section" id="apply-form">
        <h2 className="member-section-title">Apply for {plan.label} Membership</h2>
        <p className="member-section-sub">
          Active registered clients can apply below. Our team verifies client status and sends the payment QR code via WhatsApp &amp; Email.
        </p>

        {submitted ? (
          <div className="member-success-card">
            <HiOutlineCheckCircle size={56} color="#22c55e" style={{ margin: "0 auto 16px" }} />
            <h2>Membership Request Received!</h2>
            <p>
              Thank you, <strong>{form.fullName}</strong>. We have received your application for the <strong>{plan.label} Membership ({plan.price})</strong>.
            </p>
            <p style={{ marginTop: "8px", color: "#94a3b8" }}>
              Our audit desk has been notified. We will send the payment QR code and activation confirmation to <strong>{form.email}</strong> and WhatsApp within 24 hours.
            </p>
            <div style={{ marginTop: "28px" }}>
              <Link
                to="/SignIn"
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "#fff",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                Go to Portal Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="member-apply-form" onSubmit={handleSubmit}>
            <div className="member-selected-summary" style={{ borderColor: plan.color }}>
              <div>
                <span className="summary-label">Selected Tier</span>
                <span className="summary-val" style={{ color: plan.color }}>{plan.label} Card</span>
              </div>
              <div>
                <span className="summary-label">Duration</span>
                <span className="summary-val">{plan.duration}</span>
              </div>
              <div>
                <span className="summary-label">Investment</span>
                <span className="summary-val" style={{ color: plan.color }}>{plan.price}</span>
              </div>
            </div>

            <div className="member-form-grid">
              {/* Registered Email with Instant Verification Button */}
              <div className="member-form-field full">
                <label htmlFor="mf-email">Registered Client Email *</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
                  <input
                    id="mf-email"
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. yourname@company.com"
                    value={form.email}
                    onChange={handleChange}
                    className={emailStatus === "ok" ? "valid" : emailStatus === "not_found" ? "invalid" : ""}
                    style={{
                      flex: 1,
                      border: emailStatus === "ok" ? "2px solid #22c55e" : emailStatus === "not_found" ? "2px solid #ef4444" : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => runEmailCheck(form.email, true)}
                    disabled={checkingEmail || !form.email}
                    style={{
                      padding: "0 20px",
                      background: emailStatus === "ok" ? "#059669" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: checkingEmail || !form.email ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {checkingEmail ? (
                      "Checking..."
                    ) : emailStatus === "ok" ? (
                      <><HiOutlineShieldCheck size={18} /> Verified Client</>
                    ) : (
                      "Check Status"
                    )}
                  </button>
                </div>

                {emailStatus === "ok" && (
                  <span className="email-check-hint ok" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <HiOutlineCheckCircle size={15} />
                    Verified registered client account ({clientInfo?.name || form.fullName || "Active Client"}). Eligible to apply!
                  </span>
                )}
                {emailStatus === "not_found" && (
                  <span className="email-check-hint invalid" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <HiOutlineExclamationCircle size={15} />
                    Not registered in our portal. You must be an existing registered client of Sri Kathiravan &amp; Co to apply.
                  </span>
                )}
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-name">Full Name *</label>
                <input
                  id="mf-name"
                  type="text"
                  name="fullName"
                  required
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-mobile">Mobile Number *</label>
                <input
                  id="mf-mobile"
                  type="tel"
                  name="mobile"
                  required
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-business">Business / Firm Name</label>
                <input
                  id="mf-business"
                  type="text"
                  name="businessName"
                  placeholder="e.g. Aravind Enterprises Pvt Ltd"
                  value={form.businessName}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-type">Business Type</label>
                <input
                  id="mf-type"
                  type="text"
                  name="businessType"
                  placeholder="e.g. Services, Retail, Manufacturing"
                  value={form.businessType}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-location">Location</label>
                <input
                  id="mf-location"
                  type="text"
                  name="location"
                  placeholder="City, State"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-gst">GST Number</label>
                <input
                  id="mf-gst"
                  type="text"
                  name="gstnumber"
                  placeholder="GSTIN (optional)"
                  value={form.gstnumber}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field">
                <label htmlFor="mf-pan">PAN Number</label>
                <input
                  id="mf-pan"
                  type="text"
                  name="pannumber"
                  placeholder="PAN (optional)"
                  value={form.pannumber}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-field full">
                <label htmlFor="mf-message">Message (Optional)</label>
                <textarea
                  id="mf-message"
                  name="message"
                  rows={3}
                  placeholder="Any specific tax or audit requirements..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Clickable Action Button */}
            <button
              type="submit"
              className="member-submit-btn"
              disabled={submitting}
              style={{
                background: plan.color,
                color: plan.tier === "SILVER" ? "#0f172a" : plan.tier === "GOLD" ? "#0f172a" : "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              id="membership-submit-btn"
            >
              {submitting ? (
                "Submitting Application..."
              ) : (
                <>
                  <span>Apply for {plan.label} Membership ({plan.price})</span>
                  <HiOutlineArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </section>

      {/* ══════ POPUP MODAL: VERIFICATION & FEEDBACK ══════ */}
      {verifyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 7, 18, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && setVerifyModal(null)}
        >
          <div
            style={{
              background: "#0f172a",
              border: verifyModal.type === "VERIFIED" ? "2px solid #22c55e" : "2px solid #ef4444",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              color: "#fff",
              boxShadow: verifyModal.type === "VERIFIED"
                ? "0 20px 60px rgba(34, 197, 94, 0.3)"
                : "0 20px 60px rgba(239, 68, 68, 0.3)",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setVerifyModal(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <HiOutlineXMark size={22} />
            </button>

            {verifyModal.type === "VERIFIED" ? (
              /* ── VERIFIED REGISTERED CLIENT ── */
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "2px solid #22c55e",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <HiOutlineCheckBadge size={34} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "#22c55e" }}>
                  Registered Client Verified!
                </h3>
                <p style={{ color: "#e2e8f0", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }}>
                  Welcome back, <strong>{verifyModal.name}</strong>! Your account (<code>{verifyModal.email}</code>) is registered with Sri Kathiravan &amp; Co.
                </p>
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "14px",
                    marginBottom: "24px",
                    fontSize: "13px",
                    color: "#94a3b8",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Client Name:</span>
                    <strong style={{ color: "#fff" }}>{verifyModal.name}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Selected Plan:</span>
                    <strong style={{ color: plan.color }}>{plan.label} Card ({plan.price})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Eligibility:</span>
                    <strong style={{ color: "#22c55e" }}>Eligible for Membership</strong>
                  </div>
                </div>
                <button
                  onClick={() => setVerifyModal(null)}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "linear-gradient(135deg, #059669, #047857)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  Proceed with Application
                </button>
              </div>
            ) : (
              /* ── UNREGISTERED EMAIL ALERT ── */
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "2px solid #ef4444",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <HiOutlineExclamationCircle size={36} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "#ef4444" }}>
                  Client Registration Required
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px" }}>
                  The email <strong style={{ color: "#fff" }}>{verifyModal.email}</strong> is not registered in our portal database.
                </p>
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "12px",
                    padding: "14px",
                    marginBottom: "24px",
                    fontSize: "13px",
                    color: "#fca5a5",
                    textAlign: "left",
                    lineHeight: "1.5",
                  }}
                >
                  ⚠️ <strong>Notice:</strong> Per Sri Kathiravan &amp; Co office guidelines, membership privileges (24/7 meetings, document support, and permanent downloads) are exclusively available for registered clients.
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setVerifyModal(null)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                  <Link
                    to="/SignIn"
                    style={{
                      flex: 2,
                      padding: "12px",
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "#fff",
                      borderRadius: "10px",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span>Sign In to Portal</span>
                    <HiOutlineArrowTopRightOnSquare size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}