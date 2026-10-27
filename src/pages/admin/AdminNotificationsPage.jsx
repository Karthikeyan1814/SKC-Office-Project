import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/AdminNotifications.css";
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineInbox,
  HiOutlineTrash,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
} from "react-icons/hi2";
import NotificationSettingsModal from "../../components/NotificationSettingsModal";
import { isSoundEnabled } from "../../utils/notificationSound";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | MEMBERSHIP | FILES
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const navigate = useNavigate();

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
      const res = await api.get("/Admin/Notifications");
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
      await api.post("/Admin/Notifications/ReadAll");
      toast.success("All notifications marked as read");
      fetchNotifs();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/Admin/Notifications/${id}`);
      toast.success("Notification deleted");
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all admin alerts?")) return;
    try {
      await api.delete("/Admin/Notifications/ClearAll");
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
      if (filter === "MEMBERSHIP") return n.type?.includes("MEMBERSHIP") || n.title?.toLowerCase().includes("membership");
      if (filter === "FILES") return n.type?.includes("FILE") || n.title?.toLowerCase().includes("file");
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

  // Determine icon & style per notification type
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
        actionText: "Review in Membership Hub",
        actionUrl: "/Admin/Membership",
      };
    }
    if (type.includes("FILE") || title.includes("file") || title.includes("document")) {
      return {
        icon: HiOutlineDocumentText,
        iconBg: "#e0e7ff",
        iconColor: "#4f46e5",
        border: "#6366f1",
        tag: "Document Hub",
        tagBg: "#eef2ff",
        tagColor: "#4338ca",
        actionText: "Open File Repository",
        actionUrl: "/Admin/FileManagement",
      };
    }
    return {
      icon: HiOutlineBell,
      iconBg: "#f3f4f6",
      iconColor: "#6b7280",
      border: "#9ca3af",
      tag: "System Notice",
      tagBg: "#f9fafb",
      tagColor: "#4b5563",
      actionText: null,
      actionUrl: null,
    };
  };

  return (
    <div className="admin-notif-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="admin-notif-header">
        <div>
          <div className="admin-notif-title-row">
            <h2 className="admin-notif-title">
              <HiOutlineBell size={30} color="#d97706" /> System Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="admin-notif-badge">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="admin-notif-subtitle">
            Real-time feed of membership applications, client document uploads, and administrative alerts.
          </p>
        </div>

        <div className="admin-notif-actions">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            style={{
              padding: "8px 14px",
              background: soundOn ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${soundOn ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: soundOn ? "#10b981" : "#ef4444",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "12.5px",
            }}
            title="Notification Sound & Desktop Alert Settings"
            id="admin-notif-sound-btn"
          >
            {soundOn ? <HiOutlineSpeakerWave size={16} /> : <HiOutlineSpeakerXMark size={16} />}
            <span>Sound {soundOn ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={fetchNotifs}
            disabled={loading}
            className="btn-notif-refresh"
          >
            <HiOutlineArrowPath size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-notif-readall"
            >
              <HiOutlineCheck size={16} /> Mark All Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                padding: "8px 14px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "12.5px",
              }}
            >
              <HiOutlineTrash size={15} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────── */}
      <div className="admin-notif-filters">
        {[
          { key: "ALL", label: `All Alerts (${notifications.length})` },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "MEMBERSHIP", label: "Membership Requests 👑" },
          { key: "FILES", label: "File Uploads 📄" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`notif-filter-chip ${filter === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notifications List ─────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
        {loading ? (
          <div className="notif-empty-state">
            <p style={{ margin: 0, color: "#94a3b8" }}>Loading notifications feed...</p>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              <HiOutlineInbox size={36} />
            </div>
            <h4 className="notif-empty-title">No notifications in this view</h4>
            <p className="notif-empty-desc">
              {filter === "UNREAD" ? "You're all caught up! Zero unread notifications." : "New alerts will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="admin-notif-list">
            {filteredNotifs.map((n) => {
              const meta = getNotifMeta(n);
              const IconComp = meta.icon;

              return (
                <div
                  key={n.id}
                  className={`notif-card ${n.read ? "read" : "unread"}`}
                  style={{ borderLeftColor: meta.border }}
                >
                  {/* Type Icon Badge */}
                  <div
                    className="notif-icon-box"
                    style={{ background: meta.iconBg, color: meta.iconColor }}
                  >
                    <IconComp size={22} />
                  </div>

                  {/* Body */}
                  <div className="notif-body">
                    <div className="notif-meta-row">
                      <div className="notif-tags-wrap">
                        <span
                          className="notif-tag"
                          style={{ background: meta.tagBg, color: meta.tagColor }}
                        >
                          {meta.tag}
                        </span>
                        <h4 className="notif-title-text" style={{ margin: 0 }}>
                          {n.title}
                        </h4>
                      </div>

                      <span className="notif-timestamp">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="notif-message-text">
                      {n.message}
                    </p>

                    {meta.actionUrl && (
                      <Link
                        to={meta.actionUrl}
                        className="notif-action-btn"
                        style={{ color: meta.iconColor }}
                      >
                        {meta.actionText} <HiOutlineArrowRight size={14} />
                      </Link>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    {!n.read && (
                      <span className="notif-status-dot" title="Unread alert" />
                    )}

                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      title="Delete this alert"
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
                      <HiOutlineTrash size={16} />
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
