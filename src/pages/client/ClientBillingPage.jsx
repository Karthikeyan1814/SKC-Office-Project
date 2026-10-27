import { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosInstance";
import "../../styles/BillingPage.css";
import "../../styles/ClientPortal.css";
import {
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineClipboardDocument,
  HiOutlineFolderOpen,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import { buildDocPrintHtml } from "../../utils/billingPrintTemplate";
import {
  shareViaWhatsApp,
  shareViaEmail,
  generateVectorPdfBlob,
  downloadVectorPdf,
  downloadBlob,
} from "../../utils/whatsappShareHelper";

// Default Firm Bank Info
const FIRM_INFO = {
  name: "Sri Kathiravan & Co.",
  subTitle: "Tax, Audit & Financial Advisory Consultants",
  bankName: "HDFC Bank Ltd",
  accountName: "Sri Kathiravan & Co.",
  accountNumber: "50200084729103",
  ifscCode: "HDFC0001234",
  branch: "Salem Main Branch",
  upiId: "8825750992@upi",
  phone: "+91 88257 50992",
};

const normalizeDoc = (d) => {
  let items = [];
  try {
    if (d.itemsJson) items = typeof d.itemsJson === "string" ? JSON.parse(d.itemsJson) : d.itemsJson;
    else if (d.items) items = d.items;
  } catch {}

  let paymentDetails = {};
  try {
    if (d.paymentDetailsJson) paymentDetails = typeof d.paymentDetailsJson === "string" ? JSON.parse(d.paymentDetailsJson) : d.paymentDetailsJson;
    else if (d.paymentDetails) paymentDetails = d.paymentDetails;
  } catch {}

  let customColumns = [];
  try {
    if (d.customColumnsJson) customColumns = typeof d.customColumnsJson === "string" ? JSON.parse(d.customColumnsJson) : d.customColumnsJson;
    else if (d.customColumns) customColumns = d.customColumns;
  } catch {}

  let intermediateRows = [];
  try {
    if (d.intermediateRowsJson) intermediateRows = typeof d.intermediateRowsJson === "string" ? JSON.parse(d.intermediateRowsJson) : d.intermediateRowsJson;
    else if (d.intermediateRows) intermediateRows = d.intermediateRows;
  } catch {}

  let firm = null;
  try {
    if (d.firmJson) firm = typeof d.firmJson === "string" ? JSON.parse(d.firmJson) : d.firmJson;
    else if (d.firm) firm = d.firm;
  } catch {}

  return {
    ...d,
    id: d.id,
    date: d.docDate || d.date || "",
    time: d.docTime || d.time || "",
    dueDate: d.dueDate || "",
    totalOutstanding: d.totalOutstanding !== undefined ? d.totalOutstanding : (d.paymentDetails?.totalOutstanding || 0),
    declaredNetWorthPayable: d.declaredNetWorthPayable !== undefined ? d.declaredNetWorthPayable : null,
    declaredAdjustmentDiff: d.declaredAdjustmentDiff !== undefined ? d.declaredAdjustmentDiff : (d.paymentDetails?.declaredAdjustmentDiff || 0),
    declaredAdjustmentNote: d.declaredAdjustmentNote || d.paymentDetails?.declaredAdjustmentNote || "",
    items: Array.isArray(items) && items.length > 0 ? items : [
      {
        id: 1,
        description: d.type === "RECEIPT" ? (d.receiptTowards || "Payment Towards Account") : "Professional Tax & Advisory Services",
        quantity: 1,
        rate: d.totalAmount || 0,
        total: d.totalAmount || 0,
        gstPercent: 18,
      }
    ],
    paymentDetails,
    customColumns: Array.isArray(customColumns) ? customColumns : [],
    intermediateRows: Array.isArray(intermediateRows) ? intermediateRows : [],
    firm: firm || null,
  };
};

export default function ClientBillingPage() {
  const clientName = localStorage.getItem("skc-name") || "Valued Client";
  const [filterType, setFilterType] = useState("ALL"); // "ALL", "INVOICE", "RECEIPT"
  const [billingArchive, setBillingArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);
  const [firmInfo, setFirmInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_firm_info");
      if (saved) return JSON.parse(saved);
    } catch {}
    return FIRM_INFO;
  });

  const fetchClientDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/Client/Billing/Documents");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const normalized = res.data.map(normalizeDoc);
        setBillingArchive(normalized);
        try {
          localStorage.setItem("skc_client_billing_cache", JSON.stringify(normalized));
        } catch {}
        return;
      }
    } catch (err) {
      console.warn("Client billing fetch error:", err);
    } finally {
      setLoading(false);
    }

    // Fallback to cache or localStorage if offline
    try {
      const cached = localStorage.getItem("skc_client_billing_cache") || localStorage.getItem("skc_billing_archive");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setBillingArchive(parsed.map(normalizeDoc));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchClientDocs();

    // Dynamically load active Firm & Bank particulars
    const fetchFirmDetails = async () => {
      try {
        const res = await api.get("/Public/FirmDetails");
        if (res.data) {
          setFirmInfo(res.data);
          try {
            localStorage.setItem("skc_firm_info", JSON.stringify(res.data));
          } catch {}
        }
      } catch (err) {
        console.warn("Public firm details fetch warning:", err);
      }
    };
    fetchFirmDetails();
  }, []);

  // Filter documents belonging to this client or all active if matching
  const clientDocs = useMemo(() => {
    if (!billingArchive || billingArchive.length === 0) return [];
    
    // If documents were returned by backend API (scoped to current authenticated client)
    const fromBackend = billingArchive.some((d) => d.clientId !== undefined);
    if (fromBackend) {
      return billingArchive.filter((d) => !d.isArchived);
    }

    const clientMobile = (localStorage.getItem("skc-mobile") || "").replace(/\D/g, "");
    const nameLower = clientName.toLowerCase().trim();

    // Match by mobile or name, or fallback to first few if demonstration
    const matched = billingArchive.filter((doc) => {
      if (doc.isArchived) return false;
      const docMobile = (doc.clientMobile || "").replace(/\D/g, "");
      if (clientMobile && docMobile && (docMobile.includes(clientMobile) || clientMobile.includes(docMobile))) return true;
      const docName = (doc.clientName || "").toLowerCase().trim();
      if (nameLower && (docName.includes(nameLower) || nameLower.includes(docName))) return true;
      return false;
    });

    if (matched.length > 0) return matched;
    return billingArchive.filter((d) => !d.isArchived);
  }, [billingArchive, clientName]);

  // Aggregate Client Financial Metrics
  const metrics = useMemo(() => {
    const totalBilled = clientDocs
      .filter((d) => d.type === "INVOICE")
      .reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);

    const totalPaid = clientDocs.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

    const totalPendingDue = clientDocs
      .filter((d) => d.type === "INVOICE" && (Number(d.remainingBalance) || 0) > 0)
      .reduce((sum, d) => sum + (Number(d.remainingBalance) || 0), 0);

    return { totalBilled, totalPaid, totalPendingDue };
  }, [clientDocs]);

  // Filtered List based on tab
  const filteredList = useMemo(() => {
    if (filterType === "ALL") return clientDocs;
    return clientDocs.filter((d) => d.type === filterType);
  }, [clientDocs, filterType]);

  // Copy to Clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // 100% Vector Print/PDF Handler for Client (Exact Parity with Admin)
  const handlePrintDoc = (doc) => {
    const isReceipt = doc.type === "RECEIPT";
    const docTitle = `${doc.type}_${doc.docNumber}`;
    const orientation = isReceipt ? "landscape" : "portrait";

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast.error("Please allow popups to download or view the document PDF.");
      return;
    }

    let stylesHtml = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
      stylesHtml += el.outerHTML + "\n";
    });

    const docHtml = buildDocPrintHtml(doc, firmInfo);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 ${orientation};
              margin: ${isReceipt ? "6mm" : "8mm"};
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              color: #1e293b !important;
            }
            .print-wrapper {
              width: 100% !important;
              max-width: ${isReceipt ? "280mm" : "198mm"} !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            /* Multi-page & Single-page print rules */
            table {
              width: 100% !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .doc-summary-split,
            .doc-bank-box,
            .doc-calc-table-wrap,
            .doc-amount-words,
            .doc-payment-status {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .doc-footer-grid,
            .doc-terms,
            .doc-seal-box,
            .doc-signatory,
            .doc-receipt-footer {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-before: auto !important;
              break-before: auto !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${docHtml}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Direct High-Resolution Vector PDF Download
  const handleDownloadPdfDoc = async (doc) => {
    if (!doc) return;
    const isReceipt = doc.type === "RECEIPT";
    const docTitle = `${doc.type}_${doc.docNumber}`;
    try {
      toast.loading("Generating vector PDF...", { id: "client-pdf-dl" });
      const docHtml = buildDocPrintHtml(doc, firmInfo);
      await downloadVectorPdf(docHtml, isReceipt, docTitle);
      toast.dismiss("client-pdf-dl");
      toast.success(`Downloaded ${docTitle}.pdf successfully!`);
    } catch (err) {
      console.error(err);
      toast.dismiss("client-pdf-dl");
      toast.error("Failed to generate PDF. Please try Print Document if needed.");
    }
  };

  // WhatsApp Share with Attached PDF File (No Captions)
  const handleWhatsAppShareDoc = async (doc) => {
    if (!doc) return;
    const isReceipt = doc.type === "RECEIPT";
    const docTitle = `${doc.type}_${doc.docNumber}`;
    const clientMobile = localStorage.getItem("skc-mobile") || doc.clientMobile || "";

    toast.loading("Preparing PDF for WhatsApp...", { id: "client-wa-share" });
    try {
      const docHtml = buildDocPrintHtml(doc, firmInfo);
      const { blob: pdfBlob } = await generateVectorPdfBlob(docHtml, isReceipt, docTitle);
      toast.dismiss("client-wa-share");

      await shareViaWhatsApp({
        fileBlob: pdfBlob,
        fileName: `${docTitle}.pdf`,
        phone: clientMobile,
        title: `${isReceipt ? "Payment Receipt" : "Tax Invoice"} - ${doc.docNumber}`,
      });
    } catch (err) {
      console.error("WhatsApp share error:", err);
      toast.dismiss("client-wa-share");
      toast.error("Could not prepare PDF for WhatsApp.");
    }
  };

  // Default Email Share with Attached PDF File
  const handleEmailShareDoc = async (doc) => {
    if (!doc) return;
    const isReceipt = doc.type === "RECEIPT";
    const docTitle = `${doc.type}_${doc.docNumber}`;
    const clientEmail = doc.clientEmail || "";

    toast.loading("Preparing PDF for Email...", { id: "client-email-share" });
    try {
      const docHtml = buildDocPrintHtml(doc, firmInfo);
      const { blob: pdfBlob } = await generateVectorPdfBlob(docHtml, isReceipt, docTitle);
      toast.dismiss("client-email-share");

      await shareViaEmail({
        fileBlob: pdfBlob,
        fileName: `${docTitle}.pdf`,
        email: clientEmail,
        title: `${isReceipt ? "Payment Receipt" : "Tax Invoice"}`,
        docNo: doc.docNumber,
      });
    } catch (err) {
      console.error("Email share error:", err);
      toast.dismiss("client-email-share");
      toast.error("Could not prepare PDF for Email.");
    }
  };

  return (
    <div className="client-page-container">
      {/* ── CLIENT BILLING EXECUTIVE HERO ── */}
      <div className="client-hero-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}>
        <div>
          <span
            className="client-hero-tag"
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#93c5fd",
              border: "1px solid rgba(147, 197, 253, 0.3)",
            }}
          >
            <HiOutlineSparkles size={14} /> OFFICIAL CLIENT FINANCIAL STATEMENT
          </span>
          <h1 className="client-hero-title">Invoices & Payment Receipts</h1>
          <p className="client-hero-sub">
            Real-time ledger of your billed advisory retainers, verified compliance payments, and downloadable tax invoices
          </p>
        </div>

        <div className="client-hero-actions">
          <button
            type="button"
            className="btn-client-outline"
            onClick={fetchClientDocs}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <HiOutlineArrowPath size={16} className={loading ? "spin-animate" : ""} />
            {loading ? "Syncing..." : "Refresh Ledger"}
          </button>
          <button
            type="button"
            className="btn-client-outline"
            onClick={() => handleCopy(firmInfo.accountNumber, "Bank Account Number")}
          >
            <HiOutlineClipboardDocument size={16} /> Copy Bank Details
          </button>
        </div>
      </div>

      {/* ── 3 FINANCIAL REAL-TIME TRACKING CARDS ── */}
      <div className="client-stats-grid" style={{ marginBottom: "28px" }}>
        {/* Metric 1: Total Billed */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Total Billed (Payable)</p>
            <h3 className="client-stat-val">
              ₹ {metrics.totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Audited Professional Fees</span>
          </div>
          <div className="client-stat-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <HiOutlineDocumentText size={20} />
          </div>
        </div>

        {/* Metric 2: Total Paid */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Amount Cleared / Paid</p>
            <h3 className="client-stat-val" style={{ color: "#15803d" }}>
              ₹ {metrics.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: "12px", color: "#16a34a" }}>Realized via Online & Bank</span>
          </div>
          <div className="client-stat-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
            <HiOutlineCheckCircle size={20} />
          </div>
        </div>

        {/* Metric 3: Remaining Balance */}
        <div className="client-stat-card">
          <div>
            <p className="client-stat-label">Remaining Balance Due</p>
            <h3
              className="client-stat-val"
              style={{ color: metrics.totalPendingDue <= 0 ? "#15803d" : "#dc2626" }}
            >
              ₹ {metrics.totalPendingDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: "12px", color: metrics.totalPendingDue <= 0 ? "#15803d" : "#dc2626", fontWeight: "700" }}>
              {metrics.totalPendingDue <= 0 ? "✓ All Accounts Settled" : "⚠️ Outstanding Payment Due"}
            </span>
          </div>
          <div
            className="client-stat-icon-wrap"
            style={{
              background: metrics.totalPendingDue <= 0 ? "#ecfdf5" : "#fef2f2",
              color: metrics.totalPendingDue <= 0 ? "#059669" : "#dc2626",
            }}
          >
            {metrics.totalPendingDue <= 0 ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationCircle size={20} />}
          </div>
        </div>
      </div>

      {/* ── AUTHORIZED REMITTANCE BANK & UPI DETAILS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1.5px solid #e2e8f0",
          padding: "22px 24px",
          marginBottom: "28px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <HiOutlineBanknotes size={20} color="#2563eb" />
              How to Pay — {firmInfo.name} Official Remittance Channels
            </h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
              Direct bank transfer and online UPI handles verified for instant payment acknowledgment
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(firmInfo.upiId, "Official UPI ID")}
            style={{
              padding: "7px 14px",
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HiOutlineClipboardDocument size={14} /> Copy UPI ID ({firmInfo.upiId})
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", fontSize: "13px" }}>
          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Beneficiary Bank</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.bankName}</strong>
          </div>

          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Account Name</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.accountName}</strong>
          </div>

          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Account Number</span>
            <strong style={{ color: "#1e40af", letterSpacing: "0.5px" }}>{firmInfo.accountNumber}</strong>
          </div>

          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>IFSC Code</span>
            <strong style={{ color: "#0f172a" }}>{firmInfo.ifscCode}</strong> ({firmInfo.branch})
          </div>
        </div>
      </div>

      {/* ── FILED INVOICES & RECEIPTS LIST ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1.5px solid #e2e8f0",
          padding: "22px 24px",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              My Filed Invoices & Payment Receipts ({filteredList.length})
            </h3>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>
              Click "Download / View PDF" to generate and print your official signed document
            </span>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`billing-filter-tab ${filterType === "ALL" ? "active-tab" : ""}`}
              onClick={() => setFilterType("ALL")}
            >
              All Records
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${filterType === "INVOICE" ? "active-tab" : ""}`}
              onClick={() => setFilterType("INVOICE")}
            >
              Tax Invoices
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${filterType === "RECEIPT" ? "active-tab" : ""}`}
              onClick={() => setFilterType("RECEIPT")}
            >
              Payment Receipts
            </button>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
            <HiOutlineDocumentText size={36} color="#94a3b8" style={{ display: "block", margin: "0 auto 10px" }} />
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#334155" }}>
              No billing documents found
            </h4>
            <p style={{ margin: "4px 0", fontSize: "12.5px" }}>
              When the administrator files tax invoices or payment receipts for your account, they will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="items-table-wrapper" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Doc Type</th>
                  <th>Document No</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Total Bill (₹)</th>
                  <th style={{ textAlign: "right" }}>Amount Paid (₹)</th>
                  <th style={{ textAlign: "right" }}>Remaining Due (₹)</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((doc) => {
                  const isFullyPaid = (Number(doc.remainingBalance) || 0) <= 0;
                  const isPartial = (Number(doc.paidAmount) || 0) > 0 && !isFullyPaid;
                  return (
                    <tr key={doc.id}>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            background: doc.type === "INVOICE" ? "#eff6ff" : "#ecfdf5",
                            color: doc.type === "INVOICE" ? "#1e40af" : "#065f46",
                          }}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{doc.docNumber}</strong>
                      </td>
                      <td>{doc.date}</td>
                      <td style={{ textAlign: "right", fontWeight: "700" }}>
                        ₹{Number(doc.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {doc.declaredAdjustmentDiff !== undefined && Number(doc.declaredAdjustmentDiff) !== 0 && (
                          <div style={{ fontSize: "10.5px", color: Number(doc.declaredAdjustmentDiff) < 0 ? "#15803d" : "#1d4ed8", fontWeight: "700" }}>
                            {Number(doc.declaredAdjustmentDiff) < 0 ? "Concession: - " : "Surcharge: + "}
                            ₹{Math.abs(Number(doc.declaredAdjustmentDiff)).toLocaleString("en-IN")}
                            {doc.declaredAdjustmentNote ? ` (${doc.declaredAdjustmentNote})` : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", color: "#15803d", fontWeight: "700" }}>
                        ₹{Number(doc.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: "800",
                          color: isFullyPaid ? "#15803d" : "#dc2626",
                        }}
                      >
                        ₹{Number(doc.remainingBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`payment-mode-tag mode-tag-${(doc.paymentMode || "UPI").toLowerCase().replace('_', '-')}`}>
                          {doc.paymentMode || "UPI"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`stamp-badge ${
                            isFullyPaid ? "stamp-paid" : isPartial ? "stamp-partial" : "stamp-due"
                          }`}
                          style={{ fontSize: "10px", padding: "2px 8px" }}
                        >
                          {isFullyPaid ? "PAID" : isPartial ? "PARTIAL" : "DUE"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDocPreview(doc)}
                            style={{
                              padding: "5px 10px",
                              background: "#f1f5f9",
                              color: "#1e293b",
                              border: "1px solid #cbd5e1",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Interactive high-fidelity document preview"
                          >
                            <HiOutlineEye size={14} color="#2563eb" /> Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdfDoc(doc)}
                            style={{
                              padding: "5px 10px",
                              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)",
                            }}
                            title="Download vector PDF directly to your device"
                          >
                            <HiOutlineArrowDownTray size={14} /> Download PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintDoc(doc)}
                            style={{
                              padding: "5px 10px",
                              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 6px rgba(30, 64, 175, 0.25)",
                            }}
                            title="Print document"
                          >
                            <HiOutlinePrinter size={14} /> Print
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWhatsAppShareDoc(doc)}
                            style={{
                              padding: "5px 10px",
                              background: "#22c55e",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 6px rgba(34, 197, 94, 0.25)",
                            }}
                            title="Share document directly via WhatsApp with file attachment"
                          >
                            <FaWhatsapp size={14} /> WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEmailShareDoc(doc)}
                            style={{
                              padding: "5px 10px",
                              background: "linear-gradient(135deg, #0284c7, #0369a1)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                            }}
                            title="Share document directly via default Email client"
                          >
                            <HiOutlineEnvelope size={14} /> Email
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

      {/* ── INTERACTIVE DOCUMENT PREVIEW MODAL ── */}
      {selectedDocPreview && (
        <div
          className="debtor-modal-overlay"
          onClick={() => setSelectedDocPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="billing-preview-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: selectedDocPreview.type === "RECEIPT" ? "1050px" : "900px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1.5px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: selectedDocPreview.type === "INVOICE" ? "#eff6ff" : "#ecfdf5",
                    color: selectedDocPreview.type === "INVOICE" ? "#1e40af" : "#065f46",
                  }}
                >
                  {selectedDocPreview.type === "INVOICE" ? "TAX INVOICE" : "PAYMENT RECEIPT"}
                </span>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                  {selectedDocPreview.docNumber}
                </strong>
                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                  • Dated {selectedDocPreview.date}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPdfDoc(selectedDocPreview)}
                  style={{
                    padding: "7px 14px",
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Download vector PDF directly to your device"
                >
                  <HiOutlineArrowDownTray size={15} /> Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintDoc(selectedDocPreview)}
                  style={{
                    padding: "7px 14px",
                    background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Send to printer"
                >
                  <HiOutlinePrinter size={15} /> Print Document
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShareDoc(selectedDocPreview)}
                  style={{
                    padding: "7px 14px",
                    background: "#22c55e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaWhatsapp size={15} /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => handleEmailShareDoc(selectedDocPreview)}
                  style={{
                    padding: "7px 14px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Share PDF via default Email client"
                >
                  <HiOutlineEnvelope size={15} /> Email
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocPreview(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px",
                  }}
                >
                  <HiOutlineXMark size={24} />
                </button>
              </div>
            </div>

            {/* Modal Document Body */}
            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                background: "#f1f5f9",
                flex: 1,
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: buildDocPrintHtml(selectedDocPreview, firmInfo),
                }}
                style={{
                  maxWidth: "100%",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
