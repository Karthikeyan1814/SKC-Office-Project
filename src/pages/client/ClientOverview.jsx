import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import "../../styles/ClientPortal.css";
import {
  HiOutlineFolderOpen,
  HiOutlineCalendarDays,
  HiOutlineBell,
  HiOutlineSparkles,
  HiOutlineArrowUpTray,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineIdentification,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineExclamationTriangle,
  HiOutlinePaperAirplane,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlineBanknotes,
  HiOutlineClipboardDocument,
} from "react-icons/hi2";
import toast from "react-hot-toast";

export default function ClientOverview() {
  const clientName = localStorage.getItem("skc-name") || "Valued Client";
  const [fileCount, setFileCount] = useState(0);
  const [membership, setMembership] = useState(null);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [clientStatus, setClientStatus] = useState(null);
  const [reconsultNotes, setReconsultNotes] = useState("");
  const [submittingReconsult, setSubmittingReconsult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [billingSummary, setBillingSummary] = useState({ totalBilled: 0, totalPaid: 0, pendingDue: 0, invoicesCount: 0 });
  const [firmInfo, setFirmInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_firm_info");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: "Sri Kathiravan & Co.",
      bankName: "HDFC Bank Ltd",
      accountName: "Sri Kathiravan & Co.",
      accountNumber: "50200084729103",
      ifscCode: "HDFC0001234",
      branch: "Salem Main Branch",
      upiId: "8825750992@upi",
    };
  });

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const fetchDashboardData = async () => {
    try {
      const [statusRes, filesRes, memRes, apptRes, notifRes, unreadRes, billingRes, firmRes, globalMemRes] = await Promise.allSettled([
        api.get("/Client/Status"),
        api.get("/Client/Files"),
        api.get("/Client/Membership/Status"),
        api.get("/Client/Appointments"),
        api.get("/Client/Notifications"),
        api.get("/Client/Notifications/UnreadCount"),
        api.get("/Client/Billing/Summary"),
        api.get("/Public/FirmDetails"),
        api.get("/Public/Membership/GlobalSettings"),
      ]);

      if (globalMemRes.status === "fulfilled" && globalMemRes.value.data) {
        setMembershipEnabled(Boolean(globalMemRes.value.data.membershipEnabled));
      }

      if (statusRes.status === "fulfilled" && statusRes.value.data) {
        setClientStatus(statusRes.value.data);
        if (statusRes.value.data.isDeactivated || !statusRes.value.data.active) {
          localStorage.setItem("skc-deactivated", "true");
        } else {
          localStorage.setItem("skc-deactivated", "false");
        }
      }

      if (filesRes.status === "fulfilled") setFileCount(filesRes.value.data?.length || 0);
      if (memRes.status === "fulfilled") setMembership(memRes.value.data || null);
      if (apptRes.status === "fulfilled") setAppointmentsCount(apptRes.value.data?.length || 0);
      if (notifRes.status === "fulfilled") setRecentNotifs((notifRes.value.data || []).slice(0, 3));
      if (unreadRes.status === "fulfilled") setUnreadCount(unreadRes.value.data?.count || 0);

      if (billingRes.status === "fulfilled" && billingRes.value.data) {
        const b = billingRes.value.data;
        if (b.documentCount > 0 || b.totalBilled > 0) {
          setBillingSummary({
            totalBilled: b.totalBilled || 0,
            totalPaid: b.totalPaid || 0,
            pendingDue: b.totalPendingDue || 0,
            invoicesCount: b.documentCount || 0,
          });
        }
      }

      if (firmRes.status === "fulfilled" && firmRes.value.data) {
        setFirmInfo(firmRes.value.data);
        try {
          localStorage.setItem("skc_firm_info", JSON.stringify(firmRes.value.data));
        } catch {}
      }
    } catch (e) {
      console.error("Dashboard data load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    try {
      const saved = localStorage.getItem("skc_billing_archive");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clientMobile = localStorage.getItem("skc-mobile") || "";
          const nameLower = clientName.toLowerCase();
          const matched = parsed.filter((doc) => {
            if (doc.isArchived) return false;
            const docMobile = (doc.clientMobile || "").replace(/\D/g, "");
            const userMobile = clientMobile.replace(/\D/g, "");
            if (userMobile && docMobile === userMobile) return true;
            if ((doc.clientName || "").toLowerCase().includes(nameLower)) return true;
            if (nameLower.includes((doc.clientName || "").toLowerCase())) return true;
            return false;
          });
          const targetDocs = matched.length > 0 ? matched : parsed.filter((d) => !d.isArchived);
          const totalBilled = targetDocs.filter((d) => d.type === "INVOICE").reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
          const totalPaid = targetDocs.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);
          const pendingDue = targetDocs.filter((d) => d.type === "INVOICE" && (Number(d.remainingBalance) || 0) > 0).reduce((sum, d) => sum + (Number(d.remainingBalance) || 0), 0);
          setBillingSummary({
            totalBilled,
            totalPaid,
            pendingDue,
            invoicesCount: targetDocs.length,
          });
        }
      }
    } catch {}
  }, [clientName]);

  const handleRequestReconsultation = async (e) => {
    e.preventDefault();
    setSubmittingReconsult(true);
    try {
      const res = await api.post("/Client/RequestReconsultation", {
        notes: reconsultNotes || "Client requested account reactivation and consultation.",
      });
      toast.success(res.data.message || "Re-consultation request submitted successfully!");
      setClientStatus((prev) => ({
        ...prev,
        reconsultationRequested: true,
        reconsultationNotes: reconsultNotes || "Client requested account reactivation and consultation.",
        reconsultationRequestedAt: new Date().toISOString(),
      }));
      localStorage.setItem("skc-reconsultation-requested", "true");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit re-consultation request");
    } finally {
      setSubmittingReconsult(false);
    }
  };

  const isDeactivated = clientStatus && (clientStatus.isDeactivated || !clientStatus.active);
  const isMember = membership?.isActive && membership?.membershipStatus === "MEMBER";
  const planType = (membership?.membershipPlan || "FREE").toUpperCase();

  // Days left & expiration calculation
  let daysLeft = null;
  let isExpired = false;
  if (membership?.membershipExpiry) {
    const diff = new Date(membership.membershipExpiry) - new Date();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (diff <= 0) {
      isExpired = true;
    }
  }

  // ── RENDER DEACTIVATED RESTRICTED VIEW (NO FEATURE ACCESS) ──
  if (isDeactivated) {
    return (
      <div className="client-page-container" style={{ maxWidth: "860px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Deactivation Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)",
            borderRadius: "16px",
            padding: "24px 28px",
            color: "#ffffff",
            boxShadow: "0 14px 35px rgba(0,0,0,0.2)",
            marginBottom: "20px",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1.5px solid #ef4444",
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HiOutlineLockClosed size={24} />
            </div>

            <div style={{ flex: 1, minWidth: "260px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  background: "#dc2626",
                  color: "#ffffff",
                  borderRadius: "999px",
                  fontSize: "10.5px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                RESTRICTED PORTAL ACCESS
              </span>
              <h1 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px" ,color:"white" }}>
                Account Temporarily Deactivated
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: "13px", lineHeight: 1.5 }}>
                Your client portal features have been temporarily restricted by the administration desk.
                Access to the document vault, priority meeting schedules, and automated filings is currently suspended.
              </p>
            </div>
          </div>
        </div>

        {/* Client Particulars Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <HiOutlineIdentification size={18} color="#2563eb" /> Registered Client Profile Particulars
            </h3>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: "999px",
                fontSize: "10.5px",
                fontWeight: "800",
                background: "#fee2e2",
                color: "#b91c1c",
              }}
            >
              STATUS: DEACTIVATED
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", fontSize: "13px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Full Name</span>
              <strong style={{ color: "#0f172a" }}>{clientStatus.name || "N/A"}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Business / Trade Entity</span>
              <strong style={{ color: "#0f172a" }}>{clientStatus.legalname || "Individual Client"}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Registered Mobile</span>
              <strong style={{ color: "#0f172a" }}>{clientStatus.mobile || "N/A"}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Email Address</span>
              <strong style={{ color: "#0f172a" }}>{clientStatus.email || "N/A"}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Membership Tier</span>
              <strong style={{ color: "#0f172a" }}>{clientStatus.membershipPlan || "Standard"}</strong>
            </div>
          </div>
        </div>

        {/* Re-Consultation Action Desk */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "22px 24px",
            border: "1.5px solid #fed7aa",
            boxShadow: "0 2px 12px rgba(249,115,22,0.06)",
          }}
        >
          {clientStatus.reconsultationRequested ? (
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 11px",
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  color: "#166534",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "800",
                  marginBottom: "12px",
                }}
              >
                <HiOutlineCheckCircle size={14} /> RE-CONSULTATION REQUEST TRANSMITTED
              </div>

              <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                Your Request is Under Review
              </h3>

              <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                Your reactivation request along with your client particulars have been forwarded directly to the SKC Administrator portal.
                An administrative partner will review your account particulars and contact you to complete re-consultation.
              </p>

              {clientStatus.reconsultationNotes && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    fontSize: "12.5px",
                    color: "#334155",
                  }}
                >
                  <span style={{ fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>
                    Your Request Notes:
                  </span>
                  "{clientStatus.reconsultationNotes}"
                </div>
              )}

              <div
                style={{
                  background: "#eff6ff",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  fontSize: "12.5px",
                  color: "#1e40af",
                }}
              >
                <div>
                  <strong>Urgent Assistance?</strong> Call the administrative desk directly.
                </div>
                <div style={{ display: "flex", gap: "14px", fontWeight: "700" }}>
                  <span>📞 +91 88257 50992</span>
                  <span>✉️ km3974808@gmail.com</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 11px",
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#c2410c",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "800",
                  marginBottom: "12px",
                }}
              >
                <HiOutlineExclamationTriangle size={14} /> RE-CONSULTATION DESK
              </div>

              <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                Request Account Re-Consultation &amp; Reactivation
              </h3>

              <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                Submit this request to send an immediate alert to the administration portal with your client details.
                You can optionally specify your compliance status or reason for reactivation below.
              </p>

              <form onSubmit={handleRequestReconsultation}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "5px" }}>
                    Message for Administration Team (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details or explain why your account should be reactivated (e.g. pending GST filing, annual audit submission, updated contact info)..."
                    value={reconsultNotes}
                    onChange={(e) => setReconsultNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReconsult}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #ea580c, #c2410c)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: submittingReconsult ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 3px 12px rgba(234,88,12,0.3)",
                  }}
                >
                  <HiOutlinePaperAirplane size={16} />
                  {submittingReconsult ? "Transmitting Re-consultation Request..." : "Request Re-consultation with Admin"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="client-page-container">
      {/* ── LUXURY EXECUTIVE HERO BANNER ─────────────────────── */}
      <div className="client-hero-card">
        <div>
          <span
            className="client-hero-tag"
            style={{
              background: isMember ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.1)",
              color: isMember ? "#fbbf24" : "#cbd5e1",
              border: isMember ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <HiOutlineSparkles size={14} />
            {membershipEnabled ? (isMember ? `${planType} VIP ACTIVE CLIENT` : "STANDARD CLIENT ACCOUNT") : "OFFICIAL CLIENT ACCOUNT"}
          </span>

          <h1 className="client-hero-title">
            {getGreeting()}, {clientName}
          </h1>

          <p className="client-hero-sub">
            Welcome to your official Sri Kathiravan & Co Client Portal. Securely access audited tax statements,
            upload regulatory compliance filings, and consult your dedicated chartered accountants.
          </p>
        </div>

        <div className="client-hero-actions">
          <Link to="/Client/Files" className="btn-client-outline">
            <HiOutlineFolderOpen size={16} /> Open Document Vault
          </Link>
          {membershipEnabled ? (
            isMember && !isExpired ? (
              <Link to="/Client/Membership" className="btn-client-gold">
                <HiOutlineSparkles size={16} /> My VIP Membership
              </Link>
            ) : isExpired ? (
              <Link to="/Client/Membership-Request" className="btn-client-gold">
                <HiOutlineSparkles size={16} /> Renew Membership
              </Link>
            ) : (
              <Link to="/Client/Membership-Request" className="btn-client-gold">
                <HiOutlineSparkles size={16} /> Apply for Membership
              </Link>
            )
          ) : (
            <Link to="/Client/Appointments" className="btn-client-gold">
              <HiOutlineCalendarDays size={16} /> Book Consultation
            </Link>
          )}
        </div>
      </div>

      {/* ── 4 STAT METRICS GRID ──────────────────────────────── */}
      <div className="client-stats-grid">
        {/* Metric 1: Files */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Document Repository</p>
            <h3 className="client-stat-val">{fileCount} Files</h3>
            <Link to="/Client/Files" className="client-stat-link">
              Browse Vault <HiOutlineArrowRight size={13} />
            </Link>
          </div>
          <div className="client-stat-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <HiOutlineFolderOpen size={20} />
          </div>
        </div>

        {/* Metric 2: Membership / Access */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">{membershipEnabled ? "Membership Tier" : "Portal Access"}</p>
            <h3 className="client-stat-val" style={{ color: !membershipEnabled ? "#059669" : isMember ? (isExpired ? "#dc2626" : "#d97706") : "#475569" }}>
              {!membershipEnabled ? "Standard Access" : isMember ? `${planType} Card` : "Free Tier"}
            </h3>
            {!membershipEnabled ? (
              <Link to="/Client/Appointments" className="client-stat-link" style={{ color: "#059669" }}>
                100% Free Access <HiOutlineArrowRight size={13} />
              </Link>
            ) : isMember && !isExpired ? (
              <Link to="/Client/Membership" className="client-stat-link" style={{ color: "#d97706" }}>
                {daysLeft !== null ? `${daysLeft} Days Left • View Perks` : "View Privileges"} <HiOutlineArrowRight size={13} />
              </Link>
            ) : isExpired ? (
              <Link to="/Client/Membership-Request" className="client-stat-link" style={{ color: "#dc2626", fontWeight: "700" }}>
                Expired • Renew Now <HiOutlineArrowRight size={13} />
              </Link>
            ) : (
              <Link to="/Client/Membership-Request" className="client-stat-link" style={{ color: "#d97706" }}>
                Upgrade to VIP <HiOutlineArrowRight size={13} />
              </Link>
            )}
          </div>
          <div className="client-stat-icon-wrap" style={{ background: !membershipEnabled ? "#dcfce7" : isExpired ? "#fee2e2" : "#fef3c7", color: !membershipEnabled ? "#059669" : isExpired ? "#dc2626" : "#d97706" }}>
            <HiOutlineIdentification size={20} />
          </div>
        </div>

        {/* Metric 3: Appointments */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Consultations</p>
            <h3 className="client-stat-val">{appointmentsCount} Booked</h3>
            <Link to="/Client/Appointments" className="client-stat-link" style={{ color: "var(--primary, #7c3aed)" }}>
              Schedule Session <HiOutlineArrowRight size={13} />
            </Link>
          </div>
          <div className="client-stat-icon-wrap" style={{ background: "var(--lite, #f5f3ff)", color: "var(--primary, #7c3aed)" }}>
            <HiOutlineCalendarDays size={20} />
          </div>
        </div>

        {/* Metric 4: Notifications */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Active Alerts</p>
            <h3 className="client-stat-val" style={{ color: unreadCount > 0 ? "#dc2626" : "#0f172a" }}>
              {unreadCount} Unread
            </h3>
            <Link to="/Client/Notifications" className="client-stat-link" style={{ color: "#059669" }}>
              View Notification Feed <HiOutlineArrowRight size={13} />
            </Link>
          </div>
          <div className="client-stat-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
            <HiOutlineBell size={20} />
          </div>
        </div>

        {/* Metric 5: Invoices & Real-Time Balance */}
        <div className="client-stat-card" style={{ borderLeft: billingSummary.pendingDue <= 0 ? "4px solid #059669" : "4px solid #dc2626" }}>
          <div>
            <p className="client-stat-label">Invoices & Billing Balance</p>
            <h3
              className="client-stat-val"
              style={{ color: billingSummary.pendingDue <= 0 ? "#15803d" : "#dc2626" }}
            >
              {billingSummary.pendingDue <= 0 ? "₹ 0.00 Due" : `₹ ${billingSummary.pendingDue.toLocaleString("en-IN")}`}
            </h3>
            <Link to="/Client/Billing" className="client-stat-link" style={{ color: "#2563eb", fontWeight: "700" }}>
              {billingSummary.pendingDue <= 0 ? "All Cleared • View Invoices" : "Payment Due • View & Pay"} <HiOutlineArrowRight size={13} />
            </Link>
          </div>
          <div
            className="client-stat-icon-wrap"
            style={{
              background: billingSummary.pendingDue <= 0 ? "#ecfdf5" : "#fef2f2",
              color: billingSummary.pendingDue <= 0 ? "#059669" : "#dc2626",
            }}
          >
            <HiOutlineReceiptPercent size={20} />
          </div>
        </div>
      </div>

      {/* ── OFFICIAL BANK REMITTANCE & PAYMENT CHANNELS WIDGET ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1.5px solid #e2e8f0",
          padding: "20px 24px",
          marginBottom: "28px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <HiOutlineBanknotes size={20} color="#2563eb" />
              Official Remittance & Bank Settlement Details ({firmInfo.name || "Sri Kathiravan & Co."})
            </h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
              Transfer advisory fee payments or retainers directly to verified firm bank channels
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleCopy(firmInfo.upiId, "Official UPI ID")}
              style={{
                padding: "6px 12px",
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <HiOutlineClipboardDocument size={14} /> Copy UPI ({firmInfo.upiId})
            </button>
            <Link
              to="/Client/Billing"
              style={{
                padding: "6px 12px",
                background: "#eff6ff",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              View Full Billing Ledger &rarr;
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Beneficiary Bank</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.bankName || "HDFC Bank Ltd"}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Account Name</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.accountName || "Sri Kathiravan & Co."}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Account Number</span>
            <strong style={{ color: "#1e40af", letterSpacing: "0.5px" }}>{firmInfo.accountNumber || "50200084729103"}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>IFSC Code</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.ifscCode || "HDFC0001234"}</strong> {firmInfo.branch && `(${firmInfo.branch})`}
          </div>
        </div>
      </div>

      {/* ── MEMBERSHIP TIER SELECTION (FOR NON-MEMBERS & EXPIRED) ── */}
      {membershipEnabled && (!isMember || isExpired) && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "26px 30px", border: "1.5px solid #fed7aa", boxShadow: "0 4px 20px rgba(249, 115, 22, 0.08)", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#fff7ed", color: "#c2410c", borderRadius: "999px", fontSize: "11px", fontWeight: "800", marginBottom: "4px" }}>
                <HiOutlineSparkles size={14} /> CHOOSE YOUR MEMBERSHIP PLAN
              </span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                Select a Plan for Priority Admin Messaging, Dedicated CA Desk &amp; VIP Perks
              </h3>
            </div>
            <Link to="/Client/Membership-Request" style={{ padding: "8px 16px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: "10px", fontWeight: "700", fontSize: "13px", textDecoration: "none" }}>
              View All Plan Details &rarr;
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {/* Gold */}
            <div style={{ border: "2px solid #f59e0b", borderRadius: "14px", padding: "20px", background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)", boxShadow: "0 4px 14px rgba(245, 158, 11, 0.15)", position: "relative" }}>
              <span style={{ position: "absolute", top: "-10px", right: "14px", background: "#f59e0b", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "999px" }}>POPULAR</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <strong style={{ color: "#d97706", fontSize: "17px" }}>Gold Plan</strong>
                <span style={{ fontSize: "19px", fontWeight: "900", color: "#0f172a" }}>₹699<span style={{ fontSize: "11px", color: "#64748b" }}>/6mo</span></span>
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 14px", minHeight: "36px" }}>Priority Messaging to Admin, Priority Document Review &amp; 24/7 VIP Meetings.</p>
              <Link to="/Client/Membership-Request" style={{ display: "block", textAlign: "center", padding: "9px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: "8px", fontWeight: "800", fontSize: "13px", textDecoration: "none", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)" }}>
                Choose Gold Plan
              </Link>
            </div>

            {/* Platinum */}
            <div style={{ border: "2px solid #a855f7", borderRadius: "14px", padding: "20px", background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)", boxShadow: "0 4px 14px rgba(168, 85, 247, 0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <strong style={{ color: "#9333ea", fontSize: "17px" }}>Platinum Plan</strong>
                <span style={{ fontSize: "19px", fontWeight: "900", color: "#0f172a" }}>₹999<span style={{ fontSize: "11px", color: "#64748b" }}>/12mo</span></span>
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 14px", minHeight: "36px" }}>All Features Completely Unlocked, Dedicated CA Manager, 1-on-1 Video Meetings &amp; Zero-Wait Verification.</p>
              <Link to="/Client/Membership-Request" style={{ display: "block", textAlign: "center", padding: "9px", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", borderRadius: "8px", fontWeight: "800", fontSize: "13px", textDecoration: "none", boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)" }}>
                Choose Platinum Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ACTION LAUNCHPAD ────────────────────────────── */}
      <div className="client-section-header">
        <h3 className="client-section-title">
          <HiOutlineSparkles color="#d97706" size={18} /> Executive Launchpad
        </h3>
        <span style={{ fontSize: "12px", color: "#64748b" }}>Instant client services &amp; compliance tools</span>
      </div>

      <div className="client-actions-grid">
        {/* Action 1: Documents */}
        <Link to="/Client/Files" className="client-action-card">
          <div>
            <div className="client-action-top">
              <div className="client-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <HiOutlineArrowUpTray size={18} />
              </div>
              <h4 className="client-action-heading">
                Document Vault (Free Access)
              </h4>
            </div>
            <p className="client-action-desc">
              Transmit GST bills, bank statements, and tax receipts directly to audit team. Full upload &amp; download access included.
            </p>
          </div>
          <div className="client-action-foot" style={{ color: "#2563eb" }}>
            Open Document Vault <HiOutlineArrowRight size={13} />
          </div>
        </Link>

        {/* Action 2: Appointments */}
        <Link to="/Client/Appointments" className="client-action-card">
          <div>
            <div className="client-action-top">
              <div className="client-action-icon" style={{ background: "var(--lite, #f5f3ff)", color: "var(--primary, #7c3aed)" }}>
                <HiOutlineCalendarDays size={18} />
              </div>
              <h4 className="client-action-heading">
                {membershipEnabled && isMember && (planType === "PLATINUM" || planType === "GOLD")
                  ? "24/7 VIP Consultation"
                  : "Office Consultation (Free)"}
              </h4>
            </div>
            <p className="client-action-desc">
              Schedule direct Chartered Accountant consultations for tax filings, GST returns, or regulatory audits. Free booking for all clients.
            </p>
          </div>
          <div className="client-action-foot" style={{ color: "var(--primary, #7c3aed)" }}>
            Book Consultation <HiOutlineArrowRight size={13} />
          </div>
        </Link>

        {/* Action 3: Dynamically routed to perks or Billing */}
        {membershipEnabled ? (
          isMember && !isExpired ? (
            <Link to="/Client/Membership" className="client-action-card">
              <div>
                <div className="client-action-top">
                  <div className="client-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                    <HiOutlineIdentification size={18} />
                  </div>
                  <h4 className="client-action-heading">{planType} VIP Privileges</h4>
                </div>
                <p className="client-action-desc">
                  {planType === "PLATINUM"
                    ? "All features unlocked: Dedicated Senior CA, Unlimited Consultations, Permanent Vault."
                    : "Priority Messaging to Admin, Priority Document Review & Fast Response Desk."}
                </p>
              </div>
              <div className="client-action-foot" style={{ color: "#d97706" }}>
                View Member Privileges <HiOutlineArrowRight size={13} />
              </div>
            </Link>
          ) : isExpired ? (
            <Link to="/Client/Membership-Request" className="client-action-card">
              <div>
                <div className="client-action-top">
                  <div className="client-action-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <HiOutlineIdentification size={18} />
                  </div>
                  <h4 className="client-action-heading">Renew VIP Membership</h4>
                </div>
                <p className="client-action-desc">
                  Your annual membership has concluded. Renew your package to maintain uninterrupted VIP perks.
                </p>
              </div>
              <div className="client-action-foot" style={{ color: "#dc2626" }}>
                Renew Membership Now <HiOutlineArrowRight size={13} />
              </div>
            </Link>
          ) : (
            <Link to="/Client/Membership-Request" className="client-action-card">
              <div>
                <div className="client-action-top">
                  <div className="client-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                    <HiOutlineIdentification size={18} />
                  </div>
                  <h4 className="client-action-heading">Apply for Membership</h4>
                </div>
                <p className="client-action-desc">
                  Unlock priority messaging to admin, dedicated CA desk, and round-the-clock VIP advisory.
                </p>
              </div>
              <div className="client-action-foot" style={{ color: "#d97706" }}>
                Explore VIP Packages <HiOutlineArrowRight size={13} />
              </div>
            </Link>
          )
        ) : (
          <Link to="/Client/Billing" className="client-action-card">
            <div>
              <div className="client-action-top">
                <div className="client-action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <HiOutlineReceiptPercent size={18} />
                </div>
                <h4 className="client-action-heading">Invoices & Statements (Free)</h4>
              </div>
              <p className="client-action-desc">
                Review verified billing invoices, settlement receipts, and net payable statements issued by SKC accounting desk.
              </p>
            </div>
            <div className="client-action-foot" style={{ color: "#059669" }}>
              View Billing Hub <HiOutlineArrowRight size={13} />
            </div>
          </Link>
        )}
      </div>

      {/* ── RECENT ALERTS FEED TEASER ─────────────────────────── */}
      <div style={{ background: "#ffffff", borderRadius: "20px", padding: "26px 30px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              Recent Notification Stream
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Latest notices regarding document delivery, membership verification, and office advisories.
            </p>
          </div>
          <Link
            to="/Client/Notifications"
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#2563eb",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            View All Notifications <HiOutlineArrowRight size={14} />
          </Link>
        </div>

        {recentNotifs.length === 0 ? (
          <p style={{ margin: 0, padding: "24px 0", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
            You're all caught up! No recent notifications.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentNotifs.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: n.read ? "#f8fafc" : "#fffdf8",
                  border: n.read ? "1px solid #f1f5f9" : "1.5px solid #fde68a",
                  borderLeft: n.read ? "4px solid #cbd5e1" : "4px solid #f59e0b",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    {n.message}
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
