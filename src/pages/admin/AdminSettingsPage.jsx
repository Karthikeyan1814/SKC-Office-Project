import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { useUniversalTheme } from "../../context/ThemeContext";
import "../../styles/AdminSettingsPage.css";
import {
  HiOutlineCog6Tooth,
  HiOutlineFolderPlus,
  HiOutlineFolderOpen,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineSwatch,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineServerStack,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineSquares2X2,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineBellAlert,
  HiOutlinePlay,
  HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundType,
  setSoundType,
  getSoundVolume,
  setSoundVolume,
  playNotificationSound,
  SOUND_TYPES,
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  isBrowserNotificationEnabled,
  setBrowserNotificationEnabled,
  sendBrowserNotification,
} from "../../utils/notificationSound";

const FOLDER_COLORS = [
  "#4f46e5", // Indigo
  "#d97706", // Amber
  "#059669", // Emerald
  "#dc2626", // Red
  "#0284c7", // Sky
  "#7c3aed", // Purple
  "#db2777", // Pink
  "#475569", // Slate
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("folders"); // 'folders' | 'forms' | 'theme' | 'notifications' | 'storage'

  // Notification Sound & Desktop Alert State
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [soundTypeState, setSoundTypeState] = useState(getSoundType());
  const [soundVol, setSoundVol] = useState(getSoundVolume());
  const [browserOn, setBrowserOn] = useState(isBrowserNotificationEnabled());
  const [browserPerm, setBrowserPerm] = useState(getBrowserNotificationPermission());
  const [isTestingSound, setIsTestingSound] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setSoundOn(isSoundEnabled());
      setSoundTypeState(getSoundType());
      setSoundVol(getSoundVolume());
      setBrowserOn(isBrowserNotificationEnabled());
      setBrowserPerm(getBrowserNotificationPermission());
    };
    window.addEventListener("skc-sound-settings-changed", handleSync);
    return () => window.removeEventListener("skc-sound-settings-changed", handleSync);
  }, []);

  // Folders State
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderSearch, setFolderSearch] = useState("");
  const [availableClients, setAvailableClients] = useState([]);

  // Folder Create/Edit Modal
  const [folderModal, setFolderModal] = useState({
    open: false,
    isEdit: false,
    folderId: null,
    folderName: "",
    description: "",
    isCommon: true,
    clientId: "",
    folderColor: "#4f46e5",
    saving: false,
  });

  // Folder Delete Modal
  const [deleteFolderModal, setDeleteFolderModal] = useState({
    open: false,
    folder: null,
    deleting: false,
  });

  // Storage Purge Modal
  const [purgeModal, setPurgeModal] = useState({
    open: false,
    confirmInput: "",
    purging: false,
  });

  // Theme Context
  const {
    selectedThemeId,
    selectedFontId,
    customColors,
    selectColorTheme,
    selectFontTheme,
    updateIndividualColor,
    resetToDefault,
    COLOR_THEMES,
    FONT_THEMES,
  } = useUniversalTheme();

  // Fetch Folders
  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const res = await api.get("/Admin/Folders");
      setFolders(res.data || []);
    } catch {
      toast.error("Failed to load folders");
    } finally {
      setLoadingFolders(false);
    }
  };

  // Fetch Clients for Folder Allocation
  const fetchClients = async () => {
    try {
      const res = await api.get("/Admin/FileManagement/Clients");
      setAvailableClients(res.data || []);
    } catch {
      // fallback
      try {
        const res2 = await api.get("/Admin/Clients");
        setAvailableClients(res2.data || []);
      } catch {}
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchClients();
  }, []);

  // Filtered Folders
  const filteredFolders = useMemo(() => {
    if (!folderSearch.trim()) return folders;
    const q = folderSearch.toLowerCase();
    return folders.filter(
      (f) =>
        f.folderName?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.allocatedTo?.toLowerCase().includes(q)
    );
  }, [folders, folderSearch]);

  // Statistics
  const totalFolders = folders.length;
  const commonFoldersCount = folders.filter((f) => f.isCommon).length;
  const clientFoldersCount = folders.filter((f) => !f.isCommon).length;
  const totalDocumentsAttached = folders.reduce((sum, f) => sum + (f.fileCount || 0), 0);

  // Open Create Folder Modal
  const handleOpenCreateFolder = () => {
    setFolderModal({
      open: true,
      isEdit: false,
      folderId: null,
      folderName: "",
      description: "",
      isCommon: true,
      clientId: "",
      folderColor: "#4f46e5",
      saving: false,
    });
  };

  // Open Edit Folder Modal
  const handleOpenEditFolder = (f) => {
    setFolderModal({
      open: true,
      isEdit: true,
      folderId: f.id,
      folderName: f.folderName || "",
      description: f.description || "",
      isCommon: f.isCommon,
      clientId: f.client?.id ? String(f.client.id) : "",
      folderColor: f.folderColor || "#4f46e5",
      saving: false,
    });
  };

  // Save Folder (Create or Rename)
  const handleSaveFolder = async (e) => {
    e.preventDefault();
    if (!folderModal.folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    if (!folderModal.isCommon && !folderModal.clientId) {
      toast.error("Please select a client to allocate this folder to");
      return;
    }

    setFolderModal((prev) => ({ ...prev, saving: true }));
    try {
      if (folderModal.isEdit) {
        await api.put(`/Admin/Folders/${folderModal.folderId}`, {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : folderModal.clientId,
          folderColor: folderModal.folderColor,
        });
        toast.success("Folder updated successfully!");
      } else {
        await api.post("/Admin/Folders", {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : folderModal.clientId,
          folderColor: folderModal.folderColor,
        });
        toast.success("Folder created successfully!");
      }
      setFolderModal((prev) => ({ ...prev, open: false, saving: false }));
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save folder");
      setFolderModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Delete Folder
  const handleDeleteFolder = async () => {
    if (!deleteFolderModal.folder) return;
    setDeleteFolderModal((prev) => ({ ...prev, deleting: true }));
    try {
      await api.delete(`/Admin/Folders/${deleteFolderModal.folder.id}`);
      toast.success("Folder deleted successfully");
      setDeleteFolderModal({ open: false, folder: null, deleting: false });
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete folder");
      setDeleteFolderModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Purge Storage (Moved from FileManagementPage.jsx)
  const handleExecutePurge = async (e) => {
    e.preventDefault();
    if (purgeModal.confirmInput !== "RESET STORAGE") {
      toast.error("Please type 'RESET STORAGE' exactly to confirm.");
      return;
    }

    setPurgeModal((prev) => ({ ...prev, purging: true }));
    try {
      const res = await api.delete("/Admin/FileManagement/PurgeAll");
      toast.success(res.data?.message || "Storage reset completely fresh!");
      setPurgeModal({ open: false, confirmInput: "", purging: false });
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to purge storage");
      setPurgeModal((prev) => ({ ...prev, purging: false }));
    }
  };

  return (
    <div className="admin-settings-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="settings-header">
        <div className="settings-header-left">
          <h1>
            <span className="settings-header-icon-box">
              <HiOutlineCog6Tooth size={24} />
            </span>
            System &amp; Administration Control Settings
          </h1>
          <p className="settings-header-sub">
            Centralized hub to manage document folder hierarchies, dynamic forms, universal theme palettes, and AWS S3 storage controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              fetchFolders();
              toast.success("Settings synchronized!");
            }}
            className="btn-folder-action"
            style={{ padding: "8px 14px" }}
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ─────────────────────────────────────── */}
      <div className="settings-tabs-nav">
        <button
          className={`settings-tab-btn ${activeTab === "folders" ? "active" : ""}`}
          onClick={() => setActiveTab("folders")}
        >
          <HiOutlineFolderOpen size={18} />
          <span>Folder Allocation &amp; Hierarchy</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === "forms" ? "active" : ""}`}
          onClick={() => setActiveTab("forms")}
        >
          <HiOutlineDocumentText size={18} />
          <span>Dynamic Forms &amp; CMS Fields</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === "theme" ? "active" : ""}`}
          onClick={() => setActiveTab("theme")}
        >
          <HiOutlineSwatch size={18} />
          <span>Universal Color Palettes</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
          id="tab-btn-notifications"
        >
          <HiOutlineSpeakerWave size={18} />
          <span>Notification &amp; Sound Alerts</span>
        </button>

        <button
          className={`settings-tab-btn tab-danger ${activeTab === "storage" ? "active" : ""}`}
          onClick={() => setActiveTab("storage")}
        >
          <HiOutlineExclamationTriangle size={18} />
          <span>Cloud Storage Reset (Danger Zone)</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: FOLDER MANAGEMENT
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "folders" && (
        <>
          {/* Metrics */}
          <div className="settings-stats-row">
            <div className="settings-stat-card">
              <div className="stat-card-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                <HiOutlineFolderOpen />
              </div>
              <div className="stat-card-info">
                <h4>{totalFolders}</h4>
                <p>Total Active Folders</p>
              </div>
            </div>

            <div className="settings-stat-card">
              <div className="stat-card-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                <HiOutlineGlobeAlt />
              </div>
              <div className="stat-card-info">
                <h4>{commonFoldersCount}</h4>
                <p>Common (All Clients)</p>
              </div>
            </div>

            <div className="settings-stat-card">
              <div className="stat-card-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <HiOutlineUsers />
              </div>
              <div className="stat-card-info">
                <h4>{clientFoldersCount}</h4>
                <p>Client Allocated</p>
              </div>
            </div>

            <div className="settings-stat-card">
              <div className="stat-card-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
                <HiOutlineDocumentText />
              </div>
              <div className="stat-card-info">
                <h4>{totalDocumentsAttached}</h4>
                <p>Files in Folders</p>
              </div>
            </div>
          </div>

          {/* Section Card */}
          <div className="settings-section-card">
            <div className="section-card-header">
              <div>
                <h3 className="section-card-title">
                  <HiOutlineFolderPlus size={22} color="var(--primary, #4f46e5)" />
                  Document Folder Directory
                </h3>
                <p className="section-card-desc">
                  Create common folders for universal access or allocate client-specific folders. Clients can only upload into their allocated folders.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Filter folders by name or client..."
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    minWidth: "220px",
                  }}
                />

                <button onClick={handleOpenCreateFolder} className="btn-primary-action">
                  <HiOutlineFolderPlus size={18} /> Create New Folder
                </button>
              </div>
            </div>

            {/* Folder Grid */}
            {loadingFolders ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <HiOutlineArrowPath size={24} style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: "10px" }}>Loading folder hierarchy...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "14px" }}>
                <HiOutlineFolderOpen size={40} color="#94a3b8" />
                <h4 style={{ margin: "10px 0 4px 0", color: "#334155" }}>No Folders Found</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {folderSearch ? "No folders match your search query." : "Click 'Create New Folder' to set up your first document folder."}
                </p>
              </div>
            ) : (
              <div className="folders-grid">
                {filteredFolders.map((f) => (
                  <div key={f.id} className="folder-box">
                    <div className="folder-box-top">
                      <div
                        className="folder-icon-circle"
                        style={{
                          background: `${f.folderColor || "#4f46e5"}18`,
                          color: f.folderColor || "#4f46e5",
                        }}
                      >
                        <HiOutlineFolderOpen />
                      </div>

                      <span className={`folder-type-badge ${f.isCommon ? "badge-common" : "badge-client"}`}>
                        {f.isCommon ? "🌐 Common (All)" : `💼 ${f.allocatedTo || "Client"}`}
                      </span>
                    </div>

                    <h4 className="folder-name">{f.folderName}</h4>
                    <p className="folder-desc">
                      {f.description || (f.isCommon ? "Universal document repository folder." : `Dedicated folder for ${f.allocatedTo}.`)}
                    </p>

                    <div className="folder-meta-row">
                      <span>
                        <strong>{f.fileCount || 0}</strong> {f.fileCount === 1 ? "document" : "documents"}
                      </span>

                      <div className="folder-actions-row">
                        <button
                          onClick={() => handleOpenEditFolder(f)}
                          className="btn-folder-action"
                          title="Rename or edit folder settings"
                        >
                          <HiOutlinePencilSquare size={14} /> Rename
                        </button>

                        <button
                          onClick={() => setDeleteFolderModal({ open: true, folder: f, deleting: false })}
                          className="btn-folder-action btn-del"
                          title="Delete folder"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: DYNAMIC FORMS & CMS SETTINGS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "forms" && (
        <div className="settings-section-card">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">
                <HiOutlineDocumentText size={22} color="var(--primary, #4f46e5)" />
                Dynamic Client Registration &amp; Master Content Forms
              </h3>
              <p className="section-card-desc">
                Customize dynamic onboarding fields, manage mandatory validations, and update public home page text content directly.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Form Customizer Launch Card */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "24px", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--lite, #eef2ff)", color: "var(--primary, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiOutlineDocumentText size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Client Form Customizer</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>Add/remove dynamic input fields for client profiles</p>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                Allows administrator to inject dynamic custom fields (such as TAN Number, Import-Export Code, Annual Turnover, or Custom Upload requirements) without changing code.
              </p>
              <Link to="/Admin/EditClientForm" className="btn-primary-action" style={{ textDecoration: "none", display: "inline-flex" }}>
                Launch Form Customizer <HiOutlineArrowTopRightOnSquare size={16} />
              </Link>
            </div>

            {/* Home Page CMS Card */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "24px", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiOutlineSquares2X2 size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Home Page Dynamic CMS</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>Update public page content &amp; headings</p>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                Modify hero banners, tax notice service cards, firm statistics, and advisory details with English and Tamil bilingual support.
              </p>
              <Link to="/Admin/HomePageCMS" className="btn-primary-action" style={{ textDecoration: "none", display: "inline-flex", background: "linear-gradient(135deg, #d97706, #b45309)" }}>
                Launch Home Page CMS <HiOutlineArrowTopRightOnSquare size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: UNIVERSAL THEME & COLOR PALETTES
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "theme" && (
        <div className="settings-section-card">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">
                <HiOutlineSwatch size={22} color="var(--primary, #4f46e5)" />
                Universal Theme &amp; Color System
              </h3>
              <p className="section-card-desc">
                Select from predefined luxury color palettes or tailor brand colors for topbars, navigation, cards, and buttons.
              </p>
            </div>

            <button onClick={resetToDefault} className="btn-folder-action">
              Reset Theme to Factory Default
            </button>
          </div>

          {/* Theme Presets */}
          <div style={{ marginBottom: "28px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
              Predefined Curated Palettes
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {COLOR_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => selectColorTheme(theme.id)}
                    style={{
                      border: isSelected ? "2px solid var(--primary, #4f46e5)" : "1px solid #e2e8f0",
                      background: isSelected ? "var(--lite, #eef2ff)" : "#ffffff",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "700", color: isSelected ? "var(--primary, #4338ca)" : "#0f172a" }}>
                        {theme.name}
                      </span>
                      {isSelected && <HiOutlineCheck size={18} color="var(--primary, #4f46e5)" />}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {theme.preview.map((hex, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: hex,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Typography Engine */}
          <div style={{ marginBottom: "28px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
              Portal Typography
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {FONT_THEMES.map((f) => {
                const isSelected = selectedFontId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => selectFontTheme(f.id)}
                    style={{
                      border: isSelected ? "2px solid var(--primary, #4f46e5)" : "1px solid #e2e8f0",
                      background: isSelected ? "var(--lite, #eef2ff)" : "#ffffff",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      fontFamily: f.fontFamily,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: "700" }}>{f.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{f.sub}</div>
                      </div>
                      {isSelected && <HiOutlineCheck size={16} color="var(--primary, #4f46e5)" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Preview */}
          <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: "700", color: "#334155" }}>
              Live Component Preview
            </h4>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn-primary-action">
                <HiOutlineSparkles size={16} /> Active Brand Button
              </button>
              <span style={{ padding: "6px 14px", borderRadius: "20px", background: "var(--lite, #eef2ff)", color: "var(--primary, #4f46e5)", fontWeight: "700", fontSize: "12.5px" }}>
                Brand Accent Pill
              </span>
              <span style={{ padding: "6px 14px", borderRadius: "20px", background: "var(--gold-lite, #fef3c7)", color: "var(--gold, #d97706)", fontWeight: "700", fontSize: "12.5px" }}>
                VIP Retainer Tier
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 4: STORAGE & NUCLEAR PURGE (DANGER ZONE)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "storage" && (
        <div className="settings-section-card">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">
                <HiOutlineServerStack size={22} color="#dc2626" />
                Cloud Document Storage &amp; Fresh Reset
              </h3>
              <p className="section-card-desc">
                High-security administrative controls. The Storage Reset was relocated here from the File Management Hub to safeguard against accidental storage wipes.
              </p>
            </div>
          </div>

          {/* Vault Status Box */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>AWS S3 Bucket</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>karthikeyan-audit-dev</div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>AWS Region</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>eu-north-1 (Stockholm)</div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Total Files Attached</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{totalDocumentsAttached}</div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Security Encryption</span>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <HiOutlineShieldCheck size={18} /> AES-256 Enabled
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="danger-zone-box">
            <div className="danger-zone-header">
              <HiOutlineExclamationTriangle size={24} />
              <h3>Permanent Storage Purge &amp; Reset</h3>
            </div>

            <p className="danger-desc">
              Warning: Resetting storage will permanently delete all uploaded documents from the AWS S3 cloud bucket and purge all document records from the database table. This action is irreversible and should only be performed when initializing fresh production environments.
            </p>

            <button
              onClick={() => setPurgeModal({ open: true, confirmInput: "", purging: false })}
              className="btn-purge-danger"
            >
              <HiOutlineTrash size={18} /> Reset Complete Storage
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: NOTIFICATION & SOUND ALERT CONTROLS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "notifications" && (
        <div className="settings-panel-card" style={{ padding: "28px" }}>
          <div className="panel-title-row" style={{ marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                <HiOutlineBellAlert size={26} color="#d97706" />
                Notification Chimes &amp; Instant Desktop Alerts
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                Configure audible sound chimes and browser push alerts for all portal roles (Admin, Staff, and Client).
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "22px" }}>
            {/* Card 1: Audible Notification Sound */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: soundOn ? "#ecfdf5" : "#fef2f2", color: soundOn ? "#059669" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {soundOn ? <HiOutlineSpeakerWave size={22} /> : <HiOutlineSpeakerXMark size={22} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Audible Notification Chime</h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>Play tone when new files, notices, or bookings arrive</p>
                  </div>
                </div>

                {/* Toggle switch */}
                <label style={{ position: "relative", display: "inline-block", width: "52px", height: "28px" }}>
                  <input
                    type="checkbox"
                    checked={soundOn}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setSoundOn(next);
                      setSoundEnabled(next);
                      if (next) {
                        toast.success("Notification sound enabled");
                        playNotificationSound(soundTypeState, true);
                      } else {
                        toast("Notification sound muted", { icon: "🔇" });
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: "absolute",
                    cursor: "pointer",
                    inset: 0,
                    backgroundColor: soundOn ? "#10b981" : "#cbd5e1",
                    transition: "0.3s",
                    borderRadius: "28px",
                  }}>
                    <span style={{
                      position: "absolute",
                      height: "22px",
                      width: "22px",
                      left: "3px",
                      bottom: "3px",
                      backgroundColor: "#fff",
                      transition: "0.3s",
                      borderRadius: "50%",
                      transform: soundOn ? "translateX(24px)" : "translateX(0)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }} />
                  </span>
                </label>
              </div>

              {soundOn && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                      Select Chime Tone Melody
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                      {SOUND_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSoundTypeState(t.id);
                            setSoundType(t.id);
                            playNotificationSound(t.id, true);
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: soundTypeState === t.id ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                            background: soundTypeState === t.id ? "#eef2ff" : "#f8fafc",
                            color: soundTypeState === t.id ? "#4338ca" : "#334155",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ fontWeight: "700", fontSize: "13px" }}>{t.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{t.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                      <span>Alert Chime Volume</span>
                      <span style={{ color: "#4f46e5" }}>{Math.round(soundVol * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={soundVol}
                      onChange={(e) => {
                        const next = parseFloat(e.target.value);
                        setSoundVol(next);
                        setSoundVolume(next);
                      }}
                      style={{ width: "100%", accentColor: "#4f46e5" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTestingSound(true);
                      playNotificationSound(soundTypeState, true);
                      setTimeout(() => setIsTestingSound(false), 600);
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                    }}
                  >
                    <HiOutlinePlay size={16} />
                    <span>{isTestingSound ? "Playing Audio Chime..." : "Play Test Notification Tone"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Desktop / Browser Push Notifications */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <HiOutlineDevicePhoneMobile size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Desktop &amp; Browser Alerts</h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>Receive native OS alerts even when tab is backgrounded</p>
                  </div>
                </div>

                {/* Toggle switch */}
                <label style={{ position: "relative", display: "inline-block", width: "52px", height: "28px" }}>
                  <input
                    type="checkbox"
                    checked={browserOn}
                    onChange={async (e) => {
                      const next = e.target.checked;
                      if (next) {
                        const ok = await setBrowserNotificationEnabled(true);
                        const perm = getBrowserNotificationPermission();
                        setBrowserPerm(perm);
                        if (ok && perm === "granted") {
                          setBrowserOn(true);
                          toast.success("Desktop alerts activated!");
                          sendBrowserNotification("Sri Kathiravan & Co.", {
                            body: "Desktop notification test alert confirmed.",
                          });
                        } else if (perm === "denied") {
                          setBrowserOn(false);
                          toast.error("Notifications blocked in browser settings. Please allow notifications.");
                        } else {
                          setBrowserOn(false);
                        }
                      } else {
                        await setBrowserNotificationEnabled(false);
                        setBrowserOn(false);
                        toast("Browser alerts disabled", { icon: "🔕" });
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: "absolute",
                    cursor: "pointer",
                    inset: 0,
                    backgroundColor: browserOn ? "#10b981" : "#cbd5e1",
                    transition: "0.3s",
                    borderRadius: "28px",
                  }}>
                    <span style={{
                      position: "absolute",
                      height: "22px",
                      width: "22px",
                      left: "3px",
                      bottom: "3px",
                      backgroundColor: "#fff",
                      transition: "0.3s",
                      borderRadius: "50%",
                      transform: browserOn ? "translateX(24px)" : "translateX(0)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569" }}>Browser Permission Status</span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: browserPerm === "granted" ? "#ecfdf5" : browserPerm === "denied" ? "#fef2f2" : "#fffbeb",
                    color: browserPerm === "granted" ? "#059669" : browserPerm === "denied" ? "#dc2626" : "#d97706",
                    border: `1px solid ${browserPerm === "granted" ? "#a7f3d0" : browserPerm === "denied" ? "#fecaca" : "#fde68a"}`,
                  }}>
                    {browserPerm === "granted" ? "Permission Granted" : browserPerm === "denied" ? "Blocked by Browser" : "Permission Default"}
                  </span>
                </div>

                {browserOn && browserPerm === "granted" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isBrowserNotificationSupported()) {
                        toast.error("Browser notifications not supported");
                        return;
                      }
                      sendBrowserNotification("Sri Kathiravan & Co. - Push Test", {
                        body: "Desktop notification test successful! Real-time alerts are functioning correctly.",
                      });
                      toast.success("Test alert dispatched to OS notification center!");
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                    }}
                  >
                    <HiOutlineShieldCheck size={16} />
                    <span>Send Test Desktop Push Notification</span>
                  </button>
                )}

                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "#166534", lineHeight: "1.5" }}>
                  <strong>Tip for Staff &amp; Clients:</strong> Each user can also toggle sound alerts instantly directly from the top navigation bar speaker icon without leaving their current screen.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: CREATE / RENAME FOLDER
          ══════════════════════════════════════════════════════════ */}
      {folderModal.open && (
        <div className="settings-modal-overlay" onClick={() => setFolderModal((prev) => ({ ...prev, open: false }))}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>
                <HiOutlineFolderPlus size={22} color="var(--primary, #4f46e5)" />
                {folderModal.isEdit ? "Rename / Edit Folder" : "Create New Document Folder"}
              </h3>
              <button
                className="settings-modal-close"
                onClick={() => setFolderModal((prev) => ({ ...prev, open: false }))}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="settings-modal-body">
              {/* Folder Name */}
              <div className="settings-form-group">
                <label>Folder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Annual Returns, Audited Financials, Incorporation"
                  value={folderModal.folderName}
                  onChange={(e) => setFolderModal((prev) => ({ ...prev, folderName: e.target.value }))}
                  className="settings-input"
                />
              </div>

              {/* Description */}
              <div className="settings-form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief note on what documents belong in this folder..."
                  value={folderModal.description}
                  onChange={(e) => setFolderModal((prev) => ({ ...prev, description: e.target.value }))}
                  className="settings-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Allocation Type */}
              <div className="settings-form-group">
                <label>Folder Scope &amp; Allocation *</label>
                <div className="settings-radio-grid">
                  <div
                    className={`settings-radio-option ${folderModal.isCommon ? "selected" : ""}`}
                    onClick={() => setFolderModal((prev) => ({ ...prev, isCommon: true, clientId: "" }))}
                  >
                    <span className="radio-opt-title">🏢 Admin &amp; Staff (⭐ Default)</span>
                    <span className="radio-opt-sub">Only visible to Admin &amp; Staff. Hidden from clients</span>
                  </div>

                  <div
                    className={`settings-radio-option ${!folderModal.isCommon ? "selected" : ""}`}
                    onClick={() => setFolderModal((prev) => ({ ...prev, isCommon: false }))}
                  >
                    <span className="radio-opt-title">💼 Client Dedicated</span>
                    <span className="radio-opt-sub">Allocated strictly to a specific client</span>
                  </div>
                </div>
              </div>

              {/* If Client Dedicated: Client Picker */}
              {!folderModal.isCommon && (
                <div className="settings-form-group">
                  <label>Select Allocated Client *</label>
                  <select
                    required
                    value={folderModal.clientId}
                    onChange={(e) => setFolderModal((prev) => ({ ...prev, clientId: e.target.value }))}
                    className="settings-input"
                    style={{ background: "#ffffff" }}
                  >
                    <option value="">-- Choose client account --</option>
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || "Client"} {c.mobile ? `(${c.mobile})` : ""} {c.legalname ? `- ${c.legalname}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Color Tag */}
              <div className="settings-form-group">
                <label>Folder Color Accent</label>
                <div className="color-picker-row">
                  {FOLDER_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className={`color-chip-btn ${folderModal.folderColor === hex ? "active" : ""}`}
                      style={{ background: hex }}
                      onClick={() => setFolderModal((prev) => ({ ...prev, folderColor: hex }))}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setFolderModal((prev) => ({ ...prev, open: false }))}
                  className="btn-folder-action"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={folderModal.saving}
                  className="btn-primary-action"
                >
                  {folderModal.saving ? "Saving..." : folderModal.isEdit ? "Update Folder" : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: DELETE FOLDER
          ══════════════════════════════════════════════════════════ */}
      {deleteFolderModal.open && deleteFolderModal.folder && (
        <div className="settings-modal-overlay" onClick={() => setDeleteFolderModal({ open: false, folder: null, deleting: false })}>
          <div className="settings-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3 style={{ color: "#dc2626" }}>
                <HiOutlineTrash size={22} />
                Delete Folder?
              </h3>
              <button
                className="settings-modal-close"
                onClick={() => setDeleteFolderModal({ open: false, folder: null, deleting: false })}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.5 }}>
                Are you sure you want to delete folder <strong>"{deleteFolderModal.folder.folderName}"</strong>?
              </p>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                Existing documents inside this folder will not be erased; they will automatically be unlinked to the default "General" folder.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setDeleteFolderModal({ open: false, folder: null, deleting: false })}
                  className="btn-folder-action"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteFolder}
                  disabled={deleteFolderModal.deleting}
                  className="btn-purge-danger"
                  style={{ padding: "8px 16px" }}
                >
                  {deleteFolderModal.deleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: STORAGE PURGE (DANGER ZONE CONFIRMATION)
          ══════════════════════════════════════════════════════════ */}
      {purgeModal.open && (
        <div className="settings-modal-overlay" onClick={() => setPurgeModal({ open: false, confirmInput: "", purging: false })}>
          <div className="settings-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3 style={{ color: "#dc2626" }}>
                <HiOutlineExclamationTriangle size={22} />
                Confirm Complete Storage Wipe
              </h3>
              <button
                className="settings-modal-close"
                onClick={() => setPurgeModal({ open: false, confirmInput: "", purging: false })}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <form onSubmit={handleExecutePurge} className="settings-modal-body">
              <p style={{ margin: 0, fontSize: "13.5px", color: "#7f1d1d", lineHeight: 1.5 }}>
                ⚠️ This operation will permanently delete ALL uploaded files in AWS S3 (bucket: <code>karthikeyan-audit-dev</code>) and purge the entire database document registry.
              </p>

              <div className="settings-form-group">
                <label>To confirm, type <strong>RESET STORAGE</strong> below:</label>
                <input
                  type="text"
                  required
                  placeholder="RESET STORAGE"
                  value={purgeModal.confirmInput}
                  onChange={(e) => setPurgeModal((prev) => ({ ...prev, confirmInput: e.target.value }))}
                  className="settings-input"
                  style={{ borderColor: "#fca5a5" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setPurgeModal({ open: false, confirmInput: "", purging: false })}
                  className="btn-folder-action"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={purgeModal.purging || purgeModal.confirmInput !== "RESET STORAGE"}
                  className="btn-purge-danger"
                  style={{
                    opacity: purgeModal.confirmInput === "RESET STORAGE" ? 1 : 0.5,
                    cursor: purgeModal.confirmInput === "RESET STORAGE" ? "pointer" : "not-allowed",
                  }}
                >
                  {purgeModal.purging ? "Purging AWS S3 & Database..." : "Permanently Purge All"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
