/**
 * Utility function to reliably trigger browser file downloads with the correct filename and extension.
 * Handles Chrome timing issues where immediate removal of <a> tags causes fallback to Blob UUIDs.
 */
export const triggerBrowserDownload = (blobData, originalFileName, contentType) => {
  if (!blobData) return;

  // Ensure blob has the right MIME type
  const type = contentType || blobData.type || "application/octet-stream";
  const blob = blobData instanceof Blob ? (blobData.type ? blobData : new Blob([blobData], { type })) : new Blob([blobData], { type });

  let downloadName = originalFileName ? originalFileName.trim() : "";

  // Fallback name if none provided
  if (!downloadName) {
    downloadName = "document";
  }

  // Auto-append known extensions if missing
  if (!downloadName.includes(".")) {
    if (type.includes("jpeg") || type.includes("jpg")) downloadName += ".jpeg";
    else if (type.includes("png")) downloadName += ".png";
    else if (type.includes("pdf")) downloadName += ".pdf";
    else if (type.includes("zip")) downloadName += ".zip";
    else if (type.includes("plain") || type.includes("text")) downloadName += ".txt";
    else if (type.includes("csv")) downloadName += ".csv";
    else if (type.includes("excel") || type.includes("spreadsheetml")) downloadName += ".xlsx";
    else if (type.includes("wordprocessingml") || type.includes("msword")) downloadName += ".docx";
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = downloadName;
  link.setAttribute("download", downloadName);

  document.body.appendChild(link);
  link.click();

  // Keep link in DOM briefly so Chrome download manager can read download attribute
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
  }, 1500);
};

export const extractFileNameFromHeaders = (headers, fallbackName) => {
  if (!headers) return fallbackName;
  const disposition = headers["content-disposition"] || headers["Content-Disposition"];
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches && matches[1]) {
      return matches[1].replace(/['"]/g, "").trim();
    }
  }
  return fallbackName;
};
