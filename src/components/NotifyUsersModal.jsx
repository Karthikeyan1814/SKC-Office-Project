import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  HiOutlineBellAlert,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineEnvelope,
} from "react-icons/hi2";

export default function NotifyUsersModal({ isOpen, onClose, onSuccess }) {
  const [target, setTarget] = useState("all"); // 'all' | 'clients' | 'staff' | 'admins'
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter an announcement message.");
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post("/Admin/BroadcastNotification", {
        target,
        title: title.trim() || "Official Office Announcement",
        message: message.trim(),
        sendEmail,
      });

      toast.success(res.data?.message || "Notification broadcast dispatched successfully!");
      setTitle("");
      setMessage("");
      setTarget("all");
      setSendEmail(true);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Broadcast failed:", err);
      toast.error(err.response?.data?.message || "Failed to dispatch broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        padding: "16px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "20px 24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          color: "#0f172a",
          margin: "auto",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (stays fixed at top of card) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexShrink: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "800",
              color: "#312e81",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <HiOutlineBellAlert size={20} color="var(--primary, #4f46e5)" />
            Broadcast Announcement &amp; Notify
          </h3>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "#f1f5f9",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "#64748b", lineHeight: 1.4, flexShrink: 0 }}>
          Broadcast an official directive or notice. Recipients receive in-portal cards and automated email notifications.
        </p>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: "auto",
            flex: 1,
            paddingRight: "2px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Target Audience */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>
              Target Audience
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
              {[
                { id: "all", label: "👥 All Users (Everyone)" },
                { id: "clients", label: "💼 Clients Only" },
                { id: "staff", label: "👨‍💻 Staff Only" },
                { id: "admins", label: "🛡️ Admins Only" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTarget(t.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: target === t.id ? "1.5px solid var(--primary, #4f46e5)" : "1px solid #e2e8f0",
                    background: target === t.id ? "var(--lite, #eef2ff)" : "#ffffff",
                    color: target === t.id ? "var(--primary, #4338ca)" : "#475569",
                    fontWeight: target === t.id ? "700" : "500",
                    fontSize: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Subject */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>
              Announcement Subject / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Important Notice: Advance Tax Payment Deadline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 11px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "12.5px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>
              Announcement Message
            </label>
            <textarea
              rows={3}
              required
              placeholder="Type the message to broadcast to the selected group..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 11px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "12.5px",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Send Email Checkbox */}
          <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="sendEmailCheckTop"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              style={{ cursor: "pointer", width: "15px", height: "15px" }}
            />
            <label
              htmlFor="sendEmailCheckTop"
              style={{ fontSize: "12px", color: "#334155", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <HiOutlineEnvelope size={14} color="#475569" />
              Send automated email notification to all recipient inboxes
            </label>
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "auto", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={broadcasting}
              style={{
                padding: "7px 15px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={broadcasting}
              style={{
                padding: "7px 18px",
                background: "linear-gradient(135deg, var(--primary, #4f46e5) 0%, var(--primary-hover, #4338ca) 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: broadcasting ? "not-allowed" : "pointer",
                opacity: broadcasting ? 0.75 : 1,
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
            >
              <HiOutlinePaperAirplane size={14} />
              {broadcasting ? "Broadcasting..." : "Send Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
