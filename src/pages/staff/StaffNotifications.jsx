import { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/StaffNotifications.css";
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineInbox,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function StaffNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | FILES | APPOINTMENTS | SYSTEM

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Staff/Notifications");
      setNotifications(res.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/Staff/Notifications/ReadAll");
      toast.success("All staff notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/Staff/Notifications/${id}/Read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/Staff/Notifications/${id}`);
      toast.success("Notification deleted");
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all staff notifications?")) return;
    try {
      await api.delete("/Staff/Notifications/ClearAll");
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
      if (filter === "FILES") return n.type?.includes("FILE") || n.title?.toLowerCase().includes("file") || n.message?.toLowerCase().includes("file");
      if (filter === "APPOINTMENTS") return n.type?.includes("APPOINTMENT") || n.title?.toLowerCase().includes("appointment") || n.message?.toLowerCase().includes("consultation");
      if (filter === "SYSTEM") return n.type?.includes("MEMBERSHIP") || n.type?.includes("ANNOUNCEMENT") || n.type?.includes("ADMIN");
      return true;
    });
  }, [notifications, filter]);

  // Relative time helper
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getNotifMeta = (n) => {
    const t = (n.type || "").toUpperCase();
    const title = (n.title || "").toLowerCase();
    if (t.includes("FILE") || title.includes("file") || title.includes("document")) {
      return { icon: HiOutlineDocumentText, className: "file", label: "File Upload" };
    }
    if (t.includes("APPOINTMENT") || title.includes("appointment") || title.includes("consultation")) {
      return { icon: HiOutlineCalendarDays, className: "appt", label: "Appointment" };
    }
    if (t.includes("MEMBERSHIP") || title.includes("membership")) {
      return { icon: HiOutlineSparkles, className: "membership", label: "Membership" };
    }
    return { icon: HiOutlineBell, className: "system", label: "Official Alert" };
  };

  return (
    <div className="staff-notif-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="staff-notif-header">
        <div>
          <div className="staff-notif-title-row">
            <h1 className="staff-notif-title">
              <HiOutlineBell size={28} /> Staff Operational Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="staff-notif-badge">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="staff-notif-subtitle">
            Live updates for client document uploads, incoming consultation bookings, and administrative directives.
          </p>
        </div>

        <div className="staff-notif-actions">
          <button
            onClick={fetchNotifs}
            className="btn-staff-notif-action btn-staff-notif-refresh"
            title="Refresh alerts"
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-staff-notif-action btn-staff-notif-readall"
            >
              <HiOutlineCheck size={16} /> Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-staff-notif-action btn-staff-notif-clear"
            >
              <HiOutlineTrash size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Bar ───────────────────────────────── */}
      <div className="staff-notif-filter-bar">
        {[
          { id: "ALL", label: "All Alerts", count: notifications.length },
          { id: "UNREAD", label: "Unread", count: unreadCount },
          {
            id: "FILES",
            label: "Client Files",
            count: notifications.filter((n) => n.type?.includes("FILE") || n.title?.toLowerCase().includes("file")).length,
          },
          {
            id: "APPOINTMENTS",
            label: "Appointments",
            count: notifications.filter((n) => n.type?.includes("APPOINTMENT") || n.title?.toLowerCase().includes("appointment")).length,
          },
          {
            id: "SYSTEM",
            label: "Directives & Admin",
            count: notifications.filter((n) => n.type?.includes("MEMBERSHIP") || n.type?.includes("ANNOUNCEMENT")).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`staff-filter-pill ${filter === tab.id ? "active" : ""}`}
          >
            <span>{tab.label}</span>
            <span className="staff-filter-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Notifications Feed ────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <HiOutlineArrowPath size={32} className="spin-animate" style={{ marginBottom: "12px" }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Loading staff notifications...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="staff-notif-empty">
          <div className="staff-notif-empty-icon">
            <HiOutlineInbox />
          </div>
          <h3 className="staff-notif-empty-title">
            {filter === "UNREAD" ? "No Unread Alerts" : "All Caught Up!"}
          </h3>
          <p className="staff-notif-empty-desc">
            {filter === "UNREAD"
              ? "You have acknowledged all recent operational alerts."
              : "No incoming client document uploads or appointment alerts matching this filter."}
          </p>
        </div>
      ) : (
        <div className="staff-notif-list">
          {filteredNotifs.map((n) => {
            const meta = getNotifMeta(n);
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                className={`staff-notif-card ${n.read ? "read" : "unread"}`}
                onClick={() => !n.read && handleMarkSingleRead(n.id)}
              >
                <div className={`staff-notif-icon-wrap ${meta.className}`}>
                  <Icon />
                </div>

                <div className="staff-notif-content">
                  <div className="staff-notif-topline">
                    <h4 className="staff-notif-item-title">
                      {!n.read && <span className="staff-unread-dot" title="Unread alert" />}
                      {n.title}
                    </h4>
                    <span className="staff-notif-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="staff-notif-message">{n.message}</p>
                </div>

                <div className="staff-notif-card-actions">
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkSingleRead(n.id, e)}
                      title="Mark as read"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#0284c7",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <HiOutlineCheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(n.id, e)}
                    className="btn-notif-icon-delete"
                    title="Delete notification"
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
  );
}
