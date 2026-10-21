import React from "react";
import {
  HiOutlineCloudArrowUp,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import "../styles/FileUploadProgress.css";

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function FileUploadProgress({
  progress = 0,
  loadedBytes = 0,
  totalBytes = 0,
  phase = "IDLE", // 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  fileName = "",
  destination = "",
  errorMessage = "",
  onCancel,
  onRetry,
  theme = "light", // 'light' | 'dark'
}) {
  if (phase === "IDLE") return null;

  const isUploading = phase === "UPLOADING";
  const isProcessing = phase === "PROCESSING";
  const isSuccess = phase === "SUCCESS";
  const isError = phase === "ERROR";

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer = null;
    if (isProcessing) {
      setElapsedSeconds(1);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  const cleanPercent = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={`fup-container fup-${theme} ${
        isProcessing ? "fup-processing" : isSuccess ? "fup-success" : isError ? "fup-error" : ""
      }`}
    >
      {/* Top Header */}
      <div className="fup-header">
        <div className="fup-file-info">
          {/* Animated Icon Badge */}
          <div
            className={`fup-icon-badge ${
              isProcessing
                ? "fup-icon-processing"
                : isSuccess
                ? "fup-icon-success"
                : isError
                ? "fup-icon-error"
                : "fup-icon-uploading"
            }`}
          >
            {isUploading && <HiOutlineCloudArrowUp className="fup-bounce" />}
            {isProcessing && <HiOutlineArrowPath className="fup-spin" />}
            {isSuccess && <HiOutlineCheckCircle />}
            {isError && <HiOutlineExclamationTriangle />}
          </div>

          <div className="fup-file-text">
            <span className="fup-filename" title={fileName}>
              {fileName || "Selected Document"}
            </span>
            <div className="fup-subtitle">
              {destination && <span>To: <strong>{destination}</strong></span>}
              {destination && totalBytes > 0 && <span>•</span>}
              {totalBytes > 0 && <span>{formatBytes(totalBytes)}</span>}
            </div>
          </div>
        </div>

        {/* Status Percentage Badge or Cancel */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className={`fup-percentage-badge ${
              isProcessing
                ? "fup-pct-processing"
                : isSuccess
                ? "fup-pct-success"
                : isError
                ? "fup-pct-error"
                : ""
            }`}
          >
            {isUploading && `${cleanPercent}%`}
            {isProcessing && `100% • AWS S3 Sync (${elapsedSeconds}s)`}
            {isSuccess && "Verified"}
            {isError && "Failed"}
          </span>

          {isUploading && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              title="Cancel Upload"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                opacity: 0.7,
                color: "inherit",
              }}
            >
              <HiOutlineXMark size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modern Animated Progress Track */}
      <div className="fup-track">
        <div
          className={`fup-fill ${
            isProcessing
              ? "fup-fill-processing"
              : isSuccess
              ? "fup-fill-success"
              : isError
              ? "fup-fill-error"
              : "fup-fill-uploading"
          }`}
          style={{ width: `${isProcessing ? 100 : cleanPercent}%` }}
        />
      </div>

      {/* Progress Footer: Live Bytes & Status description */}
      <div className="fup-footer">
        <div className="fup-stats">
          {isUploading && totalBytes > 0 ? (
            <span>
              {formatBytes(loadedBytes)} / {formatBytes(totalBytes)}
            </span>
          ) : isProcessing ? (
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <HiOutlineShieldCheck size={15} color="#9333ea" /> AWS S3 Encrypted Storage
            </span>
          ) : isSuccess ? (
            <span>100% Uploaded & Encrypted</span>
          ) : isError ? (
            <span>Upload Interrupted</span>
          ) : null}
        </div>

        <div className="fup-status-msg">
          {isUploading && <span>Uploading to server...</span>}
          {isProcessing && (
            <span className="fup-status-processing">
              Securing in AWS S3 ({elapsedSeconds}s)... Please wait
            </span>
          )}
          {isSuccess && <span className="fup-status-success">Ready in portal!</span>}
          {isError && <span className="fup-status-error">Error occurred</span>}
        </div>
      </div>

      {/* Error Callout Banner if failed */}
      {isError && (
        <div className="fup-error-callout">
          <span>{errorMessage || "Upload encountered an error. Please try again."}</span>
          {onRetry && (
            <button type="button" className="fup-btn-retry" onClick={onRetry}>
              Retry Upload
            </button>
          )}
        </div>
      )}
    </div>
  );
}
