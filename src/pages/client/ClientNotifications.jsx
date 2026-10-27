import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/ClientPortal.css";
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineInbox,
  HiOutlineTrash,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
} from "react-icons/hi2";
import NotificationSettingsModal from "../../components/NotificationSettingsModal";
import { isSoundEnabled } from "../../utils/notificationSound";

export default function ClientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | MEMBERSHIP | FILES | APPOINTMENTS
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    const handleSoundChange = (e) => {
      if (e?.detail?.soundEnabled !== undefined) {
        setSoundOn(e.detail.soundEnabled);
      } else {
        setSoundOn(isSoundEnabled());
      }
    };
    window.addEventListener("skc-sound-settings-changed", handleSoundChange);
    return () => window.removeEventListener("skc-sound-settings-changed", handleSoundChange);
  }, []);

  // Deduplicate notifications helper
  const deduplicateNotifs = (list) => {
    if (!Array.isArray(list)) return [];
    const seenIds = new Set();
    const seenContent = new Set();
    return list.filter((item) => {
      if (!item) return false;
      if (item.id && seenIds.has(item.id)) return false;
      if (item.id) seenIds.add(item.id);

      const contentKey = `${item.title || ""}_${item.message || ""}_${String(item.createdAt || "").slice(0, 16)}`;
      if (seenContent.has(contentKey)) return false;
      seenContent.add(contentKey);

      return true;
    });
  };

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Client/Notifications");
      setNotifications(deduplicateNotifs(res.data || []));
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const handleNotifArrived = () => {
      fetchNotifs();
    };
    window.addEventListener("skc-notification-arrived", handleNotifArrived);
    return () => window.removeEventListener("skc-notification-arrived", handleNotifArrived);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/Client/Notifications/ReadAll");
      toast.success("All notifications marked as read");
      fetchNotifs();
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/Client/Notifications/${id}`);
      toast.success("Notification deleted");
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await api.delete("/Client/Notifications/ClearAll");
      toast.success("All notifications cleared");
      setNotifications([]);
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "UNREAD") return !n.read;
      const type = (n.type || "").toUpperCase();
      const title = (n.title || "").toLowerCase();
      if (filter === "MEMBERSHIP") return type.includes("MEMBERSHIP") || title.includes("membership");
      if (filter === "FILES") return type.includes("FILE") || title.includes("file") || title.includes("document");
      if (filter === "APPOINTMENTS") return type.includes("APPOINTMENT") || title.includes("appointment") || title.includes("meeting");
      return true;
    });
  }, [notifications, filter]);

  // Format date helper with UTC & IST timezone normalization
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      let normalized = String(dateStr).trim();
      if (!normalized.endsWith("Z") && !normalized.includes("+") && !normalized.match(/-\d{2}:\d{2}$/)) {
        normalized = normalized + "Z";
      }
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();

      // If created within the last 60 seconds (or slight clock skew), show "Just now"
      if (diffMs < 60000) return "Just now";
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getNotifMeta = (n) => {
    const type = (n.type || "").toUpperCase();
    const title = (n.title || "").toLowerCase();

    if (type.includes("MEMBERSHIP") || title.includes("membership")) {
      return {
        icon: HiOutlineSparkles,
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        border: "#f59e0b",
        tag: "Membership Alert",
        tagBg: "#fffbeb",
        tagColor: "#b45309",
        actionText: "View Membership Perks",
        actionUrl: "/Client/Membership",
      };
    }
    if (type.includes("FILE") || title.includes("file") || title.includes("document")) {
      return {
        icon: HiOutlineDocumentText,
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
        border: "#3b82f6",
        tag: "Document Notice",
        tagBg: "#f0f9ff",
        tagColor: "#1d4ed8",
        actionText: "Open Document Vault",
        actionUrl: "/Client/Files",
      };
    }
    if (type.includes("APPOINTMENT") || title.includes("appointment") || title.includes("meeting")) {
      return {
        icon: HiOutlineCalendarDays,
        iconBg: "#f5f3ff",
        iconColor: "#7c3aed",
        border: "#8b5cf6",
        tag: "Consultation Notice",
        tagBg: "#faf5ff",
        tagColor: "#6d28d9",
        actionText: "Check Appointments",
        actionUrl: "/Client/Appointments",
      };
    }
    return {
      icon: HiOutlineBell,
      iconBg: "#f8fafc",
      iconColor: "#64748b",
      border: "#94a3b8",
      tag: "Office Alert",
      tagBg: "#f1f5f9",
      tagColor: "#475569",
      actionText: null,
      actionUrl: null,
    };
  };

  return (
    <div className="client-page-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="client-notif-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
              <HiOutlineBell size={30} color="#d97706" /> My Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "800",
                  padding: "3px 12px",
                  borderRadius: "999px",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)",
                }}
              >
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Alerts for newly uploaded audit files, appointment schedules, and membership activation notices.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            style={{
              padding: "10px 16px",
              background: soundOn ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              border: `1px solid ${soundOn ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "700",
              color: soundOn ? "#059669" : "#dc2626",
              cursor: "pointer",
            }}
            title="Notification Sound & Desktop Alert Settings"
            id="client-notif-sound-btn"
          >
            {soundOn ? <HiOutlineSpeakerWave size={17} /> : <HiOutlineSpeakerXMark size={17} />}
            <span>Sound {soundOn ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={fetchNotifs}
            disabled={loading}
            style={{
              padding: "10px 18px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#334155",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <HiOutlineArrowPath size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "13px",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
              }}
            >
              <HiOutlineCheck size={16} /> Mark All Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                padding: "10px 18px",
                background: "rgba(239, 68, 68, 0.08)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              <HiOutlineTrash size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Chips ──────────────────────────────────────── */}
      <div className="client-notif-filters">
        {[
          { key: "ALL", label: `All Alerts (${notifications.length})` },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "MEMBERSHIP", label: "Membership 👑" },
          { key: "FILES", label: "Documents 📄" },
          { key: "APPOINTMENTS", label: "Appointments 📅" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`client-notif-chip ${filter === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notification Cards ────────────────────────────────── */}
      <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
            <p style={{ margin: 0, fontSize: "14px" }}>Loading notifications feed...</p>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <HiOutlineInbox size={32} />
            </div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#1e293b" }}>
              No notifications found
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {filter === "UNREAD" ? "You have no unread alerts at this time." : "New alerts will appear here as soon as they arrive."}
            </p>
          </div>
        ) : (
          <div>
            {filteredNotifs.map((n) => {
              const meta = getNotifMeta(n);
              const IconComp = meta.icon;

              return (
                <div
                  key={n.id}
                  className={`client-notif-card ${n.read ? "read" : "unread"}`}
                  style={{ borderLeftColor: meta.border }}
                >
                  {/* Icon Box */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: meta.iconBg,
                      color: meta.iconColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={22} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: meta.tagBg,
                            color: meta.tagColor,
                          }}
                        >
                          {meta.tag}
                        </span>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                          {n.title}
                        </h4>
                      </div>

                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p style={{ margin: "4px 0 12px 0", fontSize: "14px", color: "#475569", lineHeight: 1.55 }}>
                      {n.message}
                    </p>

                    {meta.actionUrl && (
                      <Link
                        to={meta.actionUrl}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: meta.iconColor,
                          fontSize: "13px",
                          fontWeight: "700",
                          textDecoration: "none",
                        }}
                      >
                        {meta.actionText} <HiOutlineArrowRight size={14} />
                      </Link>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    {!n.read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                        }}
                        title="Unread"
                      />
                    )}

                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      title="Delete this notification"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        padding: "6px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <HiOutlineTrash size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sound & Alert Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
