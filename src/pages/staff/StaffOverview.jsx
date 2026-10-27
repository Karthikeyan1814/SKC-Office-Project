import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/StaffOverview.css";
import { formatDate, formatTime, formatDateTimeAgo, formatFullDateTime } from "../../utils/dateFormat";
import {
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineFolderOpen,
  HiOutlineBell,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineBriefcase,
  HiOutlineBuildingLibrary,
  HiOutlineBanknotes,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineBellAlert,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineVideoCamera,
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

export default function StaffOverview() {
  const navigate = useNavigate();
  const staffName = localStorage.getItem("skc-name") || "Staff Member";

  const [stats, setStats] = useState({
    clients: 0,
    appointments: 0,
    filesCount: 0,
    unreadNotifications: 0,
  });

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // VIP Priority Document Requests
  const [priorityDocs, setPriorityDocs] = useState([]);
  const [loadingPriorityDocs, setLoadingPriorityDocs] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("ALL"); // ALL | PENDING | ACKNOWLEDGED
  const [replyModal, setReplyModal] = useState({
    open: false,
    item: null,
    replyText: "",
    status: "ACKNOWLEDGED",
    submitting: false,
  });

  // Time & Clock
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [clientsRes, apptRes, notifRes, filesRes] = await Promise.allSettled([
        api.get("/Admin/Clients"),
        api.get("/Staff/Appointments"),
        api.get("/Staff/Notifications/UnreadCount"),
        api.get("/Staff/FileManagement/AllFiles"),
      ]);

      const clientsCount = clientsRes.status === "fulfilled" && Array.isArray(clientsRes.value.data)
        ? clientsRes.value.data.length
        : 0;

      const appts = apptRes.status === "fulfilled" && Array.isArray(apptRes.value.data)
        ? apptRes.value.data
        : [];

      const unreadCount = notifRes.status === "fulfilled" && notifRes.value.data?.count != null
        ? notifRes.value.data.count
        : 0;

      const filesCount = filesRes.status === "fulfilled" && Array.isArray(filesRes.value.data)
        ? filesRes.value.data.length
        : 0;

      setStats({
        clients: clientsCount,
        appointments: appts.length,
        filesCount: filesCount,
        unreadNotifications: unreadCount,
      });

      // Filter upcoming or pending appointments (sorted recent first)
      setUpcomingAppointments(appts.slice(0, 5));
    } catch (e) {
      console.error("Failed to fetch staff dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriorityDocs = async () => {
    setLoadingPriorityDocs(true);
    try {
      const res = await api.get("/Staff/PriorityDocs/All");
      setPriorityDocs(res.data || []);
    } catch (e) {
      console.error("Failed to fetch staff priority docs", e);
    } finally {
      setLoadingPriorityDocs(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await Promise.allSettled([fetchDashboardData(), fetchPriorityDocs()]);
    setSyncing(false);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPriorityDocs();
  }, []);

  const handleSendPriorityReply = async (e) => {
    e.preventDefault();
    if (!replyModal.item || !replyModal.replyText.trim()) {
      toast.error("Please enter an acknowledgment reply message.");
      return;
    }
    setReplyModal((prev) => ({ ...prev, submitting: true }));
    try {
      await api.post(`/Staff/PriorityDocs/${replyModal.item.id}/Reply`, {
        reply: replyModal.replyText.trim(),
        status: replyModal.status,
        repliedBy: staffName,
      });
      toast.success("✓ Staff acknowledgment dispatched to client!");
      setReplyModal({ open: false, item: null, replyText: "", status: "ACKNOWLEDGED", submitting: false });
      fetchPriorityDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit acknowledgment.");
      setReplyModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const pendingPriorityCount = useMemo(() => {
    return priorityDocs.filter((d) => d.status === "PENDING").length;
  }, [priorityDocs]);

  const filteredPriorityDocs = useMemo(() => {
    if (priorityFilter === "PENDING") return priorityDocs.filter((d) => d.status === "PENDING");
    if (priorityFilter === "ACKNOWLEDGED") return priorityDocs.filter((d) => d.status === "ACKNOWLEDGED" || d.status === "FULFILLED");
    return priorityDocs;
  }, [priorityDocs, priorityFilter]);

  const renderPlanBadge = (plan) => {
    const p = (plan || "SILVER").toUpperCase();
    if (p === "PLATINUM") {
      return (
        <span style={{ padding: "3px 8px", background: "#f3e8ff", color: "#7e22ce", borderRadius: "6px", fontSize: "11px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          💎 Platinum VIP
        </span>
      );
    }
    if (p === "GOLD") {
      return (
        <span style={{ padding: "3px 8px", background: "#fef3c7", color: "#b45309", borderRadius: "6px", fontSize: "11px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          🌟 Gold VIP
        </span>
      );
    }
    return (
      <span style={{ padding: "3px 8px", background: "#f1f5f9", color: "#475569", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
        🥈 Silver Member
      </span>
    );
  };

  const goToCategory = (catKey) => {
    navigate(`/Staff/FileManagement?category=${catKey}`);
  };

  // Document categories for staff quick jump
  const CATEGORIES = [
    { key: "ALL", label: "All Documents", desc: "Master client document archives", icon: HiOutlineFolderOpen, color: "#0284c7", bg: "#e0f2fe" },
    { key: "GST", label: "GST Returns", desc: "GSTR-1, 3B & Monthly filing records", icon: HiOutlineDocumentText, color: "#0284c7", bg: "#e0f2fe" },
    { key: "ROC", label: "ROC Filings", desc: "Annual company filings & DIN records", icon: HiOutlineBriefcase, color: "#7c3aed", bg: "#f5f3ff" },
    { key: "TAX", label: "Tax Filings", desc: "ITR computations & Tax audit forms", icon: HiOutlineBuildingLibrary, color: "#059669", bg: "#ecfdf5" },
    { key: "FINANCIAL", label: "Financials", desc: "P&L statements & Signed balance sheets", icon: HiOutlineBanknotes, color: "#d97706", bg: "#fffbeb" },
    { key: "PAYROLL", label: "Pay Rolls", desc: "PF, ESI challans & wage registers", icon: HiOutlineCurrencyRupee, color: "#ea580c", bg: "#fff7ed" },
    { key: "CERTIFICATE", label: "Certificates", desc: "Statutory & MSME registrations", icon: HiOutlineShieldCheck, color: "#2563eb", bg: "#eff6ff" },
    { key: "COMPLIANCE", label: "Compliance Notice", desc: "IT & GST scrutiny notifications", icon: HiOutlineBellAlert, color: "#dc2626", bg: "#fef2f2" },
    { key: "IMPORTANT", label: "Important Records", desc: "High-priority client case papers", icon: HiOutlineSparkles, color: "#b45309", bg: "#fef3c7" },
    { key: "OTHER", label: "Other Documents", desc: "Misc supporting audit documentation", icon: HiOutlineFolderOpen, color: "#64748b", bg: "#f8fafc" },
  ];

  return (
    <div className="staff-overview-container">
      {/* ── Staff Hero Banner ─────────────────────────────────── */}
      <div className="staff-hero-card">
        <div className="staff-hero-left">
          <div className="staff-avatar-large">
            {(staffName || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="staff-greeting-title">
              {getGreeting()}, {staffName}!
            </h1>
            <p className="staff-greeting-sub">
              Sri Kathiravan &amp; Co. Staff Workspace &bull; Audit &amp; Advisory Operational Desk
            </p>
            <div className="staff-pills-row">
              <span className="staff-pill role">
                ● Staff Operations Specialist
              </span>
              <span className="staff-pill active">
                ● Shift Status: Active &bull; Operational
              </span>
              <span className="staff-pill vault">
                ● AWS S3 Vault Connected
              </span>
            </div>
          </div>
        </div>

        <div className="staff-hero-right">
          <div className="staff-clock-time">{currentTime || "--:--:-- --"}</div>
          <div className="staff-clock-date">{currentDate || "Loading Date..."}</div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="staff-sync-btn"
          >
            <HiOutlineArrowPath
              size={14}
              style={{ animation: syncing ? "spin 1s linear infinite" : "none" }}
            />
            {syncing ? "Syncing..." : "Sync Workspace"}
          </button>
        </div>
      </div>

      {/* ── Key Operational Metric Cards ──────────────────────── */}
      <div className="staff-section-header" style={{ marginTop: 0 }}>
        <div>
          <h2 className="staff-section-title">
            <HiOutlineBriefcase size={20} color="#0284c7" />
            Workspace Operational Health &amp; Workload
          </h2>
          <p className="staff-section-sub">
            Real-time client portfolio volume, active consultations, and communication alerts
          </p>
        </div>
      </div>

      <div className="staff-metrics-grid">
        {/* Card 1: Clients */}
        <div
          className="staff-metric-card blue"
          onClick={() => navigate("/Staff/ClientDetails")}
          title="Click to view Client Directory"
        >
          <div className="staff-metric-info">
            <span className="staff-metric-label">Client Directory</span>
            <div className="staff-metric-num">{stats.clients}</div>
            <span className="staff-metric-badge" style={{ color: "#0284c7" }}>
              View Client Records &rarr;
            </span>
          </div>
          <div className="staff-metric-icon-box blue">
            <HiOutlineUsers size={24} />
          </div>
        </div>

        {/* Card 2: Consultations */}
        <div
          className="staff-metric-card purple"
          onClick={() => navigate("/Staff/Appointments")}
          title="Click to review Consultation Sessions"
        >
          <div className="staff-metric-info">
            <span className="staff-metric-label">Consultation Sessions</span>
            <div className="staff-metric-num" style={{ color: stats.appointments > 0 ? "#7c3aed" : "#0f172a" }}>
              {stats.appointments}
            </div>
            <span className="staff-metric-badge" style={{ color: "#7c3aed" }}>
              Check Appointment Desk &rarr;
            </span>
          </div>
          <div className="staff-metric-icon-box purple">
            <HiOutlineCalendarDays size={24} />
          </div>
        </div>

        {/* Card 3: Document Vault */}
        <div
          className="staff-metric-card amber"
          onClick={() => navigate("/Staff/FileManagement")}
          title="Click to browse AWS S3 Document Vault"
        >
          <div className="staff-metric-info">
            <span className="staff-metric-label">Vault Documents</span>
            <div className="staff-metric-num">{stats.filesCount}</div>
            <span className="staff-metric-badge" style={{ color: "#d97706" }}>
              Open Document Vault &rarr;
            </span>
          </div>
          <div className="staff-metric-icon-box amber">
            <HiOutlineFolderOpen size={24} />
          </div>
        </div>

        {/* Card 4: Staff Notifications */}
        <div
          className="staff-metric-card emerald"
          onClick={() => navigate("/Staff/Notifications")}
          title="Click to view Staff Notifications"
        >
          <div className="staff-metric-info">
            <span className="staff-metric-label">Unread Messages</span>
            <div className="staff-metric-num" style={{ color: stats.unreadNotifications > 0 ? "#059669" : "#0f172a" }}>
              {stats.unreadNotifications}
            </div>
            <span
              className="staff-metric-badge"
              style={{
                color: stats.unreadNotifications > 0 ? "#059669" : "#64748b",
                fontWeight: stats.unreadNotifications > 0 ? "700" : "500",
              }}
            >
              {stats.unreadNotifications > 0 ? "● Unread Alerts &rarr;" : "All Caught Up &rarr;"}
            </span>
          </div>
          <div className="staff-metric-icon-box emerald">
            <HiOutlineBell size={24} />
          </div>
        </div>
      </div>

      {/* ── ⚡ VIP PRIORITY DOCUMENT REQUESTS HUB (STAFF DESK) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: "20px",
          padding: "24px 28px",
          marginBottom: "32px",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  background: "rgba(245, 158, 11, 0.25)",
                  color: "#fbbf24",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                }}
              >
                ⚡ STAFF ACTION QUEUE
              </span>
              {pendingPriorityCount > 0 && (
                <span
                  style={{
                    padding: "4px 10px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    animation: "pulse 1.8s infinite",
                  }}
                >
                  {pendingPriorityCount} Pending Acknowledgment
                </span>
              )}
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>
              VIP Client Priority Document Requests
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
              Urgent client document requests submitted by active members. Provide rapid acknowledgment notes and track compliance deliverables.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "8px", background: "rgba(255, 255, 255, 0.08)", padding: "4px", borderRadius: "10px" }}>
            {[
              { id: "ALL", label: `All (${priorityDocs.length})` },
              { id: "PENDING", label: `Pending (${pendingPriorityCount})` },
              { id: "ACKNOWLEDGED", label: `Acknowledged` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPriorityFilter(f.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  background: priorityFilter === f.id ? "#ffffff" : "transparent",
                  color: priorityFilter === f.id ? "#0f172a" : "#cbd5e1",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loadingPriorityDocs ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13.5px" }}>
            <HiOutlineArrowPath size={20} className="spin-icon" style={{ display: "inline", marginRight: "8px" }} />
            Loading live priority requests...
          </div>
        ) : filteredPriorityDocs.length === 0 ? (
          <div style={{ padding: "28px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "14px", textAlign: "center", border: "1px dashed rgba(255, 255, 255, 0.15)" }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13.5px" }}>
              🎉 Zero pending requests in this view. All client priority document inquiries have been acknowledged.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPriorityDocs.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: item.status === "PENDING" ? "1.5px solid rgba(245, 158, 11, 0.5)" : "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#ffffff" }}>
                      {item.clientName}
                    </div>
                    {renderPlanBadge(item.membershipPlan)}
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>✉️ {item.clientEmail}</span>
                    {item.clientMobile && <span style={{ fontSize: "12px", color: "#94a3b8" }}>📞 {item.clientMobile}</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <HiOutlineClock size={13} /> {formatDateTimeAgo(item.createdAt)}
                    </span>
                    {item.status === "PENDING" ? (
                      <span style={{ padding: "3px 10px", background: "#fef3c7", color: "#b45309", borderRadius: "999px", fontSize: "11.5px", fontWeight: "800" }}>
                        ⚡ Awaiting Reply
                      </span>
                    ) : item.status === "FULFILLED" ? (
                      <span style={{ padding: "3px 10px", background: "#e0e7ff", color: "#3730a3", borderRadius: "999px", fontSize: "11.5px", fontWeight: "800" }}>
                        ✓ Fulfilled
                      </span>
                    ) : (
                      <span style={{ padding: "3px 10px", background: "#dcfce7", color: "#15803d", borderRadius: "999px", fontSize: "11.5px", fontWeight: "800" }}>
                        ✓ Acknowledged
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", padding: "2px 8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", borderRadius: "6px" }}>
                    {item.docType?.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
                    {item.message}
                  </span>
                </div>

                {/* If already acknowledged, show the current reply */}
                {item.adminReply && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.35)",
                      borderLeft: "3px solid #22c55e",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "12.5px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#4ade80", fontWeight: "700", marginBottom: "2px" }}>
                      <span>✓ Replied by {item.repliedBy || "Staff Desk"}</span>
                      {item.repliedAt && <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDateTimeAgo(item.repliedAt)}</span>}
                    </div>
                    <div style={{ color: "#ffffff" }}>{item.adminReply}</div>
                  </div>
                )}

                {/* Action button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyModal({
                        open: true,
                        item: item,
                        replyText: item.adminReply || "",
                        status: item.status === "PENDING" ? "ACKNOWLEDGED" : item.status,
                        submitting: false,
                      })
                    }
                    style={{
                      padding: "6px 14px",
                      background: item.status === "PENDING" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: item.status === "PENDING" ? "0 2px 10px rgba(245, 158, 11, 0.35)" : "none",
                    }}
                  >
                    <HiOutlineChatBubbleLeftEllipsis size={14} />
                    {item.status === "PENDING" ? "Acknowledge & Reply" : "Update Acknowledgment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REPLY & ACKNOWLEDGE MODAL (PERMANENT BLACK BG & WHITE FONT) ── */}
      {replyModal.open && replyModal.item && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setReplyModal({ open: false, item: null, replyText: "", status: "ACKNOWLEDGED", submitting: false })}
        >
          <div
            style={{
              background: "#090d16",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: "18px",
              maxWidth: "520px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 25px 65px rgba(0, 0, 0, 0.85)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <HiOutlineChatBubbleLeftEllipsis size={22} color="#f59e0b" />
                Staff Acknowledgment: Priority Request
              </h3>
              <button
                type="button"
                onClick={() => setReplyModal({ open: false, item: null, replyText: "", status: "ACKNOWLEDGED", submitting: false })}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#ffffff",
                }}
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <div style={{ background: "#151d2f", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ color: "#ffffff", fontSize: "13.5px" }}>{replyModal.item.clientName}</strong>
                {renderPlanBadge(replyModal.item.membershipPlan)}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                Requested Category: <strong style={{ color: "#fbbf24" }}>{replyModal.item.docType?.replace(/_/g, " ")}</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", fontStyle: "italic", background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: "6px" }}>
                &quot;{replyModal.item.message}&quot;
              </p>
            </div>

            <form onSubmit={handleSendPriorityReply}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Staff Acknowledgment Note for Client *
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyModal.replyText}
                  onChange={(e) => setReplyModal({ ...replyModal, replyText: e.target.value })}
                  placeholder="e.g. Request received by staff desk. Preparing your required documentation..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />

                {/* Presets */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setReplyModal({ ...replyModal, replyText: "Request acknowledged. Staff executive is assigned and preparing your records." })}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      color: "#94a3b8",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    + Staff assigned
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyModal({ ...replyModal, replyText: "Files generated and uploaded to your vault. Please review.", status: "FULFILLED" })}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      color: "#94a3b8",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    + Uploaded to Vault
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Update Processing Status
                </label>
                <select
                  value={replyModal.status}
                  onChange={(e) => setReplyModal({ ...replyModal, status: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                >
                  <option value="ACKNOWLEDGED" style={{ background: "#151d2f", color: "#fff" }}>ACKNOWLEDGED (In Progress &amp; Assigned)</option>
                  <option value="FULFILLED" style={{ background: "#151d2f", color: "#fff" }}>FULFILLED (Completed &amp; Available in Vault)</option>
                  <option value="PENDING" style={{ background: "#151d2f", color: "#fff" }}>PENDING (Awaiting Document Details)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setReplyModal({ open: false, item: null, replyText: "", status: "ACKNOWLEDGED", submitting: false })}
                  style={{
                    padding: "10px 16px",
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
                  disabled={replyModal.submitting}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <HiOutlinePaperAirplane size={16} />
                  {replyModal.submitting ? "Sending..." : "Dispatch Acknowledgment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Action Shortcuts ───────────────────────────── */}
      <div className="staff-shortcuts-grid">
        <button
          className="staff-shortcut-btn"
          onClick={() => navigate("/Staff/FileManagement")}
        >
          <div className="staff-shortcut-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <HiOutlineArrowUpTray size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Upload Documents</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Add files to client folders</div>
          </div>
        </button>

        <button
          className="staff-shortcut-btn"
          onClick={() => navigate("/Staff/ClientDetails")}
        >
          <div className="staff-shortcut-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <HiOutlineUsers size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Client Directory</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Review profiles &amp; data</div>
          </div>
        </button>

        <button
          className="staff-shortcut-btn"
          onClick={() => navigate("/Staff/Appointments")}
        >
          <div className="staff-shortcut-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
            <HiOutlineCalendarDays size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Consultation Desk</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Track client meetings</div>
          </div>
        </button>

        <button
          className="staff-shortcut-btn"
          onClick={() => navigate("/Staff/Notifications")}
        >
          <div className="staff-shortcut-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <HiOutlineBellAlert size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Staff Inbox</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Admin alerts &amp; requests</div>
          </div>
        </button>
      </div>

      {/* ── Document Vault Categories Hub ─────────────────────── */}
      <div className="staff-section-header">
        <div>
          <h2 className="staff-section-title">
            <HiOutlineFolderOpen size={20} color="#0284c7" />
            Document Vault Categories
          </h2>
          <p className="staff-section-sub">
            Fast jump into specific filing archives and compliance directories
          </p>
        </div>
      </div>

      <div className="staff-categories-grid">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <div
              key={cat.key}
              className="staff-category-card"
              onClick={() => goToCategory(cat.key)}
              title={`Open ${cat.label} in Document Vault`}
            >
              <div
                className="staff-cat-icon-wrap"
                style={{ background: cat.bg, color: cat.color }}
              >
                <IconComponent size={24} />
              </div>
              <h3 className="staff-category-name">{cat.label}</h3>
              <p className="staff-category-desc">{cat.desc}</p>
              <span className="staff-category-action" style={{ color: cat.color }}>
                Browse Files <HiOutlineArrowRight size={12} />
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Upcoming Consultation Sessions ────────────────────── */}
      <div className="staff-section-header">
        <div>
          <h2 className="staff-section-title">
            <HiOutlineCalendarDays size={20} color="#7c3aed" />
            Recent &amp; Upcoming Consultation Schedule
          </h2>
          <p className="staff-section-sub">
            Review sessions booked by clients for video meets or in-person advisory
          </p>
        </div>
      </div>

      <div className="staff-upcoming-card">
        {upcomingAppointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 20px", color: "#64748b" }}>
            <HiOutlineCalendarDays size={38} color="#cbd5e1" style={{ marginBottom: "10px" }} />
            <p style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              No upcoming appointments currently booked
            </p>
            <p style={{ margin: 0, fontSize: "12.5px" }}>
              New consultation bookings from clients will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table className="staff-upcoming-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact Info</th>
                  <th>Consultation Format</th>
                  <th>Scheduled Timeline</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Access Details</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((appt) => {
                  const s = (appt.status || "").toUpperCase();
                  const isConfirmed = s === "CONFIRMED" || s === "SCHEDULED";
                  const isPending = s === "PENDING";

                  return (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#e0f2fe",
                              color: "#0284c7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "13px",
                            }}
                          >
                            {(appt.clientName || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>
                              {appt.clientName || "Valued Client"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Client #{appt.clientId || appt.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {appt.clientEmail && (
                          <div style={{ fontSize: "12px", color: "#334155" }}>
                            ✉️ {appt.clientEmail}
                          </div>
                        )}
                        {appt.clientMobile && (
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            📞 {appt.clientMobile}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: "600" }}>
                          {appt.appointmentType === "ONLINE" ? (
                            <><HiOutlineVideoCamera size={16} color="#0284c7" /> Online Meet</>
                          ) : appt.appointmentType === "IN_PERSON" ? (
                            <><HiOutlineBuildingOffice2 size={16} color="#7c3aed" /> In-Office Desk</>
                          ) : (
                            <><HiOutlinePhone size={16} color="#059669" /> Phone Advisory</>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>
                          {formatDate(appt.requestedDateTime, "Pending Schedule")}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {formatTime(appt.requestedDateTime, "Timeline TBD")}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            background: isConfirmed
                              ? "rgba(34, 197, 94, 0.12)"
                              : isPending
                              ? "rgba(245, 158, 11, 0.12)"
                              : "rgba(148, 163, 184, 0.12)",
                            color: isConfirmed
                              ? "#15803d"
                              : isPending
                              ? "#b45309"
                              : "#475569",
                          }}
                        >
                          {appt.status || "PENDING"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {appt.meetingLink ? (
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              background: "#0284c7",
                              color: "#ffffff",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <HiOutlineVideoCamera size={14} /> Join
                          </a>
                        ) : (
                          <button
                            onClick={() => navigate("/Staff/Appointments")}
                            style={{
                              padding: "6px 12px",
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Review &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
