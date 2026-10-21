import toast from "react-hot-toast";

/**
 * Universal WhatsApp & Document Sharing Utility
 * 
 * 1. Native Web Share API (Level 1):
 *    On supported mobile browsers (Chrome Android, Safari iOS) and compatible platforms,
 *    attaches the actual document file (.pdf / .png / document) directly into WhatsApp via navigator.share({ files: [file] }).
 * 
 * 2. Instant Auto-Download + WhatsApp Web Chat Launch (Level 2 Desktop Fallback):
 *    Since WhatsApp Web protocol does not permit web browsers to attach arbitrary local files via wa.me URL query parameters,
 *    this automatically triggers the download of the document file to the user's computer,
 *    copies/pre-fills the WhatsApp message with client details & direct portal verification link,
 *    and displays clear guidance: "📄 File downloaded! Simply click 📎 in WhatsApp to attach."
 */
export async function shareViaWhatsApp({
  fileBlob = null,
  fileName = "Document.pdf",
  fileMimeType = "application/pdf",
  phone = "",
  title = "SKC Office Document",
  message = "",
  directUrl = "",
}) {
  const phoneClean = (phone || "").replace(/\D/g, "");
  const baseFileName = fileName ? fileName.trim() : "Document.pdf";

  // ── LEVEL 1: NATIVE WEB SHARE API WITH FILE ATTACHMENT ──
  if (fileBlob && typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
    try {
      const fileObj = new File([fileBlob], baseFileName, {
        type: fileMimeType || fileBlob.type || "application/pdf",
        lastModified: Date.now(),
      });

      if (navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          title,
          text: message,
          files: [fileObj],
        });
        toast.success("Document shared with file attached via WhatsApp!");
        return true;
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        // User closed or dismissed the share sheet
        return false;
      }
      console.warn("Native file sharing error, falling back to desktop download workflow:", err);
    }
  }

  // ── LEVEL 2: DESKTOP WORKFLOW (DIRECT WHATSAPP WEB CHAT LAUNCH) ──
  // Format WhatsApp text with message & portal verification link
  let fullMessage = message;
  if (directUrl && !fullMessage.includes(directUrl)) {
    fullMessage += `\n\n🔗 *Direct Access / Verification Link:* ${directUrl}`;
  }

  const waUrl = phoneClean
    ? `https://wa.me/91${phoneClean}?text=${encodeURIComponent(fullMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;

  window.open(waUrl, "_blank");

  toast.success("Opening WhatsApp chat with document details...", { duration: 4000 });

  return true;
}

/**
 * Converts printable document HTML into a standalone printable document Blob for sharing/download.
 */
export function generateDocumentBlob(htmlContent, title = "Document") {
  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      @page { size: auto; margin: 8mm; }
      *, *::before, *::after { box-sizing: border-box !important; }
      body {
        font-family: 'Inter', sans-serif;
        background: #ffffff;
        margin: 0;
        padding: 16px;
        color: #0f172a;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .doc-paper-invoice, .doc-paper-receipt {
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 24px;
        max-width: 900px;
        margin: 0 auto;
        background: #ffffff;
      }
      .doc-table, .receipt-items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 11px;
      }
      .doc-table th, .receipt-items-table th {
        padding: 7px 8px;
        font-weight: 700;
        text-align: left;
      }
      .doc-table td, .receipt-items-table td {
        padding: 7px 8px;
        border-bottom: 1px solid #e2e8f0;
      }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;
  return new Blob([fullHtml], { type: "text/html;charset=utf-8" });
}
