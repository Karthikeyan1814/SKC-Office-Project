import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";
import {
  HiOutlineChartBarSquare,
  HiOutlineUsers,
  HiOutlineFolderOpen,
  HiOutlineIdentification,
  HiOutlineCalendarDays,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineSwatch,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
} from "react-icons/hi2";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { useUniversalTheme } from "../context/ThemeContext";

const getMenuItems = (role, membershipStatus, membershipEnabled = false) => {
  const adminMenu = [
    { label: "Dashboard",          icon: HiOutlineChartBarSquare, path: "/Admin" },
    { label: "File Repository",    icon: HiOutlineFolderOpen,      path: "/Admin/FileManagement" },
    { label: "Invoice & Receipt",  icon: HiOutlineReceiptPercent,  path: "/Admin/Billing" },
    { label: "Membership Tier",    icon: HiOutlineIdentification,  path: "/Admin/Membership" },
    { label: "Appointments",      icon: HiOutlineCalendarDays,    path: "/Admin/Appointments" },
    { label: "Staff & Access",     icon: HiOutlineShieldCheck,     path: "/Admin/AccessManagement" },
    { label: "Notifications",     icon: HiOutlineBell,            path: "/Admin/Notifications" },
    { label: "Client Directory",   icon: HiOutlineUsers,          path: "/Admin/ClientDetails" },
    { label: "My Profile",         icon: HiOutlineUserCircle,      path: "/Admin/Profile" },
    { label: "System Settings",    icon: HiOutlineCog6Tooth,       path: "/Admin/Settings" },
  ];

  const staffMenu = [
    { label: "Dashboard",         icon: HiOutlineChartBarSquare, path: "/Staff" },
    { label: "Client Directory",  icon: HiOutlineUsers,          path: "/Staff/ClientDetails" },
    { label: "File Repository",   icon: HiOutlineFolderOpen,      path: "/Staff/FileManagement" },
    { label: "Appointments",      icon: HiOutlineCalendarDays,    path: "/Staff/Appointments" },
    { label: "Notifications",     icon: HiOutlineBell,            path: "/Staff/Notifications" },
    { label: "My Profile",        icon: HiOutlineUserCircle,      path: "/Staff/Profile" },
  ];

  const isClientDeactivated = role === "CLIENT" && localStorage.getItem("skc-deactivated") === "true";

  const isMemberActive = membershipStatus?.isActive && membershipStatus?.membershipStatus === "MEMBER";
  const plan = (membershipStatus?.membershipPlan || "").toUpperCase();
  const isExpired = membershipStatus?.membershipExpiry
    ? new Date(membershipStatus.membershipExpiry) < new Date()
    : false;

  // When membership is deactivated globally (Initial Launch Mode), client portal has unrestricted free access and no membership items
  let clientMenu;
  if (isClientDeactivated) {
    clientMenu = [{ label: "Account Status", icon: HiOutlineShieldCheck, path: "/Client" }];
  } else if (!membershipEnabled) {
    clientMenu = [
      { label: "Dashboard", icon: HiOutlineChartBarSquare, path: "/Client" },
      { label: "My Documents", icon: HiOutlineFolderOpen, path: "/Client/Files" },
      { label: "Invoices & Receipts", icon: HiOutlineReceiptPercent, path: "/Client/Billing" },
      { label: "Appointments", icon: HiOutlineCalendarDays, path: "/Client/Appointments" },
      { label: "Notifications", icon: HiOutlineBell, path: "/Client/Notifications" },
      { label: "My Profile", icon: HiOutlineUserCircle, path: "/Client/Profile" },
    ];
  } else if (!isMemberActive || isExpired) {
    clientMenu = [
      { label: "Dashboard", icon: HiOutlineChartBarSquare, path: "/Client" },
      {
        label: isExpired ? "Renew Membership" : "Choose Membership",
        icon: HiOutlineSparkles,
        path: "/Client/Membership-Request",
        highlight: true,
      },
      { label: "Membership Plans", icon: HiOutlineIdentification, path: "/Client/Membership" },
      { label: "My Documents", icon: HiOutlineFolderOpen, path: "/Client/Files" },
      { label: "Invoices & Receipts", icon: HiOutlineReceiptPercent, path: "/Client/Billing" },
      { label: "Appointments", icon: HiOutlineCalendarDays, path: "/Client/Appointments" },
      { label: "Notifications", icon: HiOutlineBell, path: "/Client/Notifications" },
      { label: "My Profile", icon: HiOutlineUserCircle, path: "/Client/Profile" },
    ];
  } else {
    clientMenu = [
      { label: "Dashboard", icon: HiOutlineChartBarSquare, path: "/Client" },
      { label: "My Documents", icon: HiOutlineFolderOpen, path: "/Client/Files" },
      { label: "Invoices & Receipts", icon: HiOutlineReceiptPercent, path: "/Client/Billing" },
      {
        label: plan === "PLATINUM" || plan === "GOLD" ? "VIP Appointments" : "Appointments",
        icon: HiOutlineCalendarDays,
        path: "/Client/Appointments",
      },
      {
        label: `${plan ? plan.charAt(0) + plan.slice(1).toLowerCase() : "VIP"} Member Perks`,
        icon: HiOutlineSparkles,
        path: "/Client/Membership",
      },
      { label: "Notifications", icon: HiOutlineBell, path: "/Client/Notifications" },
      { label: "My Profile", icon: HiOutlineUserCircle, path: "/Client/Profile" },
    ];
  }

  if (role === "ADMIN") return adminMenu;
  if (role === "STAFF") return staffMenu;
  return clientMenu;
};

export default function Sidebar({ isOpen, setIsOpen }) {
  const { setIsThemeModalOpen } = useUniversalTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingMemberships, setPendingMemberships] = useState(0);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = setIsOpen !== undefined ? setIsOpen : setInternalOpen;

  const role = localStorage.getItem("skc-role") || "CLIENT";
  const menuItems = getMenuItems(role, membershipStatus, membershipEnabled);

  // Fetch unread notification count, membership pending count, client membership status & global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await api.get("/Public/Membership/GlobalSettings");
        setMembershipEnabled(Boolean(res.data?.membershipEnabled));
      } catch {
        // silent
      }
    };

    const fetchUnread = async () => {
      try {
        const path =
          role === "ADMIN"  ? "/Admin/Notifications/UnreadCount"  :
          role === "STAFF"  ? "/Staff/Notifications/UnreadCount"  :
                              "/Client/Notifications/UnreadCount";
        const res = await api.get(path);
        setUnreadCount(res.data.count || 0);
      } catch {
        // silent
      }
    };

    const fetchPendingMembership = async () => {
      if (role === "ADMIN") {
        try {
          const res = await api.get("/Admin/Membership/PendingCount");
          setPendingMemberships(res.data.count || 0);
        } catch {
          // silent
        }
      }
    };

    const fetchClientMembership = async () => {
      if (role === "CLIENT") {
        try {
          const res = await api.get("/Client/Membership/Status");
          setMembershipStatus(res.data);
        } catch {
          // silent
        }
      }
    };

    fetchGlobalSettings();
    fetchUnread();
    fetchPendingMembership();
    fetchClientMembership();
    const interval = setInterval(() => {
      fetchGlobalSettings();
      fetchUnread();
      fetchPendingMembership();
      fetchClientMembership();
    }, 30000);
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

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Modern Sidebar Container */}
      <aside className={`sidebar-container ${open ? "open" : ""}`} id="portal-sidebar">
        {/* Toggle / Header */}
        <div className="sidebar-header">
          <div
            className={`sidebar-burger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
            title={open ? "Collapse Navigation" : "Expand Navigation"}
          >
            <span />
            <span />
            <span />
          </div>

          <div className="sidebar-brand-pill">
            <span className="brand-badge-name">Navigation</span>
            <span className="brand-badge-role">{role}</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isNotif = item.label === "Notifications";
              const isExact = item.path === "/Admin" || item.path === "/Staff" || item.path === "/Client";

              return (
                <li key={index} className="sidebar-menu-row">
                  <NavLink
                    to={item.path}
                    end={isExact}
                    onClick={() => {
                      if (window.innerWidth <= 768) setOpen(false);
                    }}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                    }
                    title={!open ? item.label : ""}
                  >
                    <span className="sidebar-icon-wrap">
                      <Icon size={20} />
                      {isNotif && unreadCount > 0 && !open && (
                        <span className="sidebar-icon-dot" />
                      )}
                      {item.label === "Membership Tier" && pendingMemberships > 0 && !open && (
                        <span className="sidebar-icon-dot" style={{ background: "#ef4444" }} />
                      )}
                    </span>
                    <span className="sidebar-label-text">{item.label}</span>
                    {item.locked && open && (
                      <span style={{ marginLeft: "auto", fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "2px" }} title="Membership Plan Required">
                        <HiOutlineLockClosed size={13} color="#f59e0b" />
                      </span>
                    )}
                    {item.highlight && open && (
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "800", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", padding: "2px 7px", borderRadius: "999px", letterSpacing: "0.4px" }}>
                        STAR
                      </span>
                    )}
                    {isNotif && unreadCount > 0 && open && (
                      <span className="sidebar-notif-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {item.label === "Membership Tier" && pendingMemberships > 0 && open && (
                      <span className="sidebar-notif-badge" style={{ background: "#ef4444", color: "#fff" }}>
                        {pendingMemberships > 99 ? "99+" : pendingMemberships}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          {role === "ADMIN" && (
            <button
              className="sidebar-theme-btn"
              onClick={() => setIsThemeModalOpen(true)}
              title={!open ? "Theme & Colors (Admin)" : ""}
              style={{ marginBottom: "6px" }}
            >
              <span className="sidebar-icon-wrap">
                <HiOutlineSwatch size={20} style={{ color: "var(--gold, #f59e0b)" }} />
              </span>
              <span className="sidebar-label-text" style={{ color: "var(--gold, #f59e0b)", fontWeight: "600" }}>
                Theme &amp; Colors
              </span>
            </button>
          )}

          <button
            className="sidebar-signout-btn"
            onClick={handleSignOut}
            title={!open ? "Sign Out" : ""}
          >
            <span className="sidebar-icon-wrap">
              <HiOutlineArrowRightOnRectangle size={20} />
            </span>
            <span className="sidebar-label-text">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}