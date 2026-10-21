import { useState, useEffect, useRef } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import {
  HiOutlineIdentification,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineQrCode,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlinePhoto,
  HiOutlineArrowPath,
} from "react-icons/hi2";

const PLAN_META = {
  GOLD:    { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Gold",   icon: HiOutlineSparkles, months: 6, price: 699, privilege: "Priority Admin Messaging, Consultation & Document Review" },
  PLATINUM:{ color: "#a855f7", bg: "rgba(168,85,247,0.1)", label: "Platinum", icon: HiOutlineTrophy, months: 12, price: 999, privilege: "All Features Completely Unlocked, 1-on-1 Video Meetings & Dedicated CA Manager" },
};

export default function MembershipManagePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [pendingCount, setPendingCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("requests"); // requests | plans | members
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [savingPlans, setSavingPlans] = useState(false);
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState(false);

  // Permission popup
  const [permissionModal, setPermissionModal] = useState(null); // { request, planType }
  const [customMessage, setCustomMessage] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [activating, setActivating] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const qrInputRef = useRef();

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchGlobalSettings = async () => {
    try {
      const res = await api.get("/Public/Membership/GlobalSettings");
      setMembershipEnabled(Boolean(res.data?.membershipEnabled));
    } catch {}
  };

  const handleToggleMaster = async () => {
    setTogglingMaster(true);
    try {
      const res = await api.post("/Admin/Membership/ToggleMaster", { enabled: !membershipEnabled });
      setMembershipEnabled(res.data.membershipEnabled);
      if (res.data.membershipEnabled) {
        toast.success("🌟 Membership System ACTIVATED! Tier features are now LIVE for clients.");
      } else {
        toast.success("⏸️ Membership System DEACTIVATED! Portal set to Initial Launch Mode (unrestricted, free client access).");
      }
    } catch {
      toast.error("Failed to toggle membership system status.");
    } finally {
      setTogglingMaster(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Admin/Membership/Requests?status=${filter}`);
      setRequests(res.data || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/Admin/Membership/PendingCount");
      setPendingCount(res.data.count || 0);
    } catch {}
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get("/Admin/Membership/Plans");
      const filtered = (res.data || []).filter(p => p.planTier !== "SILVER");
      setPlans(filtered);
    } catch {}
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/Admin/Membership/ActiveMembers");
      setMembers(res.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchRequests();
    fetchPendingCount();
    fetchPlans();
    fetchMembers();
    // Live update every 15 seconds so incoming requests update live on admin screen
    const interval = setInterval(() => {
      fetchRequests();
      fetchPendingCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  // ── QR File handler
  const handleQrFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
  };

  const getPlanDetails = (tier) => {
    const defaultMeta = PLAN_META[tier] || PLAN_META.GOLD;
    const planData = plans.find((p) => p.planTier === tier);
    return {
      label: planData?.displayName || defaultMeta.label,
      price: (planData?.price !== undefined && planData?.price !== null && planData?.price !== "") ? planData.price : defaultMeta.price,
      months: (planData?.durationMonths !== undefined && planData?.durationMonths !== null && planData?.durationMonths !== "") ? planData.durationMonths : defaultMeta.months,
      color: defaultMeta.color,
      bg: defaultMeta.bg,
      icon: defaultMeta.icon,
      privilege: defaultMeta.privilege,
    };
  };

  const buildDefaultMessage = (req, tier) => {
    const selectedTier = tier || req?.planType || "GOLD";
    const plan = getPlanDetails(selectedTier);
    return (
      `🎉 Dear ${req?.fullName || "Valued Client"},\n\n` +
      `Your *${plan.label} Membership* at Sri Kathiravan & Co has been approved!\n\n` +
      `💳 Plan: ${plan.label}\n` +
      `💰 Amount: ₹${plan.price}\n` +
      `📅 Duration: ${plan.months} Month(s)\n\n` +
      `Please complete the payment using the attached QR code and reply with your payment screenshot. Contact us for any queries.\n\n` +
      `— Sri Kathiravan & Co (Chartered Accountants)`
    );
  };

  const openPermissionModal = (req) => {
    const tier = req?.planType && req.planType !== "SILVER" ? req.planType : "GOLD";
    setPermissionModal({ request: req, planType: tier });
    setCustomMessage(buildDefaultMessage(req, tier));
    setAdminNote("");
    setQrFile(null);
    setQrPreview(null);
  };

  // ── Send WhatsApp
  const sendWhatsApp = (req) => {
    const raw = (req?.mobile || "").replace(/\D/g, "");
    const cleanMobile = raw.length === 10 ? `91${raw}` : raw.startsWith("91") ? raw : `91${raw}`;
    const msg = encodeURIComponent(customMessage || buildDefaultMessage(req, permissionModal?.planType));
    toast.success("Opening WhatsApp chat! Tip: You can paste the message & attach your QR code.", { duration: 5000 });
    window.open(`https://wa.me/${cleanMobile}?text=${msg}`, "_blank");
  };

  // ── Send Native Email Client (mailto)
  const sendMailTo = (req) => {
    const tier = permissionModal?.planType || req?.planType || "GOLD";
    const plan = getPlanDetails(tier);
    const subject = encodeURIComponent(`🎉 Membership Approved – Sri Kathiravan & Co (${plan.label} Plan)`);
    const body = encodeURIComponent(customMessage || buildDefaultMessage(req, tier));
    window.open(`mailto:${req.email}?subject=${subject}&body=${body}`, "_blank");
  };

  // ── Copy Message to Clipboard
  const copyMessageToClipboard = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    toast.success("Default text message copied to clipboard!");
  };

  // ── Send Email & Activate
  const handleActivate = async () => {
    const req = permissionModal?.request;
    if (!req) return;
    setActivating(true);
    try {
      const planType = permissionModal.planType || req.planType || "SILVER";
      const noteToSend = adminNote?.trim() || customMessage?.trim() || "";
      const res = await api.post(`/Admin/Membership/Activate/${req.id}`, { planType, adminNote: noteToSend });
      toast.success(res.data?.message || `${planType} membership activated! Email sent to ${req.email}`);
      setPermissionModal(null);
      setAdminNote("");
      setQrFile(null);
      setQrPreview(null);
      fetchRequests();
      fetchPendingCount();
      fetchMembers();
    } catch (err) {
      console.error("Failed to activate membership:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to activate membership";
      toast.error(msg);
    } finally {
      setActivating(false);
    }
  };

  // ── Reject
  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await api.post(`/Admin/Membership/Reject/${rejectModal.id}`, { reason: rejectReason });
      toast.success("Request rejected. Email sent.");
      setRejectModal(null);
      setRejectReason("");
      fetchRequests();
      fetchPendingCount();
    } catch {
      toast.error("Failed to reject request");
    }
  };

  // ── Save plans
  const handleSavePlans = async () => {
    setSavingPlans(true);
    try {
      await api.put("/Admin/Membership/Plans", plans);
      toast.success("Membership plans updated! Automated message amount and duration synchronized.");
      fetchPlans();
    } catch {
      toast.error("Failed to save plans");
    } finally {
      setSavingPlans(false);
    }
  };

  const updatePlan = (tier, field, value) => {
    setPlans(prev => prev.map(p =>
      p.planTier === tier ? { ...p, [field]: value } : p
    ));
  };

  return (
    <div className="mm-container">
      <style>{`
        .mm-container { padding: 24px; font-family: 'Inter', sans-serif; }
        .mm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 12px; }
        .mm-title { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; color: #111827; }
        .mm-badge { background: #ef4444; color: #fff; border-radius: 100px; padding: 2px 9px; font-size: 12px; font-weight: 700; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .mm-tabs { display: flex; gap: 6px; background: #f3f4f6; border-radius: 12px; padding: 4px; margin-bottom: 24px; flex-wrap: wrap; }
        .mm-tab { flex: 1; min-width: 100px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.2s; white-space: nowrap; }
        .mm-tab.active { background: #fff; color: #111827; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        .mm-filter-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .mm-filter-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #4b5563; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .mm-filter-btn.active { background: #1e293b; color: #fff; border-color: #1e293b; }
        .mm-refresh-btn { margin-left: auto; padding: 7px 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #4b5563; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .mm-requests { display: flex; flex-direction: column; gap: 12px; }
        .mm-req-card { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; transition: box-shadow 0.2s; }
        .mm-req-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .mm-req-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; }
        .mm-req-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mm-req-info { flex: 1; min-width: 0; }
        .mm-req-name { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 3px; }
        .mm-req-meta { font-size: 12px; color: #6b7280; }
        .mm-req-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .mm-plan-badge { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
        .mm-status-badge { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
        .mm-req-body { padding: 0 20px 20px; border-top: 1px solid #f3f4f6; }
        .mm-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
        .mm-detail-item { font-size: 13px; color: #6b7280; }
        .mm-detail-item strong { display: block; font-size: 13px; color: #111827; font-weight: 600; margin-top: 2px; }
        .mm-req-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
        .mm-btn { padding: 9px 18px; border-radius: 9px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .mm-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .mm-btn-approve { background: linear-gradient(135deg,#059669,#047857); color:#fff; }
        .mm-btn-reject { background: #fee2e2; color: #b91c1c; }
        .mm-btn-whatsapp { background: #dcfce7; color: #15803d; }
        .mm-empty { text-align: center; padding: 60px 20px; color: #9ca3af; }
        /* Permission modal */
        .mm-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .mm-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.4); }
        .mm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
        .mm-modal-title { font-size: 18px; font-weight: 800; color: #111827; }
        .mm-modal-close { background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 6px; }
        .mm-modal-body { padding: 24px; }
        .mm-modal-plan-select { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .mm-modal-plan-btn { flex: 1; min-width: 90px; padding: 10px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; font-size: 12px; font-weight: 700; text-align: center; transition: all 0.2s; background: #f9fafb; }
        .mm-modal-plan-btn.active { background: #f0fdf4; }
        .mm-qr-upload { border: 2px dashed #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; margin-bottom: 16px; transition: border-color 0.2s; }
        .mm-qr-upload:hover { border-color: #6366f1; }
        .mm-qr-preview { max-height: 160px; border-radius: 8px; margin-top: 10px; }
        .mm-note-input { width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-family: inherit; resize: vertical; outline: none; margin-bottom: 16px; }
        .mm-note-input:focus { border-color: #6366f1; }
        .mm-modal-actions { display: flex; flex-direction: column; gap: 10px; }
        .mm-wa-btn { padding: 13px; background: #22c55e; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .mm-email-btn { padding: 13px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .mm-activate-btn { padding: 13px; background: linear-gradient(135deg,#059669,#047857); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        /* Plans tab */
        .mm-plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .mm-plan-editor { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; padding: 22px; }
        .mm-plan-editor-title { font-size: 16px; font-weight: 800; margin: 0 0 16px; }
        .mm-plan-field { margin-bottom: 12px; }
        .mm-plan-field label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; }
        .mm-plan-field input { width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; }
        .mm-plan-field input:focus { border-color: #6366f1; }
        .mm-save-plans-btn { padding: 11px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
        /* Members tab */
        .mm-members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .mm-member-card { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; padding: 20px; }
        .mm-member-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .mm-member-name { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .mm-member-email { font-size: 12px; color: #6b7280; margin: 0 0 12px; }
        .mm-member-expiry { font-size: 12px; color: #6b7280; margin-top: 8px; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="mm-header">
        <div className="mm-title">
          <HiOutlineIdentification size={26} color="#4f46e5" />
          Membership Control
          {pendingCount > 0 && <span className="mm-badge">{pendingCount} New</span>}
        </div>
      </div>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
        Review requests, activate plans, configure tiers, and manage active members.
      </p>

      {/* ── MASTER SYSTEM TOGGLE BANNER ────────────────────── */}
      <div style={{
        background: membershipEnabled
          ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
          : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        borderRadius: "16px",
        padding: "20px 24px",
        color: "#ffffff",
        marginBottom: "24px",
        border: membershipEnabled ? "2px solid #10b981" : "2px solid #475569",
        boxShadow: membershipEnabled
          ? "0 10px 30px rgba(16, 185, 129, 0.25)"
          : "0 10px 30px rgba(15, 23, 42, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        transition: "all 0.3s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "260px", flex: 1 }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            background: membershipEnabled ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.15)",
            border: membershipEnabled ? "1.5px solid #34d399" : "1.5px solid #64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0
          }}>
            {membershipEnabled ? "🌟" : "⏸️"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", letterSpacing: "-0.2px" ,color:"white"}}>
                {membershipEnabled ? "Membership System: ACTIVATED & LIVE" : "Membership System: DEACTIVATED (Initial Launch Mode)"}
              </h3>
              <span style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.5px",
                background: membershipEnabled ? "#10b981" : "#475569",
                color: "#ffffff"
              }}>
                {membershipEnabled ? "VIP GATING ACTIVE" : "100% FREE CLIENT ACCESS"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9, lineHeight: "1.4", maxWidth: "650px" }}>
              {membershipEnabled
                ? "Active membership tiers (Gold & Platinum) are currently displayed in the client portal. Clients can request upgrades for priority admin messaging and dedicated CA desk. (File Hub, Invoices, and Appointments remain free for all clients)."
                : "Initial Launch Mode is active. All membership pages, upgrade cards, and tier banners are hidden across the client portal. All registered clients have 100% free and unrestricted access."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleMaster}
          disabled={togglingMaster}
          style={{
            padding: "12px 24px",
            background: membershipEnabled
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #10b981, #059669)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: "800",
            cursor: togglingMaster ? "not-allowed" : "pointer",
            boxShadow: membershipEnabled
              ? "0 4px 14px rgba(239, 68, 68, 0.4)"
              : "0 4px 14px rgba(16, 185, 129, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
        >
          {togglingMaster ? (
            "Updating System..."
          ) : membershipEnabled ? (
            <>⏸️ Turn OFF Membership (Launch Mode)</>
          ) : (
            <>🚀 Turn ON Membership (Activate VIP)</>
          )}
        </button>
      </div>

      {/* ── TABS ───────────────────────────────────────── */}
      <div className="mm-tabs">
        {[
          { key: "requests", label: "Applications" },
          { key: "plans", label: "Plan Settings" },
          { key: "members", label: `Active Members (${members.length})` },
        ].map((t) => (
          <button key={t.key} className={`mm-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: REQUESTS ══════════════════ */}
      {activeTab === "requests" && (
        <>
          <div className="mm-filter-row">
            {["PENDING", "APPROVED", "REJECTED"].map((s) => (
              <button key={s} className={`mm-filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
            <button className="mm-refresh-btn" onClick={() => { fetchRequests(); fetchPendingCount(); }}>
              <HiOutlineArrowPath size={15} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="mm-empty">Loading applications...</div>
          ) : requests.length === 0 ? (
            <div className="mm-empty">
              <HiOutlineIdentification size={40} style={{ marginBottom: "10px", opacity: 0.3 }} />
              <p>No {filter.toLowerCase()} applications found.</p>
            </div>
          ) : (
            <div className="mm-requests">
              {requests.map((r) => {
                const planMeta = PLAN_META[r.planType] || PLAN_META.GOLD;
                const PlanIcon = planMeta.icon;
                const isExpanded = expandedId === r.id;
                const avatarColor = planMeta.color;

                return (
                  <div key={r.id} className="mm-req-card">
                    <div className="mm-req-header" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                      <div className="mm-req-avatar" style={{ background: avatarColor }}>
                        {(r.fullName || "?")[0].toUpperCase()}
                      </div>
                      <div className="mm-req-info">
                        <p className="mm-req-name">{r.fullName || "Unknown"}</p>
                        <p className="mm-req-meta">{r.email} • {r.mobile}</p>
                      </div>
                      <div className="mm-req-badges">
                        <span className="mm-plan-badge" style={{ background: planMeta.bg, color: planMeta.color }}>
                          <PlanIcon size={11} style={{ verticalAlign: "middle" }} /> {planMeta.label}
                        </span>
                        <span className="mm-status-badge" style={{
                          background: r.status === "APPROVED" ? "#dcfce7" : r.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                          color: r.status === "APPROVED" ? "#166534" : r.status === "REJECTED" ? "#991b1b" : "#92400e",
                        }}>{r.status}</span>
                        {isExpanded ? <HiOutlineChevronUp size={16} color="#6b7280" /> : <HiOutlineChevronDown size={16} color="#6b7280" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mm-req-body">
                        <div className="mm-detail-grid">
                          <div className="mm-detail-item">Business<strong>{r.businessName || "—"}</strong></div>
                          <div className="mm-detail-item">Type<strong>{r.businessType || "—"}</strong></div>
                          <div className="mm-detail-item">Location<strong>{r.location || "—"}</strong></div>
                          <div className="mm-detail-item">GST<strong>{r.gstnumber || "—"}</strong></div>
                          <div className="mm-detail-item">PAN<strong>{r.pannumber || "—"}</strong></div>
                          <div className="mm-detail-item">Applied<strong>{r.requestedAt ? new Date(r.requestedAt).toLocaleString("en-IN") : "—"}</strong></div>
                        </div>
                        {r.message && (
                          <p style={{ fontSize: "13px", color: "#6b7280", background: "#f9fafb", padding: "10px 14px", borderRadius: "8px" }}>
                            <em>"{r.message}"</em>
                          </p>
                        )}
                        {r.adminNote && (
                          <p style={{ fontSize: "13px", color: "#92400e", background: "#fef3c7", padding: "10px 14px", borderRadius: "8px", marginTop: "8px" }}>
                            <strong>Admin Note:</strong> {r.adminNote}
                          </p>
                        )}

                        {r.status === "PENDING" && (
                          <div className="mm-req-actions">
                            <button
                              className="mm-btn mm-btn-approve"
                              onClick={() => openPermissionModal(r)}
                            >
                              <HiOutlineCheckCircle size={16} /> Grant Permission
                            </button>
                            <button className="mm-btn mm-btn-whatsapp" onClick={() => sendWhatsApp(r)}>
                              <HiOutlineDevicePhoneMobile size={16} /> WhatsApp
                            </button>
                            <button className="mm-btn mm-btn-reject" onClick={() => setRejectModal(r)}>
                              <HiOutlineXCircle size={16} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════ TAB: PLAN SETTINGS ════════════ */}
      {activeTab === "plans" && (
        <div>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
            Configure active membership tiers (Gold & Platinum). Changes here update the plan settings used for new activations.
          </p>
          <div className="mm-plans-grid">
            {["GOLD", "PLATINUM"].map((tier) => {
              const meta = PLAN_META[tier];
              const planData = plans.find((p) => p.planTier === tier) || {};
              const PlanIcon = meta.icon;
              return (
                <div key={tier} className="mm-plan-editor" style={{ borderTop: `4px solid ${meta.color}` }}>
                  <p className="mm-plan-editor-title" style={{ color: meta.color }}>
                    <PlanIcon size={18} style={{ verticalAlign: "middle" }} /> {meta.label} Plan
                  </p>
                  <div className="mm-plan-field">
                    <label>Display Name</label>
                    <input value={planData.displayName || meta.label} onChange={(e) => updatePlan(tier, "displayName", e.target.value)} />
                  </div>
                  <div className="mm-plan-field">
                    <label>Price (₹)</label>
                    <input type="number" value={planData.price || meta.price} onChange={(e) => updatePlan(tier, "price", e.target.value)} />
                  </div>
                  <div className="mm-plan-field">
                    <label>Duration (months)</label>
                    <input type="number" value={planData.durationMonths || meta.months} onChange={(e) => updatePlan(tier, "durationMonths", e.target.value)} />
                  </div>
                  <div className="mm-plan-field">
                    <label>Features (comma-separated)</label>
                    <input value={planData.features || ""} onChange={(e) => updatePlan(tier, "features", e.target.value)} placeholder="Feature 1, Feature 2" />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mm-save-plans-btn" onClick={handleSavePlans} disabled={savingPlans}>
            {savingPlans ? "Saving..." : "Save Plan Settings"}
          </button>
        </div>
      )}

      {/* ══════════════ TAB: ACTIVE MEMBERS ══════════ */}
      {activeTab === "members" && (
        <div>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
            All clients with an active membership.
          </p>
          {members.length === 0 ? (
            <div className="mm-empty"><HiOutlineUser size={40} style={{ opacity: 0.3 }} /><p>No active members yet.</p></div>
          ) : (
            <div className="mm-members-grid">
              {members.map((m) => {
                const meta = PLAN_META[m.membershipPlan] || PLAN_META.GOLD;
                return (
                  <div key={m.id} className="mm-member-card" style={{ borderLeft: `4px solid ${meta.color}` }}>
                    <div className="mm-member-avatar" style={{ background: meta.color }}>
                      {(m.name || "?")[0].toUpperCase()}
                    </div>
                    <p className="mm-member-name">{m.name}</p>
                    <p className="mm-member-email">{m.email}</p>
                    <span className="mm-plan-badge" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label} Plan
                    </span>
                    <p className="mm-member-expiry">
                      Expires: {m.membershipExpiry ? new Date(m.membershipExpiry).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════ PERMISSION POPUP MODAL ══════ */}
      {permissionModal && (
        <div className="mm-modal-bg" onClick={(e) => e.target === e.currentTarget && setPermissionModal(null)}>
          <div className="mm-modal">
            <div className="mm-modal-header">
              <p className="mm-modal-title">🎯 Grant Membership Permission</p>
              <button className="mm-modal-close" onClick={() => setPermissionModal(null)}>
                <HiOutlineXMark size={22} />
              </button>
            </div>
            <div className="mm-modal-body">
              {/* Client info */}
              <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
                <p style={{ font: "700 14px Inter, sans-serif", color: "#111827", margin: "0 0 4px" }}>{permissionModal.request.fullName}</p>
                <p style={{ font: "400 13px Inter, sans-serif", color: "#6b7280", margin: 0 }}>{permissionModal.request.email} • {permissionModal.request.mobile}</p>
              </div>

              {/* Plan selector */}
              <p style={{ font: "600 13px Inter, sans-serif", color: "#374151", margin: "0 0 10px" }}>Select Membership Plan to Activate</p>
              <div className="mm-modal-plan-select">
                {["GOLD", "PLATINUM"].map((tier) => {
                  const planInfo = getPlanDetails(tier);
                  const isActive = permissionModal.planType === tier;
                  return (
                    <button
                      key={tier}
                      className={`mm-modal-plan-btn ${isActive ? "active" : ""}`}
                      style={isActive ? { borderColor: planInfo.color, color: planInfo.color } : {}}
                      onClick={() => {
                        const nextTier = tier;
                        setPermissionModal((prev) => ({ ...prev, planType: nextTier }));
                        setCustomMessage(buildDefaultMessage(permissionModal.request, nextTier));
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800 }}>{planInfo.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: isActive ? planInfo.color : "#111827" }}>₹{planInfo.price}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>{planInfo.months} mo.</div>
                    </button>
                  );
                })}
              </div>

              {/* Message to Client */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 6px" }}>
                <span style={{ font: "600 13px Inter, sans-serif", color: "#374151" }}>Default Text Message to Client</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setCustomMessage(buildDefaultMessage(permissionModal.request, permissionModal.planType))}
                    style={{ background: "none", border: "none", color: "#6366f1", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Default
                  </button>
                  <button
                    type="button"
                    onClick={copyMessageToClipboard}
                    style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "6px", color: "#374151", fontSize: "11px", fontWeight: 600, padding: "2px 8px", cursor: "pointer" }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <textarea
                className="mm-note-input"
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                style={{ fontSize: "12px", lineHeight: "1.5" }}
              />

              {/* QR Upload */}
              <p style={{ font: "600 13px Inter, sans-serif", color: "#374151", margin: "16px 0 8px" }}>
                <HiOutlineQrCode size={15} style={{ verticalAlign: "middle" }} /> Attach Payment QR (from system)
              </p>
              <div className="mm-qr-upload" onClick={() => qrInputRef.current?.click()}>
                {qrPreview ? (
                  <div>
                    <img src={qrPreview} alt="QR Preview" className="mm-qr-preview" />
                    <p style={{ color: "#059669", fontSize: "12px", fontWeight: 700, margin: "6px 0 0" }}>✓ QR image selected (click to change)</p>
                  </div>
                ) : (
                  <>
                    <HiOutlinePhoto size={32} color="#9ca3af" />
                    <p style={{ color: "#9ca3af", margin: "8px 0 0", fontSize: "13px" }}>Click to upload QR image from your system files</p>
                  </>
                )}
                <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrFile} />
              </div>

              {/* Action buttons */}
              <div className="mm-modal-actions">
                <button className="mm-wa-btn" onClick={() => sendWhatsApp(permissionModal.request)}>
                  <HiOutlineDevicePhoneMobile size={18} /> Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => sendMailTo(permissionModal.request)}
                  style={{
                    padding: "13px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <HiOutlineEnvelope size={18} /> Open in Email App (mailto)
                </button>
                <button className="mm-email-btn" onClick={handleActivate} disabled={activating}>
                  <HiOutlinePaperAirplane size={18} />
                  {activating ? "Activating..." : "Activate Plan & Send Automated Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ REJECT MODAL ══════ */}
      {rejectModal && (
        <div className="mm-modal-bg" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="mm-modal" style={{ maxWidth: "420px" }}>
            <div className="mm-modal-header">
              <p className="mm-modal-title">Reject Application</p>
              <button className="mm-modal-close" onClick={() => setRejectModal(null)}><HiOutlineXMark size={22} /></button>
            </div>
            <div className="mm-modal-body">
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
                Provide a reason for rejecting <strong>{rejectModal.fullName}'s</strong> application. This will be emailed to them.
              </p>
              <textarea
                className="mm-note-input"
                rows={4}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "11px", background: "#f3f4f6", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleReject} style={{ flex: 2, padding: "11px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700 }}>
                  Reject & Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
