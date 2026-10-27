import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/MembershipCard.css";
import "../../styles/ClientPortal.css";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../../utils/fileDownloader";
import {
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowDownTray,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineDevicePhoneMobile,
  HiOutlineArrowUpRight,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { formatDate, formatTime, formatDateTimeAgo, formatFullDateTime } from "../../utils/dateFormat";

const TIER_DATA = {
  GOLD: {
    name: "Gold Member",
    tierClass: "skc-tier-card--gold",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeColor: "#fbbf24",
    accent: "#f59e0b",
    icon: HiOutlineSparkles,
    benefits: [
      "Priority Direct Messaging to Admin Desk",
      "Expedited Document Review & Audit Advisory",
      "24/7 Timeline Meeting Scheduling",
      "Direct Notice & SCN Defense Assistance",
    ],
  },
  PLATINUM: {
    name: "Platinum Member",
    tierClass: "skc-tier-card--platinum",
    badgeBg: "rgba(168, 85, 247, 0.2)",
    badgeColor: "#c084fc",
    accent: "#a855f7",
    icon: HiOutlineTrophy,
    benefits: [
      "All Features Completely Unlocked (Max VIP)",
      "Dedicated Senior Chartered Accountant Manager",
      "Unlimited 1-on-1 Video Meetings & Direct Calling",
      "Zero-Wait Live Audit Verification",
      "Priority SCN & Appellate Defense",
      "1-Year VIP Status (Annual Term)",
    ],
  },
};

export default function ClientMembership() {
  const [statusData, setStatusData] = useState(null);
  const [membershipEnabled, setMembershipEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meetings"); // meetings | docs | files
  const [files, setFiles] = useState([]);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // 1-on-1 Meeting Form
  const [meetingForm, setMeetingForm] = useState({
    dateTime: "",
    meetingType: "ONLINE_MEET",
    topic: "",
    notes: "",
  });
  const [bookingMeeting, setBookingMeeting] = useState(false);

  // Documentation Query Form
  const [docQuery, setDocQuery] = useState({
    docType: "GST_RECONCILIATION",
    urgent: true,
    message: "",
  });
  const [sendingQuery, setSendingQuery] = useState(false);
  const [myPriorityDocs, setMyPriorityDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const clientName = localStorage.getItem("skc-name") || "Valued Client";
  const clientId = localStorage.getItem("skc-id") || "";

  // Upgrade & Extend Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [actionType, setActionType] = useState("UPGRADE"); // UPGRADE | EXTEND
  const [targetTier, setTargetTier] = useState("PLATINUM");
  const [extensionMonths, setExtensionMonths] = useState(6);
  const [utrNumber, setUtrNumber] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("skco@icici");
    setCopiedUpi(true);
    toast.success("UPI ID copied: skco@icici");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingUpgrade(true);
    try {
      const email = statusData?.email || localStorage.getItem("skc-user") || "";
      const chosenPlan = actionType === "UPGRADE" ? targetTier : (statusData?.membershipPlan || "GOLD");
      const duration = actionType === "UPGRADE"
        ? (targetTier === "PLATINUM" ? 12 : targetTier === "GOLD" ? 6 : 1)
        : extensionMonths;

      try {
        await api.post("/Client/Membership/UpgradeRequest", {
          action: actionType,
          targetPlan: chosenPlan,
          durationMonths: duration,
          utr: utrNumber.trim(),
          note: requestNote.trim(),
        });
      } catch {
        // Fallback to /Membership/Request
        await api.post("/Membership/Request", {
          fullName: clientName,
          name: clientName,
          email: email,
          planType: chosenPlan,
          message: `[${actionType === "UPGRADE" ? "MEMBERSHIP UPGRADE REQUEST" : "MEMBERSHIP EXTENSION REQUEST"}] Current: ${statusData?.membershipPlan || "VIP"}. Target: ${chosenPlan} (${duration} Months). UTR/Ref: ${utrNumber || "N/A"}. Note: ${requestNote || "Submitted from VIP Privileges Hub"}`,
          notes: `[${actionType}] ${requestNote || ""}`,
        });
      }

      toast.success(
        actionType === "UPGRADE"
          ? `🎉 Upgrade request for ${chosenPlan} dispatched to Administration!`
          : `🎉 Extension request (+${duration} Months) dispatched to Administration!`
      );
      setShowUpgradeModal(false);
      setUtrNumber("");
      setRequestNote("");
      fetchMembership();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit request. Please contact office directly.";
      toast.error(msg);
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  useEffect(() => {
    fetchMembership();
    fetchFiles();
    fetchMyPriorityDocs();
  }, []);

  const fetchMyPriorityDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get("/Client/PriorityDocs/MyRequests");
      setMyPriorityDocs(res.data || []);
    } catch {
      // Ignore if unauthenticated
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchMembership = async () => {
    setLoading(true);
    try {
      const [res, settingsRes] = await Promise.allSettled([
        api.get("/Client/Membership/Status"),
        api.get("/Public/Membership/GlobalSettings"),
      ]);
      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        setMembershipEnabled(Boolean(settingsRes.value.data.membershipEnabled));
      }
      if (res.status === "fulfilled") {
        setStatusData(res.value.data);
      } else {
        setStatusData({ isActive: false });
      }
    } catch {
      setStatusData({ isActive: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get("/Client/Files");
      setFiles(res.data || []);
    } catch {}
  };

  const isMember = statusData?.isActive;
  const planType = (statusData?.membershipPlan || "GOLD").toUpperCase();
  const tierConfig = TIER_DATA[planType] || TIER_DATA.GOLD;
  const TierIcon = tierConfig.icon;

  // Calculate days left
  let daysLeft = null;
  if (statusData?.membershipExpiry) {
    const diff = new Date(statusData.membershipExpiry) - new Date();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Handle 1-on-1 Booking
  const handleBookMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.dateTime) {
      toast.error("Please select your preferred date & time.");
      return;
    }
    setBookingMeeting(true);
    try {
      let dt = meetingForm.dateTime;
      if (dt && dt.length === 16) {
        dt = `${dt}:00`;
      }
      await api.post("/Client/Appointment/Book", {
        appointmentType: "ONLINE",
        requestedDateTime: dt,
        clientNote: `[VIP Member 24/7 1-on-1] ${meetingForm.topic}: ${meetingForm.notes}`,
      });
      toast.success("🎯 1-on-1 Meeting booked! An audit executive will confirm your timeline.");
      setMeetingForm({ dateTime: "", meetingType: "ONLINE_MEET", topic: "", notes: "" });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to book meeting. Please try again.";
      toast.error(msg);
    } finally {
      setBookingMeeting(false);
    }
  };

  // Handle Document Request / Live Query
  const handleSendDocQuery = async (e) => {
    e.preventDefault();
    if (!docQuery.message.trim()) {
      toast.error("Please enter your documentation or inquiry details.");
      return;
    }
    setSendingQuery(true);
    try {
      await api.post("/Client/PriorityDocs/Request", {
        docType: docQuery.docType,
        message: docQuery.message.trim(),
        urgency: "VIP_PRIORITY",
      });
      toast.success("⚡ Priority document request dispatched to Admin & Staff Desk! Fast response guaranteed.");
      setDocQuery({ docType: "GST_RECONCILIATION", urgent: true, message: "" });
      fetchMyPriorityDocs();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit request.";
      toast.error(msg);
    } finally {
      setSendingQuery(false);
    }
  };

  // Handle Expiration-free download
  const handleDownload = async (fileId, fileName) => {
    setDownloadingFileId(fileId);
    try {
      const res = await api.get(`/Client/Files/${fileId}/Download`, {
        responseType: "blob",
      });
      const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
      const contentType = res.headers["content-type"] || res.data?.type;
      triggerBrowserDownload(res.data, resolvedName, contentType);
      toast.success(`🌟 VIP Expiration-Free Download: ${resolvedName}`);
    } catch (err) {
      toast.error("Download failed. Please check your connection.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Rename File State & Handlers
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [refreshingVault, setRefreshingVault] = useState(false);

  const handleRefreshVault = async () => {
    setRefreshingVault(true);
    await fetchFiles();
    setRefreshingVault(false);
    toast.success("Document vault refreshed!");
  };

  const handleOpenRename = (file) => {
    setRenamingFile(file);
    setNewFileName(file.fileName || "");
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }
    setRenaming(true);
    try {
      await api.put(`/Client/Files/${renamingFile.id}/Rename`, {
        newFileName: newFileName.trim(),
      });
      toast.success("Document renamed successfully!");
      setRenamingFile(null);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename document");
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to permanently delete this document from AWS S3 and your vault?")) return;
    try {
      await api.delete(`/Client/Files/${fileId}`);
      toast.success("Document deleted successfully");
      fetchFiles();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  // Helper: format date with time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
        <p>Loading your membership privileges...</p>
      </div>
    );
  }

  if (!membershipEnabled) {
    return (
      <div style={{ maxWidth: "700px", margin: "60px auto", padding: "0 20px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "20px",
          padding: "36px 32px",
          color: "#ffffff",
          textAlign: "center",
          border: "1.5px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}>
          <div style={{ fontSize: "44px", marginBottom: "16px" }}>🚀</div>
          <span style={{
            padding: "4px 12px",
            background: "rgba(16, 185, 129, 0.2)",
            color: "#34d399",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "0.5px",
            display: "inline-block",
            marginBottom: "12px",
          }}>
            INITIAL LAUNCH MODE ACTIVE
          </span>
          <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 10px 0", color: "#ffffff" }}>
            Full Free Unrestricted Portal Access
          </h2>
          <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", maxWidth: "520px", margin: "0 auto 24px auto" }}>
            Sri Kathiravan & Co is currently operating in initial launch mode. All registered clients have complete, free access to Document Vault, Invoices & Receipts, and Appointment Booking without requiring a membership plan.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/Client" style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
              Return to Dashboard
            </Link>
            <Link to="/Client/Appointments" style={{ padding: "12px 24px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
              Book Free Consultation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP HERO HEADER ──────────────────────────────────────────────── */}
      <div
        style={{
          background: isMember
            ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)"
            : "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
          borderRadius: "20px",
          padding: "32px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 800,
                background: isMember ? tierConfig.badgeBg : "rgba(255,255,255,0.1)",
                color: isMember ? tierConfig.badgeColor : "#9ca3af",
                border: isMember ? `1px solid ${tierConfig.accent}` : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <TierIcon size={14} />
              {isMember ? `${planType} ACTIVE MEMBER` : "FREE ACCOUNT"}
            </span>
            {isMember && daysLeft !== null && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#a5b4fc",
                  background: "rgba(99,102,241,0.15)",
                  padding: "4px 10px",
                  borderRadius: "100px",
                }}
              >
                ⏳ {daysLeft} Days Remaining
              </span>
            )}
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 900,
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textShadow: "0 2px 10px rgba(0,0,0,0.35)",
            }}
          >
            {isMember ? `VIP Member Privileges Hub` : "Unlock SKC Membership Privileges"}
          </h1>
          <p style={{ color: "#e2e8f0", fontSize: "14px", margin: 0, maxWidth: "600px", lineHeight: 1.5 }}>
            {isMember
              ? "Your membership grants 24/7 1-on-1 consultations, priority documentation support, and expiration-free document downloads."
              : "Upgrade your account to unlock priority admin messaging, 24/7 meeting timelines, and dedicated CA support."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {isMember ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActionType(planType === "PLATINUM" ? "EXTEND" : "UPGRADE");
                  setTargetTier("PLATINUM");
                  setShowUpgradeModal(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#ffffff",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "13px",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                }}
              >
                <HiOutlineSparkles size={16} /> Upgrade / Extend
              </button>
              <Link
                to="/Client/Profile"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                View Member Card <HiOutlineArrowUpRight size={16} />
              </Link>
            </>
          ) : (
            <Link
              to="/Client/Membership-Request"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#ffffff",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "0 4px 15px rgba(245,158,11,0.4)",
              }}
            >
              <HiOutlineSparkles size={18} /> Apply for Membership
            </Link>
          )}
        </div>
      </div>

      {/* ── CONDITIONAL: ACTIVE MEMBER VIEW vs LOCKED UPGRADE VIEW ─────── */}
      {isMember ? (
        <>
          {/* ── CARD & STATS ROW ─────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
            {/* Holographic / Glowing Tier Card */}
            <div className="skc-membership-card-wrap">
              <div className={`skc-tier-card ${tierConfig.tierClass}`}>
                <div className="skc-card-topbar">
                  <div className="skc-card-chip" />
                  <span
                    className="skc-card-tier-pill"
                    style={{ background: tierConfig.badgeBg, color: tierConfig.badgeColor, border: `1px solid ${tierConfig.accent}` }}
                  >
                    <TierIcon size={14} /> {tierConfig.name}
                  </span>
                </div>

                <div className="skc-card-mid">
                  <div className="skc-card-client-name">{clientName}</div>
                  <div className="skc-card-client-meta">
                    <span>ID: #{clientId ? String(clientId).padStart(5, "0") : "SKC-VIP"}</span>
                    <span>• Status: Active</span>
                  </div>
                </div>

                <div className="skc-card-footer">
                  <div className="skc-card-stat">
                    <span className="skc-card-stat-label">Valid Thru</span>
                    <span className="skc-card-stat-value">
                      {statusData?.membershipExpiry ? new Date(statusData.membershipExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" }) : "Active"}
                    </span>
                  </div>
                  <div className="skc-card-stat" style={{ textAlign: "right" }}>
                    <span className="skc-card-stat-label">Privilege Level</span>
                    <span className="skc-card-stat-value" style={{ color: tierConfig.accent }}>
                      Tier {planType === "PLATINUM" ? "3 (Max)" : planType === "GOLD" ? "2 (VIP)" : "1 (Pro)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlocked Benefits Quick Grid */}
            <div
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiOutlineCheckBadge size={22} color="#10b981" /> Unlocked Member Privileges
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tierConfig.benefits.map((b, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                        ✓
                      </span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "20px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  💡 <strong>Member Guarantee:</strong> Your files never expire, your meeting requests receive 24/7 scheduling priority, and documentation requests skip the queue.
                </p>
              </div>
            </div>
          </div>

          {/* ── TABS: UNLOCKED PRIVILEGES HUB ──────────────────────── */}
          <div style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 2px 14px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            {/* Tab navigation */}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", padding: "6px" }}>
              {[
                { id: "meetings", label: "📅 24/7 1-on-1 Meetings", desc: "Private Consultation" },
                { id: "docs", label: "💬 Priority Docs & Live Query", desc: "Direct Admin Desk" },
                { id: "files", label: "📥 Expiration-Free Vault", desc: "Permanent Downloads" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    border: "none",
                    borderRadius: "12px",
                    background: activeTab === tab.id ? "#fff" : "transparent",
                    color: activeTab === tab.id ? "#111827" : "#6b7280",
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ fontSize: "11px", color: activeTab === tab.id ? "#4f46e5" : "#9ca3af" }}>{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: 1-ON-1 MEETINGS */}
            {activeTab === "meetings" && (
              <div style={{ padding: "28px" }}>
                {planType === "SILVER" ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "16px", border: "1.5px dashed #cbd5e1" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "26px" }}>
                      🔒
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                      24/7 Private 1-on-1 Consultations Unlocked on Gold &amp; Platinum
                    </h3>
                    <p style={{ margin: "0 auto 20px", maxWidth: "480px", fontSize: "13.5px", color: "#64748b", lineHeight: 1.5 }}>
                      Your active Silver membership includes standard document access and office-hours compliance. Upgrade to Gold or Platinum to schedule private 1-on-1 consultations 24 hours a day, 7 days a week with senior executives.
                    </p>
                    <Link
                      to="/Client/Membership-Request"
                      style={{
                        padding: "10px 22px",
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: "#fff",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "13.5px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                      }}
                    >
                      <HiOutlineSparkles size={16} /> Upgrade to Gold Plan &rarr;
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "#111827" }}>
                        Private 1-on-1 Consultation (24/7 Flexible Timeline)
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        As an active {planType} member, choose any timeline 24 hours a day, 7 days a week. Our audit executives tailor the schedule to your convenience.
                      </p>
                    </div>

                    <form onSubmit={handleBookMeeting} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                          Requested Date & Time (24/7 Available) *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={meetingForm.dateTime}
                          onChange={(e) => setMeetingForm({ ...meetingForm, dateTime: e.target.value })}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "10px",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                          Consultation Focus / Topic *
                        </label>
                        <select
                          value={meetingForm.topic}
                          onChange={(e) => setMeetingForm({ ...meetingForm, topic: e.target.value })}
                          required
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "10px",
                            fontSize: "14px",
                            outline: "none",
                            background: "#fff",
                          }}
                        >
                          <option value="">Select Topic</option>
                          <option value="Income Tax Return & Assessment">Income Tax Return & Assessment</option>
                          <option value="GST Audit & Reconciliation">GST Audit & Reconciliation</option>
                          <option value="ROC & Corporate Compliance">ROC & Corporate Compliance</option>
                          <option value="Financial Advisory & Cash Flow">Financial Advisory & Cash Flow</option>
                          <option value="Notice Defense & Legal Consultation">Notice Defense & Legal Consultation</option>
                        </select>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                          Specific Details / Agenda for the Executive
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Briefly state your documents or questions so our CA can review beforehand..."
                          value={meetingForm.notes}
                          onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "10px",
                            fontSize: "14px",
                            outline: "none",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={bookingMeeting}
                          style={{
                            padding: "12px 28px",
                            background: "linear-gradient(135deg, var(--primary, #4f46e5), var(--primary-hover, #7c3aed))",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <HiOutlineCalendarDays size={18} />
                          {bookingMeeting ? "Booking..." : "Confirm 1-on-1 Consultation"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: PRIORITY DOCS & LIVE QUERY */}
            {activeTab === "docs" && (
              <div style={{ padding: "28px" }}>
                {planType === "SILVER" ? (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      border: "1.5px dashed #cbd5e1",
                      borderRadius: "16px",
                      padding: "40px 24px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#fef3c7",
                        color: "#d97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <HiOutlineLockClosed size={28} />
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                      Direct WhatsApp VIP Desk Unlocked on Gold &amp; Platinum
                    </h3>
                    <p style={{ margin: "0 auto 20px", maxWidth: "500px", fontSize: "13.5px", color: "#64748b", lineHeight: 1.5 }}>
                      Silver tier includes standard portal documentation. Upgrade to Gold or Platinum to unlock direct WhatsApp concierge access with our partners, 0-minute turnaround document requests, and priority audit defense.
                    </p>
                    <Link
                      to="/Client/Membership-Request"
                      style={{
                        padding: "10px 22px",
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: "#fff",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "13.5px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                      }}
                    >
                      <HiOutlineSparkles size={16} /> Upgrade to Gold Plan &rarr;
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "#111827" }}>
                        Documentation Support &amp; Direct Desk Live Inquiry
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Members receive guaranteed zero-queue response for audited reports, certificates, and compliance queries.
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                      <form onSubmit={handleSendDocQuery}>
                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                            Document Category Requested
                          </label>
                          <select
                            value={docQuery.docType}
                            onChange={(e) => setDocQuery({ ...docQuery, docType: e.target.value })}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 14px",
                              border: "1px solid #d1d5db",
                              borderRadius: "10px",
                              fontSize: "14px",
                              outline: "none",
                            }}
                          >
                            <option value="GST_RECONCILIATION">GST Reconciliation Report</option>
                            <option value="ITR_ACKNOWLEDGEMENT">Income Tax ITR-V Acknowledgment</option>
                            <option value="NETWORTH_CERTIFICATE">CA Certified Net Worth Statement</option>
                            <option value="BALANCE_SHEET_COPY">Audited Balance Sheet &amp; P&amp;L</option>
                            <option value="CUSTOM_DOC">Other Custom Document Request</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                            Query / Document Specification *
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Detail the period, assessment year, or specific requirements..."
                            value={docQuery.message}
                            onChange={(e) => setDocQuery({ ...docQuery, message: e.target.value })}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 14px",
                              border: "1px solid #d1d5db",
                              borderRadius: "10px",
                              fontSize: "14px",
                              outline: "none",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingQuery}
                          style={{
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #059669, #047857)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <HiOutlinePaperAirplane size={18} />
                          {sendingQuery ? "Submitting..." : "Send Priority Request"}
                        </button>
                      </form>

                      {/* Direct WhatsApp VIP Support */}
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: 800, marginBottom: "8px" }}>
                            <HiOutlineDevicePhoneMobile size={20} /> Instant WhatsApp VIP Desk
                          </div>
                          <p style={{ fontSize: "13px", color: "#15803d", lineHeight: 1.5 }}>
                            Prefer chatting directly? Message our designated Member Executive on WhatsApp for live resolution.
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/919942426868?text=${encodeURIComponent(`Hello Sri Kathiravan & Co team, I am active member ${clientName} (ID: ${clientId}). I need priority documentation assistance.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px",
                            background: "#22c55e",
                            color: "#fff",
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "14px",
                            marginTop: "16px",
                          }}
                        >
                          Chat on WhatsApp Now
                        </a>
                      </div>
                    </div>

                    {/* ── Active Priority Inquiries & Staff Acknowledgments ── */}
                    <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                          <HiOutlineSparkles size={18} color="#f59e0b" />
                          Track Your Priority Requests &amp; Acknowledgments
                        </h4>
                        <button
                          type="button"
                          onClick={fetchMyPriorityDocs}
                          style={{
                            background: "#f1f5f9",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#475569",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <HiOutlineArrowPath size={14} className={loadingDocs ? "spin-icon" : ""} /> Refresh
                        </button>
                      </div>

                      {loadingDocs ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                          Loading priority inquiries...
                        </div>
                      ) : myPriorityDocs.length === 0 ? (
                        <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                          <p style={{ margin: 0, color: "#64748b", fontSize: "13.5px" }}>
                            You have no priority document inquiries submitted yet. Submit a request above to receive fast staff acknowledgment!
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {myPriorityDocs.map((req) => (
                            <div
                              key={req.id}
                              style={{
                                background: req.status === "ACKNOWLEDGED" ? "#f0fdf4" : "#ffffff",
                                border: req.status === "ACKNOWLEDGED" ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "16px 18px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span
                                    style={{
                                      padding: "3px 8px",
                                      background: "#fef3c7",
                                      color: "#b45309",
                                      fontSize: "11px",
                                      fontWeight: "800",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    ⚡ {req.docType?.replace(/_/g, " ")}
                                  </span>
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Submitted {formatDateTimeAgo(req.createdAt)} ({formatFullDateTime(req.createdAt)})
                                  </span>
                                </div>

                                <div>
                                  {req.status === "ACKNOWLEDGED" ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#dcfce7", color: "#15803d", borderRadius: "999px", fontSize: "12px", fontWeight: "800" }}>
                                      <HiOutlineCheckCircle size={14} /> Acknowledged by Staff
                                    </span>
                                  ) : req.status === "FULFILLED" ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#e0e7ff", color: "#3730a3", borderRadius: "999px", fontSize: "12px", fontWeight: "800" }}>
                                      <HiOutlineCheckBadge size={14} /> Fulfilled
                                    </span>
                                  ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#fef3c7", color: "#b45309", borderRadius: "999px", fontSize: "12px", fontWeight: "800" }}>
                                      <HiOutlineClock size={14} /> Pending Office Review
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", color: "#1e293b", lineHeight: 1.45 }}>
                                {req.message}
                              </p>

                              {/* Staff / Admin Reply Box */}
                              {req.adminReply ? (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    background: "#ffffff",
                                    border: "1.5px solid #22c55e",
                                    borderRadius: "10px",
                                    padding: "12px 14px",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#15803d", display: "flex", alignItems: "center", gap: "5px" }}>
                                      <HiOutlineCheckCircle size={14} /> Official Response from {req.repliedBy || "Sri Kathiravan & Co. Desk"}
                                    </span>
                                    {req.repliedAt && (
                                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        {formatDateTimeAgo(req.repliedAt)}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: "600" }}>
                                    {req.adminReply}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                                  ⏳ Awaiting office acknowledgment note. Our desk has been alerted in real time.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: EXPIRATION-FREE VAULT */}
            {activeTab === "files" && (
              <div style={{ padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800, color: "#111827" }}>
                      Permanent Expiration-Free Document Vault
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                      As an active member, file expiration limits are waived. You have continuous download access.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={handleRefreshVault}
                      disabled={refreshingVault}
                      style={{
                        padding: "7px 14px",
                        background: "#fff",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        cursor: refreshingVault ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      title="Refresh Vault Documents"
                    >
                      <HiOutlineArrowPath size={14} style={{ animation: refreshingVault ? "spin 1s linear infinite" : "none" }} />
                      {refreshingVault ? "Refreshing..." : "Refresh"}
                    </button>
                    <span style={{ padding: "6px 14px", background: "#fef3c7", color: "#92400e", borderRadius: "100px", fontSize: "12px", fontWeight: 800 }}>
                      🌟 Expiration Exempt Active
                    </span>
                  </div>
                </div>

                {files.length === 0 ? (
                  <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px" }}>No documents in your vault yet.</p>
                ) : (
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
                    <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#4b5563" }}>
                          <th style={{ padding: "10px" }}>Document Name</th>
                          <th style={{ padding: "10px" }}>Category</th>
                          <th style={{ padding: "10px" }}>Uploaded By</th>
                          <th style={{ padding: "10px" }}>Created On</th>
                          <th style={{ padding: "10px" }}>Member Status</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((f) => {
                          const uploaderName = f.userName || (f.direction === "UPLOADED_BY_CLIENT" ? "You (Client)" : "SKC Office");
                          const isSelf = f.direction === "UPLOADED_BY_CLIENT" || (f.uploadedByRole === "CLIENT");
                          return (
                            <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "12px 10px", fontWeight: 600, color: "#111827" }}>
                                <HiOutlineDocumentText size={18} color="#4f46e5" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                                {f.fileName}
                              </td>
                              <td style={{ padding: "10px" }}>
                                <span style={{ padding: "3px 8px", background: "#f3f4f6", borderRadius: "6px", fontSize: "12px" }}>
                                  {f.category}
                                </span>
                              </td>
                              <td style={{ padding: "10px" }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  background: isSelf ? "#e0f2fe" : "#fef3c7",
                                  color: isSelf ? "#0369a1" : "#b45309",
                                }}>
                                  {isSelf ? "👤" : "🏛️"} {uploaderName}
                                </span>
                              </td>
                              <td style={{ padding: "10px", color: "#4b5563", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <HiOutlineCalendarDays size={14} color="#9ca3af" />
                                  <span>{formatDateTime(f.createdAt)}</span>
                                </div>
                              </td>
                              <td style={{ padding: "10px" }}>
                                <span style={{ padding: "3px 8px", background: "#dcfce7", color: "#15803d", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                                  🌟 Permanent Access
                                </span>
                              </td>
                              <td style={{ padding: "10px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => handleDownload(f.id, f.fileName)}
                                    disabled={downloadingFileId === f.id}
                                    style={{
                                      padding: "6px 12px",
                                      background: "#4f46e5",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <HiOutlineArrowDownTray size={14} />
                                    {downloadingFileId === f.id ? "Downloading..." : "Download"}
                                  </button>

                                  <button
                                    onClick={() => handleOpenRename(f)}
                                    title="Rename Document"
                                    style={{
                                      padding: "6px 10px",
                                      background: "#f1f5f9",
                                      color: "#334155",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <HiOutlinePencilSquare size={13} color="#475569" /> Rename
                                  </button>

                                  <button
                                    onClick={() => handleDeleteFile(f.id)}
                                    title="Delete Document"
                                    style={{
                                      padding: "6px 10px",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <HiOutlineTrash size={13} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Rename Modal */}
                {renamingFile && (
                  <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px",
                  }}>
                    <div style={{
                      background: "#fff",
                      borderRadius: "16px",
                      width: "100%",
                      maxWidth: "460px",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      padding: "24px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                          <HiOutlinePencilSquare size={20} color="#4f46e5" /> Rename Vault Document
                        </h3>
                        <button
                          onClick={() => setRenamingFile(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                        >
                          <HiOutlineXMark size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleRenameSubmit}>
                        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6b7280" }}>
                          Enter the updated name for this document in your vault:
                        </p>

                        <input
                          type="text"
                          required
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            marginBottom: "20px",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          autoFocus
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setRenamingFile(null)}
                            style={{
                              padding: "8px 16px",
                              background: "#f3f4f6",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "13px"
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={renaming}
                            style={{
                              padding: "8px 20px",
                              background: "#4f46e5",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: renaming ? "not-allowed" : "pointer",
                              fontWeight: "600",
                              fontSize: "13px",
                            }}
                          >
                            {renaming ? "Saving..." : "Save New Name"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── LOCKED / NOT YET MEMBER VIEW ─────────────────────────── */
        <div>
          {/* Feature Teasers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "36px" }}>
            <div style={{ background: "#fff", borderRadius: "18px", padding: "26px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiOutlineCalendarDays size={24} />
                </span>
                <HiOutlineLockClosed size={20} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px", color: "#111827" }}>1-on-1 Meetings (24/7 Timeline)</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Book dedicated private consultations whenever you need them — mornings, late evenings, or weekends.
              </p>
            </div>

            <div style={{ background: "#fff", borderRadius: "18px", padding: "26px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiOutlineChatBubbleLeftRight size={24} />
                </span>
                <HiOutlineLockClosed size={20} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px", color: "#111827" }}>Documentation & Live Chat</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Direct access to SKC chartered accountants and audit managers for rapid document issuance and live notice defense.
              </p>
            </div>

            <div style={{ background: "#fff", borderRadius: "18px", padding: "26px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiOutlineArrowDownTray size={24} />
                </span>
                <HiOutlineLockClosed size={20} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px", color: "#111827" }}>Expiration-Free Downloads</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Normal downloads expire after 30 days. Membership unlocks permanent, lifetime document re-downloads.
              </p>
            </div>
          </div>

          {/* Pricing cards */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#111827", margin: "0 0 6px" }}>Choose Your Membership Plan</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Selected by registered clients and activated instantly by SKC administrators.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { tier: "GOLD", name: "Gold Card", price: "₹699", duration: "6 Months", color: "#f59e0b", badge: "POPULAR", desc: "Priority Admin Messaging, Document Review & 24/7 VIP Meetings" },
              { tier: "PLATINUM", name: "Platinum Card", price: "₹999", duration: "12 Months (Annual Renewal)", color: "#a855f7", badge: "ALL FEATURES UNLOCKED", desc: "Dedicated CA Manager Desk, 1-on-1 Video Meetings & Zero-Wait Audit Verification" },
            ].map((p) => (
              <div
                key={p.tier}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "28px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  border: `2px solid ${p.color}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {p.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      background: p.color,
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "100px",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#111827" }}>{p.name}</h3>
                  <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#6b7280" }}>{p.desc}</p>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: p.color, marginBottom: "4px" }}>{p.price}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "20px" }}>Duration: {p.duration}</div>
                </div>

                <Link
                  to="/Client/Membership-Request"
                  style={{
                    display: "block",
                    padding: "12px",
                    textAlign: "center",
                    background: p.tier === "GOLD" ? "linear-gradient(135deg, #f59e0b, #d97706)" : p.tier === "PLATINUM" ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "#1e293b",
                    color: "#fff",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  Apply for {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── UPGRADE & EXTEND MEMBERSHIP MODAL (PERMANENT BLACK BG & WHITE FONT) ── */}
      {showUpgradeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            style={{
              background: "#090d16",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 65px rgba(0,0,0,0.85)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #090d16 0%, #151d2f 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "24px",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#fbbf24",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    marginBottom: "6px",
                  }}
                >
                  <HiOutlineSparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
                  EXECUTIVE ACCOUNT SERVICES
                </span>
                <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>
                  Upgrade or Extend Membership
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                  Currently holding <strong style={{ color: "#ffffff" }}>{planType} Member</strong> status ({daysLeft !== null ? `${daysLeft} Days Remaining` : "Active"}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <form onSubmit={handleUpgradeSubmit} style={{ padding: "24px" }}>
              {/* Segmented Mode Selector */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.06)",
                  padding: "4px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActionType("UPGRADE")}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    background: actionType === "UPGRADE" ? "#151d2f" : "transparent",
                    color: actionType === "UPGRADE" ? "#ffffff" : "#94a3b8",
                    boxShadow: actionType === "UPGRADE" ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  🚀 Upgrade Plan Tier
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("EXTEND")}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    background: actionType === "EXTEND" ? "#151d2f" : "transparent",
                    color: actionType === "EXTEND" ? "#ffffff" : "#94a3b8",
                    boxShadow: actionType === "EXTEND" ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  ⏳ Extend Active Duration
                </button>
              </div>

              {/* MODE 1: UPGRADE TIER */}
              {actionType === "UPGRADE" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#e2e8f0", marginBottom: "8px" }}>
                    Select Your New Elevated Membership Tier:
                  </label>
                  <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
                    {/* Platinum Option */}
                    <div
                      onClick={() => setTargetTier("PLATINUM")}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: targetTier === "PLATINUM" ? "2px solid #a855f7" : "1.5px solid rgba(255, 255, 255, 0.12)",
                        background: targetTier === "PLATINUM" ? "#1a1333" : "#151d2f",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: targetTier === "PLATINUM" ? "0 4px 18px rgba(168,85,247,0.3)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>💎</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "14px", color: "#ffffff" }}>
                            Platinum Card (12 Months VIP Term)
                          </strong>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            Dedicated Senior CA Desk • Unlimited 1-on-1 Consultations • Permanent Vault + Rename
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: "#c084fc" }}>₹999</div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Annual Renewal</span>
                      </div>
                    </div>

                    {/* Gold Option (if currently Silver) */}
                    {planType === "SILVER" && (
                      <div
                        onClick={() => setTargetTier("GOLD")}
                        style={{
                          padding: "16px",
                          borderRadius: "14px",
                          border: targetTier === "GOLD" ? "2px solid #f59e0b" : "1.5px solid rgba(255, 255, 255, 0.12)",
                          background: targetTier === "GOLD" ? "#261e12" : "#151d2f",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: targetTier === "GOLD" ? "0 4px 18px rgba(245,158,11,0.3)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px" }}>🌟</span>
                          <div>
                            <strong style={{ display: "block", fontSize: "14px", color: "#ffffff" }}>
                              Gold Card (6 Months Term)
                            </strong>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                              24/7 VIP Appointments • WhatsApp Partner Desk • Expiration-Free Downloads
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "900", color: "#fbbf24" }}>₹699</div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>6 Months</span>
                        </div>
                      </div>
                    )}

                    {planType === "PLATINUM" && (
                      <div style={{ padding: "14px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", color: "#4ade80", fontSize: "13px" }}>
                        ✨ You already enjoy our highest tier (Platinum Elite). Switch to &quot;Extend Active Duration&quot; above to add more validity to your term.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: EXTEND DURATION */}
              {actionType === "EXTEND" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#e2e8f0", marginBottom: "8px" }}>
                    Select Extension Duration for Your Current {planType} Plan:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                    {[
                      { months: 1, price: "₹299", label: "+1 Month", badge: "Short Term" },
                      { months: 6, price: "₹699", label: "+6 Months", badge: "Popular" },
                      { months: 12, price: "₹999", label: "+12 Months", badge: "Best Value" },
                    ].map((opt) => (
                      <div
                        key={opt.months}
                        onClick={() => setExtensionMonths(opt.months)}
                        style={{
                          padding: "14px 10px",
                          borderRadius: "12px",
                          border: extensionMonths === opt.months ? "2px solid #3b82f6" : "1.5px solid rgba(255, 255, 255, 0.12)",
                          background: extensionMonths === opt.months ? "#1e293b" : "#151d2f",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ display: "block", fontSize: "10px", fontWeight: "800", color: extensionMonths === opt.months ? "#60a5fa" : "#94a3b8", textTransform: "uppercase" }}>
                          {opt.badge}
                        </span>
                        <strong style={{ display: "block", fontSize: "15px", margin: "4px 0", color: "#ffffff" }}>
                          {opt.label}
                        </strong>
                        <span style={{ fontSize: "14px", fontWeight: "900", color: "#60a5fa" }}>{opt.price}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "12px 16px", background: "#151d2f", border: "1px dashed rgba(255, 255, 255, 0.2)", borderRadius: "10px", marginBottom: "20px", fontSize: "12.5px", color: "#cbd5e1" }}>
                    💡 <strong>Preserved Validity:</strong> Your remaining {daysLeft !== null ? `${daysLeft} days` : "active term"} will not be lost. The +{extensionMonths} months will be added on top of your existing expiry.
                  </div>
                </div>
              )}

              {/* Payment Info & Direct QR Desk */}
              <div style={{ background: "#151d2f", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255, 255, 255, 0.12)", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src="/skc-payment-qr.png"
                      alt="Payment QR"
                      style={{ width: "70px", height: "70px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.2)", objectFit: "contain", background: "#fff", padding: "4px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#ffffff" }}>
                        Instant UPI Payment (Optional / On File)
                      </strong>
                      <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>
                        UPI ID: <strong style={{ color: "#ffffff" }}>skco@icici</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{
                          marginTop: "4px",
                          padding: "2px 8px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#60a5fa",
                          cursor: "pointer",
                        }}
                      >
                        {copiedUpi ? "✓ Copied" : "Copy UPI ID"}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Amount to Pay</span>
                    <strong style={{ fontSize: "20px", fontWeight: "900", color: "#fbbf24" }}>
                      {actionType === "UPGRADE"
                        ? (targetTier === "PLATINUM" ? "₹999" : "₹699")
                        : (extensionMonths === 12 ? "₹999" : extensionMonths === 6 ? "₹699" : "₹299")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* UTR / Transaction Reference */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Payment Reference / UTR Number (Optional if paying via Office):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 429182390192 or Pay via Office Desk"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "#0d121f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    color: "#ffffff",
                    outline: "none",
                  }}
                />
              </div>

              {/* Special Note */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Special Request / Note for Audit Administrator:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please activate starting this billing cycle..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "#0d121f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    color: "#ffffff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpgrade}
                  style={{
                    padding: "10px 22px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <HiOutlineSparkles size={16} />
                  {submittingUpgrade
                    ? "Submitting..."
                    : actionType === "UPGRADE"
                    ? `Confirm Upgrade to ${targetTier}`
                    : `Confirm +${extensionMonths} Months Extension`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
