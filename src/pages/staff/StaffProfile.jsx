import { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/StaffProfile.css";
import {
  HiOutlineUserCircle,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBriefcase,
  HiOutlineFolderOpen,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineBell,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

export default function StaffProfile() {
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'security' | 'privileges'
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile fields state
  const [profile, setProfile] = useState({
    id: null,
    name: localStorage.getItem("skc-name") || "Staff Member",
    email: "",
    mobile: "",
    designation: "Audit Officer & Client Specialist",
    role: localStorage.getItem("skc-role") || "STAFF",
    active: true,
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

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Staff/Profile");
      if (res.data) {
        setProfile({
          id: res.data.id || null,
          name: res.data.name || localStorage.getItem("skc-name") || "Staff Member",
          email: res.data.email || "",
          mobile: res.data.mobile || "",
          designation: res.data.designation || "Audit Officer & Client Specialist",
          role: res.data.role || "STAFF",
          active: res.data.active ?? true,
        });
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
      const res = await api.put("/Staff/Profile", {
        name: profile.name.trim(),
        email: profile.email.trim(),
        mobile: profile.mobile.trim(),
        designation: profile.designation ? profile.designation.trim() : "",
      });

      toast.success(res.data?.message || "Staff profile updated successfully!");

      if (res.data?.name) {
        localStorage.setItem("skc-name", res.data.name);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/Staff/Profile/Password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(res.data?.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password";
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="staff-profile-container">
      {/* ── Executive Hero Header ─────────────────────────────── */}
      <div className="staff-profile-hero">
        <div className="staff-profile-hero-left">
          <div className="staff-profile-avatar">
            {profile.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h1 className="staff-profile-name">{profile.name}</h1>
            <p className="staff-profile-designation">{profile.designation}</p>
            <div className="staff-profile-pills">
              <span className="staff-profile-pill role">
                <HiOutlineShieldCheck size={14} /> Official Staff Account
              </span>
              <span className="staff-profile-pill active">
                <HiOutlineCheckBadge size={14} /> Active Operator
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ──────────────────────────────────── */}
      <div className="staff-profile-tabs">
        <button
          onClick={() => setActiveTab("details")}
          className={`staff-tab-btn ${activeTab === "details" ? "active" : ""}`}
        >
          <HiOutlineUserCircle size={18} /> Profile &amp; Contact Details
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`staff-tab-btn ${activeTab === "security" ? "active" : ""}`}
        >
          <HiOutlineKey size={18} /> Security &amp; Credentials
        </button>
        <button
          onClick={() => setActiveTab("privileges")}
          className={`staff-tab-btn ${activeTab === "privileges" ? "active" : ""}`}
        >
          <HiOutlineShieldCheck size={18} /> Assigned Operating Privileges
        </button>
      </div>

      {/* ── Tab Content: Profile Details ─────────────────────── */}
      {activeTab === "details" && (
        <div className="staff-profile-card">
          <h2 className="staff-profile-section-title">
            <HiOutlineUserCircle size={22} color="#0284c7" /> Staff Particulars &amp; Contact Record
          </h2>
          <p className="staff-profile-section-desc">
            Ensure your official email and contact number remain current for administrative notices and client correspondence.
          </p>

          <form onSubmit={handleUpdateProfile}>
            <div className="staff-form-grid">
              <div className="staff-form-group">
                <label className="staff-form-label">
                  <HiOutlineUserCircle /> Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="staff-form-input"
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">
                  <HiOutlineBriefcase /> Official Designation / Title
                </label>
                <input
                  type="text"
                  value={profile.designation}
                  onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                  placeholder="e.g. Senior Audit Assistant"
                  className="staff-form-input"
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">
                  <HiOutlineEnvelope /> Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="staff@srikathiravan.com"
                  className="staff-form-input"
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">
                  <HiOutlinePhone /> Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="staff-form-input"
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Assigned System Role</label>
                <input
                  type="text"
                  disabled
                  value="STAFF (Operating Member)"
                  className="staff-form-input"
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Account Status</label>
                <input
                  type="text"
                  disabled
                  value="Active & Authorized"
                  className="staff-form-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-staff-primary"
            >
              {savingProfile ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab Content: Security & Password ─────────────────── */}
      {activeTab === "security" && (
        <div className="staff-profile-card">
          <h2 className="staff-profile-section-title">
            <HiOutlineKey size={22} color="#0284c7" /> Update Account Password
          </h2>
          <p className="staff-profile-section-desc">
            Keep your operator credentials secure. Choose a strong password containing at least 6 characters.
          </p>

          <form onSubmit={handleChangePassword} style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "24px" }}>
              <div className="staff-form-group">
                <label className="staff-form-label">Current Password *</label>
                <div className="staff-pass-wrap">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="staff-form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="staff-pass-toggle"
                  >
                    {showCurrentPass ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">New Password *</label>
                <div className="staff-pass-wrap">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter at least 6 characters"
                    className="staff-form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="staff-pass-toggle"
                  >
                    {showNewPass ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Confirm New Password *</label>
                <div className="staff-pass-wrapper">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-type new password"
                    className="staff-form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="staff-pass-toggle"
                    title={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="btn-staff-primary"
            >
              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab Content: Operating Privileges ────────────────── */}
      {activeTab === "privileges" && (
        <div className="staff-profile-card">
          <h2 className="staff-profile-section-title">
            <HiOutlineShieldCheck size={22} color="#0284c7" /> Staff Operating Authority &amp; System Scope
          </h2>
          <p className="staff-profile-section-desc">
            Your staff account is endowed with standard executive permissions to manage client filings, documentation, and consultations.
          </p>

          <div className="staff-privilege-grid">
            <div className="staff-privilege-card">
              <div className="staff-privilege-header">
                <div className="staff-privilege-icon">
                  <HiOutlineFolderOpen />
                </div>
                <h4 className="staff-privilege-title">Document Vault &amp; AWS S3</h4>
              </div>
              <p className="staff-privilege-desc">
                Authorized to upload audited statements, file returns, configure document expiry, and grant download extensions to registered clients.
              </p>
            </div>

            <div className="staff-privilege-card">
              <div className="staff-privilege-header">
                <div className="staff-privilege-icon">
                  <HiOutlineUsers />
                </div>
                <h4 className="staff-privilege-title">Client Directory Oversight</h4>
              </div>
              <p className="staff-privilege-desc">
                Full search and read access to all registered client entities, trade profiles, GSTIN/PAN records, and active audit history.
              </p>
            </div>

            <div className="staff-privilege-card">
              <div className="staff-privilege-header">
                <div className="staff-privilege-icon">
                  <HiOutlineCalendarDays />
                </div>
                <h4 className="staff-privilege-title">Consultation Schedules</h4>
              </div>
              <p className="staff-privilege-desc">
                Review client consultation requests, assign meeting timelines, provide meeting links, and confirm appointments with clients.
              </p>
            </div>

            <div className="staff-privilege-card">
              <div className="staff-privilege-header">
                <div className="staff-privilege-icon">
                  <HiOutlineBell />
                </div>
                <h4 className="staff-privilege-title">Real-Time Operational Alerts</h4>
              </div>
              <p className="staff-privilege-desc">
                Instant delivery of alerts for incoming client document uploads, appointment bookings, and administrative office broadcasts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
