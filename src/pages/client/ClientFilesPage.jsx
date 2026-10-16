import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/ClientPortal.css";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../../utils/fileDownloader";
import {
  HiOutlineFolderOpen,
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

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [customUploadFileName, setCustomUploadFileName] = useState("");
  const [category, setCategory] = useState("COMPLIANCE");
  const [uploading, setUploading] = useState(false);

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
    checkMembership();
  }, []);

  const planType = (membershipData?.membershipPlan || "").toUpperCase();

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
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", category);
      if (customUploadFileName.trim()) {
        formData.append("customFileName", customUploadFileName.trim());
      }

      const res = await api.post("/Client/Files/Upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success") {
        toast.success("File uploaded to your portal and admins notified!");
        setShowUpload(false);
        setUploadFile(null);
        setCustomUploadFileName("");
        fetchFiles();
      } else {
        toast.error(res.data?.message || "File upload failed");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "File upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
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
          background: planType === "PLATINUM" ? "linear-gradient(135deg, #2e1065, #4c1d95)" : planType === "GOLD" ? "linear-gradient(135deg, #451a03, #78350f)" : "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "14px",
          padding: "14px 20px",
          color: "#ffffff",
          marginBottom: "20px",
          border: `1.5px solid ${planType === "PLATINUM" ? "#a855f7" : planType === "GOLD" ? "#f59e0b" : "#94a3b8"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>
              {planType === "PLATINUM" ? "💎" : planType === "GOLD" ? "🌟" : "⭐"}
            </span>
            <div>
              <strong style={{ fontSize: "14px", display: "block" }}>
                {planType === "PLATINUM" ? "Platinum Elite Vault: Permanent Storage & File Rename Active" : planType === "GOLD" ? "Gold VIP Vault: Expiration-Free Downloads Active (Files Never Expire)" : "Silver Member Vault: Active Document Access"}
              </strong>
              <span style={{ fontSize: "12px", opacity: 0.85 }}>
                {planType === "PLATINUM" ? "Unlimited cloud retention, custom file tags, and high-speed multi-file download." : planType === "GOLD" ? "Files in this repository do not expire. Standard downloads are unrestricted." : "Standard audit and filing downloads. Upgrade to Gold for Expiration-Free access."}
              </span>
            </div>
          </div>
          {planType === "SILVER" && (
            <Link to="/Client/Membership" style={{ fontSize: "12px", fontWeight: "700", color: "#fbbf24", textDecoration: "underline" }}>
              Upgrade to Gold (Never Expire) &rarr;
            </Link>
          )}
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

      <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <HiOutlineDocumentText size={48} color="#d1d5db" style={{ marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "#374151", fontSize: "16px" }}>No documents in your portal yet</h4>
            <p style={{ margin: 0, fontSize: "14px" }}>Click &quot;Upload Document&quot; above to submit files for CA verification.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
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
                {files.map((f) => {
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
                            <span style={{ fontSize: "12px", color: "#9ca3af" }}>ID: #{f.id}</span>
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
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
                    padding: "8px 18px",
                    background: "var(--primary, #2563eb)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  {uploading ? "Uploading to AWS S3..." : "Upload"}
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
    </div>
  );
}
