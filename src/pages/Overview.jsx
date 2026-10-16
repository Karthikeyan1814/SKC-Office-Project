import { useState, useEffect, useMemo } from "react";
import "../styles/Overview.css";
import useCounter from "../hook/useCounter";
import FilesLayout from "../layouts/FilesLayout";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { formatDate, formatTime, formatDateTimeAgo, formatFullDateTime } from "../utils/dateFormat";
import {
  HiOutlineUsers,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlineFolderOpen,
  HiOutlineDocumentText,
  HiOutlineBriefcase,
  HiOutlineBuildingLibrary,
  HiOutlineBanknotes,
  HiOutlineCurrencyRupee,
  HiOutlineArrowRight,
  HiOutlineArrowUpTray,
  HiOutlineBellAlert,
  HiOutlineKey,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

export default function Overview() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("skc-name") || "Administrator";

  const [stats, setStats] = useState({
    activeClients: 0,
    memberClients: 0,
    pendingAppointments: 0,
    pendingMemberships: 0,
  });

  const [importantFiles, setImportantFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
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

  const activeClientsCount = useCounter(stats.activeClients);
  const memberClientsCount = useCounter(stats.memberClients);
  const pendingAppointmentsCount = useCounter(stats.pendingAppointments);
  const pendingMembershipsCount = useCounter(stats.pendingMemberships);

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

  // Fetch live dashboard stats
  const fetchStats = async () => {
    try {
      const res = await api.get("/Admin/Dashboard/Stats");
      if (res.data) {
        setStats({
          activeClients: res.data.activeClients || 0,
          memberClients: res.data.memberClients || 0,
          pendingAppointments: res.data.pendingAppointments || 0,
          pendingMemberships: res.data.pendingMemberships || 0,
        });
      }
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    }
  };

  // Fetch Priority Document Requests
  const fetchPriorityDocs = async () => {
    setLoadingPriorityDocs(true);
    try {
      const res = await api.get("/Admin/PriorityDocs/All");
      setPriorityDocs(res.data || []);
    } catch (e) {
      console.error("Failed to fetch priority docs", e);
    } finally {
      setLoadingPriorityDocs(false);
    }
  };

  // Fetch live Important files from AWS S3 & Postgres
  const fetchImportantFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await api.get("/Admin/FileManagement/AllFiles?category=IMPORTANT");
      setImportantFiles(res.data || []);
    } catch (e) {
      console.error("Failed to load important files", e);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    await Promise.allSettled([fetchStats(), fetchPriorityDocs(), fetchImportantFiles()]);
    setSyncing(false);
  };

  useEffect(() => {
    fetchStats();
    fetchPriorityDocs();
    fetchImportantFiles();
  }, []);

  const goToCategory = (catKey) => {
    navigate(`/Admin/FileManagement?category=${catKey}`);
  };

  // Handle Priority Doc Reply
  const handleSendPriorityReply = async (e) => {
    e.preventDefault();
    if (!replyModal.item || !replyModal.replyText.trim()) {
      toast.error("Please enter an acknowledgment reply message.");
      return;
    }
    setReplyModal((prev) => ({ ...prev, submitting: true }));
    try {
      await api.post(`/Admin/PriorityDocs/${replyModal.item.id}/Reply`, {
        reply: replyModal.replyText.trim(),
        status: replyModal.status,
        repliedBy: adminName,
      });
      toast.success("✓ Acknowledgment dispatched to client portal & notifications!");
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

  // Document categories configuration
  const CATEGORIES = [
    { key: "ALL", label: "All Documents", desc: "Complete master document vault", icon: HiOutlineFolderOpen, color: "#4f46e5", bg: "#eef2ff" },
    { key: "GST", label: "GST Documents", desc: "GSTR-1, 3B, 9 & Monthly returns", icon: HiOutlineDocumentText, color: "#0284c7", bg: "#e0f2fe" },
    { key: "ROC", label: "ROC Filings", desc: "Company annual returns & DIN records", icon: HiOutlineBriefcase, color: "#7c3aed", bg: "#f5f3ff" },
    { key: "TAX", label: "Tax Filings", desc: "ITR-1 through 7 & TDS certificates", icon: HiOutlineBuildingLibrary, color: "#059669", bg: "#ecfdf5" },
    { key: "FINANCIAL", label: "Financials", desc: "Balance sheets & Audit P&L records", icon: HiOutlineBanknotes, color: "#d97706", bg: "#fffbeb" },
    { key: "PAYROLL", label: "Pay Rolls", desc: "PF, ESI & Employee salary registers", icon: HiOutlineCurrencyRupee, color: "#ea580c", bg: "#fff7ed" },
    { key: "CERTIFICATE", label: "Certificates", desc: "MSME, Incorporation & GST Certs", icon: HiOutlineShieldCheck, color: "#2563eb", bg: "#eff6ff" },
    { key: "COMPLIANCE", label: "Compliance Notice", desc: "Department notices & assessments", icon: HiOutlineBellAlert, color: "#dc2626", bg: "#fef2f2" },
    { key: "IMPORTANT", label: "Important Records", desc: "High-priority audit documentation", icon: HiOutlineSparkles, color: "#b45309", bg: "#fef3c7" },
    { key: "OTHER", label: "Other Documents", desc: "Miscellaneous vouchers & contracts", icon: HiOutlineFolderOpen, color: "#64748b", bg: "#f8fafc" },
  ];

  return (
    <div className="overview-cont">
      {/* ── Executive Hero Card ──────────────────────────────── */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <h1 className="overview-greeting-title">
            {getGreeting()}, {adminName}!
          </h1>
          <p className="overview-greeting-sub">
            Sri Kathiravan &amp; Co. Enterprise Management &bull; Executive Command Center
          </p>
          <div className="overview-pills-row">
            <span className="overview-pill live">
              ● Production DB Online
            </span>
            <span className="overview-pill cloud">
              ● AWS S3 Vault Connected
            </span>
            <span className="overview-pill admin">
              ● Master Authority Level 1
            </span>
          </div>
        </div>

        <div className="overview-hero-right">
          <div className="overview-clock-time">{currentTime || "--:--:-- --"}</div>
          <div className="overview-clock-date">{currentDate || "Loading Date..."}</div>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="overview-sync-btn"
          >
            <HiOutlineArrowPath
              size={14}
              style={{ animation: syncing ? "spin 1s linear infinite" : "none" }}
            />
            {syncing ? "Syncing..." : "Sync System"}
          </button>
        </div>
      </div>

      {/* ── Key Operational Metrics ───────────────────────────── */}
      <div className="overview-section-header" style={{ marginTop: 0 }}>
        <div>
          <h2 className="overview-section-title">
            <HiOutlineBriefcase size={20} color="#4f46e5" />
            Operational Health &amp; Activity Overview
          </h2>
          <p className="overview-section-sub">
            Live client portfolios, membership tiers, and pending administrative actions
          </p>
        </div>
      </div>

      <div className="overview-metrics-grid">
        {/* Card 1: Active Clients */}
        <div
          className="overview-metric-card blue"
          onClick={() => navigate("/Admin/ClientDetails")}
          title="Click to view Client Directory"
        >
          <div className="overview-metric-info">
            <span className="overview-metric-label">Active Clients</span>
            <div className="overview-metric-num">{activeClientsCount}</div>
            <span className="overview-metric-badge" style={{ color: "#2563eb" }}>
              View Directory &rarr;
            </span>
          </div>
          <div className="overview-metric-icon-box blue">
            <HiOutlineUsers size={24} />
          </div>
        </div>

        {/* Card 2: Active Members */}
        <div
          className="overview-metric-card amber"
          onClick={() => navigate("/Admin/Membership")}
          title="Click to manage Membership Plans"
        >
          <div className="overview-metric-info">
            <span className="overview-metric-label">Active Retainer Members</span>
            <div className="overview-metric-num">{memberClientsCount}</div>
            <span className="overview-metric-badge" style={{ color: "#d97706" }}>
              Manage Tiers &rarr;
            </span>
          </div>
          <div className="overview-metric-icon-box amber">
            <HiOutlineSparkles size={24} />
          </div>
        </div>

        {/* Card 3: Pending Appointments */}
        <div
          className="overview-metric-card purple"
          onClick={() => navigate("/Admin/Appointments")}
          title="Click to review Consultation Requests"
        >
          <div className="overview-metric-info">
            <span className="overview-metric-label">Pending Consultations</span>
            <div className="overview-metric-num" style={{ color: stats.pendingAppointments > 0 ? "#7c3aed" : "#0f172a" }}>
              {pendingAppointmentsCount}
            </div>
            <span
              className="overview-metric-badge"
              style={{
                color: stats.pendingAppointments > 0 ? "#7c3aed" : "#64748b",
                fontWeight: stats.pendingAppointments > 0 ? "700" : "500",
              }}
            >
              {stats.pendingAppointments > 0 ? "⚠️ Review Slots &rarr;" : "All Reviewed &rarr;"}
            </span>
          </div>
          <div className="overview-metric-icon-box purple">
            <HiOutlineCalendarDays size={24} />
          </div>
        </div>

        {/* Card 4: Requested Memberships */}
        <div
          className="overview-metric-card green"
          onClick={() => navigate("/Admin/Membership")}
          title="Click to approve Membership Requests"
        >
          <div className="overview-metric-info">
            <span className="overview-metric-label">Membership Requests</span>
            <div className="overview-metric-num" style={{ color: stats.pendingMemberships > 0 ? "#059669" : "#0f172a" }}>
              {pendingMembershipsCount}
            </div>
            <span
              className="overview-metric-badge"
              style={{
                color: stats.pendingMemberships > 0 ? "#059669" : "#64748b",
                fontWeight: stats.pendingMemberships > 0 ? "700" : "500",
              }}
            >
              {stats.pendingMemberships > 0 ? "● Pending Approval &rarr;" : "Up to date &rarr;"}
            </span>
          </div>
          <div className="overview-metric-icon-box green">
            <HiOutlineShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* ── ⚡ VIP PRIORITY DOCUMENT REQUESTS HUB ───────────────── */}
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
                ⚡ HIGH PRIORITY QUEUE
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
                  {pendingPriorityCount} Pending Action
                </span>
              )}
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>
              VIP Client Priority Document Requests &amp; Inquiries
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
              Privileged inquiries submitted by Retainer Members. Review documentation specifications and reply with immediate office acknowledgment.
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
                      <span>✓ Replied by {item.repliedBy || "Admin"}</span>
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
                Acknowledge Priority Document Request
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
                  Official Acknowledgment Note for Client *
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyModal.replyText}
                  onChange={(e) => setReplyModal({ ...replyModal, replyText: e.target.value })}
                  placeholder="e.g. Request acknowledged. Our senior audit team has initiated review..."
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
                    onClick={() => setReplyModal({ ...replyModal, replyText: "Request acknowledged. Our senior audit team is actively preparing your documentation." })}
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
                    + Audit in progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyModal({ ...replyModal, replyText: "Reconciliation verified. Please check your document vault; files uploaded.", status: "FULFILLED" })}
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
                    + Verified &amp; Uploaded
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

      {/* ── Administrative Quick Actions ──────────────────────── */}
      <div className="overview-shortcuts-grid">
        <button
          className="overview-shortcut-btn"
          onClick={() => navigate("/Admin/Appointments")}
        >
          <div className="overview-shortcut-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <HiOutlineCalendarDays size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Consultation Desk</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Schedule video meets</div>
          </div>
        </button>

        <button
          className="overview-shortcut-btn"
          onClick={() => navigate("/Admin/FileManagement")}
        >
          <div className="overview-shortcut-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <HiOutlineArrowUpTray size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Document Vault</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>AWS S3 file repository</div>
          </div>
        </button>

        <button
          className="overview-shortcut-btn"
          onClick={() => navigate("/Admin/AccessManagement")}
        >
          <div className="overview-shortcut-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <HiOutlineKey size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Staff &amp; Access Controls</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Roles, OTP 2FA &amp; Security</div>
          </div>
        </button>

        <button
          className="overview-shortcut-btn"
          onClick={() => navigate("/Admin/Appointments")}
        >
          <div className="overview-shortcut-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <HiOutlineBellAlert size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700" }}>Broadcast Notification</div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>Email &amp; In-app alerts</div>
          </div>
        </button>
      </div>

      {/* ── Document Vault Categories Hub ─────────────────────── */}
      <div className="overview-section-header">
        <div>
          <h2 className="overview-section-title">
            <HiOutlineFolderOpen size={20} color="#2563eb" />
            Document Vault Categories
          </h2>
          <p className="overview-section-sub">
            Direct access to organized client folders and compliance archives
          </p>
        </div>
      </div>

      <div className="overview-categories-grid">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <div
              key={cat.key}
              className="overview-category-card"
              onClick={() => goToCategory(cat.key)}
              title={`Open ${cat.label} in Document Vault`}
            >
              <div
                className="overview-cat-icon-wrap"
                style={{ background: cat.bg, color: cat.color }}
              >
                <IconComponent size={24} />
              </div>
              <h3 className="overview-category-name">{cat.label}</h3>
              <p className="overview-category-desc">{cat.desc}</p>
              <span className="overview-category-action" style={{ color: cat.color }}>
                Browse Files <HiOutlineArrowRight size={12} />
              </span>
            </div>
          );
        })}
      </div>

      {/* ── High-Priority / Important Documents Section ───────── */}
      <div className="overview-section-header">
        <div>
          <h2 className="overview-section-title">
            <HiOutlineSparkles size={20} color="#d97706" />
            High-Priority &amp; Critical Audit Documents
          </h2>
          <p className="overview-section-sub">
            Files marked as IMPORTANT by clients and administrative partners
          </p>
        </div>
      </div>

      <FilesLayout
        fileCategorie={"Important Files"}
        files={importantFiles}
        loading={loadingFiles}
        onRefresh={fetchImportantFiles}
        isAdmin={true}
      />
    </div>
  );
}