import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../../utils/fileDownloader";
import {
  HiOutlineFolderArrowDown,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowUpTray,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
} from "react-icons/hi2";

const CATEGORIES = [
  { key: "ALL", label: "All Documents", icon: "/all_files.svg" },
  { key: "GST", label: "Gst Documents", icon: "/gst.svg" },
  { key: "ROC", label: "Roc Documents", icon: "/roc.svg" },
  { key: "TAX", label: "Tax Documents", icon: "/tax.svg" },
  { key: "FINANCIAL", label: "Financial Statements", icon: "/finance.svg" },
  { key: "PAYROLL", label: "Pay Rolls", icon: "/payroll.svg" },
  { key: "CERTIFICATE", label: "Certificates", icon: "/certificate.svg" },
  { key: "COMPLIANCE", label: "Compliance Notice", icon: "/complaint.svg" },
  { key: "IMPORTANT", label: "Important File", icon: "/important.svg" },
  { key: "OTHER", label: "Other Documents", icon: "/other.svg" },
];

export default function FileManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialSearch = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [customUploadFileName, setCustomUploadFileName] = useState("");
  const [uploadCategory, setUploadCategory] = useState(
    initialCategory !== "ALL" ? initialCategory : "GST"
  );
  const [targetAudience, setTargetAudience] = useState("PERSONAL");
  const [expirationDate, setExpirationDate] = useState("");
  const [showPlatinumExpiryPopup, setShowPlatinumExpiryPopup] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync category & search & openUpload with URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }

    const searchVal = searchParams.get("search");
    if (searchVal !== null && searchVal !== undefined) {
      setSearchQuery(searchVal);
    }

    const openUpload = searchParams.get("openUpload");
    if (openUpload === "true") {
      setShowUploadModal(true);
      const preClientId = searchParams.get("clientId");
      const preClientName = searchParams.get("clientName");
      if (preClientId) {
        setSelectedClient({
          id: Number(preClientId),
          name: preClientName || "Selected Client",
          mobile: searchParams.get("clientMobile") || "",
          email: searchParams.get("clientEmail") || "",
          gstnumber: searchParams.get("clientGst") || "",
        });
      }
      const initialUploadCat = searchParams.get("uploadCat") || (cat && cat !== "ALL" ? cat : "GST");
      setUploadCategory(initialUploadCat);

      api.get("/Admin/FileManagement/Clients")
        .then((res) => setAvailableClients(res.data || []))
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSelectCategory = (catKey) => {
    setActiveCategory(catKey);
    const newParams = {};
    if (catKey !== "ALL") newParams.category = catKey;
    if (searchQuery) newParams.search = searchQuery;
    setSearchParams(newParams);
  };

  // Fetch all files
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Admin/FileManagement/AllFiles?category=${activeCategory}`);
      setFiles(res.data || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeCategory]);

  // Fetch all clients when upload modal opens
  const openUploadModal = async () => {
    setShowUploadModal(true);
    const defaultCat = activeCategory !== "ALL" ? activeCategory : "GST";
    setUploadCategory(defaultCat);
    if (defaultCat === "IMPORTANT") {
      setTargetAudience("PERSONAL");
    }
    setSelectedClient(null);
    setClientSearchQuery("");
    setUploadFile(null);
    try {
      const res = await api.get("/Admin/FileManagement/Clients");
      setAvailableClients(res.data || []);
    } catch {
      toast.error("Failed to fetch clients list");
    }
  };

  // Filter available clients in modal
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return availableClients;
    const q = clientSearchQuery.toLowerCase();
    return availableClients.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.gstnumber && c.gstnumber.toLowerCase().includes(q)) ||
      (c.legalname && c.legalname.toLowerCase().includes(q))
    );
  }, [availableClients, clientSearchQuery]);

  // Filter files live by search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => {
      const matchFile = f.fileName && f.fileName.toLowerCase().includes(q);
      const c = f.client;
      const matchClient = c && (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.gstnumber && c.gstnumber.toLowerCase().includes(q)) ||
        (c.legalname && c.legalname.toLowerCase().includes(q))
      );
      const matchInternal = !c && (
        (f.direction && f.direction.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        "personal".includes(q) ||
        "staff".includes(q)
      );
      return matchFile || matchClient || matchInternal;
    });
  }, [files, searchQuery]);

  // Handle direct AWS S3 Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadCategory !== "IMPORTANT" && !selectedClient) {
      toast.error("Please select a client from the list");
      return;
    }
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (customUploadFileName.trim()) {
        formData.append("customFileName", customUploadFileName.trim());
      }

      if (uploadCategory === "IMPORTANT") {
        formData.append("targetAudience", targetAudience);
      } else {
        formData.append("clientId", selectedClient.id);
        formData.append("targetAudience", "CLIENT");
      }

      if (expirationDate) {
        formData.append("expirationDate", expirationDate);
      }

      const res = await api.post("/Admin/FileManagement/Upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success") {
        const dest = uploadCategory === "IMPORTANT"
          ? (targetAudience === "STAFF" ? "Staff Workspace" : "Personal Storage")
          : selectedClient.name;
        toast.success(`File successfully uploaded to ${dest}!`);
        setShowUploadModal(false);
        setUploadFile(null);
        setCustomUploadFileName("");
        setExpirationDate("");
        setSelectedClient(null);
        fetchFiles();
      } else {
        toast.error(res.data?.message || "File upload failed.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "File upload failed. Please try again.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // Download file
  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/Admin/Files/${fileId}/Download`, {
        responseType: "blob",
      });
      const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
      const contentType = res.headers["content-type"] || res.data?.type;
      triggerBrowserDownload(res.data, resolvedName, contentType);
      toast.success(`Downloading ${resolvedName}...`);
    } catch {
      toast.error("Failed to download file from S3");
    }
  };

  // Delete file
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to permanently delete this file from AWS S3 and database?")) return;
    try {
      await api.delete(`/Admin/FileManagement/Delete/${fileId}`);
      toast.success("File deleted successfully");
      fetchFiles();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  // Rename file
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRenameModal = (file) => {
    setRenamingFile(file);
    setNewFileName(file.fileName || "");
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }
    setRenaming(true);
    try {
      await api.put(`/Admin/FileManagement/Rename/${renamingFile.id}`, {
        newFileName: newFileName.trim(),
      });
      toast.success("File renamed successfully!");
      setRenamingFile(null);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename file");
    } finally {
      setRenaming(false);
    }
  };

  // Purge all files in S3 and Database (Fresh Reset)
  const handlePurgeAll = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL documents stored in AWS S3 and database files table so you can start completely fresh. Are you sure?"
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const res = await api.delete("/Admin/FileManagement/PurgeAll");
      toast.success(res.data?.message || "Storage reset completely fresh!");
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to purge files");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format date with time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: Render uploader badge
  const renderUploaderBadge = (f) => {
    const name = f.userName || (f.uploadedByRole ? `${f.uploadedByRole}` : "Admin");
    const isClient = (f.uploadedByRole === "CLIENT") || name.toLowerCase().includes("client");
    const isStaff = (f.uploadedByRole === "STAFF") || name.toLowerCase().includes("staff");
    const bg = isClient ? "#e0f2fe" : isStaff ? "#f3e8ff" : "#fef3c7";
    const color = isClient ? "#0369a1" : isStaff ? "#7e22ce" : "#b45309";
    const icon = isClient ? "👤" : isStaff ? "👔" : "👑";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          background: bg,
          color: color,
        }}
        title={`Uploaded by: ${name}`}
      >
        <span>{icon}</span> {name}
      </span>
    );
  };

  return (
    <div style={{ padding: "30px 20px", fontFamily: "var(--font2, sans-serif)", color: "#1f2937" }}>
      {/* Header & Upload Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
            <HiOutlineFolderArrowDown size={32} color="#d97706" /> Document Distribution Hub
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Select a category to view files, search by client details, or distribute new documents to client portals.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={fetchFiles}
            disabled={loading}
            style={{
              padding: "11px 18px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
            title="Refresh documents list"
          >
            <HiOutlineArrowPath size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handlePurgeAll}
            style={{
              padding: "11px 16px",
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(185,28,28,0.06)",
              transition: "all 0.2s",
            }}
            title="Delete all documents from AWS S3 and database"
          >
            <HiOutlineTrash size={16} /> Reset Storage
          </button>

          <button
            onClick={openUploadModal}
            style={{
              padding: "11px 22px",
              background: "linear-gradient(135deg, #d97706, #b45309)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(217, 119, 6, 0.35)",
              transition: "0.2s transform",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <HiOutlineArrowUpTray size={18} /> Upload New Document
          </button>
        </div>
      </div>

      {/* Universal Search Bar */}
      <div style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        marginBottom: "28px",
        border: "1px solid #e5e7eb"
      }}>
        <HiOutlineMagnifyingGlass size={22} color="#9ca3af" />
        <input
          type="text"
          placeholder="Search by file name, client name, mobile, email, or GST number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "15px",
            background: "transparent",
            color: "#111827",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}
          >
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {/* Categories Cards Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "600", color: "#374151" }}>
          Categories
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px",
        }}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <div
                key={cat.key}
                onClick={() => handleSelectCategory(cat.key)}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 10px 30px rgba(142, 45, 226, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isActive ? "2px solid #8b5cf6" : "1px solid #f3f4f6",
                  borderBottom: isActive ? "4px solid #8b5cf6" : "1px solid #f3f4f6",
                  transform: isActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <img
                  src={cat.icon}
                  alt={cat.label}
                  style={{ height: "36px", width: "36px", objectFit: "contain" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <h4 style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "600",
                  color: isActive ? "#7c3aed" : "#374151",
                  textAlign: "center"
                }}>
                  {cat.label}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files List Section */}
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#111827" }}>
              {CATEGORIES.find((c) => c.key === activeCategory)?.label || "Documents"}
            </h3>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing {filteredFiles.length} {filteredFiles.length === 1 ? "document" : "documents"}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
            Loading files...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <HiOutlineDocumentText size={48} color="#d1d5db" style={{ marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#374151", fontSize: "16px" }}>No documents found</h4>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {searchQuery ? "Try refining your search terms or category filter." : "Click 'Upload New Document' to add files to this category."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredFiles.map((f) => {
              const isExpired = f.expirationDate && new Date(f.expirationDate) < new Date();
              return (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: "#f9fafb",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  {/* File & Client Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "280px", flex: 2 }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#fef3c7",
                      color: "#d97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <HiOutlineDocumentText size={24} />
                    </div>

                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                        {f.fileName || "Untitled Document"}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "#6b7280" }}>
                        {f.client ? (
                          <>
                            <span style={{ fontWeight: "600", color: "#1f2937" }}>
                              👤 {f.client.name}
                            </span>
                            <span>•</span>
                            <span>📞 {f.client.mobile}</span>
                            {f.client.gstnumber && (
                              <>
                                <span>•</span>
                                <span style={{ color: "#4f46e5" }}>GST: {f.client.gstnumber}</span>
                              </>
                            )}
                          </>
                        ) : f.direction === "SHARED_WITH_STAFF" ? (
                          <span style={{ fontWeight: "600", color: "#7c3aed" }}>
                            👥 Shared with Staff Members
                          </span>
                        ) : (
                          <span style={{ fontWeight: "600", color: "#0d9488" }}>
                            🔒 Personal Storage (Internal)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Created On & Uploader Properties */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563" }}>
                      <span style={{ color: "#6b7280" }}>Uploaded by:</span>
                      {renderUploaderBadge(f)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                      <HiOutlineCalendarDays size={14} color="#9ca3af" />
                      <span>Created: <strong style={{ color: "#374151" }}>{formatDateTime(f.createdAt)}</strong></span>
                    </div>
                  </div>

                  {/* Category & Expiry */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 10px",
                      background: "#e0e7ff",
                      color: "#3730a3",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {f.category}
                    </span>

                    {isExpired ? (
                      <span style={{
                        padding: "4px 10px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}>
                        Expired ({f.expirationDate})
                      </span>
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <HiOutlineClock size={15} />
                        {f.expirationDate ? `Expires: ${f.expirationDate}` : "No Expiry"}
                      </span>
                    )}
                  </div>

                  {/* Actions: Download, Rename, Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleDownload(f.id, f.fileName)}
                      title="Download from AWS S3"
                      style={{
                        padding: "8px 14px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <HiOutlineArrowDownTray size={15} /> Download
                    </button>

                    <button
                      onClick={() => openRenameModal(f)}
                      title="Rename Document"
                      style={{
                        padding: "8px 12px",
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <HiOutlinePencilSquare size={15} color="#475569" /> Rename
                    </button>

                    <button
                      onClick={() => handleDelete(f.id)}
                      title="Delete Record"
                      style={{
                        padding: "8px 12px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <HiOutlineTrash size={15} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal with Interactive Client Search */}
      {showUploadModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "580px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            padding: "28px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827" }}>
                Upload & Assign Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* Category & Expiry Selection First */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setUploadCategory(newCat);
                      if (newCat === "IMPORTANT") {
                        setTargetAudience("PERSONAL");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      background: "#fff"
                    }}
                  >
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Conditional Client Selector OR Important File Internal Target */}
              {uploadCategory === "IMPORTANT" ? (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "18px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#166534", marginBottom: "6px" }}>
                    <span>🔒 Personal / Office Storage Target</span>
                  </div>
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#15803d" }}>
                    Important files are reserved for personal administrative or internal staff use. Client selection is not involved.
                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <label style={{
                      flex: 1,
                      minWidth: "180px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: targetAudience === "PERSONAL" ? "#dcfce7" : "#fff",
                      border: targetAudience === "PERSONAL" ? "2px solid #16a34a" : "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: targetAudience === "PERSONAL" ? "700" : "500",
                      color: "#14532d"
                    }}>
                      <input
                        type="radio"
                        name="targetAudience"
                        value="PERSONAL"
                        checked={targetAudience === "PERSONAL"}
                        onChange={() => setTargetAudience("PERSONAL")}
                      />
                      🔒 Personal (Only Me)
                    </label>

                    <label style={{
                      flex: 1,
                      minWidth: "180px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: targetAudience === "STAFF" ? "#ede9fe" : "#fff",
                      border: targetAudience === "STAFF" ? "2px solid #7c3aed" : "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: targetAudience === "STAFF" ? "700" : "500",
                      color: "#5b21b6"
                    }}>
                      <input
                        type="radio"
                        name="targetAudience"
                        value="STAFF"
                        checked={targetAudience === "STAFF"}
                        onChange={() => setTargetAudience("STAFF")}
                      />
                      👥 Send to Staff Members
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                      Select Target Client
                    </label>
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        style={{ background: "none", border: "none", color: "#6366f1", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                      >
                        Change Client
                      </button>
                    )}
                  </div>

                  {selectedClient ? (
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: "#e0e7ff",
                      border: "1px solid #6366f1",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <strong style={{ color: "#3730a3", fontSize: "14px" }}>{selectedClient.name}</strong>
                        <div style={{ color: "#4f46e5", fontSize: "12px", marginTop: "2px" }}>
                          📞 {selectedClient.mobile} • ✉️ {selectedClient.email} {selectedClient.gstnumber ? `• GST: ${selectedClient.gstnumber}` : ""}
                        </div>
                      </div>
                      <span style={{ background: "#4338ca", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                        Selected
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Filter client by name, mobile, email, or GST..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          marginBottom: "10px",
                          outline: "none"
                        }}
                      />

                      <div style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: "#f9fafb",
                        padding: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}>
                        {filteredClients.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                            No clients found
                          </div>
                        ) : (
                          filteredClients.map((c) => {
                            const isSelected = selectedClient?.id === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedClient(c);
                                  if (c.membershipPlan && c.membershipPlan.toUpperCase() === "PLATINUM") {
                                    setExpirationDate("");
                                    setShowPlatinumExpiryPopup(true);
                                  }
                                }}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  background: isSelected ? "#e0e7ff" : "#fff",
                                  border: isSelected ? "1px solid #6366f1" : "1px solid #f3f4f6",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "13px",
                                }}
                              >
                                <div>
                                  <strong style={{ color: isSelected ? "#4338ca" : "#111827" }}>{c.name}</strong>
                                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                                    {c.mobile} • {c.email} {c.gstnumber ? `• GST: ${c.gstnumber}` : ""}
                                  </div>
                                </div>
                                {isSelected && <HiOutlineCheck size={18} color="#4338ca" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Choose File (Upload to AWS S3) */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>
                  Choose Document (Upload to AWS S3)
                </label>
                <input
                  type="file"
                  required={!uploadFile}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setUploadFile(f || null);
                    if (f) setCustomUploadFileName(f.name);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px dashed #d1d5db",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    cursor: "pointer",
                  }}
                />
              </div>

              {/* Selected File Box with Rename & Discard Properties */}
              {uploadFile && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Selected File Properties
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setCustomUploadFileName("");
                      }}
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Discard selected file"
                    >
                      <HiOutlineTrash size={13} /> Discard File
                    </button>
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Rename File Before Upload (Optional):
                    </label>
                    <input
                      type="text"
                      value={customUploadFileName}
                      onChange={(e) => setCustomUploadFileName(e.target.value)}
                      placeholder="Enter custom file name..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #94a3b8",
                        borderRadius: "6px",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Original: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              {/* Expiration Date Input with Platinum Protection */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                    Document Expiration Date (Optional)
                  </label>
                  {selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM" && (
                    <span style={{
                      background: "linear-gradient(135deg, #f3e8ff, #ede9fe)",
                      color: "#6b21a8",
                      border: "1px solid #d8b4fe",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      ✨ Platinum Card: Expiration-Free
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM") {
                      setShowPlatinumExpiryPopup(true);
                    }
                    setExpirationDate(val);
                  }}
                  onClick={() => {
                    if (selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM") {
                      setShowPlatinumExpiryPopup(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM" ? (
                  <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#7c3aed", fontWeight: "600" }}>
                    💎 Platinum Member: Files have permanent lifetime storage with no expiration required.
                  </p>
                ) : (
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Leave empty for no expiration. If set, file will automatically expire on this date.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: "10px 18px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: "10px 22px",
                    background: uploading ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <HiOutlineArrowUpTray size={18} />
                  {uploading ? "Uploading to S3..." : "Upload & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renamingFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "460px",
            padding: "28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <HiOutlinePencilSquare size={22} color="#2563eb" /> Rename Document
              </h3>
              <button onClick={() => setRenamingFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Enter the new display name for this document. Original file extension will be preserved if omitted.
            </p>

            <form onSubmit={handleRenameSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  New Document Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Audited_Balance_Sheet_2026.pdf"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  style={{
                    padding: "10px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "10px",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: renaming ? "not-allowed" : "pointer",
                  }}
                >
                  {renaming ? "Renaming..." : "Save New Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PLATINUM EXPIRATION-FREE NOTICE POPUP ──────────────── */}
      {showPlatinumExpiryPopup && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            maxWidth: "460px",
            width: "100%",
            padding: "32px 28px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            textAlign: "center",
            border: "1.5px solid #e9d5ff",
          }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f3e8ff, #ede9fe)",
              color: "#7e22ce",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px auto",
              boxShadow: "0 4px 20px rgba(147, 51, 234, 0.2)",
            }}>
              <span style={{ fontSize: "32px" }}>🏆</span>
            </div>

            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "#faf5ff",
              border: "1px solid #d8b4fe",
              color: "#6b21a8",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.5px",
              marginBottom: "10px",
            }}>
              PLATINUM CARD PRIVILEGE
            </div>

            <h3 style={{ margin: "0 0 10px 0", fontSize: "21px", fontWeight: "800", color: "#1e1b4b" }}>
              Expiration-Free File Access
            </h3>

            <p style={{ margin: "0 0 18px 0", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              <strong>{selectedClient?.name || "This client"}</strong> holds a prestigious <strong>Platinum Membership</strong>.
              All files for Platinum members are granted <strong>permanent lifetime cloud storage</strong> with zero expiration limits.
            </p>

            <div style={{
              background: "#faf5ff",
              border: "1px dashed #c084fc",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "24px",
              fontSize: "13px",
              color: "#581c87",
              textAlign: "left",
            }}>
              ✨ <strong>VIP Guarantee:</strong> Platinum clients never experience file link expirations.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setExpirationDate("");
                  setShowPlatinumExpiryPopup(false);
                  toast.success("Lifetime expiration-free storage preserved for Platinum member!");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #9333ea, #7e22ce)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(147, 51, 234, 0.3)",
                }}
              >
                ✓ Keep Expiration-Free (Recommended)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPlatinumExpiryPopup(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Set Custom Expiry Anyway (Override)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
