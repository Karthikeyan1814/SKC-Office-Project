import "../styles/FileLayout.css";
import { FaFileAlt } from "react-icons/fa";
import {
    HiOutlineArrowDownTray,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineCalendarDays,
    HiOutlineUser,
} from "react-icons/hi2";

export default function File({ file, onDownload, onRename, onDelete }) {
    if (!file) return null;

    const fileName = file.fileName || file.filename || "Important Document";

    // Format date with time
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "14 Oct 2026, 12:00 PM";
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

    const scopeBadge = file.client ? (
        `👤 ${file.client.name}`
    ) : file.direction === "SHARED_WITH_STAFF" ? (
        "👥 Shared with Staff"
    ) : (
        "🔒 Personal Storage"
    );

    const uploaderName = file.userName || (file.uploadedByRole ? `${file.uploadedByRole}` : "Admin");
    const isClient = (file.uploadedByRole === "CLIENT") || uploaderName.toLowerCase().includes("client");
    const isStaff = (file.uploadedByRole === "STAFF") || uploaderName.toLowerCase().includes("staff");
    const uploaderBg = isClient ? "#e0f2fe" : isStaff ? "#f3e8ff" : "#fef3c7";
    const uploaderColor = isClient ? "#0369a1" : isStaff ? "#7e22ce" : "#b45309";

    return (
        <div
            className="files"
            style={{
                display: "grid",
                gridTemplateColumns: "44px minmax(180px, 2fr) minmax(140px, 1fr) minmax(150px, 1fr) minmax(170px, 1fr) auto",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px",
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
            }}
        >
            {/* File Icon */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "8px", background: "#fef3c7" }}>
                <FaFileAlt color="#d97706" size={20} />
            </div>

            {/* File Name */}
            <div style={{ overflow: "hidden" }}>
                <h4
                    className="files-name"
                    title={fileName}
                    style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {fileName}
                </h4>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                    ID: #{file.id} • {file.category || "IMPORTANT"}
                </span>
            </div>

            {/* Scope Badge */}
            <div>
                <span
                    style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#4f46e5",
                        background: "#ede9fe",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        display: "inline-block",
                        whiteSpace: "nowrap",
                    }}
                >
                    {scopeBadge}
                </span>
            </div>

            {/* Uploaded By */}
            <div>
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: uploaderColor,
                        background: uploaderBg,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                    }}
                    title={`Uploaded by: ${uploaderName}`}
                >
                    <span>{isClient ? "👤" : isStaff ? "👔" : "👑"}</span>
                    <span>{uploaderName}</span>
                </span>
            </div>

            {/* Created On Date & Time */}
            <div style={{ fontSize: "12px", color: "#4b5563", display: "flex", alignItems: "center", gap: "5px" }}>
                <HiOutlineCalendarDays size={15} color="#9ca3af" />
                <span>{formatDateTime(file.createdAt)}</span>
            </div>

            {/* Action Buttons: Download, Rename, Delete */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                <button
                    type="button"
                    onClick={() => onDownload && onDownload(file.id, fileName)}
                    title="Download File"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        fontWeight: "600",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                    }}
                >
                    <HiOutlineArrowDownTray size={14} /> Download
                </button>

                {onRename && (
                    <button
                        type="button"
                        onClick={() => onRename(file)}
                        title="Rename Document"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                            fontWeight: "600",
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            fontSize: "12px",
                        }}
                    >
                        <HiOutlinePencilSquare size={14} color="#475569" /> Rename
                    </button>
                )}

                {onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(file.id)}
                        title="Delete Document"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                            fontWeight: "600",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            fontSize: "12px",
                        }}
                    >
                        <HiOutlineTrash size={14} /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}