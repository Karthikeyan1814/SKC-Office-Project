import { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/AdminProfile.css";
import {
  HiOutlineUserCircle,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineCloudArrowUp,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
} from "react-icons/hi2";

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'security' | 'privileges' | 'bankAccount'
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingFirm, setSavingFirm] = useState(false);

  // Profile fields state
  const [profile, setProfile] = useState({
    id: null,
    name: localStorage.getItem("skc-name") || "Administrator",
    email: "",
    mobile: "",
    altmobile: "",
    role: localStorage.getItem("skc-role") || "ADMIN",
    active: true,
  });

  // Firm & Remittance Banking Details state
  const [firmForm, setFirmForm] = useState({
    name: "Sri Kathiravan & Co.",
    subTitle: "Tax, Audit & Financial Advisory Consultants",
    address: "No. 42, Commercial Complex, Gandhi Road",
    city: "Salem, Tamil Nadu - 636007",
    phone: "+91 88257 50992",
    email: "contact@srikathiravan.com",
    gstin: "33AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    state: "Tamil Nadu",
    stateCode: "33",
    bankName: "HDFC Bank Ltd",
    accountName: "Sri Kathiravan & Co.",
    accountNumber: "50200084729103",
    ifscCode: "HDFC0001234",
    branch: "Salem Main Branch",
    upiId: "8825750992@upi",
  });

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fetch admin profile and firm banking details
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [res, firmRes] = await Promise.allSettled([
        api.get("/Admin/Profile"),
        api.get("/Public/FirmDetails"),
      ]);

      if (res.status === "fulfilled" && res.value?.data) {
        setProfile({
          id: res.value.data.id || null,
          name: res.value.data.name || localStorage.getItem("skc-name") || "Administrator",
          email: res.value.data.email || "",
          mobile: res.value.data.mobile || "",
          altmobile: res.value.data.altmobile || "",
          role: res.value.data.role || "ADMIN",
          active: res.value.data.active ?? true,
        });
      }

      if (firmRes.status === "fulfilled" && firmRes.value?.data) {
        setFirmForm((prev) => ({ ...prev, ...firmRes.value.data }));
        try {
          localStorage.setItem("skc_firm_info", JSON.stringify(firmRes.value.data));
        } catch {}
      }
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update profile handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error("Full name cannot be blank");
      return;
    }
    if (!profile.email.trim()) {
      toast.error("Email address cannot be blank");
      return;
    }
    if (!profile.mobile.trim()) {
      toast.error("Mobile number cannot be blank");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put("/Admin/Profile", {
        name: profile.name.trim(),
        email: profile.email.trim(),
        mobile: profile.mobile.trim(),
        altmobile: profile.altmobile ? profile.altmobile.trim() : "",
      });

      toast.success(res.data?.message || "Profile details updated successfully!");

      // Sync local storage so topbar reflects the new name
      if (res.data?.name) {
        localStorage.setItem("skc-name", res.data.name);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/Admin/Profile/Password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(res.data?.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  // Firm & Remittance banking update handler
  const handleUpdateFirm = async (e) => {
    e.preventDefault();
    setSavingFirm(true);
    try {
      const res = await api.post("/Admin/Firm/Details", firmForm);
      toast.success(res.data?.message || "Firm banking details saved and synced across all portals!");
      if (res.data?.firm) {
        setFirmForm(res.data.firm);
        try {
          localStorage.setItem("skc_firm_info", JSON.stringify(res.data.firm));
        } catch {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save firm details");
    } finally {
      setSavingFirm(false);
    }
  };

  return (
    <div className="admin-profile-container">
      {/* ── Hero Overview Card ───────────────────────────────── */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-large">
            {(profile.name || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="profile-hero-name">{profile.name}</h1>
            <div className="profile-hero-tags">
              <span className="profile-badge-role">{profile.role}</span>
              <span className="profile-badge-status">
                ● {profile.active ? "Active Account" : "Inactive"}
              </span>
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                Master Authority
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-hero-meta-label">Admin ID</div>
          <div className="profile-hero-meta-val">#ADM-{profile.id || "01"}</div>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={fetchProfile}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#f8fafc",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "11.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <HiOutlineArrowPath size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────── */}
      <div className="profile-tabs-bar">
        <button
          className={`profile-tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          <HiOutlineUserCircle size={17} />
          Account & Profile Information
        </button>

        <button
          className={`profile-tab-btn ${activeTab === "bankAccount" ? "active" : ""}`}
          onClick={() => setActiveTab("bankAccount")}
        >
          <HiOutlineBanknotes size={17} />
          Bank Account & Remittance Details
        </button>

        <button
          className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <HiOutlineKey size={17} />
          Security & Password Change
        </button>

        <button
          className={`profile-tab-btn ${activeTab === "privileges" ? "active" : ""}`}
          onClick={() => setActiveTab("privileges")}
        >
          <HiOutlineShieldCheck size={17} />
          Administrative Privileges
        </button>
      </div>

      {/* ── TAB 1: EDIT PROFILE DETAILS ──────────────────────── */}
      {activeTab === "details" && (
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <HiOutlineUserCircle size={20} color="#4f46e5" />
              Administrator Personal & Contact Information
            </h2>
            <p className="profile-card-desc">
              Manage your personal credentials, contact numbers, and communication channels.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="profile-form-grid">
              {/* Full Name */}
              <div className="profile-field-group">
                <label className="profile-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="profile-input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter full administrator name"
                />
              </div>

              {/* Email Address */}
              <div className="profile-field-group">
                <label className="profile-label">Email Address (Registered) *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    required
                    className="profile-input"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="admin@srikathiravan.com"
                  />
                  <HiOutlineEnvelope
                    size={16}
                    color="#94a3b8"
                    style={{ position: "absolute", right: "12px", top: "12px" }}
                  />
                </div>
              </div>

              {/* Primary Mobile */}
              <div className="profile-field-group">
                <label className="profile-label">Primary Mobile Number *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    required
                    className="profile-input"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                  <HiOutlinePhone
                    size={16}
                    color="#94a3b8"
                    style={{ position: "absolute", right: "12px", top: "12px" }}
                  />
                </div>
              </div>

              {/* Alternate Mobile */}
              <div className="profile-field-group">
                <label className="profile-label">Alternative Contact Number</label>
                <input
                  type="tel"
                  className="profile-input"
                  value={profile.altmobile}
                  onChange={(e) => setProfile({ ...profile, altmobile: e.target.value })}
                  placeholder="Emergency / Alternate phone"
                />
              </div>

              {/* Role Level (Readonly) */}
              <div className="profile-field-group">
                <label className="profile-label">Access Authority Level</label>
                <input
                  type="text"
                  disabled
                  className="profile-input"
                  value="System Administrator (Level 1 Authority)"
                />
              </div>

              {/* Status (Readonly) */}
              <div className="profile-field-group">
                <label className="profile-label">Account Operational Status</label>
                <input
                  type="text"
                  disabled
                  className="profile-input"
                  value="Active & Fully Authorized"
                />
              </div>
            </div>

            <div className="profile-actions-bar">
              <button
                type="submit"
                disabled={savingProfile}
                className="profile-save-btn"
              >
                <HiOutlineCheckBadge size={16} />
                {savingProfile ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: CHANGE PASSWORD ───────────────────────────── */}
      {activeTab === "security" && (
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <HiOutlineKey size={20} color="#7c3aed" />
              Update Administrator Password
            </h2>
            <p className="profile-card-desc">
              Keep your administrator account secure by using a strong, unique password.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ maxWidth: "560px" }}>
            {/* Current Password */}
            <div className="profile-field-group" style={{ marginBottom: "16px" }}>
              <label className="profile-label">Current Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  className="profile-input"
                  placeholder="Enter your current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {showCurrentPass ? <HiOutlineEyeSlash size={17} /> : <HiOutlineEye size={17} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="profile-field-group" style={{ marginBottom: "16px" }}>
              <label className="profile-label">New Password * (Min 6 characters)</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  className="profile-input"
                  placeholder="Create a strong new password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {showNewPass ? <HiOutlineEyeSlash size={17} /> : <HiOutlineEye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="profile-field-group" style={{ marginBottom: "22px" }}>
              <label className="profile-label">Confirm New Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  required
                  className="profile-input"
                  placeholder="Re-enter your new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  title={showConfirmPass ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPass ? <HiOutlineEyeSlash size={17} /> : <HiOutlineEye size={17} />}
                </button>
              </div>
            </div>

            <div className="profile-actions-bar" style={{ justifyContent: "flex-start" }}>
              <button
                type="submit"
                disabled={savingPassword}
                className="profile-save-btn"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
              >
                <HiOutlineKey size={16} />
                {savingPassword ? "Updating Password..." : "Update Password Now"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: PRIVILEGES & SCOPE ────────────────────────── */}
      {activeTab === "privileges" && (
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <HiOutlineShieldCheck size={20} color="#059669" />
              Administrative Scope & System Privileges
            </h2>
            <p className="profile-card-desc">
              Your account has full master administrator privileges across the entire enterprise portal.
            </p>
          </div>

          <div className="privilege-grid">
            <div className="privilege-card">
              <div className="privilege-icon purple">
                <HiOutlineShieldCheck size={20} />
              </div>
              <div>
                <h3 className="privilege-title">Access & Staff Security Authority</h3>
                <p className="privilege-desc">
                  Authorize, deactivate, or provision administrator and staff credentials with email 2FA verification.
                </p>
              </div>
            </div>

            <div className="privilege-card">
              <div className="privilege-icon blue">
                <HiOutlineCloudArrowUp size={20} />
              </div>
              <div>
                <h3 className="privilege-title">AWS S3 Cloud Document Vault</h3>
                <p className="privilege-desc">
                  Direct management over Amazon S3 bucket (<code>karthikeyan-audit-dev</code>) with retention and expiry controls.
                </p>
              </div>
            </div>

            <div className="privilege-card">
              <div className="privilege-icon emerald">
                <HiOutlineBuildingOffice2 size={20} />
              </div>
              <div>
                <h3 className="privilege-title">Appointment & Consultation Desk</h3>
                <p className="privilege-desc">
                  Review client consultation requests, assign video conference links (Google Meet / Zoom), and trigger automated pre-meeting reminders.
                </p>
              </div>
            </div>

            <div className="privilege-card">
              <div className="privilege-icon amber">
                <HiOutlineUserCircle size={20} />
              </div>
              <div>
                <h3 className="privilege-title">Membership & Plan Lifecycle</h3>
                <p className="privilege-desc">
                  Grant, renew, or adjust Silver, Gold, and Platinum tier memberships with customized expiration periods.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FIRM BANKING & REMITTANCE DETAILS ─────────── */}
      {activeTab === "bankAccount" && (
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <HiOutlineBanknotes size={22} color="#059669" />
              Firm Official Banking & Remittance Account Settings
            </h2>
            <p className="profile-card-desc">
              These verified payment channels, bank account details, and UPI IDs will automatically display on all client invoices, payment receipts, client dashboards, and official email statements.
            </p>
          </div>

          <form onSubmit={handleUpdateFirm}>
            <div style={{ marginBottom: "26px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#065f46", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 16px 0", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "8px" }}>
                🏦 Primary Bank Account Particulars
              </h3>
              <div className="profile-form-grid">
                <div className="profile-field-group">
                  <label className="profile-label">Beneficiary Bank Name *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    value={firmForm.bankName}
                    onChange={(e) => setFirmForm({ ...firmForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank Ltd"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Account Holder / Legal Beneficiary Name *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    value={firmForm.accountName}
                    onChange={(e) => setFirmForm({ ...firmForm, accountName: e.target.value })}
                    placeholder="e.g. Sri Kathiravan & Co."
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Account Number *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    style={{ letterSpacing: "0.5px", fontWeight: "700", color: "#1e40af" }}
                    value={firmForm.accountNumber}
                    onChange={(e) => setFirmForm({ ...firmForm, accountNumber: e.target.value })}
                    placeholder="e.g. 50200084729103"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    value={firmForm.ifscCode}
                    onChange={(e) => setFirmForm({ ...firmForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Branch Name</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.branch}
                    onChange={(e) => setFirmForm({ ...firmForm, branch: e.target.value })}
                    placeholder="e.g. Salem Main Branch"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Official Remittance UPI ID (VPA) *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    style={{ color: "#059669", fontWeight: "700" }}
                    value={firmForm.upiId}
                    onChange={(e) => setFirmForm({ ...firmForm, upiId: e.target.value })}
                    placeholder="e.g. 8825750992@upi"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "26px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 16px 0", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "8px" }}>
                🏢 Firm Legal Details & Invoice Header
              </h3>
              <div className="profile-form-grid">
                <div className="profile-field-group">
                  <label className="profile-label">Firm Legal Name *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    value={firmForm.name}
                    onChange={(e) => setFirmForm({ ...firmForm, name: e.target.value })}
                    placeholder="e.g. Sri Kathiravan & Co."
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Subtitle / Professional Title</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.subTitle}
                    onChange={(e) => setFirmForm({ ...firmForm, subTitle: e.target.value })}
                    placeholder="e.g. Tax, Audit & Financial Advisory Consultants"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Office Phone / Helpdesk *</label>
                  <input
                    type="text"
                    required
                    className="profile-input"
                    value={firmForm.phone}
                    onChange={(e) => setFirmForm({ ...firmForm, phone: e.target.value })}
                    placeholder="e.g. +91 88257 50992"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    className="profile-input"
                    value={firmForm.email}
                    onChange={(e) => setFirmForm({ ...firmForm, email: e.target.value })}
                    placeholder="e.g. contact@srikathiravan.com"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">GSTIN</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.gstin}
                    onChange={(e) => setFirmForm({ ...firmForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">PAN</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.pan}
                    onChange={(e) => setFirmForm({ ...firmForm, pan: e.target.value.toUpperCase() })}
                    placeholder="e.g. AAAAA0000A"
                  />
                </div>

                <div className="profile-field-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="profile-label">Official Office Address</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.address}
                    onChange={(e) => setFirmForm({ ...firmForm, address: e.target.value })}
                    placeholder="e.g. No. 42, Commercial Complex, Gandhi Road"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">City & Pincode</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={firmForm.city}
                    onChange={(e) => setFirmForm({ ...firmForm, city: e.target.value })}
                    placeholder="e.g. Salem, Tamil Nadu - 636007"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={savingFirm}
                className="profile-sync-btn"
              >
                <HiOutlineCloudArrowUp size={20} />
                {savingFirm ? "Saving & Syncing All Portals..." : "Save & Sync Account Details Globally"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
