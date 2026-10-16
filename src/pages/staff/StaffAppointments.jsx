import { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/AdminAppointments.css";
import {
  HiOutlineCalendarDays,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineTrash,
} from "react-icons/hi2";
import { formatDate, formatTime, formatFullDateTime, formatDateTimeAgo } from "../../utils/dateFormat";

export default function StaffAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Staff/Appointments");
      setAppointments(res.data || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appt) => {
    const clientName = appt.clientName || "this appointment";
    if (!window.confirm(`Delete the consultation record for ${clientName}?`)) {
      return;
    }
    try {
      await api.delete(`/Staff/Appointment/${appt.id}`);
      toast.success("Appointment deleted successfully");
      setAppointments((prev) => prev.filter((item) => item.id !== appt.id));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete appointment";
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const counts = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => (a.status || "").toUpperCase() === "PENDING").length;
    const confirmed = appointments.filter(
      (a) => (a.status || "").toUpperCase() === "CONFIRMED" || (a.status || "").toUpperCase() === "SCHEDULED"
    ).length;
    const completed = appointments.filter((a) => (a.status || "").toUpperCase() === "COMPLETED").length;
    const unregistered = appointments.filter((a) => !a.clientId || a.clientId === null).length;
    return { total, pending, confirmed, completed, unregistered };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter === "UNREGISTERED") {
        if (a.clientId !== null && a.clientId !== undefined) return false;
      } else if (statusFilter !== "ALL") {
        const s = (a.status || "").toUpperCase();
        if (statusFilter === "CONFIRMED") {
          if (s !== "CONFIRMED" && s !== "SCHEDULED") return false;
        } else if (s !== statusFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (a.clientName || "").toLowerCase();
        const email = (a.clientEmail || "").toLowerCase();
        const mobile = (a.clientMobile || "").toLowerCase();
        const note = (a.clientNote || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !mobile.includes(q) && !note.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  const renderTypeBadge = (type) => {
    const t = (type || "").toUpperCase();
    if (t.includes("ONLINE") || t.includes("VIDEO")) {
      return (
        <span className="appt-type-badge online">
          <HiOutlineVideoCamera size={13} /> Online Meet
        </span>
      );
    }
    if (t.includes("IN_PERSON") || t.includes("OFFICE")) {
      return (
        <span className="appt-type-badge in-person">
          <HiOutlineBuildingOffice2 size={13} /> Office Desk
        </span>
      );
    }
    return (
      <span className="appt-type-badge phone">
        <HiOutlinePhone size={13} /> Phone
      </span>
    );
  };

  const renderStatusPill = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "CONFIRMED" || s === "SCHEDULED") {
      return (
        <span className="appt-status-pill confirmed">
          <HiOutlineCheckCircle size={13} /> Confirmed
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="appt-status-pill pending">
          <HiOutlineClock size={13} /> Pending Review
        </span>
      );
    }
    if (s === "COMPLETED") {
      return (
        <span className="appt-status-pill completed">
          <HiOutlineCheckBadge size={13} /> Completed
        </span>
      );
    }
    return (
      <span className="appt-status-pill cancelled">
        {status}
      </span>
    );
  };

  return (
    <div className="admin-appt-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="admin-appt-header">
        <div className="admin-appt-title-group">
          <h2 className="admin-appt-heading">
            <span className="title-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
              <HiOutlineCalendarDays size={22} />
            </span>
            Staff Appointments & Consultation Schedule
          </h2>
          <p className="admin-appt-sub">
            Review client consultation bookings, join scheduled video conferences, and monitor meeting details.
          </p>
        </div>

        <div className="admin-appt-actions">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="appt-btn"
            style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#334155" }}
          >
            <HiOutlineArrowPath size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Metric Cards ─────────────────────────────────── */}
      <div className="admin-appt-metrics">
        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon emerald">
            <HiOutlineCalendarDays size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val">{counts.total}</h3>
            <p className="admin-appt-metric-label">Total Assigned</p>
          </div>
        </div>

        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon amber">
            <HiOutlineClock size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: "#b45309" }}>{counts.pending}</h3>
            <p className="admin-appt-metric-label">Pending Approval</p>
          </div>
        </div>

        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon emerald">
            <HiOutlineCheckCircle size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: "#047857" }}>{counts.confirmed}</h3>
            <p className="admin-appt-metric-label">Upcoming / Confirmed</p>
          </div>
        </div>

        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon indigo">
            <HiOutlineCheckBadge size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: "#4338ca" }}>{counts.completed}</h3>
            <p className="admin-appt-metric-label">Completed Sessions</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="admin-appt-toolbar">
        <div className="admin-appt-search-box">
          <HiOutlineMagnifyingGlass size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by client name, mobile, email, or query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-appt-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
            >
              <HiOutlineXMark size={14} />
            </button>
          )}
        </div>

        <div className="admin-appt-filter-tabs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`admin-appt-tab-btn ${statusFilter === "ALL" ? "active" : ""}`}
          >
            All <span className="admin-appt-tab-count">{counts.total}</span>
          </button>

          <button
            onClick={() => setStatusFilter("CONFIRMED")}
            className={`admin-appt-tab-btn ${statusFilter === "CONFIRMED" ? "active confirmed" : ""}`}
          >
            📅 Confirmed <span className="admin-appt-tab-count">{counts.confirmed}</span>
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`admin-appt-tab-btn ${statusFilter === "PENDING" ? "active pending" : ""}`}
          >
            ⏳ Pending <span className="admin-appt-tab-count">{counts.pending}</span>
          </button>

          <button
            onClick={() => setStatusFilter("UNREGISTERED")}
            className={`admin-appt-tab-btn ${statusFilter === "UNREGISTERED" ? "active" : ""}`}
            style={{
              background: statusFilter === "UNREGISTERED" ? "#059669" : undefined,
              color: statusFilter === "UNREGISTERED" ? "#ffffff" : undefined,
            }}
          >
            🌐 Website Guests <span className="admin-appt-tab-count">{counts.unregistered}</span>
          </button>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────────────── */}
      <div className="admin-appt-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <HiOutlineArrowPath size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13px" }}>Loading schedule...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <HiOutlineCalendarDays size={28} color="#94a3b8" style={{ margin: "0 auto 10px auto" }} />
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>No consultations found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-appt-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Format</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Meeting Access & Notes</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="appt-client-cell">
                        <div className="appt-client-avatar" style={{ background: "#ecfdf5", color: "#059669" }}>
                          {(a.clientName || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="appt-client-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {a.clientName}
                            {!a.clientId && (
                              <span style={{ background: "#e0e7ff", color: "#4338ca", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                                🌐 Guest
                              </span>
                            )}
                          </div>
                          <div className="appt-client-id">{!a.clientId ? "Website Guest Booking" : `Client #${a.clientId}`}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="appt-contact-line">✉️ {a.clientEmail}</div>
                      <div className="appt-contact-line" style={{ color: "#64748b" }}>📞 {a.clientMobile}</div>
                    </td>

                    <td>{renderTypeBadge(a.appointmentType)}</td>

                    {/* Requested Timeline & Booked Timing */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                        <HiOutlineCalendarDays size={14} color="#059669" />
                        {formatDate(a.requestedDateTime, "Pending Schedule")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <HiOutlineClock size={13} color="#64748b" />
                        {formatTime(a.requestedDateTime, "Timeline TBD")}
                      </div>
                      {a.createdAt && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", borderTop: "1px dashed #e2e8f0", paddingTop: "3px" }}>
                          Booked: {formatFullDateTime(a.createdAt)} ({formatDateTimeAgo(a.createdAt)})
                        </div>
                      )}
                    </td>

                    <td>{renderStatusPill(a.status)}</td>

                    <td>
                      {a.meetingLink ? (
                        <a href={a.meetingLink} target="_blank" rel="noreferrer" className="appt-btn appt-btn-link">
                          <HiOutlineVideoCamera size={13} /> Join Link
                        </a>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{a.clientNote || "No link assigned"}</span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDeleteAppointment(a)}
                        className="appt-btn"
                        title="Delete consultation record"
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: "700",
                          fontSize: "12px",
                        }}
                      >
                        <HiOutlineTrash size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
