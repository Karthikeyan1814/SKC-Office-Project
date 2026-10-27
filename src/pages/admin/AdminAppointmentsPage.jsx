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
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLink,
  HiOutlineBellAlert,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
} from "react-icons/hi2";
import { formatDate, formatTime, formatFullDateTime, formatDateTimeAgo } from "../../utils/dateFormat";
import NotifyUsersModal from "../../components/NotifyUsersModal";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | ONLINE | IN_PERSON | PHONE

  // Schedule / Confirm Modal
  const [scheduleModal, setScheduleModal] = useState({
    open: false,
    appointment: null,
    meetingLink: "",
    adminNote: "",
  });

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState({
    open: false,
    appointment: null,
    reason: "",
  });

  // Broadcast Notification Modal (Clients, Staff, Admins)
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/Appointments");
      setAppointments(res.data || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Summary counts
  const counts = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => (a.status || "").toUpperCase() === "PENDING").length;
    const confirmed = appointments.filter(
      (a) => (a.status || "").toUpperCase() === "CONFIRMED" || (a.status || "").toUpperCase() === "SCHEDULED"
    ).length;
    const completed = appointments.filter((a) => (a.status || "").toUpperCase() === "COMPLETED").length;
    const cancelled = appointments.filter((a) => (a.status || "").toUpperCase() === "CANCELLED").length;
    const unregistered = appointments.filter((a) => !a.clientId || a.clientId === null).length;
    return { total, pending, confirmed, completed, cancelled, unregistered };
  }, [appointments]);

  // Filtered List
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Category / Status filter
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

      // Type filter
      if (typeFilter !== "ALL") {
        if ((a.appointmentType || "").toUpperCase() !== typeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (a.clientName || "").toLowerCase();
        const email = (a.clientEmail || "").toLowerCase();
        const mobile = (a.clientMobile || "").toLowerCase();
        const note = (a.clientNote || "").toLowerCase();
        const adminNote = (a.adminNote || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !mobile.includes(q) && !note.includes(q) && !adminNote.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, typeFilter, searchQuery]);

  // Open Schedule / Confirm Modal
  const openScheduleModal = (appt) => {
    setScheduleModal({
      open: true,
      appointment: appt,
      meetingLink: appt.meetingLink || "",
      adminNote: appt.adminNote || "",
    });
  };

  // Submit Confirmation & Meeting Link
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleModal.appointment) return;
    setSubmitting(true);
    try {
      await api.post(`/Admin/Appointment/${scheduleModal.appointment.id}/Confirm`, {
        meetingLink: scheduleModal.meetingLink.trim(),
        adminNote: scheduleModal.adminNote.trim(),
      });
      toast.success("✅ Appointment confirmed & client notified with access details!");
      setScheduleModal({ open: false, appointment: null, meetingLink: "", adminNote: "" });
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to confirm appointment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Completed
  const handleMarkCompleted = async (appt) => {
    try {
      await api.post(`/Admin/Appointment/Status/${appt.id}?status=COMPLETED`);
      toast.success("✓ Consultation marked as completed");
      fetchAppointments();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Open Cancel Modal
  const openCancelModal = (appt) => {
    setCancelModal({
      open: true,
      appointment: appt,
      reason: "",
    });
  };

  // Submit Cancellation
  const handleSubmitCancel = async (e) => {
    e.preventDefault();
    if (!cancelModal.appointment) return;
    setSubmitting(true);
    try {
      await api.post(`/Admin/Appointment/${cancelModal.appointment.id}/Cancel`, {
        adminNote: cancelModal.reason.trim() || "Administrative schedule conflict",
      });
      toast.success("Appointment cancelled & client notified");
      setCancelModal({ open: false, appointment: null, reason: "" });
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to cancel appointment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = async (appt) => {
    const clientName = appt.clientName || "this user";
    if (!window.confirm(`Permanently delete the consultation record for ${clientName}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/Admin/Appointment/${appt.id}`);
      toast.success("Appointment deleted permanently");
      setAppointments((prev) => prev.filter((item) => item.id !== appt.id));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete appointment";
      toast.error(msg);
    }
  };

  // Type Badge Renderer
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

  // Status Pill Renderer
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
        <HiOutlineXCircle size={13} /> Cancelled
      </span>
    );
  };

  return (
    <div className="admin-appt-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="admin-appt-header">
        <div className="admin-appt-title-group">
          <h2 className="admin-appt-heading">
            <span className="title-icon-box">
              <HiOutlineCalendarDays size={22} />
            </span>
            Consultation & Appointment Scheduling
          </h2>
          <p className="admin-appt-sub">
            Review client consultation requests, assign video conference links (Google Meet / Zoom), track session statuses, and dispatch confirmations.
          </p>
        </div>

        <div className="admin-appt-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setIsNotifyOpen(true)}
            className="appt-btn"
            style={{
              padding: "7px 14px",
              background: "linear-gradient(135deg, #4f46e5, #4338ca)",
              border: "1px solid #4338ca",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
            }}
          >
            <HiOutlineBellAlert size={15} />
            Notify Users
          </button>

          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="appt-btn"
            style={{
              padding: "7px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "12px",
            }}
          >
            <HiOutlineArrowPath size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Metric Cards ─────────────────────────────────── */}
      <div className="admin-appt-metrics">
        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon purple">
            <HiOutlineCalendarDays size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val">{counts.total}</h3>
            <p className="admin-appt-metric-label">Total Requests</p>
          </div>
        </div>

        <div className="admin-appt-metric-card" style={{ borderColor: counts.pending > 0 ? "#fed7aa" : "#e2e8f0" }}>
          <div className="admin-appt-metric-icon amber">
            <HiOutlineClock size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: counts.pending > 0 ? "#b45309" : "#0f172a" }}>
              {counts.pending}
            </h3>
            <p className="admin-appt-metric-label">Pending Review</p>
          </div>
        </div>

        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon emerald">
            <HiOutlineCheckCircle size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: "#047857" }}>
              {counts.confirmed}
            </h3>
            <p className="admin-appt-metric-label">Confirmed & Scheduled</p>
          </div>
        </div>

        <div className="admin-appt-metric-card">
          <div className="admin-appt-metric-icon indigo">
            <HiOutlineCheckBadge size={20} />
          </div>
          <div>
            <h3 className="admin-appt-metric-val" style={{ color: "#4338ca" }}>
              {counts.completed}
            </h3>
            <p className="admin-appt-metric-label">Completed Sessions</p>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────── */}
      <div className="admin-appt-toolbar">
        <div className="admin-appt-search-box">
          <HiOutlineMagnifyingGlass size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by client name, mobile, email, or topic..."
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
            onClick={() => setStatusFilter("PENDING")}
            className={`admin-appt-tab-btn ${statusFilter === "PENDING" ? "active pending" : ""}`}
          >
            ⏳ Pending <span className="admin-appt-tab-count">{counts.pending}</span>
          </button>

          <button
            onClick={() => setStatusFilter("UNREGISTERED")}
            className={`admin-appt-tab-btn ${statusFilter === "UNREGISTERED" ? "active" : ""}`}
            style={{
              background: statusFilter === "UNREGISTERED" ? "#4f46e5" : undefined,
              color: statusFilter === "UNREGISTERED" ? "#ffffff" : undefined,
            }}
          >
            🌐 Website Guests <span className="admin-appt-tab-count">{counts.unregistered}</span>
          </button>

          <button
            onClick={() => setStatusFilter("CONFIRMED")}
            className={`admin-appt-tab-btn ${statusFilter === "CONFIRMED" ? "active confirmed" : ""}`}
          >
            📅 Confirmed <span className="admin-appt-tab-count">{counts.confirmed}</span>
          </button>

          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`admin-appt-tab-btn ${statusFilter === "COMPLETED" ? "active completed" : ""}`}
          >
            ✓ Completed <span className="admin-appt-tab-count">{counts.completed}</span>
          </button>

          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={`admin-appt-tab-btn ${statusFilter === "CANCELLED" ? "active" : ""}`}
          >
            ✕ Cancelled <span className="admin-appt-tab-count">{counts.cancelled}</span>
          </button>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              fontWeight: "600",
              color: "#475569",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Formats</option>
            <option value="ONLINE">Online Meet</option>
            <option value="IN_PERSON">In-Person Office</option>
            <option value="PHONE">Phone</option>
          </select>
        </div>
      </div>

      {/* ── Enterprise Data Table ─────────────────────────────── */}
      <div className="admin-appt-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
            <HiOutlineArrowPath size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13px" }}>Loading consultation requests...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <HiOutlineCalendarDays size={28} />
            </div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800", color: "#334155" }}>
              No consultation requests found
            </h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "Try clearing filters to see more results."
                : "Clients haven't booked any consultation slots yet."}
            </p>
          </div>
        ) : (
          <div className="appt-table-container" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table className="admin-appt-table">
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Contact Channel</th>
                  <th>Format</th>
                  <th>Requested Timeline</th>
                  <th>Status</th>
                  <th>Meeting Access & Notes</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const s = (a.status || "").toUpperCase();
                  const isPending = s === "PENDING";
                  const isConfirmed = s === "CONFIRMED" || s === "SCHEDULED";

                  return (
                    <tr key={a.id}>
                      {/* Client Info */}
                      <td>
                        <div className="appt-client-cell">
                          <div className="appt-client-avatar">
                            {(a.clientName || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="appt-client-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {a.clientName || "Unnamed Client"}
                              {!a.clientId && (
                                <span style={{ background: "#e0e7ff", color: "#4338ca", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                                  🌐 Guest
                                </span>
                              )}
                            </div>
                            <div className="appt-client-id">{!a.clientId ? "Unregistered Website Booking" : `Client #${a.clientId}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Line */}
                      <td>
                        {a.clientEmail && (
                          <div className="appt-contact-line">
                            <span>✉️</span> {a.clientEmail}
                          </div>
                        )}
                        {a.clientMobile && (
                          <div className="appt-contact-line" style={{ color: "#64748b" }}>
                            <span>📞</span> {a.clientMobile}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td>{renderTypeBadge(a.appointmentType)}</td>

                      {/* Requested Timeline & Booked Timing */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                          <HiOutlineCalendarDays size={14} color="#4f46e5" />
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

                      {/* Status */}
                      <td>{renderStatusPill(a.status)}</td>

                      {/* Meeting Access / Notes */}
                      <td style={{ maxWidth: "260px" }}>
                        {a.meetingLink ? (
                          <div style={{ marginBottom: "4px" }}>
                            <a
                              href={a.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="appt-btn appt-btn-link"
                            >
                              <HiOutlineVideoCamera size={13} /> Join Meeting
                            </a>
                          </div>
                        ) : null}

                        {a.clientNote && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#475569",
                              background: "#f8fafc",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #f1f5f9",
                              display: "inline-block",
                            }}
                            title={a.clientNote}
                          >
                            💬 {a.clientNote.length > 50 ? `${a.clientNote.slice(0, 50)}...` : a.clientNote}
                          </div>
                        )}

                        {a.adminNote && (
                          <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "3px" }}>
                            📌 <strong>Office Note:</strong> {a.adminNote}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {isPending && (
                            <>
                              <button
                                onClick={() => openScheduleModal(a)}
                                className="appt-btn appt-btn-schedule"
                                title="Confirm slot and attach meeting link"
                              >
                                <HiOutlineCheckCircle size={13} /> Confirm & Link
                              </button>

                              <button
                                onClick={() => openCancelModal(a)}
                                className="appt-btn appt-btn-cancel"
                                title="Decline request"
                              >
                                <HiOutlineXCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <>
                              <button
                                onClick={() => openScheduleModal(a)}
                                className="appt-btn"
                                style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#334155" }}
                                title="Update meeting link or notes"
                              >
                                <HiOutlineLink size={13} /> Edit Link
                              </button>

                              <button
                                onClick={() => handleMarkCompleted(a)}
                                className="appt-btn appt-btn-complete"
                                title="Mark consultation session completed"
                              >
                                <HiOutlineCheckBadge size={13} /> Complete
                              </button>

                              <button
                                onClick={() => openCancelModal(a)}
                                className="appt-btn appt-btn-cancel"
                                title="Cancel consultation"
                              >
                                <HiOutlineXCircle size={13} /> Cancel
                              </button>
                            </>
                          )}

                          {(s === "COMPLETED" || s === "CANCELLED") && (
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                              Archived
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteAppointment(a)}
                            className="appt-btn"
                            title="Delete consultation record"
                            style={{
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#ef4444",
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
      </div>

      {/* ── MODAL: CONFIRM & ASSIGN MEETING LINK ───────────────── */}
      {scheduleModal.open && scheduleModal.appointment && (
        <div className="appt-modal-overlay">
          <div className="appt-modal-card">
            <div className="appt-modal-header">
              <h3 className="appt-modal-title">
                <span style={{ color: "#7c3aed" }}><HiOutlineVideoCamera size={20} /></span>
                Confirm Consultation & Set Meeting Link
              </h3>
              <button
                onClick={() => setScheduleModal({ open: false, appointment: null, meetingLink: "", adminNote: "" })}
                className="appt-modal-close"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.45 }}>
              Confirm consultation with <strong style={{ color: "#0f172a" }}>{scheduleModal.appointment.clientName}</strong>.
              Provide a direct video link or room reference. An automated notification with this link will be dispatched to the client.
            </p>

            <form onSubmit={handleSubmitSchedule}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>
                  Video Conference Link (Google Meet / Zoom / Teams)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={scheduleModal.meetingLink}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, meetingLink: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />

                {/* Presets */}
                <div className="appt-modal-presets">
                  <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => setScheduleModal({ ...scheduleModal, meetingLink: "https://meet.google.com/new" })}
                    className="appt-preset-chip"
                  >
                    + Google Meet
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleModal({ ...scheduleModal, meetingLink: "https://zoom.us/join" })}
                    className="appt-preset-chip"
                  >
                    + Zoom Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleModal({ ...scheduleModal, meetingLink: "In-Person Desk #1 (SKC Executive Cabin)" })}
                    className="appt-preset-chip"
                  >
                    + In-Office Desk 1
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>
                  Admin Notes / Instructions for Client (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please keep GSTR-3B copies and books of accounts ready for screen review."
                  value={scheduleModal.adminNote}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, adminNote: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setScheduleModal({ open: false, appointment: null, meetingLink: "", adminNote: "" })}
                  className="appt-btn"
                  style={{ background: "#f1f5f9", color: "#475569", padding: "8px 16px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="appt-btn appt-btn-schedule"
                  style={{ padding: "8px 20px" }}
                >
                  {submitting ? "Saving & Notifying..." : "Confirm & Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT / CANCEL APPOINTMENT ──────────────────── */}
      {cancelModal.open && cancelModal.appointment && (
        <div className="appt-modal-overlay">
          <div className="appt-modal-card" style={{ maxWidth: "440px" }}>
            <div className="appt-modal-header">
              <h3 className="appt-modal-title" style={{ color: "#dc2626" }}>
                <HiOutlineXCircle size={20} />
                Decline Consultation Request
              </h3>
              <button
                onClick={() => setCancelModal({ open: false, appointment: null, reason: "" })}
                className="appt-modal-close"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.45 }}>
              Are you sure you want to cancel or reject consultation for{" "}
              <strong style={{ color: "#0f172a" }}>{cancelModal.appointment.clientName}</strong>?
              A cancellation notification will be sent to the client.
            </p>

            <form onSubmit={handleSubmitCancel}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Official holiday, partner unavailable, please choose another slot."
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setCancelModal({ open: false, appointment: null, reason: "" })}
                  className="appt-btn"
                  style={{ background: "#f1f5f9", color: "#475569", padding: "8px 16px" }}
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="appt-btn appt-btn-cancel"
                  style={{ padding: "8px 20px" }}
                >
                  {submitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: BROADCAST ANNOUNCEMENT / NOTIFY USERS ──────────── */}
      <NotifyUsersModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
      />
    </div>
  );
}
