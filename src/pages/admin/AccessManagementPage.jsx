import { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/AccessManagement.css";
import {
  HiOutlineShieldCheck,
  HiOutlineUserPlus,
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineCheckBadge,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function AccessManagementPage() {
  const [activeTab, setActiveTab] = useState("STAFF"); // "STAFF" | "CLIENT" | "ADMIN" | "CREATE_ROLE"
  const [loading, setLoading] = useState(true);

  // Current logged in admin ID
  const currentAdminId = Number(localStorage.getItem("skc-id") || 0);

  // ── 1. STAFF STATE ────────────────────────────────────────────────────────
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");

  // ── 2. CLIENT STATE ───────────────────────────────────────────────────────
  const [clientList, setClientList] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "DEACTIVATED" | "RECONSULTATION"

  // ── 3. ADMIN STATE ────────────────────────────────────────────────────────
  const [adminList, setAdminList] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");

  // Deactivate Admin OTP Modal
  const [showDeactivateOtpModal, setShowDeactivateOtpModal] = useState(false);
  const [targetAdminToDeactivate, setTargetAdminToDeactivate] = useState(null);
  const [deactivateOtp, setDeactivateOtp] = useState("");
  const [deactivateOtpSending, setDeactivateOtpSending] = useState(false);
  const [deactivateOtpVerifying, setDeactivateOtpVerifying] = useState(false);
  const [devDeactivateOtp, setDevDeactivateOtp] = useState("");

  // ── 4. CREATE ROLE CREDENTIALS STATE ───────────────────────────────────────
  const [roleTypeToCreate, setRoleTypeToCreate] = useState("STAFF"); // "STAFF" | "ADMIN"

  // Staff Form
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    mobile: "",
    designation: "Audit Executive",
    password: "",
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Admin Form
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    mobile: "",
    altmobile: "",
    password: "",
  });
  const [sendingAdminOtp, setSendingAdminOtp] = useState(false);
  const [showAdminCreationOtpModal, setShowAdminCreationOtpModal] = useState(false);
  const [adminCreationOtp, setAdminCreationOtp] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [devAdminCreationOtp, setDevAdminCreationOtp] = useState("");

  // ── DATA FETCHING ─────────────────────────────────────────────────────────
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [staffRes, clientRes, adminRes] = await Promise.all([
        api.get("/Admin/Access/Staff").catch(() => ({ data: [] })),
        api.get("/Admin/Access/Clients").catch(() => ({ data: [] })),
        api.get("/Admin/Access/Admins").catch(() => ({ data: [] })),
      ]);

      setStaffList(staffRes.data || []);
      setClientList(clientRes.data || []);
      setAdminList(adminRes.data || []);
    } catch {
      toast.error("Failed to load access control directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ── STAFF HANDLERS (Direct, no OTP) ───────────────────────────────────────
  const handleToggleStaffActive = async (id) => {
    try {
      const res = await api.post(`/Admin/Access/Staff/ToggleActive/${id}`);
      toast.success(res.data.message || "Staff status updated");
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update staff status");
    }
  };

  const handleResetStaffPassword = async (id) => {
    const password = window.prompt("Enter new password for staff member (min 4 characters):");
    if (!password) return;
    try {
      const res = await api.post(`/Admin/Access/Staff/ResetPassword/${id}`, { password });
      toast.success(res.data.message || "Staff password reset successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Permanently remove this staff account?")) return;
    try {
      await api.delete(`/Admin/Access/Staff/Delete/${id}`);
      toast.success("Staff account removed");
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete staff");
    }
  };

  // ── CLIENT HANDLERS (Direct toggle, Re-consultation clearance) ───────────
  const handleToggleClientActive = async (id) => {
    try {
      const res = await api.post(`/Admin/Access/Clients/ToggleActive/${id}`);
      toast.success(res.data.message || "Client status updated");
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update client status");
    }
  };

  // ── ADMIN HANDLERS (Requires Email OTP for deactivation) ──────────────────
  const handleInitiateAdminDeactivation = async (admin) => {
    if (admin.id === currentAdminId) {
      toast.error("You cannot deactivate your own active session administrator account.");
      return;
    }

    setTargetAdminToDeactivate(admin);
    setDeactivateOtp("");
    setDevDeactivateOtp("");
    setDeactivateOtpSending(true);

    try {
      const res = await api.post(`/Admin/Access/Admins/SendDeactivateOtp/${admin.id}`);
      toast.success(res.data.message || "Verification code sent to your registered email");
      if (res.data.devOtp) setDevDeactivateOtp(res.data.devOtp);
      setShowDeactivateOtpModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch verification code");
    } finally {
      setDeactivateOtpSending(false);
    }
  };

  const handleVerifyAndDeactivateAdmin = async (e) => {
    e.preventDefault();
    if (!deactivateOtp.trim() || deactivateOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setDeactivateOtpVerifying(true);
    try {
      const res = await api.post("/Admin/Access/Admins/VerifyAndDeactivate", {
        targetAdminId: targetAdminToDeactivate.id,
        otp: deactivateOtp.trim(),
      });
      toast.success(res.data.message || "Administrator account deactivated");
      setShowDeactivateOtpModal(false);
      setTargetAdminToDeactivate(null);
      setDeactivateOtp("");
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setDeactivateOtpVerifying(false);
    }
  };

  const handleActivateAdmin = async (id) => {
    try {
      const res = await api.post(`/Admin/Access/Admins/Activate/${id}`);
      toast.success(res.data.message || "Administrator reactivated successfully");
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to activate administrator");
    }
  };

  // ── ROLE CREATION HANDLERS ────────────────────────────────────────────────
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.mobile.trim() || !newStaff.password) {
      toast.error("Please fill in all staff account fields");
      return;
    }

    setCreatingStaff(true);
    try {
      const res = await api.post("/Admin/Access/CreateStaff", newStaff);
      toast.success(res.data.message || "Staff credential created successfully!");
      setNewStaff({ name: "", email: "", mobile: "", designation: "Audit Executive", password: "" });
      fetchAllData();
      setActiveTab("STAFF");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create staff credential");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleInitiateAdminCreation = async (e) => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.mobile.trim() || !newAdmin.password) {
      toast.error("Please fill in all administrator account fields");
      return;
    }

    setSendingAdminOtp(true);
    setDevAdminCreationOtp("");
    try {
      const res = await api.post("/Admin/Access/SendAdminCreationOtp", newAdmin);
      toast.success(res.data.message || "Security code sent to your email to authorize new Admin creation.");
      if (res.data.devOtp) setDevAdminCreationOtp(res.data.devOtp);
      setShowAdminCreationOtpModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send authorization code");
    } finally {
      setSendingAdminOtp(false);
    }
  };

  const handleVerifyAndCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminCreationOtp.trim() || adminCreationOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await api.post("/Admin/Access/CreateAdmin", {
        email: newAdmin.email.trim(),
        otp: adminCreationOtp.trim(),
      });
      toast.success(res.data.message || "New administrator created successfully!");
      setShowAdminCreationOtpModal(false);
      setAdminCreationOtp("");
      setNewAdmin({ name: "", email: "", mobile: "", altmobile: "", password: "" });
      fetchAllData();
      setActiveTab("ADMIN");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // ── FILTERED LISTS ────────────────────────────────────────────────────────
  const filteredStaff = staffList.filter((s) => {
    if (!staffSearch.trim()) return true;
    const q = staffSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q))
    );
  });

  const filteredClients = clientList.filter((c) => {
    // Status filter
    if (clientStatusFilter === "ACTIVE" && !c.active) return false;
    if (clientStatusFilter === "DEACTIVATED" && c.active) return false;
    if (clientStatusFilter === "RECONSULTATION" && !c.reconsultationRequested) return false;

    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.legalname && c.legalname.toLowerCase().includes(q)) ||
      (c.gstnumber && c.gstnumber.toLowerCase().includes(q))
    );
  });

  const filteredAdmins = adminList.filter((a) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.mobile && a.mobile.includes(q))
    );
  });

  // Re-consultation count for badge
  const pendingReconsultations = clientList.filter((c) => c.reconsultationRequested).length;

  return (
    <div className="am-page-wrapper">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="am-header">
        <div>
          <h1 className="am-header-title">
            <HiOutlineShieldCheck size={26} color="#059669" />
            Access &amp; Role Management
          </h1>
          <p className="am-header-sub">
            Unified security headquarters: manage Staff access, Client permissions, Administrator roles, and credential issuance.
          </p>
        </div>

        <button onClick={fetchAllData} className="am-btn-refresh">
          <HiOutlineArrowPath size={15} /> Refresh Directory
        </button>
      </div>

      {/* ── Main Navigation Tabs ──────────────────────────────── */}
      <div className="am-tabs-bar">
        <button
          onClick={() => setActiveTab("STAFF")}
          className={`am-tab-btn ${activeTab === "STAFF" ? "active-staff" : ""}`}
        >
          <HiOutlineUsers size={17} /> Staff Access
          <span className="am-tab-count">{staffList.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("CLIENT")}
          className={`am-tab-btn ${activeTab === "CLIENT" ? "active-client" : ""}`}
        >
          <HiOutlineUserGroup size={17} /> Client Access
          <span className="am-tab-count">{clientList.length}</span>
          {pendingReconsultations > 0 && (
            <span className="am-tab-count am-tab-count-alert">
              {pendingReconsultations} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ADMIN")}
          className={`am-tab-btn ${activeTab === "ADMIN" ? "active-admin" : ""}`}
        >
          <HiOutlineLockClosed size={17} /> Administrator Access
          <span className="am-tab-count">{adminList.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("CREATE_ROLE")}
          className={`am-tab-btn ${activeTab === "CREATE_ROLE" ? "active-create" : ""}`}
        >
          <HiOutlineUserPlus size={17} /> Create Role Credentials
        </button>
      </div>

      {/* ── TAB 1: STAFF ACCESS MANAGEMENT ───────────────────────── */}
      {activeTab === "STAFF" && (
        <div>
          {/* Top Filter & Actions */}
          <div className="am-toolbar">
            <div className="am-search-box">
              <HiOutlineMagnifyingGlass size={17} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search staff by name, email, mobile, or designation..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="am-search-input"
              />
              {staffSearch && (
                <button onClick={() => setStaffSearch("")} className="am-search-clear">
                  <HiOutlineXMark size={16} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setActiveTab("CREATE_ROLE");
                setRoleTypeToCreate("STAFF");
              }}
              className="am-btn am-btn-primary"
            >
              <HiOutlineUserPlus size={15} /> Add Staff Credential
            </button>
          </div>

          {/* Staff Table */}
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Staff Officer</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                      No staff members found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="am-user-cell">
                          <div className="am-avatar staff">
                            {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="am-user-name">{s.name}</div>
                            <div className="am-user-meta">Staff ID: #{s.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="am-badge tag-tier" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                          {s.designation || "Staff Officer"}
                        </span>
                      </td>

                      <td>
                        <div style={{ color: "#334155", fontSize: "12.5px" }}>✉️ {s.email}</div>
                        <div style={{ color: "#64748b", fontSize: "11.5px", marginTop: "2px" }}>📞 {s.mobile}</div>
                      </td>

                      <td>
                        <span className={`am-badge ${s.active ? "active" : "deactivated"}`}>
                          {s.active ? <HiOutlineCheckCircle size={13} /> : <HiOutlineXCircle size={13} />}
                          {s.active ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="am-actions-cell">
                          {/* Toggle Active Button (Direct, no OTP) */}
                          <button
                            onClick={() => handleToggleStaffActive(s.id)}
                            className={`am-btn ${s.active ? "am-btn-deactivate" : "am-btn-activate"}`}
                            title={s.active ? "Deactivate staff member (direct)" : "Activate staff member"}
                          >
                            {s.active ? "Deactivate" : "Activate"}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetStaffPassword(s.id)}
                            className="am-btn am-btn-outline"
                            title="Reset Password"
                          >
                            <HiOutlineKey size={12} /> Reset Pass
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteStaff(s.id)}
                            className="am-btn am-btn-deactivate"
                            title="Delete staff"
                            style={{ padding: "5px 8px" }}
                          >
                            <HiOutlineTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLIENT ACCESS MANAGEMENT ───────────────────────── */}
      {activeTab === "CLIENT" && (
        <div>
          {/* Re-consultation Alert Bar if any pending */}
          {pendingReconsultations > 0 && (
            <div className="am-alert-banner warning">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="am-alert-icon-box" style={{ background: "#f97316", color: "#fff" }}>
                  <HiOutlineExclamationTriangle size={18} />
                </span>
                <div>
                  <h4 className="am-alert-title" style={{ color: "#9a3412" }}>
                    {pendingReconsultations} Client(s) Requested Account Re-consultation &amp; Reactivation
                  </h4>
                  <p className="am-alert-desc" style={{ color: "#c2410c" }}>
                    Deactivated clients have submitted re-consultation requests through their restricted portal.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setClientStatusFilter("RECONSULTATION")}
                className="am-btn"
                style={{ background: "#ea580c", color: "#fff" }}
              >
                Filter Re-consultation Requests
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="am-toolbar">
            <div className="am-search-box">
              <HiOutlineMagnifyingGlass size={17} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search clients by name, trade name, GST, mobile, or email..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="am-search-input"
              />
              {clientSearch && (
                <button onClick={() => setClientSearch("")} className="am-search-clear">
                  <HiOutlineXMark size={16} />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="am-filter-chips">
              {[
                { key: "ALL", label: "All Clients" },
                { key: "ACTIVE", label: "Active Only" },
                { key: "DEACTIVATED", label: "Deactivated" },
                { key: "RECONSULTATION", label: `Re-consultation (${pendingReconsultations})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setClientStatusFilter(f.key)}
                  className={`am-filter-chip ${clientStatusFilter === f.key ? "active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client Table */}
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Client / Enterprise</th>
                  <th>Membership Tier</th>
                  <th>Access Status</th>
                  <th>Re-consultation Request</th>
                  <th style={{ textAlign: "right" }}>Permissions Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                      No clients matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => {
                    const isPlatinum = c.membershipPlan?.toUpperCase() === "PLATINUM";
                    const isGold = c.membershipPlan?.toUpperCase() === "GOLD";

                    return (
                      <tr key={c.id} style={{ background: c.reconsultationRequested ? "#fffdfa" : "inherit" }}>
                        <td>
                          <div className="am-user-name">{c.name}</div>
                          {c.legalname && (
                            <div style={{ fontSize: "11.5px", color: "#4f46e5", fontWeight: "600", marginTop: "1px" }}>
                              🏢 {c.legalname}
                            </div>
                          )}
                          <div className="am-user-meta">
                            ✉️ {c.email} • 📞 {c.mobile}
                          </div>
                          {c.gstnumber && (
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                              GST: {c.gstnumber}
                            </div>
                          )}
                        </td>

                        <td>
                          {c.membershipStatus === "MEMBER" ? (
                            <span
                              className="am-badge tag-tier"
                              style={{
                                background: isPlatinum ? "#f3e8ff" : isGold ? "#fef3c7" : "#f1f5f9",
                                color: isPlatinum ? "#7e22ce" : isGold ? "#b45309" : "#475569",
                                border: isPlatinum ? "1px solid #d8b4fe" : isGold ? "1px solid #fde68a" : "1px solid #cbd5e1",
                              }}
                            >
                              <HiOutlineSparkles size={12} />
                              {c.membershipPlan || "MEMBER"} CARD
                            </span>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "600" }}>Standard</span>
                          )}
                        </td>

                        <td>
                          <span className={`am-badge ${c.active ? "active" : "deactivated"}`}>
                            {c.active ? <HiOutlineCheckCircle size={13} /> : <HiOutlineXCircle size={13} />}
                            {c.active ? "Full Access Active" : "Account Deactivated"}
                          </span>
                        </td>

                        <td>
                          {c.reconsultationRequested ? (
                            <div
                              style={{
                                background: "#fff7ed",
                                border: "1px solid #fdba74",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                maxWidth: "260px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#c2410c", fontWeight: "800", fontSize: "11.5px" }}>
                                <HiOutlineExclamationTriangle size={14} /> Re-consultation Pending
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#7c2d12", marginTop: "3px", fontStyle: "italic" }}>
                                "{c.reconsultationNotes || "Client requested account reactivation"}"
                              </div>
                              {c.reconsultationRequestedAt && (
                                <div style={{ fontSize: "10px", color: "#9a3412", marginTop: "3px" }}>
                                  {new Date(c.reconsultationRequestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="am-actions-cell">
                            {c.reconsultationRequested ? (
                              <button
                                onClick={() => handleToggleClientActive(c.id)}
                                className="am-btn am-btn-primary"
                              >
                                ✓ Approve &amp; Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleClientActive(c.id)}
                                className={`am-btn ${c.active ? "am-btn-deactivate" : "am-btn-activate"}`}
                                title={c.active ? "Deactivate client account (direct)" : "Reactivate client account"}
                              >
                                {c.active ? "Deactivate" : "Reactivate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: ADMINISTRATOR ACCESS MANAGEMENT ───────────────── */}
      {activeTab === "ADMIN" && (
        <div>
          {/* Security Notice Banner */}
          <div className="am-alert-banner purple">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="am-alert-icon-box" style={{ background: "#7c3aed", color: "#fff" }}>
                <HiOutlineLockClosed size={18} />
              </span>
              <div>
                <h4 className="am-alert-title" style={{ color: "#5b21b6" }}>
                  Multi-Admin Security Protocol Active
                </h4>
                <p className="am-alert-desc" style={{ color: "#6d28d9" }}>
                  Under SKC security governance, administrators can directly deactivate staff and clients. However, deactivating another
                  administrator account requires <strong>mandatory Email OTP verification</strong> sent to your registered email address.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Table */}
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Registered Contact</th>
                  <th>Role / Privilege</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: "right" }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((a) => {
                  const isCurrent = a.id === currentAdminId;

                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="am-user-cell">
                          <div className="am-avatar admin">👑</div>
                          <div>
                            <div className="am-user-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {a.name}
                              {isCurrent && (
                                <span className="am-badge" style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "10px", padding: "1px 6px" }}>
                                  You (Current)
                                </span>
                              )}
                            </div>
                            <div className="am-user-meta">Admin ID: #{a.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ color: "#334155", fontSize: "12.5px" }}>✉️ {a.email}</div>
                        <div style={{ color: "#64748b", fontSize: "11.5px", marginTop: "2px" }}>📞 {a.mobile}</div>
                      </td>

                      <td>
                        <span className="am-badge tag-tier" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                          SUPER ADMIN
                        </span>
                      </td>

                      <td>
                        <span className={`am-badge ${a.active ? "active" : "deactivated"}`}>
                          {a.active ? <HiOutlineCheckCircle size={13} /> : <HiOutlineXCircle size={13} />}
                          {a.active ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="am-actions-cell">
                          {isCurrent ? (
                            <span style={{ fontSize: "11.5px", color: "#94a3b8", fontStyle: "italic" }}>
                              Current Admin Session
                            </span>
                          ) : a.active ? (
                            <button
                              onClick={() => handleInitiateAdminDeactivation(a)}
                              disabled={deactivateOtpSending}
                              className="am-btn am-btn-danger-solid"
                              title="Requires OTP verification sent to your email"
                            >
                              <HiOutlineLockClosed size={13} />
                              {deactivateOtpSending ? "Sending OTP..." : "Deactivate (OTP Required)"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateAdmin(a.id)}
                              className="am-btn am-btn-activate"
                            >
                              ✓ Reactivate Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: CREATE ROLE CREDENTIALS (Staff & Admin Settings) ── */}
      {activeTab === "CREATE_ROLE" && (
        <div className="am-create-wrap">
          {/* Sub-toggle: Staff vs Admin */}
          <div className="am-role-switch">
            <button
              onClick={() => setRoleTypeToCreate("STAFF")}
              className={`am-role-tab ${roleTypeToCreate === "STAFF" ? "active-staff" : ""}`}
            >
              <HiOutlineUsers size={16} /> Create Staff Role Credential (Direct)
            </button>

            <button
              onClick={() => setRoleTypeToCreate("ADMIN")}
              className={`am-role-tab ${roleTypeToCreate === "ADMIN" ? "active-admin" : ""}`}
            >
              <HiOutlineLockClosed size={16} /> Create Admin Role Credential (Email OTP Required)
            </button>
          </div>

          {/* 4A: CREATE STAFF ROLE */}
          {roleTypeToCreate === "STAFF" && (
            <div className="am-form-card">
              <div style={{ marginBottom: "18px" }}>
                <span className="am-badge" style={{ background: "#ecfdf5", color: "#059669", fontSize: "10.5px", padding: "2px 8px", marginBottom: "6px" }}>
                  DIRECT STAFF CREATION
                </span>
                <h3 style={{ margin: "4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Issue New Staff Account Credentials
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12.5px" }}>
                  Staff accounts grant file upload and client verification rights. No OTP authorization is required to create staff.
                </p>
              </div>

              <form onSubmit={handleCreateStaff}>
                <div className="am-form-grid">
                  <div className="am-form-group">
                    <label className="am-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Official Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Audit Senior / GST Manager"
                      value={newStaff.designation}
                      onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@srikathiravan.com"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={newStaff.mobile}
                      onChange={(e) => setNewStaff({ ...newStaff, mobile: e.target.value })}
                      className="am-input"
                    />
                  </div>
                </div>

                <div className="am-form-group" style={{ marginTop: "6px" }}>
                  <label className="am-label">Initial Login Password (min 4 characters) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure initial password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="am-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="am-btn am-btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "16px", fontSize: "13px" }}
                >
                  <HiOutlineUserPlus size={16} />
                  {creatingStaff ? "Creating Staff Account..." : "Create Staff Role Credential"}
                </button>
              </form>
            </div>
          )}

          {/* 4B: CREATE ADMIN ROLE (OTP Authorization Flow) */}
          {roleTypeToCreate === "ADMIN" && (
            <div className="am-form-card" style={{ border: "1.5px solid #ddd6fe" }}>
              <div style={{ marginBottom: "18px" }}>
                <span className="am-badge" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: "10.5px", padding: "2px 8px", marginBottom: "6px" }}>
                  🔒 HIGH-PRIVILEGE ADMIN CREATION
                </span>
                <h3 style={{ margin: "4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Create Administrator Role Credential
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12.5px", lineHeight: 1.4 }}>
                  Creating an administrator grants unrestricted system privileges. Before this account is created,
                  a <strong>6-digit security authorization code</strong> will be sent to your own administrator email.
                </p>
              </div>

              <form onSubmit={handleInitiateAdminCreation}>
                <div className="am-form-grid">
                  <div className="am-form-group">
                    <label className="am-label">Administrator Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anandha Krishnan"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Administrator Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin2@srikathiravan.com"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Primary Mobile (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9888877777"
                      value={newAdmin.mobile}
                      onChange={(e) => setNewAdmin({ ...newAdmin, mobile: e.target.value })}
                      className="am-input"
                    />
                  </div>

                  <div className="am-form-group">
                    <label className="am-label">Alternate Mobile (Optional)</label>
                    <input
                      type="tel"
                      placeholder="Secondary contact"
                      value={newAdmin.altmobile}
                      onChange={(e) => setNewAdmin({ ...newAdmin, altmobile: e.target.value })}
                      className="am-input"
                    />
                  </div>
                </div>

                <div className="am-form-group" style={{ marginTop: "6px" }}>
                  <label className="am-label">Administrator Password (min 4 chars) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter high-entropy administrator password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="am-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingAdminOtp}
                  className="am-btn am-btn-purple"
                  style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: "16px", fontSize: "13px" }}
                >
                  <HiOutlineLockClosed size={16} />
                  {sendingAdminOtp ? "Sending Security Code to Email..." : "Send Security Code & Authorize Admin"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: ADMIN DEACTIVATION OTP VERIFICATION ───────────── */}
      {showDeactivateOtpModal && targetAdminToDeactivate && (
        <div className="am-modal-overlay">
          <div className="am-modal-card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <HiOutlineLockClosed size={24} />
            </div>

            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              Authorize Admin Deactivation
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "#475569", lineHeight: 1.45 }}>
              Enter the 6-digit verification code sent to your registered email to confirm deactivating administrator{" "}
              <strong style={{ color: "#0f172a" }}>{targetAdminToDeactivate.name}</strong>.
            </p>

            <form onSubmit={handleVerifyAndDeactivateAdmin}>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                value={deactivateOtp}
                onChange={(e) => setDeactivateOtp(e.target.value.replace(/\D/g, ""))}
                className="am-otp-input"
                style={{ borderColor: "#dc2626", marginBottom: "16px" }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivateOtpModal(false);
                    setTargetAdminToDeactivate(null);
                  }}
                  className="am-btn am-btn-outline"
                  style={{ flex: 1, justifyContent: "center", padding: "9px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deactivateOtpVerifying}
                  className="am-btn am-btn-danger-solid"
                  style={{ flex: 2, justifyContent: "center", padding: "9px" }}
                >
                  {deactivateOtpVerifying ? "Verifying..." : "Verify & Deactivate Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADMIN CREATION OTP VERIFICATION ─────────────── */}
      {showAdminCreationOtpModal && (
        <div className="am-modal-overlay">
          <div className="am-modal-card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#ede9fe",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <HiOutlineKey size={24} />
            </div>

            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              Authorize Administrator Creation
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "#475569", lineHeight: 1.45 }}>
              Enter the 6-digit authorization code dispatched to your administrator email to confirm creating a new admin account for{" "}
              <strong style={{ color: "#0f172a" }}>{newAdmin.name}</strong>.
            </p>

            <form onSubmit={handleVerifyAndCreateAdmin}>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                value={adminCreationOtp}
                onChange={(e) => setAdminCreationOtp(e.target.value.replace(/\D/g, ""))}
                className="am-otp-input"
                style={{ borderColor: "#7c3aed", marginBottom: "16px" }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAdminCreationOtpModal(false)}
                  className="am-btn am-btn-outline"
                  style={{ flex: 1, justifyContent: "center", padding: "9px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="am-btn am-btn-purple"
                  style={{ flex: 2, justifyContent: "center", padding: "9px" }}
                >
                  {creatingAdmin ? "Creating Admin..." : "Verify & Issue Admin Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
