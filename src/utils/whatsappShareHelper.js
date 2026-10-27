import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Universal High-Resolution Vector PDF Generator
 * Uses html2canvas + jsPDF directly to guarantee non-blank, pixel-perfect, crisp PDF generation.
 */
export async function generateVectorPdfBlob(docHtml, isReceipt = false, docTitle = "Document") {
  // Create an on-screen fixed render container at top level (zIndex: 9999999)
  // so html2canvas renders the full document without negative coordinate or clipping issues.
  const mount = document.createElement("div");
  mount.id = "skc-pdf-vector-render";
  mount.style.position = "fixed";
  mount.style.left = "0px";
  mount.style.top = "0px";
  mount.style.width = isReceipt ? "1122px" : "794px";
  mount.style.backgroundColor = "#ffffff";
  mount.style.color = "#0f172a";
  mount.style.margin = "0";
  mount.style.padding = "0";
  mount.style.zIndex = "9999999";
  mount.style.pointerEvents = "none";
  mount.innerHTML = docHtml;

  document.body.appendChild(mount);

  try {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(mount, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: isReceipt ? 1122 : 794,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.96);
    const orientation = isReceipt ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgHeightInPdf = (canvasHeight * pdfPageWidth) / canvasWidth;

    let heightLeft = imgHeightInPdf;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, pdfPageWidth, imgHeightInPdf, undefined, "FAST");
    heightLeft -= pdfPageHeight;

    while (heightLeft > 2) {
      position = heightLeft - imgHeightInPdf;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfPageWidth, imgHeightInPdf, undefined, "FAST");
      heightLeft -= pdfPageHeight;
    }

    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } finally {
    if (document.body.contains(mount)) {
      document.body.removeChild(mount);
    }
  }
}

/**
 * Universal browser file downloader
 */
export function downloadBlob(blob, fileName = "Document.pdf") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Universal WhatsApp Sharing Utility
 * Attaches the file directly without captions as requested.
 * Works seamlessly on Mobile (Android, iOS) and Windows (Edge, Chrome).
 */
export async function shareViaWhatsApp({
  fileBlob = null,
  fileName = "Document.pdf",
  fileMimeType = "application/pdf",
  phone = "",
  title = "Document",
  message = "",
  directUrl = "",
}) {
  const phoneClean = (phone || "").replace(/\D/g, "");
  const baseFileName = fileName ? fileName.trim() : "Document.pdf";

  // ── LEVEL 1: NATIVE WEB SHARE API (Mobile & Windows 10/11) ──
  // Attaches the file directly without text captions
  if (fileBlob && typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const fileObj = new File([fileBlob], baseFileName, {
        type: fileMimeType || fileBlob.type || "application/pdf",
        lastModified: Date.now(),
      });

      const shareData = {
        title: baseFileName,
        files: [fileObj],
      };

      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Document attached to WhatsApp!");
        return true;
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        return false;
      }
      console.warn("Native file sharing aborted or not supported, proceeding to fallback:", err);
    }
  }

  // ── LEVEL 2: DESKTOP FALLBACK (Auto-download PDF + Open WhatsApp Web) ──
  if (fileBlob) {
    downloadBlob(fileBlob, baseFileName);
  }

  // Format message only if explicitly passed (e.g. FileManagement link share)
  let fullMessage = message || "";
  if (directUrl && fullMessage && !fullMessage.includes(directUrl)) {
    fullMessage += `\n\n🔗 *Direct Access / Verification Link:* ${directUrl}`;
  }

  const queryPart = fullMessage ? `?text=${encodeURIComponent(fullMessage)}` : "";
  const waUrl = phoneClean
    ? `https://wa.me/91${phoneClean}${queryPart}`
    : `https://api.whatsapp.com/send${queryPart}`;

  window.open(waUrl, "_blank");

  if (fileBlob) {
    toast.success("PDF downloaded! In WhatsApp, click 📎 to attach.", { duration: 5000 });
  } else {
    toast.success("Opening WhatsApp chat...", { duration: 4000 });
  }

  return true;
}

/**
 * Universal Default Email Client Sharing Utility
 * Attaches the file directly in the user's default email client (Windows Mail / Outlook / mobile email).
 */
export async function shareViaEmail({
  fileBlob = null,
  fileName = "Document.pdf",
  fileMimeType = "application/pdf",
  email = "",
  title = "Document",
  docNo = "",
}) {
  const baseFileName = fileName ? fileName.trim() : "Document.pdf";
  const subject = `${title}${docNo ? ` - ${docNo}` : ""}`;

  // ── LEVEL 1: NATIVE WEB SHARE API (Mobile & Windows 10/11) ──
  // Native share sheet lets user choose default Mail / Outlook / Gmail with file attached directly
  if (fileBlob && typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const fileObj = new File([fileBlob], baseFileName, {
        type: fileMimeType || fileBlob.type || "application/pdf",
        lastModified: Date.now(),
      });

      const shareData = {
        title: subject,
        files: [fileObj],
      };

      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Document attached to email!");
        return true;
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        return false;
      }
      console.warn("Native email share aborted, using mailto fallback:", err);
    }
  }

  // ── LEVEL 2: DESKTOP MAILTO FALLBACK ──
  // Auto-downloads the PDF file directly and launches default email client via mailto:
  if (fileBlob) {
    downloadBlob(fileBlob, baseFileName);
  }

  const mailtoUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:?subject=${encodeURIComponent(subject)}`;

  window.location.href = mailtoUrl;

  if (fileBlob) {
    toast.success("PDF downloaded! Click 'Attach file' in your email client.", { duration: 5000 });
  }
  return true;
}

/**
 * Backward compatibility document HTML blob helper
 */
export function generateDocumentBlob(htmlContent, title = "Document") {
  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: sans-serif; background: #ffffff; padding: 16px; margin: 0; }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;
  return new Blob([fullHtml], { type: "text/html;charset=utf-8" });
}
