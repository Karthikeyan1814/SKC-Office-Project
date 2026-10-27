import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  HiOutlineXMark,
  HiOutlineMagnifyingGlassPlus,
  HiOutlineMagnifyingGlassMinus,
  HiOutlineArrowPath,
  HiOutlineLockClosed,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";

// Configure PDF.js worker using bundled local URL
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (err) {
    console.warn("PDF.js worker initialization:", err);
  }
}

export default function ProtectedDocumentViewer({ file, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const fileName = file?.fileName || "Document";
  const isPdf =
    fileName.toLowerCase().endsWith(".pdf") ||
    file?.fileType?.includes("pdf") ||
    file?.url?.includes("application/pdf");

  const isImage =
    fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/) ||
    file?.fileType?.startsWith("image/");

  // Block right-click, text selection, and save shortcuts (Ctrl+S, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!isPdf || !file?.url) {
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: file.url,
          withCredentials: false,
        });
        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.error("Failed to parse PDF via PDF.js:", err);
        if (!isCancelled) {
          setError("Failed to load PDF canvas renderer. Falling back to secure viewer.");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [file?.url, isPdf]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !isPdf) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        const viewport = page.getViewport({ scale });

        // High DPI support for razor-sharp text
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("Page render issue:", err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, isPdf]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.2).toFixed(1)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, +(prev - 0.2).toFixed(1)));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        padding: "16px",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          borderRadius: "18px",
          maxWidth: "1050px",
          width: "100%",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "12px 20px",
            background: "#1e293b",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #059669, #047857)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#fff",
              }}
            >
              <HiOutlineLockClosed size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#f8fafc",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "380px",
                }}
                title={fileName}
              >
                {fileName}
              </h4>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                <span style={{ color: "#34d399", fontWeight: "700" }}>🛡️ Protected View</span>
                <span>•</span>
                <span>Downloads & Printing Strictly Restricted for Staff</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isPdf && numPages > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#334155",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  fontWeight: "600",
                }}
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={handlePrevPage}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: currentPage <= 1 ? "#64748b" : "#fff",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    padding: "2px 4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Previous Page"
                >
                  <HiOutlineChevronLeft size={16} />
                </button>
                <span>
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={handleNextPage}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: currentPage >= numPages ? "#64748b" : "#fff",
                    cursor: currentPage >= numPages ? "not-allowed" : "pointer",
                    padding: "2px 4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Next Page"
                >
                  <HiOutlineChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {isPdf && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#334155",
                  padding: "4px 8px",
                  borderRadius: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "2px" }}
                  title="Zoom Out"
                >
                  <HiOutlineMagnifyingGlassMinus size={16} />
                </button>
                <span
                  onClick={handleResetZoom}
                  style={{ fontSize: "11.5px", color: "#f1f5f9", fontWeight: "700", cursor: "pointer", padding: "0 4px" }}
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "2px" }}
                  title="Zoom In"
                >
                  <HiOutlineMagnifyingGlassPlus size={16} />
                </button>
              </div>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#334155",
                border: "none",
                color: "#e2e8f0",
                cursor: "pointer",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              title="Close Preview"
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>
        </div>

        {/* Document Content Area */}
        <div
          style={{
            flex: 1,
            background: "#090d16",
            position: "relative",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading && (
            <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid #334155",
                  borderTopColor: "#10b981",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px auto",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Rendering Protected Document...</span>
            </div>
          )}

          {/* Canvas Rendering (PDR.js) - 100% Free of Native PDF Browser Toolbar & Save Button */}
          {isPdf && !error && (
            <div
              style={{
                position: "relative",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#ffffff",
                display: loading ? "none" : "block",
              }}
            >
              <canvas ref={canvasRef} style={{ display: "block" }} />

              {/* Security Watermark Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "repeating-linear-gradient(45deg, transparent, transparent 180px, rgba(16, 185, 129, 0.05) 180px, rgba(16, 185, 129, 0.05) 360px)",
                }}
              >
                <div
                  style={{
                    transform: "rotate(-30deg)",
                    color: "rgba(15, 23, 42, 0.12)",
                    fontSize: "26px",
                    fontWeight: "900",
                    letterSpacing: "4px",
                    textAlign: "center",
                    textTransform: "uppercase",
                  }}
                >
                  SRI KATHIRAVAN & CO • STAFF VIEW ONLY
                </div>
              </div>
            </div>
          )}

          {/* Image Document Rendering */}
          {isImage && (
            <div
              style={{
                position: "relative",
                margin: "auto",
                maxWidth: "100%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <img
                src={file.url}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  display: "block",
                  pointerEvents: "none",
                }}
                onDragStart={(e) => e.preventDefault()}
              />
              {/* Security Watermark */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    transform: "rotate(-30deg)",
                    color: "rgba(15, 23, 42, 0.15)",
                    fontSize: "28px",
                    fontWeight: "900",
                    letterSpacing: "4px",
                    textAlign: "center",
                    textTransform: "uppercase",
                  }}
                >
                  SRI KATHIRAVAN & CO • STAFF VIEW ONLY
                </div>
              </div>
            </div>
          )}

          {/* Secure Fallback for Errors or Unsupported Formats - NEVER use iframe to prevent browser toolbar leaks */}
          {error && (
            <div style={{ margin: "auto", textAlign: "center", color: "#f87171", maxWidth: "450px", padding: "24px", background: "rgba(30, 41, 59, 0.7)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#fca5a5", fontWeight: "700" }}>Protected Viewer Notice</h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                {error}
              </p>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Client documents are strictly protected under office policy. Downloading and browser toolbar access are restricted.
              </span>
            </div>
          )}

          {!isPdf && !isImage && !error && (
            <div style={{ margin: "auto", textAlign: "center", color: "#cbd5e1", maxWidth: "450px", padding: "24px", background: "rgba(30, 41, 59, 0.7)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📁</div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#f8fafc", fontWeight: "700" }}>Non-Previewable File Format</h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                This file format ({fileName.split('.').pop()?.toUpperCase()}) cannot be rendered directly in protected canvas view.
              </p>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Staff downloads are restricted by administrative policy.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
