import { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import {
    HiOutlineArrowUpTray,
    HiOutlineXMark,
    HiOutlineArrowPath,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineDocumentText,
} from "react-icons/hi2";
import File from "./File";
import "../styles/FileLayout.css";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../utils/fileDownloader";

export default function FilesLayout({
    fileCategorie = "Important Files",
    files = [],
    loading = false,
    onRefresh,
    isAdmin = true,
}) {
    const [searchName, setSearchName] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [customFileName, setCustomFileName] = useState("");
    const [targetAudience, setTargetAudience] = useState("PERSONAL");
    const [uploading, setUploading] = useState(false);

    // Rename state & modal
    const [renamingFile, setRenamingFile] = useState(null);
    const [newFileName, setNewFileName] = useState("");
    const [renaming, setRenaming] = useState(false);

    // Live filtered files
    const filteredFiles = useMemo(() => {
        if (!searchName.trim()) return files;
        const q = searchName.toLowerCase();
        return files.filter((f) => {
            const name = (f.fileName || f.filename || "").toLowerCase();
            const clientName = (f.client?.name || "").toLowerCase();
            const dir = (f.direction || "").toLowerCase();
            return name.includes(q) || clientName.includes(q) || dir.includes(q) || "personal".includes(q) || "staff".includes(q);
        });
    }, [files, searchName]);

    // Download handler
    const handleDownload = async (fileId, fileName) => {
        try {
            const url = isAdmin ? `/Admin/Files/${fileId}/Download` : `/Staff/Files/${fileId}/Download`;
            const res = await api.get(url, { responseType: "blob" });
            const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
            const contentType = res.headers["content-type"] || res.data?.type;
            triggerBrowserDownload(res.data, resolvedName, contentType);
            toast.success(`Downloading ${resolvedName}...`);
        } catch {
            toast.error("Failed to download file from S3");
        }
    };

    // Delete handler
    const handleDelete = async (fileId) => {
        if (!window.confirm("Are you sure you want to permanently delete this document from AWS S3 and database?")) return;
        try {
            const url = isAdmin ? `/Admin/FileManagement/Delete/${fileId}` : `/Staff/FileManagement/Delete/${fileId}`;
            await api.delete(url);
            toast.success("Document deleted successfully");
            if (onRefresh) onRefresh();
        } catch {
            toast.error("Failed to delete document");
        }
    };

    // Open Rename modal
    const handleOpenRename = (file) => {
        setRenamingFile(file);
        setNewFileName(file.fileName || "");
    };

    // Submit Rename
    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        if (!newFileName.trim()) {
            toast.error("File name cannot be empty");
            return;
        }
        setRenaming(true);
        try {
            const url = isAdmin
                ? `/Admin/FileManagement/Rename/${renamingFile.id}`
                : `/Staff/FileManagement/Rename/${renamingFile.id}`;
            await api.put(url, { newFileName: newFileName.trim() });
            toast.success("Document renamed successfully!");
            setRenamingFile(null);
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to rename document");
        } finally {
            setRenaming(false);
        }
    };

    // Upload Important File handler
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            toast.error("Please choose a file to upload");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("category", "IMPORTANT");
            formData.append("targetAudience", targetAudience);
            if (customFileName.trim()) {
                formData.append("customFileName", customFileName.trim());
            }

            const uploadUrl = isAdmin ? "/Admin/FileManagement/Upload" : "/Staff/FileManagement/Upload";
            const res = await api.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.status === "success") {
                const dest = targetAudience === "STAFF" ? "Staff Members" : "Personal Storage";
                toast.success(`Important file saved to ${dest}!`);
                setShowUploadModal(false);
                setUploadFile(null);
                setCustomFileName("");
                if (onRefresh) onRefresh();
            } else {
                toast.error(res.data?.message || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload file to S3");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="files-lay-container">
            <section className="files-lay-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "700" }}>{fileCategorie}</h2>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        Internal personal storage & staff distribution files
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            style={{
                                padding: "9px 16px",
                                background: "#fff",
                                color: "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                            }}
                            title="Refresh Important Files"
                        >
                            <HiOutlineArrowPath size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setShowUploadModal(true);
                            setUploadFile(null);
                            setCustomFileName("");
                        }}
                        style={{
                            padding: "10px 20px",
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
                            boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                        }}
                    >
                        <HiOutlineArrowUpTray size={18} /> Upload Important File
                    </button>
                </div>
            </section>
            <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

            <section className="files-lay-search-cont" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "16px" }}>
                <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search by file name or sharing scope..."
                    style={{
                        minWidth: "260px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "14px",
                        outline: "none"
                    }}
                />
                <button
                    type="button"
                    style={{
                        width: "40px",
                        height: "40px",
                        minHeight: "40px",
                        minWidth: "40px",
                        borderRadius: "8px",
                        background: "#d97706",
                        border: "none",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                >
                    <FaSearch size={16} />
                </button>
            </section>

            <section className="files-area">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                        Loading important files...
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "600" }}>No important files found</p>
                        <p style={{ margin: 0, fontSize: "13px" }}>
                            Click "Upload Important File" above to store files for personal use or distribute to staff members.
                        </p>
                    </div>
                ) : (
                    filteredFiles.map((item) => (
                        <File
                            key={item.id}
                            file={item}
                            onDownload={handleDownload}
                            onRename={handleOpenRename}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </section>

            {/* Quick Upload Modal for Important File with Pre-upload Rename Property */}
            {showUploadModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px",
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "520px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                        padding: "26px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                            <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#111827" }}>
                                Upload Important File
                            </h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                            >
                                <HiOutlineXMark size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit}>
                            <div style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "10px",
                                padding: "14px",
                                marginBottom: "18px"
                            }}>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#166534", display: "block", marginBottom: "8px" }}>
                                    Storage &amp; Distribution Scope
                                </label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <label style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        background: targetAudience === "PERSONAL" ? "#dcfce7" : "#fff",
                                        border: targetAudience === "PERSONAL" ? "2px solid #16a34a" : "1px solid #d1d5db",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: targetAudience === "PERSONAL" ? "700" : "500",
                                        color: "#14532d"
                                    }}>
                                        <input
                                            type="radio"
                                            name="scope"
                                            value="PERSONAL"
                                            checked={targetAudience === "PERSONAL"}
                                            onChange={() => setTargetAudience("PERSONAL")}
                                        />
                                        🔒 Personal (Only Me)
                                    </label>
                                    <label style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        background: targetAudience === "STAFF" ? "#ede9fe" : "#fff",
                                        border: targetAudience === "STAFF" ? "2px solid #7c3aed" : "1px solid #d1d5db",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: targetAudience === "STAFF" ? "700" : "500",
                                        color: "#5b21b6"
                                    }}>
                                        <input
                                            type="radio"
                                            name="scope"
                                            value="STAFF"
                                            checked={targetAudience === "STAFF"}
                                            onChange={() => setTargetAudience("STAFF")}
                                        />
                                        👥 Send to Staff Members
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                                    Choose Document (AWS S3)
                                </label>
                                <input
                                    type="file"
                                    required={!uploadFile}
                                    onChange={(e) => {
                                        const f = e.target.files[0];
                                        setUploadFile(f || null);
                                        if (f) setCustomFileName(f.name);
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

                            {/* Selected File Box with Rename & Delete Properties */}
                            {uploadFile && (
                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    padding: "14px",
                                    marginBottom: "18px",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Selected File Properties
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUploadFile(null);
                                                setCustomFileName("");
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
                                            title="Delete/Discard selected file"
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
                                            value={customFileName}
                                            onChange={(e) => setCustomFileName(e.target.value)}
                                            placeholder="Enter custom file name..."
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                border: "1px solid #94a3b8",
                                                borderRadius: "6px",
                                                fontSize: "13px",
                                                outline: "none",
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        Original: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    style={{ padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    style={{
                                        padding: "8px 20px",
                                        background: uploading ? "#9ca3af" : "#d97706",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: uploading ? "not-allowed" : "pointer",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <HiOutlineArrowUpTray size={16} />
                                    {uploading ? "Uploading to S3..." : "Upload & Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renamingFile && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px",
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "460px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                        padding: "24px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                                <HiOutlinePencilSquare size={20} color="#4f46e5" /> Rename Document
                            </h3>
                            <button
                                onClick={() => setRenamingFile(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                            >
                                <HiOutlineXMark size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRenameSubmit}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6b7280" }}>
                                Modify the file name stored across AWS S3 and database records:
                            </p>

                            <input
                                type="text"
                                required
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                autoFocus
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setRenamingFile(null)}
                                    style={{
                                        padding: "8px 16px",
                                        background: "#f3f4f6",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: "13px"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={renaming}
                                    style={{
                                        padding: "8px 20px",
                                        background: "#4f46e5",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: renaming ? "not-allowed" : "pointer",
                                        fontWeight: "600",
                                        fontSize: "13px",
                                    }}
                                >
                                    {renaming ? "Saving..." : "Save New Name"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}