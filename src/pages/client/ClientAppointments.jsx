import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/ClientPortal.css";
import {
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineLockClosed,
  HiOutlineClock,
} from "react-icons/hi2";
import { formatDate, formatTime, formatFullDateTime, formatDateTimeAgo } from "../../utils/dateFormat";

export default function ClientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL | SCHEDULED | PENDING | COMPLETED

  // Booking Form Modal
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({
    appointmentType: "ONLINE",
    requestedDateTime: "",
    clientNote: "",
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Client/Appointments");
      setAppointments(res.data || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    try {
      const res = await api.get("/Client/Membership/Status");
      setMembershipData(res.data);
      setIsMember(Boolean(res.data?.isActive && res.data?.membershipStatus === "MEMBER"));
    } catch {}
  };

  useEffect(() => {
    fetchAppointments();
    checkMembership();
  }, []);

  const planType = (membershipData?.membershipPlan || "").toUpperCase();

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.requestedDateTime) {
      toast.error("Please pick a preferred consultation date and time");
      return;
    }

    setBooking(true);
    try {
      let dt = form.requestedDateTime;
      if (dt && dt.length === 16) {
        dt = `${dt}:00`;
      }
      const payload = {
        appointmentType: form.appointmentType,
        requestedDateTime: dt,
        clientNote: form.clientNote,
      };
      await api.post("/Client/Appointment/Book", payload);
      toast.success("🎯 Consultation request submitted! Our office will confirm your slot.");
      setShowModal(false);
      setForm({ appointmentType: "ONLINE", requestedDateTime: "", clientNote: "" });
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to request appointment";
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this consultation appointment record?")) {
      return;
    }
    try {
      await api.delete(`/Client/Appointment/${id}`);
      toast.success("Appointment deleted successfully");
      setAppointments((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete appointment";
      toast.error(msg);
    }
  };
  
  const filteredList = useMemo(() => {
    return appointments.filter((a) => {
      if (filter === "SCHEDULED") return a.status === "SCHEDULED" || a.status === "CONFIRMED";
      if (filter === "PENDING") return a.status === "PENDING";
      if (filter === "COMPLETED") return a.status === "COMPLETED";
      return true;
    });
  }, [appointments, filter]);

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "CONFIRMED" || s === "SCHEDULED") {
      return (
        <span className="status-pill scheduled">
          <HiOutlineCheckCircle size={14} /> Scheduled
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="status-pill pending">
          ⏳ Pending Review
        </span>
      );
    }
    return (
      <span className="status-pill completed">
        ✓ {status}
      </span>
    );
  };

  return (
    <div className="client-page-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="client-appt-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
              <HiOutlineCalendarDays size={30} color="var(--primary, #7c3aed)" /> Appointments & Consultations
            </h2>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Schedule direct audit advisory sessions, GST filing clarifications, and video conferences.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={fetchAppointments}
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

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "11px 22px",
              background: "linear-gradient(135deg, var(--primary, #7c3aed) 0%, var(--primary-hover, #6d28d9) 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: "800",
              fontSize: "13px",
              boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
            }}
          >
            <HiOutlinePlus size={18} /> Book Consultation
          </button>
        </div>
      </div>

      {/* ── CONSULTATION STATUS & VIP PRIVILEGES BANNER ──────── */}
      {isMember ? (
        <div style={{
          background: planType === "PLATINUM" ? "linear-gradient(135deg, #2e1065, #4c1d95)" : "linear-gradient(135deg, #451a03, #78350f)",
          borderRadius: "14px",
          padding: "14px 20px",
          color: "#ffffff",
          marginBottom: "20px",
          border: `1.5px solid ${planType === "PLATINUM" ? "#a855f7" : "#f59e0b"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>
              {planType === "PLATINUM" ? "💎" : "🌟"}
            </span>
            <div>
              <strong style={{ fontSize: "14px", display: "block" }}>
                {planType === "PLATINUM" ? "Platinum Elite: Dedicated Senior CA & Unlimited Priority Scheduling Active" : "Gold VIP: Priority Scheduling & Expedited Consultation Response"}
              </strong>
              <span style={{ fontSize: "12px", opacity: 0.85 }}>
                {planType === "PLATINUM" ? "Dedicated Senior Chartered Accountant handling all your direct consultations." : "Priority review of all consultation requests with expedited slot allocation."}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "14px",
          padding: "14px 20px",
          color: "#ffffff",
          marginBottom: "20px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📅</span>
            <div>
              <strong style={{ fontSize: "14px", display: "block" }}>
                Direct CA Consultation Booking Desk (100% Free Access)
              </strong>
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                All registered clients have free access to schedule online, in-person, or telephonic consultations with our CA advisory team.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Chips ──────────────────────────────────────── */}
      <div className="client-notif-filters">
        {[
          { key: "ALL", label: `All Consultations (${appointments.length})` },
          { key: "SCHEDULED", label: "Confirmed / Scheduled 📅" },
          { key: "PENDING", label: "Pending Review ⏳" },
          { key: "COMPLETED", label: "Completed ✓" },
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

      {/* ── Table Container ───────────────────────────────────── */}
      <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading appointments...</p>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "var(--lite, #f5f3ff)",
                color: "var(--primary, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <HiOutlineCalendarDays size={32} />
            </div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#1e293b" }}>
              No appointments found
            </h4>
            <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
              You don't have any consultation bookings matching this filter.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "8px 18px",
                background: "var(--primary, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              + Book New Consultation
            </button>
          </div>
        ) : (
          <div className="client-appt-table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table className="client-appt-table">
              <thead>
                <tr>
                  <th>Session Mode</th>
                  <th>Requested Timeline</th>
                  <th>Status</th>
                  <th>Audit Notes / Meeting Access</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                        {a.appointmentType === "ONLINE" ? (
                          <HiOutlineVideoCamera size={18} color="#2563eb" />
                        ) : a.appointmentType === "IN_PERSON" ? (
                          <HiOutlineBuildingOffice2 size={18} color="var(--primary, #7c3aed)" />
                        ) : (
                          <HiOutlinePhone size={18} color="#059669" />
                        )}
                        <span>{a.appointmentType === "ONLINE" ? "Online Video Meet" : a.appointmentType === "IN_PERSON" ? "In-Office Audit Desk" : "Phone Advisory"}</span>
                      </div>
                    </td>

                    <td style={{ color: "#334155", fontWeight: "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                        <HiOutlineCalendarDays size={14} color="var(--primary, #7c3aed)" />
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

                    <td>{getStatusBadge(a.status)}</td>

                    <td>
                      {a.meetingLink ? (
                        <a
                          href={a.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "700",
                            fontSize: "12px",
                          }}
                        >
                          <HiOutlineVideoCamera size={15} /> Join Video Conference
                        </a>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "13px" }}>
                          {a.clientNote || "Session awaiting executive confirmation"}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDeleteAppointment(a.id)}
                        title="Delete consultation record"
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#ef4444",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontWeight: "700",
                          fontSize: "12px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                      >
                        <HiOutlineTrash size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Booking Modal ─────────────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#090d16",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              borderRadius: "22px",
              padding: "32px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
                Book Consultation Slot
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Session Format *
                </label>
                <select
                  value={form.appointmentType}
                  onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="ONLINE" style={{ background: "#151d2f", color: "#ffffff" }}>Online Meeting (Google Meet / Screen Share)</option>
                  <option value="IN_PERSON" style={{ background: "#151d2f", color: "#ffffff" }}>In-Person at SKC Corporate Office</option>
                  <option value="PHONE" style={{ background: "#151d2f", color: "#ffffff" }}>Direct Tele-Consultation</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Preferred Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.requestedDateTime}
                  onChange={(e) => setForm({ ...form, requestedDateTime: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    colorScheme: "dark",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  Consultation Topic / Query Note
                </label>
                <textarea
                  rows={3}
                  value={form.clientNote}
                  onChange={(e) => setForm({ ...form, clientNote: e.target.value })}
                  placeholder="e.g. GST Annual Return filing, ITR reconciliation, notice advisory..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  disabled={booking}
                  className="btn-submit-lux"
                  style={{ width: "auto", padding: "10px 24px" }}
                >
                  {booking ? "Scheduling..." : "Submit Consultation Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
