import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineBell,
  HiOutlineArrowRightOnRectangle,
  HiBars3,
  HiOutlineSwatch,
} from "react-icons/hi2";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import "../styles/PortalTopBar.css";
import { useUniversalTheme } from "../context/ThemeContext";

export default function PortalTopBar({ onToggleSidebar }) {
  const { setIsThemeModalOpen } = useUniversalTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("skc-role") || "CLIENT";
  const userName = localStorage.getItem("skc-name") || (role === "ADMIN" ? "Administrator" : "User");

  // Determine section title from path
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes("ClientDetails")) return "Client Management Directory";
    if (path.includes("EditClientForm")) return "Client Form Settings";
    if (path.includes("FileManagement") || path.endsWith("/Files")) return "Digital Document Repository";
    if (path.includes("Membership")) return "Membership Subscriptions";
    if (path.includes("Appointments")) return "Appointment Schedules";
    if (path.includes("AccessManagement")) return "Staff & Access Control";
    if (path.includes("Notifications")) return "System Notifications";
    if (path.includes("Profile")) return "Account Settings";
    return "Executive Dashboard";
  };

  const getNotifRoute = () => {
    if (role === "ADMIN") return "/Admin/Notifications";
    if (role === "STAFF") return "/Staff/Notifications";
    return "/Client/Notifications";
  };

  const getRoleBadge = () => {
    if (role === "ADMIN") return { label: "Admin", class: "role-admin" };
    if (role === "STAFF") return { label: "Staff", class: "role-staff" };
    return { label: "Client", class: "role-client" };
  };

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const path =
          role === "ADMIN"
            ? "/Admin/Notifications/UnreadCount"
            : role === "STAFF"
            ? "/Staff/Notifications/UnreadCount"
            : "/Client/Notifications/UnreadCount";
        const res = await api.get(path);
        setUnreadCount(res.data.count || 0);
      } catch {
        // silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const handleSignOut = () => {
    localStorage.removeItem("skc-token");
    localStorage.removeItem("skc-role");
    localStorage.removeItem("skc-name");
    localStorage.removeItem("skc-id");
    toast.success("Signed out successfully");
    navigate("/SignIn");
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="portal-topbar">
      <div className="topbar-left">
        <button
          className="topbar-burger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
          id="portal-topbar-burger"
        >
          <HiBars3 size={24} />
        </button>

        <Link to={role === "ADMIN" ? "/Admin" : role === "STAFF" ? "/Staff" : "/Client"} className="topbar-brand">
          <img src="/skc-sub-logo.png" alt="Logo" className="topbar-logo" />
          <div className="topbar-brand-text">
            <span className="brand-firm">Sri Kathiravan & Co.</span>
            <span className="brand-sub">Client Management Portal</span>
          </div>
        </Link>

        <div className="topbar-separator" />

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-pill">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Live System Indicator */}
        <div className="topbar-status-chip">
          <span className="status-dot-pulse" />
          <span className="status-label">Portal Active</span>
        </div>

        {/* Theme Settings */}
        <button
          className="topbar-icon-btn"
          onClick={() => setIsThemeModalOpen(true)}
          title="Universal Theme & Color Settings"
          id="topbar-theme-btn"
          style={{ color: "var(--gold, #f59e0b)" }}
        >
          <HiOutlineSwatch size={20} />
        </button>

        {/* Notifications */}
        <Link to={getNotifRoute()} className="topbar-icon-btn" title="Notifications" id="topbar-notif-btn">
          <HiOutlineBell size={20} />
          {unreadCount > 0 && (
            <span className="topbar-notif-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </Link>

        {/* User Card */}
        <div className="topbar-user">
          <div className="user-avatar-circle">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className={`user-role-badge ${roleBadge.class}`}>{roleBadge.label}</span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          className="topbar-signout-btn"
          onClick={handleSignOut}
          title="Sign Out"
          id="portal-topbar-signout"
        >
          <HiOutlineArrowRightOnRectangle size={18} />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}
