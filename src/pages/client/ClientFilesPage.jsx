import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/ClientPortal.css";
import FileUploadProgress from "../../components/FileUploadProgress";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../../utils/fileDownloader";
import { FaWhatsapp, FaEnvelope, FaShareAlt } from "react-icons/fa";
import {
  HiOutlineFolderOpen,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineLockClosed,
} from "react-icons/hi2";

export default function ClientFilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membershipData, setMembershipData] = useState(null);

  // Folders state
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("ALL");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFolderName, setUploadFolderName] = useState("");

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [customUploadFileName, setCustomUploadFileName] = useState("");

  // Inline Document Viewer State for Client
  const [viewingFile, setViewingFile] = useState(null);

  // Document Sharing State for Client (WhatsApp & Personal Email)
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingFile, setSharingFile] = useState(null);
  const [category, setCategory] = useState("COMPLIANCE");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytes, setUploadBytes] = useState({ loaded: 0, total: 0 });
  const [uploadPhase, setUploadPhase] = useState("IDLE"); // 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");
  const uploadAbortRef = useRef(null);

  const fetchFolders = async () => {
    try {
      const res = await api.get("/Client/Folders");
      setFolders(res.data || []);
    } catch {}
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Client/Files");
      setFiles(res.data || []);
    } catch {
      toast.error("Failed to load your files");
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
    fetchFiles();
    fetchFolders();
    checkMembership();
  }, []);

  const planType = (membershipData?.membershipPlan || "").toUpperCase();

  // Inline File Viewer for Client
  const handleClientViewFile = async (f) => {
    try {
      toast.loading(`Loading ${f.fileName} for preview...`, { id: "client-view" });
      const res = await api.get(`/Client/Files/${f.id}/View`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      toast.dismiss("client-view");
      setViewingFile({ ...f, url: blobUrl });
    } catch {
      toast.dismiss("client-view");
      toast.error("Failed to load document preview");
    }
  };

  // Client Document Sharing Handlers
  const openShareModal = (f) => {
    setSharingFile(f);
    setShowShareModal(true);
  };

  const handleWhatsAppShare = (f) => {
    const text = `*SKC Client Document Share*\n📄 *Document:* ${f.fileName}\n📁 *Folder:* ${f.folderName || "General"}\n\nShared via SKC Client Portal: ${window.location.origin}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleEmailShare = (f) => {
    const subject = encodeURIComponent(`Document: ${f.fileName}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the reference for document "${f.fileName}" from SKC Office Client Portal.\n\nPortal Link: ${window.location.origin}\n\nRegards,`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const handleGmailWebShare = (f) => {
    const subject = encodeURIComponent(`Document: ${f.fileName}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the reference for document "${f.fileName}" from SKC Office Client Portal.\n\nPortal Link: ${window.location.origin}\n\nRegards,`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/Client/Files/${fileId}/Download`, {
        responseType: "blob",
      });
      const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
      const contentType = res.headers["content-type"] || res.data?.type;
      triggerBrowserDownload(res.data, resolvedName, contentType);
      toast.success(`Downloading ${resolvedName}...`);
    } catch (err) {
      if (err.response?.status === 410) {
        toast.error("This document has expired. Please request an extension.");
      } else {
        toast.error("Download failed");
      }
    }
  };

  const handleRequestExtension = async (fileId) => {
    try {
      const res = await api.post(`/Client/Files/${fileId}/RequestExtension`);
      toast.success(res.data.message || "Extension request submitted!");
      fetchFiles();
    } catch {
      toast.error("Failed to submit extension request");
    }
  };

  const handleClientUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadBytes({ loaded: 0, total: uploadFile.size || 0 });
    setUploadPhase("UPLOADING");
    setUploadErrorMsg("");

    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", category);
      if (customUploadFileName.trim()) {
        formData.append("customFileName", customUploadFileName.trim());
      }

      if (uploadFolderId) {
        formData.append("folderId", uploadFolderId);
      }
      if (uploadFolderName) {
        formData.append("folderName", uploadFolderName);
      }

      const res = await api.post("/Client/Files/Upload", formData, {
        timeout: 0, // Disable timeout to support large file uploads without premature abort
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
            setUploadProgress(percent);
            setUploadBytes({ loaded: progressEvent.loaded, total: progressEvent.total });
            if (progressEvent.loaded >= progressEvent.total) {
              setUploadProgress(100);
              setUploadPhase("PROCESSING");
            }
          }
        },
      });

      if (res.data?.status === "success") {
        setUploadPhase("SUCCESS");
        setUploadProgress(100);
        toast.success("File uploaded to your portal and admins notified!");
        setTimeout(() => {
          setShowUpload(false);
          setUploadFile(null);
          setCustomUploadFileName("");
          setUploadFolderId("");
          setUploadFolderName("");
          setUploadPhase("IDLE");
          setUploadProgress(0);
          fetchFiles();
        }, 800);
      } else {
        setUploadPhase("ERROR");
        const errMsg = res.data?.message || "File upload failed";
        setUploadErrorMsg(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        toast.info("Upload cancelled");
        setUploadPhase("IDLE");
        setUploadProgress(0);
      } else {
        console.error(err);
        setUploadPhase("ERROR");
        const msg = err.response?.data?.message || err.message || "File upload failed";
        setUploadErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelClientUpload = () => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
  };

  // Rename file state & handler
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
      await api.put(`/Client/Files/${renamingFile.id}/Rename`, {
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

  // Delete file handler
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file from your vault?")) return;
    try {
      await api.delete(`/Client/Files/${fileId}`);
      toast.success("File deleted successfully");
      fetchFiles();
    } catch {
      toast.error("Failed to delete file");
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

  const filteredFiles = files.filter((f) => {
    if (selectedFolderId === "ALL") return true;
    return String(f.folderId) === String(selectedFolderId) || f.folderName === selectedFolderId;
  });

  return (
    <div style={{ padding: "24px", color: "#1f2937", fontFamily: "var(--font2, sans-serif)" }}>
      {/* Header with Title and Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#111827", margin: "0 0 6px 0", fontSize: "24px", fontWeight: "700" }}>
            <HiOutlineFolderOpen size={30} color="#2563eb" /> My Documents &amp; Secure Repository
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
            Access, track, and download all audit and tax documents securely stored in AWS S3.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={fetchFiles}
            disabled={loading}
            style={{
              padding: "10px 18px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
            title="Refresh documents list"
          >
            <HiOutlineArrowPath size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => setShowUpload(true)}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            }}
          >
            <HiOutlineArrowUpTray size={18} /> Upload Document
          </button>
        </div>
      </div>

      {/* ── TIER STATUS OR FREE REPOSITORY BANNER ────────────── */}
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
                {planType === "PLATINUM" ? "Platinum Elite Vault: Permanent Storage & VIP File Desk Active" : "Gold VIP Vault: Priority Review & Document Advisory Desk"}
              </strong>
              <span style={{ fontSize: "12px", opacity: 0.85 }}>
                {planType === "PLATINUM" ? "Unlimited cloud retention, custom file tags, and high-speed multi-file download." : "Audit filings, GST records, and notice advisory documents reviewed with priority."}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRadius: "14px",
          padding: "12px 18px",
          color: "#334155",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📁</span>
            <div>
              <strong style={{ fontSize: "13px", display: "block", color: "#0f172a" }}>
                Document Vault (Free for All Clients)
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                View, download, and transmit your accounting records, GST bills, and tax returns with zero charge.
              </span>
            </div>
          </div>
          <Link
            to="/Client/Membership"
            style={{
              padding: "6px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              color: "#475569",
              fontSize: "12px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <HiOutlineSparkles size={14} color="#d97706" /> View VIP Plans
          </Link>
        </div>
      )}

      {/* ─── FOLDER-BASED STRUCTURE VIEW FOR CLIENT (Matching Admin Layout) ─── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <HiOutlineFolderOpen size={24} color="#2563eb" />
              Document Folders & Vaults
              <span style={{ fontSize: "12px", background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                {folders.length} {folders.length === 1 ? "Folder" : "Folders"}
              </span>
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Browse your organized documents by folder. Select a folder below to filter your files.
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px",
        }}>
          {/* All Files / All Folders Card */}
          {(() => {
            const isAllActive = selectedFolderId === "ALL";
            return (
              <div
                onClick={() => setSelectedFolderId("ALL")}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: "pointer",
                  boxShadow: isAllActive
                    ? "0 10px 30px rgba(37, 99, 235, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isAllActive ? "2px solid #2563eb" : "1px solid #f1f5f9",
                  borderBottom: isAllActive ? "4px solid #2563eb" : "1px solid #f1f5f9",
                  transform: isAllActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isAllActive ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f1f5f9",
                  color: isAllActive ? "#1d4ed8" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <HiOutlineFolderOpen size={28} />
                </div>
                <h4 style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: isAllActive ? "700" : "600",
                  color: isAllActive ? "#1d4ed8" : "#1e293b",
                  textAlign: "center"
                }}>
                  All Vault Documents ({files.length})
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
                  All office and filing records
                </p>
              </div>
            );
          })()}

          {/* Individual Folder Cards with Description Below Folder Name */}
          {folders.map((folder) => {
            const isSelected = String(selectedFolderId) === String(folder.id);
            const folderColor = folder.folderColor || "#2563eb";
            const folderFileCount = files.filter(
              (f) =>
                (f.folderId && String(f.folderId) === String(folder.id)) ||
                (f.folderName && folder.folderName && f.folderName.trim().toLowerCase() === folder.folderName.trim().toLowerCase())
            ).length;

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? `0 10px 30px rgba(37, 99, 235, 0.2)`
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isSelected ? `2px solid ${folderColor}` : "1px solid #f1f5f9",
                  borderBottom: isSelected ? `4px solid ${folderColor}` : "1px solid #f1f5f9",
                  transform: isSelected ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                  position: "relative",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isSelected ? "#eff6ff" : "#f8fafc",
                  color: folderColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${folderColor}33`
                }}>
                  <HiOutlineFolderOpen size={28} />
                </div>

                <h4 style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: isSelected ? "700" : "600",
                  color: isSelected ? folderColor : "#1e293b",
                  textAlign: "center",
                  wordBreak: "break-word"
                }}>
                  {folder.folderName}
                </h4>

                {/* Prominently Show Description Under Folder Name */}
                <p style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: "1.35",
                  textAlign: "center",
                  maxWidth: "95%",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }} title={folder.description || "No description provided"}>
                  {folder.description ? folder.description : <span style={{ fontStyle: "italic", opacity: 0.7 }}>No description</span>}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <span style={{
                    fontSize: "11px",
                    background: "#f1f5f9",
                    color: "#475569",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontWeight: "700"
                  }}>
                    {folderFileCount} {folderFileCount === 1 ? "file" : "files"}
                  </span>
                  {folder.isCommon && (
                    <span style={{ fontSize: "10px", background: "#eef2ff", color: "#4f46e5", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                      Office Common
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" }}>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <HiOutlineDocumentText size={48} color="#d1d5db" style={{ marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "#374151", fontSize: "16px" }}>No documents found</h4>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {selectedFolderId !== "ALL" ? "No documents uploaded in this folder yet." : "Click 'Upload Document' above to submit files for CA verification."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#4b5563", background: "#f9fafb" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Document Name</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Uploaded By</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Created On</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Expiry Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((f) => {
                  const hasPassedDate = f.expirationDate && new Date(f.expirationDate) < new Date();
                  const isBlockedExpired = hasPassedDate && !isMember;
                  const uploaderName = f.userName || (f.direction === "UPLOADED_BY_CLIENT" ? "You (Client)" : "SKC Office");
                  const isSelf = f.direction === "UPLOADED_BY_CLIENT" || (f.uploadedByRole === "CLIENT");

                  return (
                    <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <HiOutlineDocumentText size={20} />
                          </div>
                          <div>
                            <strong style={{ color: "#111827", display: "block", fontSize: "14px" }}>{f.fileName}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                              <span style={{ fontSize: "12px", color: "#9ca3af" }}>ID: #{f.id}</span>
                              {f.folderName && (
                                <span style={{
                                  padding: "2px 8px",
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  border: "1px solid #fde68a"
                                }}>
                                  📁 {f.folderName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "4px 10px", background: "#f3f4f6", color: "#374151", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                          {f.category}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: isSelf ? "#e0f2fe" : "#fef3c7",
                          color: isSelf ? "#0369a1" : "#b45309",
                        }}>
                          {isSelf ? "👤" : "🏛️"} {uploaderName}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", color: "#4b5563", fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <HiOutlineCalendarDays size={15} color="#9ca3af" />
                          <span>{formatDateTime(f.createdAt)}</span>
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        {isMember && hasPassedDate ? (
                          <span style={{ padding: "4px 10px", background: "#fef3c7", color: "#92400e", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                            🌟 Expiration-Free (VIP)
                          </span>
                        ) : isBlockedExpired ? (
                          <span style={{ padding: "4px 10px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                            Expired ({f.expirationDate})
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <HiOutlineClock size={15} />
                            {f.expirationDate ? `Until ${f.expirationDate}` : "No expiry"}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                          {/* View Button (In-browser preview popup) */}
                          <button
                            onClick={() => handleClientViewFile(f)}
                            title="View Document Preview"
                            style={{
                              padding: "7px 12px",
                              background: "#059669",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              boxShadow: "0 2px 6px rgba(5,150,105,0.2)",
                            }}
                          >
                            <HiOutlineEye size={15} /> View
                          </button>

                          {/* Share Button (WhatsApp & Gmail/Personal Email) */}
                          <button
                            onClick={() => openShareModal(f)}
                            title="Share via WhatsApp or Email"
                            style={{
                              padding: "7px 12px",
                              background: "#7c3aed",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              boxShadow: "0 2px 6px rgba(124,58,237,0.2)",
                            }}
                          >
                            <FaShareAlt size={13} /> Share
                          </button>

                          {isBlockedExpired ? (
                            <button
                              onClick={() => handleRequestExtension(f.id)}
                              disabled={f.extensionRequested}
                              style={{
                                padding: "7px 14px",
                                background: f.extensionRequested ? "#e5e7eb" : "#f59e0b",
                                color: f.extensionRequested ? "#9ca3af" : "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: f.extensionRequested ? "default" : "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {f.extensionRequested ? "Extension Pending" : "Request Extension"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownload(f.id, f.fileName)}
                              style={{
                                padding: "7px 14px",
                                background: isMember ? "linear-gradient(135deg, var(--primary, #4f46e5), var(--primary-hover, #7c3aed))" : "var(--primary, #2563eb)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                              }}
                            >
                              <HiOutlineArrowDownTray size={15} /> Download
                            </button>
                          )}

                          <button
                            onClick={() => openRenameModal(f)}
                            title="Rename File"
                            style={{
                              padding: "7px 10px",
                              background: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <HiOutlinePencilSquare size={14} color="#475569" /> Rename
                          </button>

                          <button
                            onClick={() => handleDelete(f.id)}
                            title="Delete File"
                            style={{
                              padding: "7px 10px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <HiOutlineTrash size={14} /> Delete
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


      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "16px",
        }}>
          <div style={{
            background: "#090d16",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "18px",
            padding: "26px",
            width: "90%",
            maxWidth: "460px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            color: "#ffffff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                Upload Document to SKC Office
              </h3>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
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

            <form onSubmit={handleClientUpload} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px", color: "#e2e8f0" }}>Choose File</label>
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
                    boxSizing: "border-box",
                    padding: "10px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    color: "#ffffff",
                  }}
                />
              </div>

              {uploadFile && (
                <div style={{
                  background: "#151d2f",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "12px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>
                      Selected File Properties
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setCustomUploadFileName("");
                      }}
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Discard file"
                    >
                      <HiOutlineTrash size={12} /> Discard
                    </button>
                  </div>

                  <div style={{ marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#e2e8f0", display: "block", marginBottom: "4px" }}>
                      Rename Before Upload (Optional):
                    </label>
                    <input
                      type="text"
                      value={customUploadFileName}
                      onChange={(e) => setCustomUploadFileName(e.target.value)}
                      placeholder="Custom file name..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#090d16",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        borderRadius: "6px",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Original: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px", color: "#e2e8f0" }}>Document Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="COMPLIANCE" style={{ background: "#151d2f", color: "#fff" }}>Compliance / Proof</option>
                  <option value="FINANCIAL" style={{ background: "#151d2f", color: "#fff" }}>Financial Statements</option>
                  <option value="GST" style={{ background: "#151d2f", color: "#fff" }}>GST Supporting Files</option>
                  <option value="TAX" style={{ background: "#151d2f", color: "#fff" }}>Tax Forms</option>
                  <option value="OTHER" style={{ background: "#151d2f", color: "#fff" }}>Other Documents</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px", color: "#e2e8f0" }}>
                  Destination Folder (Optional)
                </label>
                <select
                  value={uploadFolderId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUploadFolderId(val);
                    const match = folders.find((f) => String(f.id) === String(val));
                    setUploadFolderName(match ? match.folderName : "");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#151d2f",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="" style={{ background: "#151d2f", color: "#fff" }}>-- Root / General Documents --</option>
                  {folders.map((fld) => (
                    <option key={fld.id} value={fld.id} style={{ background: "#151d2f", color: "#fff" }}>
                      📁 {fld.folderName} {fld.isCommon ? "(Common Office Folder)" : "(Your Allocated Folder)"}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                  Upload to an allocated folder or common office repository.
                </span>
              </div>

              {/* Real-time File Upload Tracking Progress Bar with Animations */}
              <FileUploadProgress
                progress={uploadProgress}
                loadedBytes={uploadBytes.loaded}
                totalBytes={uploadBytes.total}
                phase={uploadPhase}
                fileName={customUploadFileName || uploadFile?.name}
                destination={uploadFolderName ? `Folder: ${uploadFolderName}` : "General Documents"}
                errorMessage={uploadErrorMsg}
                onCancel={handleCancelClientUpload}
                onRetry={handleClientUpload}
                theme="dark"
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    if (uploading) return;
                    setShowUpload(false);
                    setUploadPhase("IDLE");
                    setUploadProgress(0);
                  }}
                  style={{
                    padding: "9px 18px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: uploading ? "rgba(255,255,255,0.4)" : "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: "9px 20px",
                    background: uploading
                      ? "rgba(37, 99, 235, 0.5)"
                      : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: uploading ? "none" : "0 4px 14px rgba(37, 99, 235, 0.45)",
                  }}
                >
                  <HiOutlineArrowUpTray size={16} />
                  {uploadPhase === "PROCESSING"
                    ? "Securing in AWS S3..."
                    : uploading
                    ? `Uploading (${uploadProgress}%)`
                    : "Upload Document"}
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
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#090d16",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "460px",
            padding: "28px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            color: "#ffffff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                <HiOutlinePencilSquare size={22} color="var(--primary, #3b82f6)" /> Rename Document
              </h3>
              <button
                type="button"
                onClick={() => setRenamingFile(null)}
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

            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#94a3b8" }}>
              Enter the new name for this document. Original file extension will be preserved if omitted.
            </p>

            <form onSubmit={handleRenameSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  New Document Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. My_GST_Filing_2026.pdf"
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
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#ffffff",
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
                    background: "var(--primary, #2563eb)",
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
      {/* ─── CLIENT INLINE DOCUMENT VIEWER POPUP MODAL ─── */}
      {viewingFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            maxWidth: "900px",
            width: "100%",
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#1e293b",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{viewingFile.fileName}</h4>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Category: {viewingFile.category} • Folder: {viewingFile.folderName || "General"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => handleDownload(viewingFile.id, viewingFile.fileName)}
                  style={{
                    padding: "6px 12px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <HiOutlineArrowDownTray size={14} /> Download
                </button>
                <button
                  onClick={() => setViewingFile(null)}
                  style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer" }}
                >
                  <HiOutlineXMark size={24} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {viewingFile.url && (
                <iframe
                  src={viewingFile.url}
                  title={viewingFile.fileName}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CLIENT DOCUMENT SHARING MODAL (WHATSAPP & GMAIL / OWN EMAIL) ─── */}
      {showShareModal && sharingFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            maxWidth: "540px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
              borderBottom: "1px solid #ddd6fe",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#5b21b6", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaShareAlt size={18} color="#7c3aed" /> Share Your Document
                </h3>
                <span style={{ fontSize: "13px", color: "#6d28d9" }}>
                  {sharingFile.fileName}
                </span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* WhatsApp Share Card */}
              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#22c55e",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FaWhatsapp size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#166534", display: "block" }}>
                      Send via WhatsApp
                    </strong>
                    <span style={{ fontSize: "12px", color: "#15803d" }}>
                      Quickly share document details and portal access.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(sharingFile)}
                  style={{
                    padding: "9px 16px",
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FaWhatsapp size={15} /> WhatsApp
                </button>
              </div>

              {/* Gmail / Personal Email Option */}
              <div style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#ea4335",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#1e293b", display: "block" }}>
                      Send from Your Email / Gmail
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Compose from your personal email client with prefilled document details.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleGmailWebShare(sharingFile)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "#fff",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#ea4335",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    Open in Gmail Web
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailShare(sharingFile)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    Open Default Email App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
