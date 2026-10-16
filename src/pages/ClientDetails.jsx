import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import "../styles/ClientDetails.css";
import {
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineKey,
  HiOutlineFolderArrowDown,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineStar,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocument,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTag,
  HiXMark,
  HiOutlineSparkles,
  HiOutlineTrash,
} from "react-icons/hi2";
import DynamicField from "../components/DynamicFormFiled";
import LoadingAnimation2 from "../components/LoadingAnimation2";

export default function ClientDetails({ isStaff = false }) {
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState("existing"); // 'existing' | 'new'

  // Data state
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClientId, setExpandedClientId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE | MEMBER

  // Form Versions & Dynamic Schema State
  const [formVersions, setFormVersions] = useState([]);
  const [selectedFormVersion, setSelectedFormVersion] = useState("");
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicFormData, setDynamicFormData] = useState({});
  const [loadingDynamicFields, setLoadingDynamicFields] = useState(false);

  // New Client Form state
  const [formData, setFormData] = useState({
    name: "",
    legalname: "",
    mobile: "",
    email: "",
    gstnumber: "",
    pannumber: "",
    location: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Modal State
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editDynamicData, setEditDynamicData] = useState({});
  const [editSelectedVersion, setEditSelectedVersion] = useState("");
  const [editDynamicFields, setEditDynamicFields] = useState([]);
  const [loadingEditFields, setLoadingEditFields] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Load Form Versions
  const fetchFormVersions = async () => {
    try {
      const res = await api.get("/Admin/ClientForm/Versions");
      const vList = (Array.isArray(res.data) ? res.data : []).map(Number).sort((a, b) => a - b);
      setFormVersions(vList);
      if (vList.length > 0) {
        setSelectedFormVersion(String(vList[vList.length - 1]));
      }
    } catch (err) {
      console.error("Error fetching form versions:", err);
    }
  };

  // Load dynamic fields when selectedFormVersion changes (for Register form)
  useEffect(() => {
    if (!selectedFormVersion) {
      setDynamicFields([]);
      return;
    }
    const fetchFields = async () => {
      setLoadingDynamicFields(true);
      try {
        const res = await api.get("/Admin/ClientForm/Fields", {
          params: { formversion: Number(selectedFormVersion) },
        });
        setDynamicFields(res.data || []);
      } catch (err) {
        console.error("Error fetching fields:", err);
        setDynamicFields([]);
      } finally {
        setLoadingDynamicFields(false);
      }
    };
    fetchFields();
  }, [selectedFormVersion]);

  // Fetch all clients from backend
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/Clients");
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load client directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchFormVersions();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.active !== false).length;
    const members = clients.filter((c) => c.membershipStatus === "MEMBER").length;
    const gstCount = clients.filter((c) => c.gstnumber && c.gstnumber.trim()).length;
    return { total, active, members, gstCount };
  }, [clients]);

  // Filter clients based on universal search & status filter
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Status filter
      if (statusFilter === "ACTIVE" && c.active === false) return false;
      if (statusFilter === "INACTIVE" && c.active !== false) return false;
      if (statusFilter === "MEMBER" && c.membershipStatus !== "MEMBER") return false;

      // Search query across name, legalname, mobile, email, gst, pan, location
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const nameMatch = c.name?.toLowerCase().includes(q);
      const legalMatch = c.legalname?.toLowerCase().includes(q);
      const mobileMatch = c.mobile?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const gstMatch = c.gstnumber?.toLowerCase().includes(q);
      const panMatch = c.pannumber?.toLowerCase().includes(q);
      const locMatch = c.location?.toLowerCase().includes(q);

      return nameMatch || legalMatch || mobileMatch || emailMatch || gstMatch || panMatch || locMatch;
    });
  }, [clients, searchQuery, statusFilter]);

  // Toggle card expansion
  const toggleExpand = (id) => {
    setExpandedClientId((prev) => (prev === id ? null : id));
  };

  // Toggle client active/deactivate
  const handleToggleActive = async (e, clientId, currentActive) => {
    e.stopPropagation();
    const action = currentActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this client account?`)) return;

    try {
      const res = await api.post(`/Admin/Client/ToggleActive/${clientId}`);
      if (res.data?.status === "success") {
        toast.success(`Client ${currentActive ? "deactivated" : "activated"} successfully`);
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, active: res.data.active } : c))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update client status");
    }
  };

  // Copy to clipboard helper
  const handleCopy = (e, text, label) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  // Auto-generate temporary password
  const handleGeneratePassword = () => {
    const mobileDigits = formData.mobile.replace(/\D/g, "");
    let pass;
    if (mobileDigits.length >= 4) {
      pass = mobileDigits.slice(-4) + "2026";
    } else {
      pass = "SKC@" + Math.floor(1000 + Math.random() * 9000);
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    toast.success(`Generated Temporary Password: ${pass}`);
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let formattedVal = value;
    if (name === "gstnumber" || name === "pannumber") {
      formattedVal = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [name]: formattedVal }));
  };

  // Submit New Client Registration
  const handleRegisterClient = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter the client's full name");
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        legalname: formData.legalname.trim() || formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        gstnumber: formData.gstnumber.trim().toUpperCase(),
        pannumber: formData.pannumber.trim().toUpperCase(),
        location: formData.location.trim(),
        password: formData.password.trim(),
        formversion: selectedFormVersion ? Number(selectedFormVersion) : null,
        customFields: dynamicFormData,
      };

      const res = await api.post("/register/Client", payload);

      if (res.data?.status === "success") {
        toast.success(`Client "${formData.name}" successfully registered!`);

        // Reset form
        setFormData({
          name: "",
          legalname: "",
          mobile: "",
          email: "",
          gstnumber: "",
          pannumber: "",
          location: "",
          password: "",
        });
        setDynamicFormData({});

        // Refresh clients list & switch to existing tab
        await fetchClients();
        setActiveTab("existing");

        if (res.data.client?.id) {
          setExpandedClientId(res.data.client.id);
        }
      } else {
        toast.error(res.data?.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to register client. Please check details.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Client Modal
  const handleOpenEditModal = async (client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name || "",
      legalname: client.legalname || "",
      mobile: client.mobile || "",
      email: client.email || "",
      gstnumber: client.gstnumber || "",
      pannumber: client.pannumber || "",
      location: client.location || "",
      membershipStatus: client.membershipStatus || "NONE",
    });

    const clientV = client.formversion ? String(client.formversion) : (formVersions[0] ? String(formVersions[0]) : "1");
    setEditSelectedVersion(clientV);

    // Parse custom fields if present
    let parsedCustom = {};
    if (client.customFields) {
      try {
        if (typeof client.customFields === "string") {
          parsedCustom = JSON.parse(client.customFields);
        } else if (typeof client.customFields === "object") {
          parsedCustom = client.customFields;
        }
      } catch (e) {
        console.warn("Could not parse custom fields JSON", e);
      }
    }
    setEditDynamicData(parsedCustom);

    // Fetch fields for this version
    setLoadingEditFields(true);
    try {
      const res = await api.get("/Admin/ClientForm/Fields", {
        params: { formversion: Number(clientV) },
      });
      setEditDynamicFields(res.data || []);
    } catch (err) {
      console.error(err);
      setEditDynamicFields([]);
    } finally {
      setLoadingEditFields(false);
    }
  };

  // When editSelectedVersion changes in modal
  const handleEditVersionChange = async (newV) => {
    setEditSelectedVersion(newV);
    setLoadingEditFields(true);
    try {
      const res = await api.get("/Admin/ClientForm/Fields", {
        params: { formversion: Number(newV) },
      });
      setEditDynamicFields(res.data || []);
    } catch (err) {
      console.error(err);
      setEditDynamicFields([]);
    } finally {
      setLoadingEditFields(false);
    }
  };

  // Save Client Edit Updates
  const handleSaveClientEdit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    setSavingEdit(true);
    try {
      const updatePayload = {
        name: editFormData.name.trim(),
        legalname: editFormData.legalname.trim() || editFormData.name.trim(),
        mobile: editFormData.mobile.trim(),
        email: editFormData.email.trim().toLowerCase(),
        gstnumber: editFormData.gstnumber.trim().toUpperCase(),
        pannumber: editFormData.pannumber.trim().toUpperCase(),
        location: editFormData.location.trim(),
        membershipStatus: editFormData.membershipStatus,
        formversion: editSelectedVersion ? Number(editSelectedVersion) : null,
        customFields: editDynamicData,
      };

      const res = await api.put(`/Admin/Client/Update/${editingClient.id}`, updatePayload);
      if (res.data?.status === "success") {
        toast.success("Client details updated successfully!");
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? res.data.client : c))
        );
        setEditingClient(null);
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.message || "Failed to update client");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Client
  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete client "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/Client/Delete/${id}`);
      toast.success(`Client "${name}" deleted successfully.`);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete client");
    }
  };

  // Parse custom fields helper for card view
  const parseClientCustomFields = (customFields) => {
    if (!customFields) return [];
    try {
      const obj = typeof customFields === "string" ? JSON.parse(customFields) : customFields;
      return Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "");
    } catch {
      return [];
    }
  };

  return (
    <div className="client-mgmt-container">
      {/* ─── PAGE HEADER ────────────────────────────────────────────── */}
      <div className="client-mgmt-header">
        <div>
          <h1>
            <HiOutlineUsers color="#4f46e5" size={32} /> Client Management Hub
          </h1>
          <p>
            Centralized directory for auditing client profiles, dynamic attributes, tax credentials, and portal accounts.
          </p>
        </div>

        {!isStaff && (
          <button
            type="button"
            className="header-action-btn"
            onClick={() => navigate("/Admin/EditClientForm")}
            id="form-settings-btn"
          >
            <HiOutlineCog6Tooth size={18} /> Form Settings
          </button>
        )}
      </div>

      {/* ─── QUICK METRICS ───────────────────────────────────────────── */}
      <div className="client-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
            <HiOutlineUsers />
          </div>
          <div className="stat-metric-info">
            <span className="stat-metric-val">{stats.total}</span>
            <span className="stat-metric-label">Total Clients</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "#ecfdf5", color: "#16a34a" }}>
            <HiOutlineCheckCircle />
          </div>
          <div className="stat-metric-info">
            <span className="stat-metric-val">{stats.active}</span>
            <span className="stat-metric-label">Active Portals</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <HiOutlineBuildingOffice2 />
          </div>
          <div className="stat-metric-info">
            <span className="stat-metric-val">{stats.gstCount}</span>
            <span className="stat-metric-label">GST Registered</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}>
            <HiOutlineStar />
          </div>
          <div className="stat-metric-info">
            <span className="stat-metric-val">{stats.members}</span>
            <span className="stat-metric-label">Active Members</span>
          </div>
        </div>
      </div>

      {/* ─── SEGMENTED NAVIGATION TABS ───────────────────────────────── */}
      <div className="client-tabs-nav">
        <button
          type="button"
          className={`tab-item-btn ${activeTab === "existing" ? "active" : ""}`}
          onClick={() => setActiveTab("existing")}
          id="tab-existing-clients"
        >
          <HiOutlineUsers size={18} />
          <span>Existing Clients</span>
          <span className="tab-counter-badge">{clients.length}</span>
        </button>

        {!isStaff && (
          <button
            type="button"
            className={`tab-item-btn ${activeTab === "new" ? "active" : ""}`}
            onClick={() => setActiveTab("new")}
            id="tab-register-client"
          >
            <HiOutlineUserPlus size={18} />
            <span>Register New Client</span>
          </button>
        )}
      </div>

      {/* ─── TAB 1: EXISTING CLIENTS DIRECTORY ─────────────────────────── */}
      {activeTab === "existing" && (
        <div className="client-directory-section">
          {/* Universal Search & Status Filters */}
          <div className="client-search-filter-card">
            <div className="search-bar-wrap">
              <HiOutlineMagnifyingGlass className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by client name, legal entity, mobile, email, GSTIN, or PAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-field"
                id="client-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-chips-row">
              <div className="chips-group">
                <button
                  type="button"
                  className={`filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  All ({clients.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${statusFilter === "ACTIVE" ? "active" : ""}`}
                  onClick={() => setStatusFilter("ACTIVE")}
                >
                  Active ({stats.active})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${statusFilter === "INACTIVE" ? "active" : ""}`}
                  onClick={() => setStatusFilter("INACTIVE")}
                >
                  Deactivated ({stats.total - stats.active})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${statusFilter === "MEMBER" ? "active" : ""}`}
                  onClick={() => setStatusFilter("MEMBER")}
                >
                  Members ({stats.members})
                </button>
              </div>

              <div className="search-meta-results">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>

          {/* Client List Cards */}
          {loading ? (
            <div className="client-loading-state">
              <LoadingAnimation2 />
              <p>Loading clients directory...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="client-empty-state">
              <HiOutlineUsers size={48} color="#94a3b8" />
              <h3>No matching clients found</h3>
              <p>Try refining your search term or filter parameters.</p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn-reset-search"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="client-cards-container">
              {filteredClients.map((client) => {
                const isExpanded = expandedClientId === client.id;
                const initials = client.name
                  ? client.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "CL";

                const customAttributes = parseClientCustomFields(client.customFields);

                return (
                  <div
                    key={client.id}
                    className={`client-card ${isExpanded ? "expanded" : ""} ${
                      client.active === false ? "card-deactivated" : ""
                    }`}
                  >
                    {/* Collapsible Card Header - Basic Details */}
                    <div
                      className="client-card-header"
                      onClick={() => toggleExpand(client.id)}
                    >
                      <div className="client-header-primary">
                        <div className="client-avatar-badge">{initials}</div>

                        <div className="client-name-block">
                          <h3 className="client-full-name">{client.name}</h3>
                          <span className="client-legal-name">
                            {client.legalname || "Individual Account"}
                          </span>
                        </div>
                      </div>

                      {/* Header Quick Details Badges */}
                      <div className="client-header-pills">
                        {client.mobile && (
                          <div
                            className="detail-pill"
                            onClick={(e) => handleCopy(e, client.mobile, "Mobile Number")}
                            title="Click to copy Mobile"
                          >
                            <HiOutlinePhone size={14} />
                            <span>{client.mobile}</span>
                            <HiOutlineClipboardDocument className="copy-icon" size={13} />
                          </div>
                        )}

                        {client.email && (
                          <div
                            className="detail-pill"
                            onClick={(e) => handleCopy(e, client.email, "Email Address")}
                            title="Click to copy Email"
                          >
                            <HiOutlineEnvelope size={14} />
                            <span>{client.email}</span>
                            <HiOutlineClipboardDocument className="copy-icon" size={13} />
                          </div>
                        )}

                        {client.gstnumber && (
                          <div
                            className="detail-pill pill-gst"
                            onClick={(e) => handleCopy(e, client.gstnumber, "GSTIN")}
                            title="Click to copy GST Number"
                          >
                            <HiOutlineBuildingOffice2 size={14} />
                            <span>{client.gstnumber}</span>
                            <HiOutlineClipboardDocument className="copy-icon" size={13} />
                          </div>
                        )}
                      </div>

                      {/* Status Badges & Toggle */}
                      <div className="client-header-end">
                        <div className="status-badges-group">
                          {client.active !== false ? (
                            <span className="badge-active">● Active</span>
                          ) : (
                            <span className="badge-inactive">● Deactivated</span>
                          )}

                          {client.temppass && (
                            <span className="badge-temppass" title="Using temporary login password">
                              🔑 Temp Pass
                            </span>
                          )}

                          {client.membershipStatus === "MEMBER" && (
                            <span className="badge-member">⭐ Member</span>
                          )}

                          {client.formversion && (
                            <span className="badge-version">v{client.formversion}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-accordion-toggle"
                          aria-label="Expand client details"
                        >
                          {isExpanded ? (
                            <>
                              <span>Hide Details</span> <HiOutlineChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              <span>View Details</span> <HiOutlineChevronDown size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Card Body - Additional Details Dropdown */}
                    {isExpanded && (
                      <div className="client-card-dropdown">
                        <div className="dropdown-details-grid">
                          <div className="detail-metric-box">
                            <span className="detail-metric-label">
                              <HiOutlineIdentification size={15} /> PAN NUMBER
                            </span>
                            <div className="detail-metric-val">
                              {client.pannumber ? (
                                <span
                                  className="clickable-code"
                                  onClick={(e) => handleCopy(e, client.pannumber, "PAN Number")}
                                >
                                  {client.pannumber}
                                </span>
                              ) : (
                                <span className="val-not-set">Not Provided</span>
                              )}
                            </div>
                          </div>

                          <div className="detail-metric-box">
                            <span className="detail-metric-label">
                              <HiOutlineMapPin size={15} /> LOCATION / CITY
                            </span>
                            <div className="detail-metric-val">
                              {client.location || <span className="val-not-set">Not Specified</span>}
                            </div>
                          </div>

                          <div className="detail-metric-box">
                            <span className="detail-metric-label">
                              <HiOutlineCalendar size={15} /> REGISTERED DATE
                            </span>
                            <div className="detail-metric-val">
                              {client.createdAt
                                ? new Date(client.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "14 Oct 2026"}
                            </div>
                          </div>

                          <div className="detail-metric-box">
                            <span className="detail-metric-label">
                              <HiOutlineKey size={15} /> LOGIN PASSWORD STATUS
                            </span>
                            <div className="detail-metric-val" style={{ fontFamily: "inherit", fontSize: "0.88rem" }}>
                              {client.temppass ? (
                                <span style={{ color: "#c2410c", fontWeight: "600" }}>
                                  ⚠️ Pending First Login Password Change
                                </span>
                              ) : (
                                <span style={{ color: "#16a34a", fontWeight: "600" }}>
                                  ✅ Permanent Password Configured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Custom Fields Section (if client has custom attributes) */}
                        {customAttributes.length > 0 && (
                          <div className="client-custom-attributes-section">
                            <div className="custom-attributes-header">
                              <HiOutlineTag size={16} color="#7c3aed" />
                              <span>Custom Dynamic Attributes (Form Version {client.formversion || "1"})</span>
                            </div>
                            <div className="custom-attributes-grid">
                              {customAttributes.map(([key, value]) => (
                                <div key={key} className="custom-attribute-card">
                                  <span className="custom-attr-key">
                                    {key.replace(/_/g, " ").toUpperCase()}
                                  </span>
                                  <span className="custom-attr-val">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Action Toolbar for This Client */}
                        <div className="client-card-actions">
                          {!isStaff && (
                            <button
                              type="button"
                              className="btn-client-action btn-edit-details"
                              onClick={() => handleOpenEditModal(client)}
                              id={`edit-client-btn-${client.id}`}
                            >
                              <HiOutlinePencilSquare size={16} /> Edit Client Details
                            </button>
                          )}

                          {!isStaff && (
                            <button
                              type="button"
                              className={`btn-client-action btn-toggle-active ${
                                client.active === false ? "reactivate" : ""
                              }`}
                              onClick={(e) => handleToggleActive(e, client.id, client.active !== false)}
                            >
                              {client.active !== false ? (
                                <>
                                  <HiOutlineXCircle size={16} /> Deactivate Account
                                </>
                              ) : (
                                <>
                                  <HiOutlineCheckCircle size={16} /> Activate Account
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-client-action btn-view-files"
                            onClick={() =>
                              navigate(
                                `${isStaff ? "/Staff" : "/Admin"}/FileManagement?category=ALL&search=${encodeURIComponent(
                                  client.name
                                )}`
                              )
                            }
                          >
                            <HiOutlineDocumentText size={16} /> View Client Files
                          </button>

                          <button
                            type="button"
                            className="btn-client-action btn-upload-file"
                            onClick={() =>
                              navigate(
                                `${isStaff ? "/Staff" : "/Admin"}/FileManagement?openUpload=true&clientId=${client.id}&clientName=${encodeURIComponent(
                                  client.name
                                )}&clientMobile=${encodeURIComponent(client.mobile || "")}&clientEmail=${encodeURIComponent(
                                  client.email || ""
                                )}&clientGst=${encodeURIComponent(client.gstnumber || "")}&category=GST`
                              )
                            }
                          >
                            <HiOutlineFolderArrowDown size={16} /> Upload New Document
                          </button>

                          {!isStaff && (
                            <button
                              type="button"
                              className="btn-client-action btn-delete-client"
                              style={{ color: "#ef4444", borderColor: "#fecaca" }}
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              title="Delete Client"
                            >
                              <HiOutlineTrash size={16} /> Delete Client
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: REGISTER NEW CLIENT FORM ───────────────────────────── */}
      {activeTab === "new" && (
        <div className="new-client-card">
          <form onSubmit={handleRegisterClient}>
            {/* Section 1: Contact Information */}
            <h3 className="form-section-title">
              <HiOutlineUsers size={20} color="#4f46e5" /> 1. Primary Contact Information
            </h3>
            <div className="form-fields-grid">
              <div className="form-field-group">
                <label>
                  Client Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Aravind Kumar"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>
                  Mobile Number (10 Digits) <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  maxLength="10"
                  value={formData.mobile}
                  onChange={handleFormChange}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>
                  Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g. client@example.com"
                  required
                />
              </div>
            </div>

            {/* Section 2: Business & Tax Profile */}
            <h3 className="form-section-title">
              <HiOutlineBuildingOffice2 size={20} color="#4f46e5" /> 2. Business & Tax Profile
            </h3>
            <div className="form-fields-grid">
              <div className="form-field-group">
                <label>Legal / Business / Trade Name</label>
                <input
                  type="text"
                  name="legalname"
                  value={formData.legalname}
                  onChange={handleFormChange}
                  placeholder="Company, Organization, or Shop Name"
                />
              </div>

              <div className="form-field-group">
                <label>GST Number (15 Characters)</label>
                <input
                  type="text"
                  name="gstnumber"
                  maxLength="15"
                  value={formData.gstnumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                />
              </div>

              <div className="form-field-group">
                <label>PAN Number (10 Characters)</label>
                <input
                  type="text"
                  name="pannumber"
                  maxLength="10"
                  value={formData.pannumber}
                  onChange={handleFormChange}
                  placeholder="e.g. ABCDE1234F"
                />
              </div>

              <div className="form-field-group">
                <label>Registered Location / City</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="e.g. Chennai, Tamil Nadu"
                />
              </div>
            </div>

            {/* Section 3: Portal Access & Credentials */}
            <h3 className="form-section-title">
              <HiOutlineKey size={20} color="#4f46e5" /> 3. Portal Security & Temporary Password
            </h3>
            <div className="form-fields-grid" style={{ marginBottom: "14px" }}>
              <div className="form-field-group" style={{ gridColumn: "span 2" }}>
                <label>Temporary Sign-In Password</label>
                <div className="password-input-row">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Enter or auto-generate password"
                  />
                  <button
                    type="button"
                    className="btn-generate-pass"
                    onClick={handleGeneratePassword}
                  >
                    ⚡ Auto-Generate
                  </button>
                  <button
                    type="button"
                    className="btn-generate-pass"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <div className="temp-pass-callout">
              <HiOutlineKey size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Temporary Password Enforcement:</strong> When this client logs in for
                the first time using their temporary password, our security layer automatically
                requires them to create their own permanent password before accessing files and documents.
              </div>
            </div>

            {/* ─── SECTION 4: ADDITIONAL INFO (DYNAMIC CUSTOM FIELDS) ─── */}
            <div className="form-section-dynamic">
              <div className="section-4-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <HiOutlineTag size={20} color="#7c3aed" />
                  <h3 className="form-section-title" style={{ margin: 0 }}>
                    4. Additional Information (Custom Dynamic Fields)
                  </h3>
                </div>

                <div className="section-4-version-selector">
                  <label htmlFor="regFormVersion">Form Version:</label>
                  <select
                    id="regFormVersion"
                    value={selectedFormVersion}
                    onChange={(e) => setSelectedFormVersion(e.target.value)}
                    className="reg-version-select"
                  >
                    {formVersions.length === 0 ? (
                      <option value="">No versions available</option>
                    ) : (
                      formVersions.map((v) => (
                        <option key={v} value={String(v)}>
                          Version {v}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {loadingDynamicFields ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <LoadingAnimation2 />
                  <p style={{ fontSize: "13px", color: "#64748b" }}>Loading schema fields for Version {selectedFormVersion}...</p>
                </div>
              ) : dynamicFields.length === 0 ? (
                <div className="dynamic-empty-box">
                  <HiOutlineSparkles size={24} color="#7c3aed" />
                  <p>
                    No active custom attributes configured for Version {selectedFormVersion}.
                    You can configure fields under <strong>Form Settings</strong>.
                  </p>
                </div>
              ) : (
                <div className="dynamic-form-layout" style={{ marginTop: "14px" }}>
                  {dynamicFields.map((field) => (
                    <DynamicField
                      key={field.id}
                      field={field}
                      formData={dynamicFormData}
                      setFormData={setDynamicFormData}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="new-client-submit-row">
              <button
                type="button"
                className="btn-form-cancel"
                onClick={() => setActiveTab("existing")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-form-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <HiOutlineArrowPath className="animate-spin" size={18} /> Registering Client...
                  </>
                ) : (
                  <>
                    <HiOutlineUserPlus size={18} /> Register Client Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── EDIT CLIENT MODAL ────────────────────────────────────────── */}
      {editingClient && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal-card">
            <div className="edit-modal-header">
              <div>
                <h3>Edit Client Profile & Custom Attributes</h3>
                <p>Updating profile for: <strong>{editingClient.name}</strong></p>
              </div>
              <button
                className="edit-modal-close"
                onClick={() => setEditingClient(null)}
              >
                <HiXMark size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClientEdit} className="edit-modal-form">
              {/* Basic Fields Grid */}
              <div className="edit-grid-2">
                <div className="edit-form-group">
                  <label>Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>Legal Business Name</label>
                  <input
                    type="text"
                    value={editFormData.legalname}
                    onChange={(e) => setEditFormData({ ...editFormData, legalname: e.target.value })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    maxLength="15"
                    value={editFormData.gstnumber}
                    onChange={(e) => setEditFormData({ ...editFormData, gstnumber: e.target.value.toUpperCase() })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>PAN Number</label>
                  <input
                    type="text"
                    maxLength="10"
                    value={editFormData.pannumber}
                    onChange={(e) => setEditFormData({ ...editFormData, pannumber: e.target.value.toUpperCase() })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>Registered Location / City</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="edit-input"
                  />
                </div>

                <div className="edit-form-group">
                  <label>Membership Tier</label>
                  <select
                    value={editFormData.membershipStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, membershipStatus: e.target.value })}
                    className="edit-input"
                  >
                    <option value="NONE">Standard Account (NONE)</option>
                    <option value="MEMBER">Premium Member (MEMBER)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Custom Fields Section */}
              <div className="edit-dynamic-section">
                <div className="edit-dynamic-header">
                  <span style={{ fontWeight: "700", color: "#1e1b4b" }}>
                    Additional Dynamic Attributes
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "12px", color: "#64748b" }}>Version:</label>
                    <select
                      value={editSelectedVersion}
                      onChange={(e) => handleEditVersionChange(e.target.value)}
                      className="reg-version-select"
                    >
                      {formVersions.map((v) => (
                        <option key={v} value={String(v)}>
                          v{v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingEditFields ? (
                  <div style={{ textAlign: "center", padding: "16px" }}>
                    <LoadingAnimation2 />
                  </div>
                ) : editDynamicFields.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "10px 0 0" }}>
                    No dynamic fields defined in Version {editSelectedVersion}.
                  </p>
                ) : (
                  <div className="dynamic-form-layout" style={{ marginTop: "12px" }}>
                    {editDynamicFields.map((field) => (
                      <DynamicField
                        key={field.id}
                        field={field}
                        formData={editDynamicData}
                        setFormData={setEditDynamicData}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="btn-form-cancel"
                  onClick={() => setEditingClient(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-form-submit"
                >
                  {savingEdit ? "Saving Changes..." : "Save Client Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}