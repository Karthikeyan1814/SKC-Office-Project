import { useState, useEffect, useMemo, useRef } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/BillingPage.css";
import { numberToIndianWords } from "../../utils/numberToWords";
import {
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineIdentification,
  HiOutlineCurrencyRupee,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineArchiveBox,
  HiOutlineSparkles,
  HiOutlineCog6Tooth,
  HiOutlineArrowDown,
  HiOutlineXMark,
  HiOutlinePhoto,
  HiOutlineArrowLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlinePhone,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import {
  shareViaWhatsApp,
  shareViaEmail,
  generateVectorPdfBlob,
  downloadVectorPdf,
  downloadBlob,
} from "../../utils/whatsappShareHelper";
import { buildDocPrintHtml } from "../../utils/billingPrintTemplate";

// Default Firm Information
const DEFAULT_FIRM = {
  name: "Sri Kathiravan & Co.",
  subTitle: "Tax, Audit & Financial Advisory Consultants",
  address: "No. 42, Commercial Complex, Gandhi Road",
  city: "Salem, Tamil Nadu - 636007",
  phone: "+91 88257 50992",
  email: "contact@srikathiravan.com",
  gstin: "33AAAAA0000A1Z5",
  pan: "AAAAA0000A",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "HDFC Bank Ltd",
  accountName: "Sri Kathiravan & Co.",
  accountNumber: "50200084729103",
  ifscCode: "HDFC0001234",
  branch: "Salem Main Branch",
  upiId: "8825750992@upi",
};

// Available Accent Colors
const ACCENT_COLORS = [
  { name: "Royal Blue", hex: "#1e40af" },
  { name: "Classic Indigo", hex: "#4f46e5" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Executive Charcoal", hex: "#1f2937" },
];

// Initial seed archive data if localStorage is empty
const INITIAL_ARCHIVE_DATA = [];

export default function BillingInvoiceReceiptPage() {
  // Active View: "DASHBOARD" (default) or "CREATOR"
  const [activeView, setActiveView] = useState("DASHBOARD");

  // Mode: "INVOICE" or "RECEIPT"
  const [mode, setMode] = useState("INVOICE");

  // Selected Accent Theme
  const [accentColor, setAccentColor] = useState("#1e40af");

  // Firm Details (Editable & Globally Synced)
  const [firm, setFirm] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_firm_info");
      if (saved) return { ...DEFAULT_FIRM, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_FIRM;
  });

  useEffect(() => {
    const fetchLatestFirm = async () => {
      try {
        const res = await api.get("/Public/FirmDetails");
        if (res.data) {
          setFirm((prev) => ({ ...prev, ...res.data }));
          try {
            localStorage.setItem("skc_firm_info", JSON.stringify(res.data));
          } catch {}
        }
      } catch {}
    };
    fetchLatestFirm();
  }, []);

  // Available Clients from Backend
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1);
  const clientDropdownRef = useRef(null);
  const clientInputRef = useRef(null);

  // Unique Serial Number Management
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  // Dates
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [docTime, setDocTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [referenceNo, setReferenceNo] = useState("");

  // Client Details with Full In-Place Edit (Defaults to clean empty fields)
  const [client, setClient] = useState({
    name: "",
    contactPerson: "",
    mobile: "",
    email: "",
    gstin: "",
    pan: "",
    address: "",
    state: "Tamil Nadu",
    stateCode: "33",
  });

  // Checkbox Column Customizers for Invoices
  const [customFields, setCustomFields] = useState({
    showDate: true,
    showTime: true,
    showHsn: true,
    showUnit: true,
    showDiscount: true,
    showTaxBreakup: true,
    showBankDetails: true,
    showAmountInWords: true,
    showTerms: true,
    showSignatureStamp: true,
    showOutstandingBreakdown: true,
  });

  // Checkbox Column Customizers for Receipts
  const [receiptFields, setReceiptFields] = useState({
    showDate: true,
    showTime: true,
    showUnit: true,
    showQtyRate: true,
    showPrevDue: true,
    showAmountReceived: true,
    showRemaining: true,
    showTerms: true,
    showBankDetails: true,
  });

  // ─── PERSISTENT CUSTOM COLUMNS ───
  const [customColumns, setCustomColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_billing_custom_columns");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "col_period", name: "Period / FY", enabled: false },
    ];
  });

  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("skc_billing_custom_columns", JSON.stringify(customColumns));
    } catch {}
  }, [customColumns]);

  const handleAddCustomColumn = () => {
    if (!newColName.trim()) {
      toast.error("Please enter a valid column name");
      return;
    }
    const newCol = {
      id: "col_" + Date.now(),
      name: newColName.trim(),
      enabled: true,
    };
    setCustomColumns((prev) => [...prev, newCol]);
    setNewColName("");
    setIsAddingCol(false);
    toast.success(`Custom column "${newCol.name}" added to all documents!`);
  };

  const handleToggleCustomColumn = (colId) => {
    setCustomColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleDeleteCustomColumn = (colId) => {
    const colToDelete = customColumns.find((c) => c.id === colId);
    if (!window.confirm(`Delete column "${colToDelete?.name || ""}" permanently from all forms?`)) {
      return;
    }
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
    setItems((prev) =>
      prev.map((it) => {
        const nextCustom = { ...(it.customValues || {}) };
        delete nextCustom[colId];
        return { ...it, customValues: nextCustom };
      })
    );
    toast.success("Custom column deleted permanently.");
  };

  // ─── BRANDING: OFFICE SEAL & ADMIN SIGNATURE SETTINGS ───
  const [brandingSettings, setBrandingSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_billing_branding");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showSeal: true,
      sealType: "digital",
      sealImage: null,
      showSignature: true,
      signatureType: "digital",
      signatureImage: null,
      signatoryName: "Kathiravan & Co.",
      signatoryDesignation: "Managing Partner & Authorized Signatory",
    };
  });

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  const handleSaveBranding = (newSettings) => {
    setBrandingSettings(newSettings);
    try {
      localStorage.setItem("skc_billing_branding", JSON.stringify(newSettings));
    } catch {}
    setIsBrandingModalOpen(false);
    toast.success("Office Seal & Signature settings saved successfully!");
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setBrandingSettings((prev) => ({
        ...prev,
        [field]: event.target?.result,
        [field === "sealImage" ? "sealType" : "signatureType"]: "custom",
      }));
      toast.success(`${field === "sealImage" ? "Office Seal" : "Admin Signature"} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  // Line Items (Starts with 1 clean empty item)
  const [items, setItems] = useState([
    {
      id: 1,
      description: "",
      hsn: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      unit: "Service",
      quantity: 1,
      rate: 0,
      discountPercent: 0,
      gstPercent: 18,
      customValues: {},
    },
  ]);

  // Frequent Field: Total Outstanding Amount & Client Unpaid Invoices
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [clientUnpaidInvoices, setClientUnpaidInvoices] = useState([]);

  // Dynamic Intermediate Rows (Starts clean/empty)
  const [intermediateRows, setIntermediateRows] = useState([]);

  // ─── DECLARED NET WORTH PAYABLE & AUDIT TRACKING ───
  const [declaredNetWorthPayable, setDeclaredNetWorthPayable] = useState(null);
  const [payableCustomNote, setPayableCustomNote] = useState("");
  const [lastDeclaredReason, setLastDeclaredReason] = useState("");
  const [netWorthAuditHistory, setNetWorthAuditHistory] = useState([]);

  // ─── DYNAMIC PAYMENT MODES & LIVE SPECIFIC FIELDS ───
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [receiptTowards, setReceiptTowards] = useState("");

  const [paymentDetails, setPaymentDetails] = useState({
    // UPI
    upiApp: "Google Pay",
    upiId: "",
    receiverUpiId: "8825750992@upi",
    upiTxnId: "",
    // Cash
    cashReceivedBy: "Kathiravan & Co. (Admin Office)",
    cashVoucherNo: "",
    cashDenominations: "",
    // Bank Transfer / NEFT / RTGS
    bankName: "",
    bankAccountNo: "",
    bankIfsc: "",
    bankUtrNo: "",
    senderBank: "",
    // Cheque
    chequeNo: "",
    chequeDate: new Date().toISOString().split("T")[0],
    chequeBank: "",
    chequeBranch: "",
    chequeStatus: "Received & Deposited",
    // Card
    cardNetwork: "Visa",
    cardType: "Debit Card",
    cardLast4: "",
    cardAuthCode: "",
  });

  const handleUpdatePaymentDetail = (key, value) => {
    setPaymentDetails((prev) => ({ ...prev, [key]: value }));
  };

  // ─── SAVED INVOICES & RECEIPTS ARCHIVE STORE ───
  const [savedArchive, setSavedArchive] = useState(() => {
    try {
      const saved = localStorage.getItem("skc_billing_archive");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Seed initial data
    try {
      localStorage.setItem("skc_billing_archive", JSON.stringify(INITIAL_ARCHIVE_DATA));
    } catch {}
    return INITIAL_ARCHIVE_DATA;
  });

  // Sync archive changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("skc_billing_archive", JSON.stringify(savedArchive));
    } catch {}
  }, [savedArchive]);

  // Dashboard Filters & Search
  const [dashFilterTab, setDashFilterTab] = useState("ALL"); // "ALL", "INVOICE", "RECEIPT", "DUE", "ARCHIVED"
  const [dashSearchQuery, setDashSearchQuery] = useState("");
  const [isDebtorModalOpen, setIsDebtorModalOpen] = useState(false);

  // Load archive from backend and merge with local store
  const syncArchiveWithBackend = async () => {
    try {
      const res = await api.get("/Admin/Billing/Archive");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendList = res.data.map((doc) => {
          let items = [];
          try { items = doc.itemsJson ? JSON.parse(doc.itemsJson) : (doc.items || []); } catch {}
          let paymentDetails = {};
          try { paymentDetails = doc.paymentDetailsJson ? JSON.parse(doc.paymentDetailsJson) : (doc.paymentDetails || {}); } catch {}
          let intermediateRows = [];
          try { intermediateRows = doc.intermediateRowsJson ? JSON.parse(doc.intermediateRowsJson) : (doc.intermediateRows || []); } catch {}
          let customColumns = [];
          try { customColumns = doc.customColumnsJson ? JSON.parse(doc.customColumnsJson) : (doc.customColumns || []); } catch {}
          let netWorthAuditHistory = [];
          try { netWorthAuditHistory = doc.netWorthAuditHistoryJson ? JSON.parse(doc.netWorthAuditHistoryJson) : (doc.netWorthAuditHistory || []); } catch {}
          let firm = DEFAULT_FIRM;
          try { firm = doc.firmJson ? JSON.parse(doc.firmJson) : (doc.firm || DEFAULT_FIRM); } catch {}

          return {
            ...doc,
            date: doc.docDate || doc.date || "",
            time: doc.docTime || doc.time || "",
            dueDate: doc.dueDate || "",
            items,
            paymentDetails,
            intermediateRows,
            customColumns,
            netWorthAuditHistory,
            firm,
            client: {
              name: doc.clientName || "",
              contactPerson: doc.clientLegalName || doc.clientName || "",
              mobile: doc.clientMobile || "",
              email: doc.clientEmail || "",
              gstin: doc.clientGstin || "",
              pan: doc.clientPan || "",
              address: doc.clientAddress || "",
              state: doc.clientState || "Tamil Nadu",
              stateCode: doc.clientStateCode || "33",
            },
          };
        });

        // Merge with any unsynced local documents and push them to backend
        let local = [];
        try {
          const stored = localStorage.getItem("skc_billing_archive");
          if (stored) local = JSON.parse(stored);
        } catch {}

        const backendDocNums = new Set(backendList.map((d) => d.docNumber));
        const unsynced = local.filter((d) => !backendDocNums.has(d.docNumber));
        for (const un of unsynced) {
          try {
            await api.post("/Admin/Billing/Save", un);
          } catch {}
        }

        const merged = [...backendList, ...unsynced];
        setSavedArchive(merged);
        localStorage.setItem("skc_billing_archive", JSON.stringify(merged));
      } else {
        // If backend is empty but localStorage has records (like newly filed invoice), seed backend
        let local = [];
        try {
          const stored = localStorage.getItem("skc_billing_archive");
          if (stored) local = JSON.parse(stored);
        } catch {}
        if (local.length > 0) {
          for (const item of local) {
            try {
              await api.post("/Admin/Billing/Save", item);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn("Backend billing archive sync error", e);
    }
  };

  // Generate Unique Numbers on Initial Load
  useEffect(() => {
    const lastInvSeq = Number(localStorage.getItem("skc_inv_last_seq") || "1041");
    setInvoiceNumber(`INV-2026-${String(lastInvSeq + 1).padStart(4, "0")}`);

    const lastRcpSeq = Number(localStorage.getItem("skc_rcp_last_seq") || "2081");
    setReceiptNumber(`RCP-2026-${String(lastRcpSeq + 1).padStart(4, "0")}`);

    api.get("/Admin/FileManagement/Clients")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvailableClients(res.data);
        }
      })
      .catch(() => {});

    api.get("/Public/FirmDetails")
      .then((res) => {
        if (res.data) {
          setFirm((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});

    syncArchiveWithBackend();
  }, []);

  // Switch between Tax Invoice and Payment Receipt modes
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    if (newMode === "INVOICE") {
      setAccentColor("#1e40af");
      setAmountPaid(0); // Default to unpaid for fresh tax invoices
    } else {
      setAccentColor("#059669");
      if (totalOutstanding > 0) {
        setAmountPaid(totalOutstanding);
      }
    }
  };

  // Recalculate real-time previous outstanding balance from all saved unpaid invoices for current client
  const calculateClientOutstanding = (targetClient, clientId = null) => {
    const clientMobileClean = (targetClient.mobile || "").replace(/\D/g, "");
    const clientNameLower = (targetClient.name || "").toLowerCase().trim();

    if (!clientMobileClean && !clientNameLower) {
      return { unpaidList: [], totalDue: 0 };
    }

    const unpaidList = savedArchive.filter((d) => {
      if (d.isArchived || d.type !== "INVOICE") return false;
      const docBal = Number(d.remainingBalance);
      if (isNaN(docBal) || docBal <= 0) return false;

      if (clientId && d.clientId && String(d.clientId) === String(clientId)) return true;
      const docMob = (d.clientMobile || "").replace(/\D/g, "");
      if (clientMobileClean && docMob && (docMob.includes(clientMobileClean) || clientMobileClean.includes(docMob))) return true;
      const docName = (d.clientName || "").toLowerCase().trim();
      if (clientNameLower && (docName.includes(clientNameLower) || clientNameLower.includes(docName))) return true;
      return false;
    });

    const totalDue = unpaidList.reduce((sum, d) => sum + (Number(d.remainingBalance) || 0), 0);
    return { unpaidList, totalDue };
  };

  // Manual Trigger to Recalculate Real-Time Outstanding Balance
  const handleRefreshOutstanding = () => {
    const { unpaidList, totalDue } = calculateClientOutstanding(client, selectedClientId);
    setClientUnpaidInvoices(unpaidList);
    setTotalOutstanding(totalDue);

    if (totalDue > 0) {
      toast.success(
        `Calculated real-time outstanding: ₹${totalDue.toLocaleString("en-IN")} across ${unpaidList.length} unpaid invoice(s).`,
        { duration: 4000 }
      );
    } else {
      toast.success("Zero outstanding balance (₹0.00) detected for this client.");
    }
  };

  // Update Client when selected from dropdown with automatic real-time outstanding lookup
  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientUnpaidInvoices([]);
      setTotalOutstanding(0);
      return;
    }
    const found = availableClients.find((c) => String(c.id) === String(clientId));
    if (found) {
      const updatedClient = {
        name: found.name || "",
        contactPerson: found.contactPerson || found.name || "",
        mobile: found.mobile || "",
        email: found.email || "",
        gstin: found.gstnumber || found.gstin || "",
        pan: found.pan || "",
        address: found.address || "Main Road, Salem, Tamil Nadu",
        state: found.state || "Tamil Nadu",
        stateCode: found.stateCode || "33",
      };
      setClient(updatedClient);

      // Real-time calculation from saved billing archive
      const { unpaidList, totalDue } = calculateClientOutstanding(updatedClient, found.id);
      setClientUnpaidInvoices(unpaidList);
      setTotalOutstanding(totalDue);

      if (mode === "RECEIPT") {
        if (totalDue > 0) {
          setAmountPaid(totalDue);
          setReceiptTowards(`Settlement of Previous Outstanding (Inv: ${unpaidList.map((u) => u.docNumber).join(", ")})`);
        }
      } else {
        setAmountPaid(0);
      }

      if (totalDue > 0) {
        toast.success(
          `Client "${found.name}" loaded! Real-time previous outstanding: ₹${totalDue.toLocaleString("en-IN")} (${unpaidList.length} unpaid bill${unpaidList.length === 1 ? "" : "s"}).`,
          { duration: 4500 }
        );
      } else {
        toast.success(`Client "${found.name}" loaded! Outstanding balance is ₹0 (Fully settled).`);
      }
    }
  };

  // Click-outside listener & Escape handler for client search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setIsClientSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsClientSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Filtered clients based on real-time search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery || !clientSearchQuery.trim()) return availableClients;
    const q = clientSearchQuery.toLowerCase().trim();
    const qDigits = clientSearchQuery.replace(/\D/g, "");
    return availableClients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const legal = (c.legalname || c.legalName || "").toLowerCase();
      const contact = (c.contactPerson || "").toLowerCase();
      const mobile = (c.mobile || "").replace(/\D/g, "");
      const email = (c.email || "").toLowerCase();
      const gst = (c.gstnumber || c.gstin || "").toLowerCase();
      const pan = (c.pan || c.pannumber || "").toLowerCase();

      return (
        name.includes(q) ||
        legal.includes(q) ||
        contact.includes(q) ||
        email.includes(q) ||
        gst.includes(q) ||
        pan.includes(q) ||
        (qDigits && mobile.includes(qDigits))
      );
    });
  }, [availableClients, clientSearchQuery]);

  // Currently selected client object
  const selectedClientObj = useMemo(() => {
    if (!selectedClientId) return null;
    return availableClients.find((c) => String(c.id) === String(selectedClientId)) || null;
  }, [availableClients, selectedClientId]);

  // Handle client selection from search dropdown
  const handlePickClient = (c) => {
    handleSelectClient(c.id);
    setIsClientSearchOpen(false);
    setClientSearchQuery("");
    setHighlightedClientIndex(-1);
  };

  // Clear or unlink client selection
  const handleClearClientSelection = (clearFields = false) => {
    setSelectedClientId("");
    setClientUnpaidInvoices([]);
    setTotalOutstanding(0);
    setClientSearchQuery("");
    setIsClientSearchOpen(false);
    setHighlightedClientIndex(-1);
    if (clearFields) {
      setClient({
        name: "",
        contactPerson: "",
        mobile: "",
        email: "",
        gstin: "",
        pan: "",
        address: "",
        state: "Tamil Nadu",
        stateCode: "33",
      });
      toast.success("Client unlinked. Fields reset for custom client entry.");
    } else {
      toast.success("Client autofill unlinked. Details kept for manual editing.");
    }
  };

  // Keyboard navigation for client search input
  const handleClientSearchKeyDown = (e) => {
    if (!isClientSearchOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsClientSearchOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedClientIndex((prev) =>
        prev < filteredClients.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedClientIndex((prev) =>
        prev > 0 ? prev - 1 : filteredClients.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedClientIndex >= 0 && filteredClients[highlightedClientIndex]) {
        handlePickClient(filteredClients[highlightedClientIndex]);
      } else if (filteredClients.length > 0) {
        handlePickClient(filteredClients[0]);
      }
    }
  };

  // ─── COMPUTATIONS ───
  const itemsCalculated = useMemo(() => {
    return items.map((item) => {
      const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const discount = gross * ((Number(item.discountPercent) || 0) / 100);
      const taxable = gross - discount;
      const gstAmount = taxable * ((Number(item.gstPercent) || 0) / 100);
      const total = taxable + gstAmount;
      return {
        ...item,
        gross,
        discount,
        taxable,
        gstAmount,
        total,
      };
    });
  }, [items]);

  const subtotal = useMemo(() => {
    return itemsCalculated.reduce((sum, item) => sum + item.taxable, 0);
  }, [itemsCalculated]);

  const totalGst = useMemo(() => {
    return itemsCalculated.reduce((sum, item) => sum + item.gstAmount, 0);
  }, [itemsCalculated]);

  const currentInvoiceTotal = useMemo(() => {
    return subtotal + totalGst;
  }, [subtotal, totalGst]);

  const intermediateTotal = useMemo(() => {
    return intermediateRows.reduce((sum, row) => {
      const val = Number(row.amount) || 0;
      return row.type === "DEDUCT" ? sum - val : sum + val;
    }, 0);
  }, [intermediateRows]);

  // Net Payable Before Payments (Calculated vs Declared)
  const computedNetPayable = useMemo(() => {
    return Math.max(0, currentInvoiceTotal + (Number(totalOutstanding) || 0) + intermediateTotal);
  }, [currentInvoiceTotal, totalOutstanding, intermediateTotal]);

  const netPayable = useMemo(() => {
    if (declaredNetWorthPayable !== null && !isNaN(declaredNetWorthPayable)) {
      return Number(declaredNetWorthPayable);
    }
    return computedNetPayable;
  }, [declaredNetWorthPayable, computedNetPayable]);

  // Declared Net Worth Adjustment (+ or - diff and active reason)
  const declaredDiff = useMemo(() => {
    if (declaredNetWorthPayable !== null && !isNaN(declaredNetWorthPayable)) {
      return Number(declaredNetWorthPayable) - computedNetPayable;
    }
    return 0;
  }, [declaredNetWorthPayable, computedNetPayable]);

  const activeAdjustmentNote = useMemo(() => {
    if (payableCustomNote && payableCustomNote.trim()) return payableCustomNote.trim();
    if (lastDeclaredReason && lastDeclaredReason.trim()) return lastDeclaredReason.trim();
    if (netWorthAuditHistory && netWorthAuditHistory.length > 0 && netWorthAuditHistory[0].note) {
      return netWorthAuditHistory[0].note;
    }
    return "";
  }, [payableCustomNote, lastDeclaredReason, netWorthAuditHistory]);

  const remainingBalance = useMemo(() => {
    return netPayable - (Number(amountPaid) || 0);
  }, [netPayable, amountPaid]);

  const amountInWords = useMemo(() => {
    const targetAmount = mode === "INVOICE" ? netPayable : Number(amountPaid) || 0;
    return numberToIndianWords(targetAmount);
  }, [mode, netPayable, amountPaid]);

  // ─── FINANCIAL AGGREGATIONS FOR DASHBOARD ───
  const dashboardStats = useMemo(() => {
    const activeDocs = savedArchive.filter((d) => !d.isArchived);
    
    // Total Amount Payable: Sum of totalAmount across all Invoices
    const totalPayable = activeDocs
      .filter((d) => d.type === "INVOICE")
      .reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);

    // Total Amount Received: Sum of paidAmount across all documents
    const totalReceived = activeDocs.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

    // Need to Receive: Sum of remainingBalance on invoices where remainingBalance > 0
    const needToReceive = activeDocs
      .filter((d) => d.type === "INVOICE" && (Number(d.remainingBalance) || 0) > 0)
      .reduce((sum, d) => sum + (Number(d.remainingBalance) || 0), 0);

    // Debtors: Unique clients who owe money
    const debtorsMap = new Map();
    activeDocs
      .filter((d) => d.type === "INVOICE" && (Number(d.remainingBalance) || 0) > 0)
      .forEach((d) => {
        const key = d.clientMobile || d.clientName;
        if (!debtorsMap.has(key)) {
          debtorsMap.set(key, {
            clientName: d.clientName,
            clientLegalName: d.clientLegalName || d.clientName,
            clientMobile: d.clientMobile,
            clientEmail: d.clientEmail,
            totalDue: 0,
            latestInvoice: d.docNumber,
            latestDate: d.date,
            invoicesCount: 0,
          });
        }
        const debtor = debtorsMap.get(key);
        debtor.totalDue += Number(d.remainingBalance) || 0;
        debtor.invoicesCount += 1;
      });

    return {
      totalPayable,
      totalReceived,
      needToReceive,
      debtorsList: Array.from(debtorsMap.values()),
      totalInvoicesCount: activeDocs.filter((d) => d.type === "INVOICE").length,
      totalReceiptsCount: activeDocs.filter((d) => d.type === "RECEIPT").length,
    };
  }, [savedArchive]);

  // Filtered Archive Table Records
  const filteredArchiveList = useMemo(() => {
    return savedArchive.filter((doc) => {
      // Tab filter
      if (dashFilterTab === "INVOICE" && (doc.type !== "INVOICE" || doc.isArchived)) return false;
      if (dashFilterTab === "RECEIPT" && (doc.type !== "RECEIPT" || doc.isArchived)) return false;
      if (dashFilterTab === "DUE" && ((Number(doc.remainingBalance) || 0) <= 0 || doc.isArchived)) return false;
      if (dashFilterTab === "ARCHIVED" && !doc.isArchived) return false;
      if (dashFilterTab === "ALL" && doc.isArchived) return false;

      // Search query
      if (dashSearchQuery.trim()) {
        const q = dashSearchQuery.toLowerCase();
        const matchesName = (doc.clientName || "").toLowerCase().includes(q);
        const matchesMobile = (doc.clientMobile || "").toLowerCase().includes(q);
        const matchesDoc = (doc.docNumber || "").toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesDoc) return false;
      }
      return true;
    });
  }, [savedArchive, dashFilterTab, dashSearchQuery]);

  // ─── DECLARED PAYABLE HANDLER & AUDIT TRACKING ───
  const handleUpdateDeclaredPayable = (newVal, reason = "Admin Manual Update") => {
    const num = Number(newVal);
    if (isNaN(num) || num < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const oldVal = declaredNetWorthPayable !== null ? declaredNetWorthPayable : computedNetPayable;
    setDeclaredNetWorthPayable(num);

    const noteText = (reason && typeof reason === "string" && reason.trim())
      ? reason.trim()
      : (payableCustomNote.trim() || "Declared payable updated");

    setLastDeclaredReason(noteText);

    const auditEntry = {
      timestamp: new Date().toISOString(),
      previousAmount: oldVal,
      updatedAmount: num,
      declaredBy: "Admin",
      note: noteText,
    };

    setNetWorthAuditHistory((prev) => [auditEntry, ...prev]);
    setPayableCustomNote("");
    toast.success(`Net Worth Payable updated to ₹${num.toLocaleString("en-IN")} with audit log!`);
  };

  // ─── LINE ITEM HANDLERS ───
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: "",
        hsn: "9982",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unit: "Nos",
        quantity: 1,
        rate: 0,
        discountPercent: 0,
        gstPercent: 18,
        customValues: {},
      },
    ]);
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleUpdateItemCustomValue = (itemId, colId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              customValues: {
                ...(item.customValues || {}),
                [colId]: value,
              },
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      toast.error("Document must have at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ─── INTERMEDIATE ROW HANDLERS ───
  const handleAddIntermediateRow = () => {
    setIntermediateRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: "Additional Charge / Adjustment",
        amount: 0,
        type: "ADD",
      },
    ]);
  };

  const handleUpdateIntermediateRow = (id, field, value) => {
    setIntermediateRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveIntermediateRow = (id) => {
    setIntermediateRows((prev) => prev.filter((row) => row.id !== id));
  };

  // ─── SAVE TO ARCHIVE / FILE DOCUMENT ───
  const handleSaveToArchive = async () => {
    const diff = declaredNetWorthPayable !== null ? (Number(declaredNetWorthPayable) - computedNetPayable) : 0;
    const note = activeAdjustmentNote || (netWorthAuditHistory[0]?.note || "");

    const record = {
      id: Date.now(),
      type: mode,
      docNumber: mode === "INVOICE" ? invoiceNumber : receiptNumber,
      clientName: client.name,
      clientLegalName: client.contactPerson || client.name,
      clientMobile: client.mobile,
      clientEmail: client.email,
      clientGstin: client.gstin,
      clientPan: client.pan,
      clientAddress: client.address,
      clientState: client.state,
      clientStateCode: client.stateCode,
      date: docDate,
      time: docTime,
      dueDate: dueDate,
      totalAmount: mode === "INVOICE" ? netPayable : Number(amountPaid) || 0,
      currentInvoiceTotal: currentInvoiceTotal,
      totalOutstanding: Number(totalOutstanding) || 0,
      declaredNetWorthPayable: declaredNetWorthPayable,
      declaredAdjustmentDiff: diff,
      declaredAdjustmentNote: note,
      netWorthAuditHistory: netWorthAuditHistory,
      paidAmount: Number(amountPaid) || 0,
      remainingBalance: remainingBalance,
      paymentMode: paymentMode,
      paymentDetails: {
        ...paymentDetails,
        totalOutstanding: Number(totalOutstanding) || 0,
        declaredAdjustmentDiff: diff,
        declaredAdjustmentNote: note,
      },
      receiptTowards: receiptTowards,
      items: items,
      customColumns: customColumns,
      client: client,
      intermediateRows: intermediateRows,
      firm: firm,
      isArchived: false,
      savedAt: new Date().toISOString(),
    };

    // Persist immediately to PostgreSQL database so client sees it live
    try {
      await api.post("/Admin/Billing/Save", record);
    } catch (err) {
      console.warn("Backend DB save warning:", err);
    }

    // Replace if editing existing, or prepend
    const existingIndex = savedArchive.findIndex((r) => r.docNumber === record.docNumber);
    let updated;
    if (existingIndex >= 0) {
      updated = [...savedArchive];
      updated[existingIndex] = { ...record, id: savedArchive[existingIndex].id };
      toast.success(`${record.docNumber} updated and synced with client portal!`);
    } else {
      updated = [record, ...savedArchive];
      toast.success(`${mode === "INVOICE" ? "Tax Invoice" : "Payment Receipt"} ${record.docNumber} filed and delivered to client portal!`);
      // Increment Sequence
      if (mode === "INVOICE") {
        const nextSeq = (parseInt(invoiceNumber.split("-").pop(), 10) || 1040) + 1;
        localStorage.setItem("skc_inv_last_seq", String(nextSeq));
      } else {
        const nextSeq = (parseInt(receiptNumber.split("-").pop(), 10) || 2080) + 1;
        localStorage.setItem("skc_rcp_last_seq", String(nextSeq));
      }
    }

    setSavedArchive(updated);
    try {
      localStorage.setItem("skc_billing_archive", JSON.stringify(updated));
    } catch {}
    setActiveView("DASHBOARD");
  };

  // ─── LOAD DOCUMENT INTO EDITOR ───
  const handleLoadDocument = (doc) => {
    setMode(doc.type);
    if (doc.type === "INVOICE") setInvoiceNumber(doc.docNumber);
    else setReceiptNumber(doc.docNumber);

    if (doc.client) {
      setClient(doc.client);
    } else {
      setClient({
        name: doc.clientName || "",
        contactPerson: doc.clientLegalName || "",
        mobile: doc.clientMobile || "",
        email: doc.clientEmail || "",
        gstin: doc.clientGstin || "",
        pan: doc.clientPan || "",
        address: doc.clientAddress || "",
        state: doc.clientState || "Tamil Nadu",
        stateCode: doc.clientStateCode || "33",
      });
    }

    if (doc.date) setDocDate(doc.date);
    if (doc.time) setDocTime(doc.time);
    if (doc.dueDate) setDueDate(doc.dueDate);
    if (doc.items) setItems(doc.items);
    if (doc.intermediateRows) setIntermediateRows(doc.intermediateRows);
    if (doc.paidAmount !== undefined) setAmountPaid(doc.paidAmount);
    if (doc.paymentMode) setPaymentMode(doc.paymentMode);
    if (doc.paymentDetails) setPaymentDetails(doc.paymentDetails);
    if (doc.receiptTowards) setReceiptTowards(doc.receiptTowards);

    if (doc.totalOutstanding !== undefined) {
      setTotalOutstanding(Number(doc.totalOutstanding) || 0);
    } else if (doc.paymentDetails?.totalOutstanding !== undefined) {
      setTotalOutstanding(Number(doc.paymentDetails.totalOutstanding) || 0);
    }

    if (doc.declaredNetWorthPayable !== undefined && doc.declaredNetWorthPayable !== null) {
      setDeclaredNetWorthPayable(Number(doc.declaredNetWorthPayable));
    } else {
      setDeclaredNetWorthPayable(null);
    }

    const loadedNote = doc.declaredAdjustmentNote || doc.paymentDetails?.declaredAdjustmentNote || "";
    setLastDeclaredReason(loadedNote);
    setPayableCustomNote("");

    if (doc.netWorthAuditHistory) {
      let parsed = doc.netWorthAuditHistory;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      if (Array.isArray(parsed)) setNetWorthAuditHistory(parsed);
    }

    setActiveView("CREATOR");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`Loaded ${doc.docNumber} into editor!`);
  };

  // Toggle Archive Status
  const handleToggleArchive = async (docId) => {
    const updated = savedArchive.map((d) =>
      d.id === docId ? { ...d, isArchived: !d.isArchived } : d
    );
    setSavedArchive(updated);
    try {
      localStorage.setItem("skc_billing_archive", JSON.stringify(updated));
      await api.post(`/Admin/Billing/ToggleArchive/${docId}`);
    } catch {}
    toast.success("Document archive status updated.");
  };

  // Delete Document
  const handleDeleteDocument = async (docId, docNumber) => {
    if (!window.confirm(`Permanently delete document ${docNumber}?`)) return;
    const updated = savedArchive.filter((d) => d.id !== docId);
    setSavedArchive(updated);
    try {
      localStorage.setItem("skc_billing_archive", JSON.stringify(updated));
      await api.post(`/Admin/Billing/Delete/${docId}`);
    } catch {}
    toast.success(`Document ${docNumber} removed.`);
  };

  // ─── 100% FAITHFUL PRINT & PDF DOWNLOAD ───
  const handlePrintDocument = (customDoc = null) => {
    const isDoc = !!customDoc;
    const isReceipt = isDoc ? customDoc.type === "RECEIPT" : mode === "RECEIPT";
    const docNo = isDoc ? customDoc.docNumber : (isReceipt ? receiptNumber : invoiceNumber);
    const docTitle = `${isReceipt ? "Receipt" : "Invoice"}_${docNo}`;
    const orientation = isReceipt ? "landscape" : "portrait";

    const docToPrint = customDoc || {
      type: mode,
      docNumber: docNo,
      date: docDate,
      time: docTime,
      dueDate,
      referenceNo,
      clientName: client.name,
      clientLegalName: client.contactPerson,
      clientMobile: client.mobile,
      clientEmail: client.email,
      clientGstin: client.gstin,
      clientPan: client.pan,
      clientAddress: client.address,
      clientState: client.state,
      clientStateCode: client.stateCode,
      items: itemsCalculated || items,
      totalAmount: netPayable,
      currentInvoiceTotal: currentInvoiceTotal,
      totalOutstanding: Number(totalOutstanding) || 0,
      declaredNetWorthPayable: declaredNetWorthPayable,
      declaredAdjustmentDiff: declaredDiff,
      declaredAdjustmentNote: activeAdjustmentNote,
      paidAmount: amountPaid,
      remainingBalance,
      paymentMode,
      receiptTowards,
      intermediateRows,
      customColumns,
      accentColor,
    };

    const docHtml = buildDocPrintHtml(docToPrint, firm, brandingSettings);

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast.error("Please allow popups to download/print the PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${docTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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

  // ─── DOCUMENT DATA PACKAGER FOR PDF / SHARING ───
  const getDocPayload = (customDoc = null) => {
    const isDoc = !!customDoc;
    const isReceipt = isDoc ? customDoc.type === "RECEIPT" : mode === "RECEIPT";
    const docNo = isDoc ? customDoc.docNumber : (isReceipt ? receiptNumber : invoiceNumber);
    const docTitle = `${isReceipt ? "Receipt" : "Invoice"}_${docNo}`;

    const docToPrint = customDoc || {
      type: mode,
      docNumber: docNo,
      date: docDate,
      time: docTime,
      dueDate,
      referenceNo,
      clientName: client.name,
      clientLegalName: client.contactPerson,
      clientMobile: client.mobile,
      clientEmail: client.email,
      clientGstin: client.gstin,
      clientPan: client.pan,
      clientAddress: client.address,
      clientState: client.state,
      clientStateCode: client.stateCode,
      items: itemsCalculated || items,
      totalAmount: netPayable,
      currentInvoiceTotal: currentInvoiceTotal,
      totalOutstanding: Number(totalOutstanding) || 0,
      declaredNetWorthPayable: declaredNetWorthPayable,
      declaredAdjustmentDiff: declaredDiff,
      declaredAdjustmentNote: activeAdjustmentNote,
      paidAmount: amountPaid,
      remainingBalance,
      paymentMode,
      receiptTowards,
      intermediateRows,
      customColumns,
      accentColor,
    };

    const docHtml = buildDocPrintHtml(docToPrint, firm, brandingSettings);
    return {
      isDoc,
      isReceipt,
      docNo,
      docTitle,
      docToPrint,
      docHtml,
      clientMobile: isDoc ? (customDoc.clientMobile || "") : client.mobile,
      clientEmail: isDoc ? (customDoc.clientEmail || "") : client.email,
    };
  };

  // ─── DIRECT HIGH-RESOLUTION PDF DOWNLOAD ───
  const handleDownloadPdf = async (customDoc = null) => {
    const { isReceipt, docTitle, docHtml } = getDocPayload(customDoc);

    try {
      toast.loading("Generating vector PDF...", { id: "pdf-download" });
      await downloadVectorPdf(docHtml, isReceipt, docTitle);

      toast.dismiss("pdf-download");
      toast.success(`Downloaded ${docTitle}.pdf successfully!`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.dismiss("pdf-download");
      toast.error("Failed to generate PDF. Please try Print Document if needed.");
    }
  };

  // ─── CREATE FRESH NEW BLANK INVOICE / RECEIPT ───
  const handleCreateNewDocument = (targetMode = "INVOICE") => {
    setMode(targetMode);
    if (targetMode === "INVOICE") {
      setAccentColor("#1e40af");
      const lastInvSeq = Number(localStorage.getItem("skc_inv_last_seq") || "1041");
      setInvoiceNumber(`INV-2026-${String(lastInvSeq + 1).padStart(4, "0")}`);
    } else {
      setAccentColor("#059669");
      const lastRcpSeq = Number(localStorage.getItem("skc_rcp_last_seq") || "2081");
      setReceiptNumber(`RCP-2026-${String(lastRcpSeq + 1).padStart(4, "0")}`);
    }

    setClient({
      name: "",
      contactPerson: "",
      mobile: "",
      email: "",
      gstin: "",
      pan: "",
      address: "",
      state: "Tamil Nadu",
      stateCode: "33",
    });
    setSelectedClientId("");
    setDocDate(new Date().toISOString().split("T")[0]);
    setDocTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setDueDate(new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
    setReferenceNo("");
    setItems([
      {
        id: 1,
        description: "",
        hsn: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
        unit: "Service",
        quantity: 1,
        rate: 0,
        discountPercent: 0,
        gstPercent: 18,
        customValues: {},
      },
    ]);
    setIntermediateRows([]);
    setTotalOutstanding(0);
    setClientUnpaidInvoices([]);
    setDeclaredNetWorthPayable(null);
    setPayableCustomNote("");
    setLastDeclaredReason("");
    setAmountPaid(0);
    setReceiptTowards("");
    setActiveView("CREATOR");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`Started new blank ${targetMode === "INVOICE" ? "Tax Invoice" : "Payment Receipt"} form`);
  };

  // ─── WHATSAPP SHARE (ATTACH REAL PDF, NO CAPTION) ───
  const handleWhatsAppShare = async (customDoc = null) => {
    const { isReceipt, docNo, docTitle, docHtml, clientMobile } = getDocPayload(customDoc);
    toast.loading("Preparing PDF for WhatsApp...", { id: "wa-share" });
    try {
      const { blob: pdfBlob } = await generateVectorPdfBlob(docHtml, isReceipt, docTitle);
      toast.dismiss("wa-share");

      await shareViaWhatsApp({
        fileBlob: pdfBlob,
        fileName: `${docTitle}.pdf`,
        phone: clientMobile,
        title: `${isReceipt ? "Payment Receipt" : "Tax Invoice"} - ${docNo}`,
      });
    } catch (err) {
      console.error("WhatsApp share error:", err);
      toast.dismiss("wa-share");
      toast.error("Could not prepare PDF for WhatsApp.");
    }
  };

  // ─── DEFAULT EMAIL SHARE (ATTACH REAL PDF) ───
  const handleEmailShare = async (customDoc = null) => {
    const { isReceipt, docNo, docTitle, docHtml, clientEmail } = getDocPayload(customDoc);
    toast.loading("Preparing PDF for Email...", { id: "email-share" });
    try {
      const { blob: pdfBlob } = await generateVectorPdfBlob(docHtml, isReceipt, docTitle);
      toast.dismiss("email-share");

      await shareViaEmail({
        fileBlob: pdfBlob,
        fileName: `${docTitle}.pdf`,
        email: clientEmail,
        title: `${isReceipt ? "Payment Receipt" : "Tax Invoice"}`,
        docNo,
      });
    } catch (err) {
      console.error("Email share error:", err);
      toast.dismiss("email-share");
      toast.error("Could not prepare PDF for Email.");
    }
  };

  const activeCustomColumns = useMemo(() => {
    return customColumns.filter((c) => c.enabled);
  }, [customColumns]);

  // ─── STRICT 100% COLUMN ALLOCATION (A4 PORTRAIT VERIFIED) ───
  const colWidths = useMemo(() => {
    const showDate = !!customFields.showDate;
    const showHsn = !!customFields.showHsn;
    const showUnit = !!customFields.showUnit;
    const showDisc = !!customFields.showDiscount;
    const customCount = activeCustomColumns.length;

    const idxW = 3.5;
    const qtyW = 5.5;
    const rateW = 10.0;
    const gstW = 6.5;
    const totalW = 13.5;

    const dateW = showDate ? 8.5 : 0;
    const hsnW = showHsn ? 8.0 : 0;
    const unitW = showUnit ? 6.5 : 0;
    const discW = showDisc ? 5.5 : 0;

    const totalCustomW = customCount > 0 ? Math.min(customCount * 8, 20) : 0;
    const perCustomW = customCount > 0 ? totalCustomW / customCount : 0;

    const used = idxW + qtyW + rateW + gstW + totalW + dateW + hsnW + unitW + discW + totalCustomW;
    const descW = Math.max(100 - used, 20.0);

    return {
      idx: `${idxW}%`,
      desc: `${descW.toFixed(1)}%`,
      date: `${dateW}%`,
      hsn: `${hsnW}%`,
      unit: `${unitW}%`,
      custom: `${perCustomW.toFixed(1)}%`,
      qty: `${qtyW}%`,
      rate: `${rateW}%`,
      disc: `${discW}%`,
      gst: `${gstW}%`,
      total: `${totalW}%`,
    };
  }, [customFields, activeCustomColumns]);

  const receiptColWidths = useMemo(() => {
    const showDate = !!receiptFields.showDate;
    const showTime = !!receiptFields.showTime;
    const showUnit = !!receiptFields.showUnit;
    const showRate = !!receiptFields.showQtyRate;
    const showPrev = !!receiptFields.showPrevDue;
    const showRem = !!receiptFields.showRemaining;
    const customCount = activeCustomColumns.length;

    const dateW = showDate ? 9.0 : 0;
    const timeW = showTime ? 7.5 : 0;
    const unitW = showUnit ? 6.5 : 0;
    const rateW = showRate ? 10.0 : 0;
    const prevW = showPrev ? 10.0 : 0;
    const remW = showRem ? 11.5 : 0;
    const amtRecW = 14.0;

    const totalCustomW = customCount > 0 ? Math.min(customCount * 8, 18) : 0;
    const perCustomW = customCount > 0 ? totalCustomW / customCount : 0;

    const used = dateW + timeW + unitW + rateW + prevW + remW + amtRecW + totalCustomW;
    const descW = Math.max(100 - used, 22.0);

    return {
      date: `${dateW}%`,
      time: `${timeW}%`,
      desc: `${descW.toFixed(1)}%`,
      unit: `${unitW}%`,
      custom: `${perCustomW.toFixed(1)}%`,
      rate: `${rateW}%`,
      prev: `${prevW}%`,
      amt: `${amtRecW}%`,
      rem: `${remW}%`,
    };
  }, [receiptFields, activeCustomColumns]);

  const renderPaymentPreviewSummary = () => {
    switch (paymentMode) {
      case "UPI":
        return (
          <span>
            • App: <strong>{paymentDetails.upiApp}</strong>
            {paymentDetails.upiTxnId && <> • UTR/Ref: <strong>{paymentDetails.upiTxnId}</strong></>}
            {paymentDetails.upiId && <> • VPA: <strong>{paymentDetails.upiId}</strong></>}
          </span>
        );
      case "CASH":
        return (
          <span>
            • Received By: <strong>{paymentDetails.cashReceivedBy}</strong>
            {paymentDetails.cashVoucherNo && <> • Voucher: <strong>{paymentDetails.cashVoucherNo}</strong></>}
          </span>
        );
      case "BANK_TRANSFER":
      case "NEFT":
      case "RTGS":
        return (
          <span>
            • Bank: <strong>{paymentDetails.bankName}</strong>
            {paymentDetails.bankUtrNo && <> • UTR/Txn: <strong>{paymentDetails.bankUtrNo}</strong></>}
            {paymentDetails.senderBank && <> • Sender Bank: <strong>{paymentDetails.senderBank}</strong></>}
          </span>
        );
      case "CHEQUE":
        return (
          <span>
            • Cheque No: <strong>{paymentDetails.chequeNo}</strong>
            • Date: <strong>{paymentDetails.chequeDate}</strong>
            • Bank: <strong>{paymentDetails.chequeBank}</strong>
            {paymentDetails.chequeStatus && <> • Status: <strong>{paymentDetails.chequeStatus}</strong></>}
          </span>
        );
      case "CARD":
        return (
          <span>
            • Network: <strong>{paymentDetails.cardNetwork} ({paymentDetails.cardType})</strong>
            • Last 4: <strong>•••• {paymentDetails.cardLast4}</strong>
            {paymentDetails.cardAuthCode && <> • Auth: <strong>{paymentDetails.cardAuthCode}</strong></>}
          </span>
        );
      default:
        return null;
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW 1: EXECUTIVE INVOICE & RECEIPT DASHBOARD (DEFAULT)
  // ═════════════════════════════════════════════════════════════════════════
  if (activeView === "DASHBOARD") {
    return (
      <div className="billing-page-container">
        {/* Dashboard Top Header */}
        <div className="billing-dash-header">
          <div className="billing-title-box">
            <h1>
              <HiOutlineDocumentText size={30} color="#1e40af" />
              Invoice & Receipt Executive Hub
            </h1>
            <p>
              Real-time receivables tracking, filed tax invoices, payment receipts, and debtor management
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-billing-action primary-print"
              onClick={() => handleCreateNewDocument("INVOICE")}
            >
              <HiOutlinePlus size={16} />
              + Create Tax Invoice
            </button>

            <button
              type="button"
              className="btn-billing-action primary-save"
              onClick={() => handleCreateNewDocument("RECEIPT")}
            >
              <HiOutlineReceiptPercent size={16} />
              + Create Payment Receipt
            </button>

            <button
              type="button"
              className="btn-billing-action settings-btn"
              onClick={() => setIsBrandingModalOpen(true)}
            >
              <HiOutlineCog6Tooth size={16} />
              Seal & Signature Settings
            </button>
          </div>
        </div>

        {/* ── 3 EXECUTIVE STAT METRICS CARDS (REAL TIME TRACKING) ── */}
        <div className="billing-dash-stats-grid">
          {/* Card 1: Total Amount Payable */}
          <div className="billing-stat-box stat-payable">
            <div className="stat-box-content">
              <p>Total Amount Payable (Billed)</p>
              <h2>₹ {dashboardStats.totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
              <small>Across {dashboardStats.totalInvoicesCount} Active Tax Invoices</small>
            </div>
            <div className="stat-box-icon">
              <HiOutlineDocumentText size={26} />
            </div>
          </div>

          {/* Card 2: Total Amount Received */}
          <div className="billing-stat-box stat-received">
            <div className="stat-box-content">
              <p>Total Amount Received</p>
              <h2>₹ {dashboardStats.totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
              <small>Realized via UPI, Bank Transfers & Cash Collections</small>
            </div>
            <div className="stat-box-icon">
              <HiOutlineBanknotes size={26} />
            </div>
          </div>

          {/* Card 3: Need to Receive (CLICKABLE -> OPENS WHO NEEDS TO PAY) */}
          <div
            className="billing-stat-box stat-due clickable"
            onClick={() => setIsDebtorModalOpen(true)}
            title="Click to view complete list of clients who need to pay and how"
          >
            <div className="stat-box-content">
              <p>Need to Receive (Pending Due)</p>
              <h2 style={{ color: "#dc2626" }}>
                ₹ {dashboardStats.needToReceive.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
              <small>Outstanding across {dashboardStats.debtorsList.length} Client Accounts</small>
              <span className="stat-action-hint">
                <HiOutlineExclamationCircle size={14} /> Click to see Who Needs to Pay & How →
              </span>
            </div>
            <div className="stat-box-icon">
              <HiOutlineCurrencyRupee size={26} />
            </div>
          </div>
        </div>

        {/* ── FILED INVOICES & RECEIPTS REGISTRY ── */}
        <div className="billing-card">
          <div className="billing-card-header">
            <div>
              <h3 className="billing-card-title">
                <HiOutlineArchiveBox size={20} color="#1e40af" />
                Filed Invoices & Payment Receipts Registry
              </h3>
              <span className="billing-card-sub">
                Complete billing records with direct vector PDF download, live editing, and WhatsApp notifications
              </span>
            </div>

            {/* Search Bar */}
            <div style={{ position: "relative", width: "280px" }}>
              <input
                type="text"
                placeholder="Search client, mobile, doc no..."
                value={dashSearchQuery}
                onChange={(e) => setDashSearchQuery(e.target.value)}
                className="billing-input"
                style={{ paddingLeft: "32px", fontSize: "13px" }}
              />
              <HiOutlineMagnifyingGlass
                size={16}
                color="#64748b"
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="billing-filter-tabs">
            <button
              type="button"
              className={`billing-filter-tab ${dashFilterTab === "ALL" ? "active-tab" : ""}`}
              onClick={() => setDashFilterTab("ALL")}
            >
              All Documents ({savedArchive.filter((d) => !d.isArchived).length})
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${dashFilterTab === "INVOICE" ? "active-tab" : ""}`}
              onClick={() => setDashFilterTab("INVOICE")}
            >
              Tax Invoices ({savedArchive.filter((d) => d.type === "INVOICE" && !d.isArchived).length})
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${dashFilterTab === "RECEIPT" ? "active-tab" : ""}`}
              onClick={() => setDashFilterTab("RECEIPT")}
            >
              Payment Receipts ({savedArchive.filter((d) => d.type === "RECEIPT" && !d.isArchived).length})
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${dashFilterTab === "DUE" ? "active-tab" : ""}`}
              onClick={() => setDashFilterTab("DUE")}
            >
              Pending Balance Only ({savedArchive.filter((d) => (Number(d.remainingBalance) || 0) > 0 && !d.isArchived).length})
            </button>
            <button
              type="button"
              className={`billing-filter-tab ${dashFilterTab === "ARCHIVED" ? "active-tab" : ""}`}
              onClick={() => setDashFilterTab("ARCHIVED")}
            >
              Archived ({savedArchive.filter((d) => d.isArchived).length})
            </button>
          </div>

          {/* Table of Filed Files */}
          <div className="items-table-wrapper" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Doc Type</th>
                  <th>Doc Number</th>
                  <th>Client Particulars</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "right" }}>Total (₹)</th>
                  <th style={{ textAlign: "right" }}>Paid (₹)</th>
                  <th style={{ textAlign: "right" }}>Remaining (₹)</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchiveList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      No documents match your active filter.
                    </td>
                  </tr>
                ) : (
                  filteredArchiveList.map((doc) => {
                    const isFullyPaid = (Number(doc.remainingBalance) || 0) <= 0;
                    const isPartial = (Number(doc.paidAmount) || 0) > 0 && !isFullyPaid;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              background: doc.type === "INVOICE" ? "#eff6ff" : "#ecfdf5",
                              color: doc.type === "INVOICE" ? "#1e40af" : "#065f46",
                              border: doc.type === "INVOICE" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                            }}
                          >
                            {doc.type}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{doc.docNumber}</strong>
                        </td>
                        <td>
                          <strong style={{ display: "block", color: "#1e293b" }}>{doc.clientName}</strong>
                          <small style={{ color: "#64748b" }}>
                            📱 {doc.clientMobile || "No Mobile"}
                            {doc.clientGstin && ` • GST: ${doc.clientGstin}`}
                          </small>
                        </td>
                        <td>
                          <div>{doc.date}</div>
                          <small style={{ color: "#64748b" }}>{doc.time || ""}</small>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "700" }}>
                          ₹{Number(doc.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(doc)}
                              title="Download high-resolution vector PDF"
                              style={{
                                padding: "5px 9px",
                                background: "#f5f3ff",
                                border: "1px solid #ddd6fe",
                                borderRadius: "6px",
                                color: "#7c3aed",
                                cursor: "pointer",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "700",
                              }}
                            >
                              <HiOutlineArrowDownTray size={14} /> PDF
                            </button>

                            {/* Print Document */}
                            <button
                              type="button"
                              onClick={() => handlePrintDocument(doc)}
                              title="Send to printer"
                              style={{
                                padding: "5px 9px",
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "6px",
                                color: "#1d4ed8",
                                cursor: "pointer",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "700",
                              }}
                            >
                              <HiOutlinePrinter size={14} /> Print
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleLoadDocument(doc)}
                              title="Edit invoice / receipt details"
                              style={{
                                padding: "5px 9px",
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                color: "#0f172a",
                                cursor: "pointer",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "700",
                              }}
                            >
                              <HiOutlinePencilSquare size={14} /> Edit
                            </button>

                            {/* WhatsApp Share */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppShare(doc)}
                              title="Share document directly via WhatsApp with attached PDF"
                              style={{
                                padding: "5px 8px",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                borderRadius: "6px",
                                color: "#059669",
                                cursor: "pointer",
                              }}
                            >
                              <FaWhatsapp size={14} />
                            </button>

                            {/* Email Share */}
                            <button
                              type="button"
                              onClick={() => handleEmailShare(doc)}
                              title="Share document directly via default Email client with attached PDF"
                              style={{
                                padding: "5px 8px",
                                background: "#f0f9ff",
                                border: "1px solid #bae6fd",
                                borderRadius: "6px",
                                color: "#0284c7",
                                cursor: "pointer",
                              }}
                            >
                              <HiOutlineEnvelope size={14} />
                            </button>

                            {/* Archive Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(doc.id)}
                              title={doc.isArchived ? "Unarchive document" : "Archive document"}
                              style={{
                                padding: "5px 8px",
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                color: "#64748b",
                                cursor: "pointer",
                              }}
                            >
                              <HiOutlineArchiveBox size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id, doc.docNumber)}
                              title="Delete permanently"
                              style={{
                                padding: "5px 7px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                            >
                              <HiOutlineTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── "WHO NEEDS TO PAY & HOW" MODAL / RECEIVABLES TRACKER ── */}
        {isDebtorModalOpen && (
          <div className="debtor-modal-overlay" onClick={() => setIsDebtorModalOpen(false)}>
            <div className="debtor-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="debtor-modal-header">
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "900", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <HiOutlineExclamationCircle size={22} color="#dc2626" />
                    Who Needs to Pay & How (Outstanding Receivables Tracker)
                  </h3>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#7f1d1d" }}>
                    Total Outstanding: <strong>₹ {dashboardStats.needToReceive.toLocaleString("en-IN")}</strong> across {dashboardStats.debtorsList.length} clients
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDebtorModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <HiOutlineXMark size={22} />
                </button>
              </div>

              <div className="debtor-modal-body">
                {/* Official Firm Receiving Channels */}
                <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: "12px", padding: "14px 18px", fontSize: "12.5px" }}>
                  <strong style={{ color: "#065f46", display: "block", marginBottom: "4px" }}>
                    🏦 Authorized Payment Channels for Clients:
                  </strong>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", color: "#166534" }}>
                    <div>UPI ID: <strong>{firm.upiId}</strong></div>
                    <div>Bank: <strong>{firm.bankName}</strong></div>
                    <div>A/C No: <strong>{firm.accountNumber}</strong></div>
                    <div>IFSC: <strong>{firm.ifscCode}</strong> ({firm.branch})</div>
                  </div>
                </div>

                {dashboardStats.debtorsList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#166534" }}>
                    <HiOutlineCheckCircle size={40} color="#16a34a" style={{ display: "block", margin: "0 auto 8px" }} />
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>All Outstanding Bills Settled!</h4>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>No clients currently owe any pending balances.</p>
                  </div>
                ) : (
                  dashboardStats.debtorsList.map((debtor, idx) => {
                    const phoneClean = (debtor.clientMobile || "").replace(/\D/g, "");
                    const waReminderMsg = `*Payment Reminder from ${firm.name}*%0A%0A` +
                      `Dear *${debtor.clientName}*,%0A` +
                      `This is a gentle reminder regarding your outstanding professional balance of *₹${Number(debtor.totalDue).toLocaleString("en-IN")}* (Latest Inv: ${debtor.latestInvoice}).%0A%0A` +
                      `Please settle via:%0A` +
                      `🏦 Bank: ${firm.bankName} (A/C: ${firm.accountNumber}, IFSC: ${firm.ifscCode})%0A` +
                      `📱 UPI ID: ${firm.upiId}%0A%0A` +
                      `Thank you for your prompt cooperation.`;

                    const waUrl = phoneClean
                      ? `https://wa.me/91${phoneClean}?text=${waReminderMsg}`
                      : `https://wa.me/?text=${waReminderMsg}`;

                    return (
                      <div key={idx} className="debtor-client-item">
                        <div className="debtor-info">
                          <h4>{debtor.clientName}</h4>
                          <p>
                            📱 Mobile: <strong>{debtor.clientMobile || "N/A"}</strong>
                            {debtor.clientEmail && ` • Email: ${debtor.clientEmail}`}
                          </p>
                          <p>
                            Latest Invoice: <strong>{debtor.latestInvoice}</strong> ({debtor.latestDate})
                            {debtor.invoicesCount > 1 && ` • ${debtor.invoicesCount} Invoices Pending`}
                          </p>
                        </div>

                        <div className="debtor-amount-box">
                          <small style={{ color: "#64748b", fontWeight: "700" }}>TOTAL DUE</small>
                          <strong>₹ {Number(debtor.totalDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </div>

                        <div className="debtor-actions">
                          {/* Send WhatsApp Reminder */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-remind-wa"
                            title="Send one-click payment reminder via WhatsApp"
                          >
                            <FaWhatsapp size={14} /> Send Reminder
                          </a>

                          {/* Record Payment / Issue Receipt */}
                          <button
                            type="button"
                            className="btn-create-rcp-quick"
                            onClick={() => {
                              setIsDebtorModalOpen(false);
                              setMode("RECEIPT");
                              setClient({
                                name: debtor.clientName,
                                contactPerson: debtor.clientLegalName,
                                mobile: debtor.clientMobile || "",
                                email: debtor.clientEmail || "",
                                gstin: "",
                                pan: "",
                                address: "Salem, Tamil Nadu",
                                state: "Tamil Nadu",
                                stateCode: "33",
                              });
                              setTotalOutstanding(debtor.totalDue);
                              setAmountPaid(debtor.totalDue);
                              setReceiptTowards(`Receipt against outstanding dues of ${debtor.latestInvoice}`);
                              setActiveView("CREATOR");
                              toast.success(`Loaded ${debtor.clientName} to record payment receipt!`);
                            }}
                            title="Generate payment receipt for this client"
                          >
                            <HiOutlineReceiptPercent size={14} /> Record Payment
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BRANDING SETTINGS MODAL ── */}
        {isBrandingModalOpen && (
          <div className="seal-modal-overlay" onClick={() => setIsBrandingModalOpen(false)}>
            <div className="seal-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="seal-modal-header">
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiOutlineSparkles size={20} color="#d97706" />
                  Office Seal & Admin Signature Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBrandingModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <HiOutlineXMark size={22} />
                </button>
              </div>

              <div className="seal-modal-body">
                {/* 1. Official Office Seal Section */}
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={brandingSettings.showSeal}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, showSeal: e.target.checked })}
                        style={{ width: "16px", height: "16px", accentColor: "#059669" }}
                      />
                      Display Official Seal / Stamp on Documents
                    </label>
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                      {brandingSettings.showSeal ? "✓ Enabled" : "Hidden"}
                    </span>
                  </div>

                  {brandingSettings.showSeal && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="sealType"
                            value="digital"
                            checked={brandingSettings.sealType === "digital"}
                            onChange={() => setBrandingSettings({ ...brandingSettings, sealType: "digital" })}
                          />
                          Digital Auto-Branded Vector Stamp
                        </label>

                        <label style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="sealType"
                            value="custom"
                            checked={brandingSettings.sealType === "custom"}
                            onChange={() => setBrandingSettings({ ...brandingSettings, sealType: "custom" })}
                          />
                          Upload Custom Stamp Image (PNG/JPEG)
                        </label>
                      </div>

                      {brandingSettings.sealType === "custom" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                          <label
                            style={{
                              padding: "8px 14px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1.5px dashed #93c5fd",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <HiOutlinePhoto size={16} /> Choose Seal Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload(e, "sealImage")}
                            />
                          </label>

                          {brandingSettings.sealImage && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img
                                src={brandingSettings.sealImage}
                                alt="Seal Preview"
                                style={{ width: "45px", height: "45px", objectFit: "contain", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                              <button
                                type="button"
                                onClick={() => setBrandingSettings({ ...brandingSettings, sealImage: null, sealType: "digital" })}
                                style={{ color: "#dc2626", background: "none", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Admin Authorized Signature Section */}
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={brandingSettings.showSignature}
                        onChange={(e) => setBrandingSettings({ ...brandingSettings, showSignature: e.target.checked })}
                        style={{ width: "16px", height: "16px", accentColor: "#1e40af" }}
                      />
                      Display Authorized Signature on Documents
                    </label>
                    <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: "700" }}>
                      {brandingSettings.showSignature ? "✓ Enabled" : "Hidden"}
                    </span>
                  </div>

                  {brandingSettings.showSignature && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "20px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="signatureType"
                            value="digital"
                            checked={brandingSettings.signatureType === "digital"}
                            onChange={() => setBrandingSettings({ ...brandingSettings, signatureType: "digital" })}
                          />
                          Digital Calligraphic Signature
                        </label>

                        <label style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="signatureType"
                            value="custom"
                            checked={brandingSettings.signatureType === "custom"}
                            onChange={() => setBrandingSettings({ ...brandingSettings, signatureType: "custom" })}
                          />
                          Upload Custom Signature Image (PNG)
                        </label>
                      </div>

                      {brandingSettings.signatureType === "custom" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
                          <label
                            style={{
                              padding: "8px 14px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1.5px dashed #93c5fd",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <HiOutlinePhoto size={16} /> Choose Signature Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload(e, "signatureImage")}
                            />
                          </label>

                          {brandingSettings.signatureImage && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img
                                src={brandingSettings.signatureImage}
                                alt="Signature Preview"
                                style={{ maxHeight: "35px", maxWidth: "120px", objectFit: "contain", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                              />
                              <button
                                type="button"
                                onClick={() => setBrandingSettings({ ...brandingSettings, signatureImage: null, signatureType: "digital" })}
                                style={{ color: "#dc2626", background: "none", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Signatory Name & Designation */}
                      <div className="billing-form-grid" style={{ marginTop: "6px" }}>
                        <div className="billing-form-group">
                          <label className="billing-label">Signatory Name</label>
                          <input
                            type="text"
                            value={brandingSettings.signatoryName}
                            onChange={(e) => setBrandingSettings({ ...brandingSettings, signatoryName: e.target.value })}
                            className="billing-input"
                            placeholder="e.g. Kathiravan & Co."
                          />
                        </div>

                        <div className="billing-form-group">
                          <label className="billing-label">Designation / Role</label>
                          <input
                            type="text"
                            value={brandingSettings.signatoryDesignation}
                            onChange={(e) => setBrandingSettings({ ...brandingSettings, signatoryDesignation: e.target.value })}
                            className="billing-input"
                            placeholder="e.g. Managing Partner & Auditor"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsBrandingModalOpen(false)}
                    style={{
                      padding: "10px 18px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBranding(brandingSettings)}
                    style={{
                      padding: "10px 22px",
                      background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "800",
                      fontSize: "13px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(30, 64, 175, 0.3)",
                    }}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW 2: FULL INVOICE & RECEIPT CREATOR & REAL-TIME PREVIEW
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="billing-page-container">
      {/* ─── Top Navigation & Mode Switcher ─── */}
      <header className="billing-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="btn-billing-action"
            onClick={() => setActiveView("DASHBOARD")}
            style={{ background: "#ffffff" }}
            title="Return to Invoices & Receipts Dashboard"
          >
            <HiOutlineArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="billing-mode-selector">
            <button
              type="button"
              className={`billing-mode-btn ${mode === "INVOICE" ? "active-mode" : ""}`}
              onClick={() => handleSwitchMode("INVOICE")}
            >
              <HiOutlineDocumentText size={18} />
              Tax Invoice (Vertical)
            </button>
            <button
              type="button"
              className={`billing-mode-btn ${mode === "RECEIPT" ? "active-mode receipt-mode" : ""}`}
              onClick={() => handleSwitchMode("RECEIPT")}
            >
              <HiOutlineReceiptPercent size={18} />
              Payment Receipt (Horizontal)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="billing-top-actions">
          <button
            type="button"
            className="btn-billing-action primary-save"
            onClick={handleSaveToArchive}
            title="File and save this document to portal registry"
          >
            <HiOutlineCheckCircle size={18} />
            File & Save Document
          </button>

          <button
            type="button"
            className="btn-billing-action primary-download"
            onClick={() => handleDownloadPdf()}
            title="Download high-resolution vector PDF directly to your device"
          >
            <HiOutlineArrowDownTray size={18} />
            Download PDF
          </button>

          <button
            type="button"
            className="btn-billing-action primary-print"
            onClick={handlePrintDocument}
            title="Send document to printer or system print preview"
          >
            <HiOutlinePrinter size={18} />
            Print Document
          </button>

          <button
            type="button"
            className="btn-billing-action primary-whatsapp"
            onClick={() => handleWhatsAppShare()}
            title="Attach PDF directly to WhatsApp without captions"
          >
            <FaWhatsapp size={16} />
            Share WhatsApp
          </button>

          <button
            type="button"
            className="btn-billing-action primary-email"
            onClick={() => handleEmailShare()}
            title="Attach PDF directly to default Email client"
            style={{
              background: "#0284c7",
              color: "#ffffff",
              border: "1px solid #0284c7",
            }}
          >
            <HiOutlineEnvelope size={16} />
            Share Email
          </button>

          <button
            type="button"
            className="btn-billing-action"
            onClick={() => {
              if (mode === "INVOICE") {
                const next = (parseInt(invoiceNumber.split("-").pop(), 10) || 1000) + 1;
                setInvoiceNumber(`INV-2026-${String(next).padStart(4, "0")}`);
              } else {
                const next = (parseInt(receiptNumber.split("-").pop(), 10) || 2000) + 1;
                setReceiptNumber(`RCP-2026-${String(next).padStart(4, "0")}`);
              }
              toast.success("Generated fresh unique document number!");
            }}
          >
            <HiOutlineArrowPath size={16} />
            New Number
          </button>

          <button
            type="button"
            className="btn-billing-action"
            onClick={() => handleCreateNewDocument(mode)}
            title="Reset form to a clean blank invoice/receipt"
          >
            <HiOutlineSparkles size={16} />
            Clear / Blank Form
          </button>

          <button
            type="button"
            className="btn-billing-action"
            onClick={() => {
              document.getElementById("billing-preview-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <HiOutlineArrowDown size={16} />
            Jump to Preview (Bottom)
          </button>
        </div>
      </header>

      {/* ─── STACKED LAYOUT: EDITOR (TOP) & PREVIEW (BOTTOM) ─── */}
      <div className="billing-layout-stacked">
        {/* TOP: FORM EDITOR PANE */}
        <section className="billing-editor-pane">
          {/* Card 1: Document Parameters & Client Autofill */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <HiOutlineIdentification size={20} color={accentColor} />
                {mode === "INVOICE" ? "1. Invoice Parameters & Client" : "1. Receipt Parameters & Client"}
              </h3>
              <span className="billing-card-sub">Unique Serial & Registered Client Autofill</span>
            </div>

            <div className="billing-form-grid">
              <div className="billing-form-group">
                <label className="billing-label">
                  {mode === "INVOICE" ? "Invoice Number *" : "Receipt Number *"}
                </label>
                <input
                  type="text"
                  required
                  value={mode === "INVOICE" ? invoiceNumber : receiptNumber}
                  onChange={(e) =>
                    mode === "INVOICE"
                      ? setInvoiceNumber(e.target.value)
                      : setReceiptNumber(e.target.value)
                  }
                  className="billing-input"
                  placeholder="e.g. INV-2026-0001"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Document Date *</label>
                <input
                  type="date"
                  required
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="billing-input"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Time</label>
                <input
                  type="text"
                  value={docTime}
                  onChange={(e) => setDocTime(e.target.value)}
                  className="billing-input"
                  placeholder="10:30 AM"
                />
              </div>

              {mode === "INVOICE" && (
                <div className="billing-form-group">
                  <label className="billing-label">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="billing-input"
                  />
                </div>
              )}

              <div className="billing-form-group">
                <label className="billing-label">
                  {mode === "INVOICE" ? "Reference / PO / Order No" : "Receipt Ack / Cheque / Bank Ref No"}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="billing-input"
                  placeholder={mode === "INVOICE" ? "e.g. PO/2026/8912" : "e.g. UTR-982301 / CHQ-40291"}
                />
              </div>

              <div className="billing-form-group full-width">
                <label className="billing-label">
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <HiOutlineMagnifyingGlass size={15} color={accentColor} />
                    Choose Client to Autofill ({mode === "INVOICE" ? "Tax Invoice" : "Payment Receipt"}):
                  </span>
                  <small style={{ color: "#2563eb", fontWeight: "600" }}>
                    ({availableClients.length} registered clients loaded from database)
                  </small>
                </label>

                <div className="billing-client-search-container" ref={clientDropdownRef}>
                  <div className="billing-client-search-input-wrap">
                    <span className="billing-client-search-icon">
                      <HiOutlineMagnifyingGlass size={18} />
                    </span>
                    <input
                      ref={clientInputRef}
                      type="text"
                      className="billing-client-search-input"
                      placeholder="Type client name, mobile, GSTIN, PAN or email to search and autofill..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setIsClientSearchOpen(true);
                        setHighlightedClientIndex(0);
                      }}
                      onFocus={() => setIsClientSearchOpen(true)}
                      onClick={() => setIsClientSearchOpen(true)}
                      onKeyDown={handleClientSearchKeyDown}
                    />
                    <div className="billing-client-search-actions">
                      {clientSearchQuery && (
                        <button
                          type="button"
                          className="billing-client-search-btn"
                          title="Clear search text"
                          onClick={() => {
                            setClientSearchQuery("");
                            clientInputRef.current?.focus();
                          }}
                        >
                          <HiOutlineXMark size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="billing-client-search-btn"
                        title={isClientSearchOpen ? "Close list" : "Browse all clients"}
                        onClick={() => setIsClientSearchOpen((prev) => !prev)}
                      >
                        {isClientSearchOpen ? (
                          <HiOutlineChevronUp size={16} />
                        ) : (
                          <HiOutlineChevronDown size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isClientSearchOpen && (
                    <div className="billing-client-dropdown-menu">
                      <div className="billing-client-dropdown-header">
                        <span>
                          {clientSearchQuery
                            ? `Found ${filteredClients.length} matching client${filteredClients.length === 1 ? "" : "s"}`
                            : `All Registered Clients (${availableClients.length})`}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "500", textTransform: "none", color: "#94a3b8" }}>
                          Press ESC to close
                        </span>
                      </div>

                      <div className="billing-client-dropdown-list">
                        {/* Option: Clear / Custom Manual Entry */}
                        <div
                          className="billing-client-dropdown-item"
                          onClick={() => handleClearClientSelection(false)}
                          style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}
                        >
                          <div className="billing-client-avatar custom">
                            <HiOutlineUser size={16} />
                          </div>
                          <div className="billing-client-meta-wrap">
                            <div className="billing-client-main-title" style={{ color: "#475569" }}>
                              -- Enter / Edit Custom Client Details Manually --
                            </div>
                            <div className="billing-client-contact-sub">
                              Unlink database autofill and type custom client details directly in Section 2 below.
                            </div>
                          </div>
                        </div>

                        {/* Filtered Clients */}
                        {filteredClients.map((c, idx) => {
                          const isSelected = String(c.id) === String(selectedClientId);
                          const isHighlighted = idx === highlightedClientIndex;
                          const initial = (c.name || "C").charAt(0).toUpperCase();

                          return (
                            <div
                              key={c.id}
                              className={`billing-client-dropdown-item ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
                              onClick={() => handlePickClient(c)}
                            >
                              <div className="billing-client-avatar">
                                {initial}
                              </div>
                              <div className="billing-client-meta-wrap">
                                <div className="billing-client-main-title">
                                  <span>{c.name}</span>
                                  {c.legalname && c.legalname !== c.name && (
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                                      ({c.legalname})
                                    </span>
                                  )}
                                  {c.membershipPlan && (
                                    <span className="billing-client-badge-pill plan">
                                      {c.membershipPlan}
                                    </span>
                                  )}
                                </div>
                                {(c.contactPerson || c.address || c.city) && (
                                  <div className="billing-client-contact-sub">
                                    {c.contactPerson && <span>Contact: {c.contactPerson}</span>}
                                    {c.contactPerson && (c.city || c.address) && <span> • </span>}
                                    {c.city || c.address ? <span>{c.city || c.address}</span> : null}
                                  </div>
                                )}
                                <div className="billing-client-badges">
                                  {c.mobile && (
                                    <span className="billing-client-badge-pill phone">
                                      <HiOutlinePhone size={12} />
                                      {c.mobile}
                                    </span>
                                  )}
                                  {(c.gstnumber || c.gstin) && (
                                    <span className="billing-client-badge-pill gstin">
                                      GST: {c.gstnumber || c.gstin}
                                    </span>
                                  )}
                                  {(c.pan || c.pannumber) && (
                                    <span className="billing-client-badge-pill">
                                      PAN: {c.pan || c.pannumber}
                                    </span>
                                  )}
                                  {c.email && (
                                    <span className="billing-client-badge-pill email">
                                      <HiOutlineEnvelope size={12} />
                                      {c.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700" }}>
                                  <HiOutlineCheckCircle size={18} />
                                  <span>Selected</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {filteredClients.length === 0 && (
                          <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>
                            <p style={{ margin: "0 0 8px 0", fontSize: "13.5px", fontWeight: "600", color: "#334155" }}>
                              No registered clients found matching &quot;{clientSearchQuery}&quot;
                            </p>
                            <p style={{ margin: 0, fontSize: "12px" }}>
                              You can directly enter client details manually in Section 2 below.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Selected Client Summary Banner */}
                  {selectedClientObj && (
                    <div className="billing-client-selected-banner">
                      <div className="billing-client-selected-info">
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#10b981",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <HiOutlineCheckCircle size={18} />
                        </div>
                        <div className="billing-client-selected-details">
                          <div className="billing-client-selected-name">
                            <span>{selectedClientObj.name}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #86efac",
                                borderRadius: "4px",
                                padding: "1px 6px",
                                fontWeight: "700",
                              }}
                            >
                              AUTOFILLED FROM DATABASE
                            </span>
                            {totalOutstanding > 0 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "4px",
                                  padding: "1px 6px",
                                  fontWeight: "700",
                                }}
                              >
                                Outstanding: ₹{totalOutstanding.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <div className="billing-client-selected-sub">
                            {selectedClientObj.mobile && <span>📞 {selectedClientObj.mobile}</span>}
                            {(selectedClientObj.gstnumber || selectedClientObj.gstin) && (
                              <span>• GST: {selectedClientObj.gstnumber || selectedClientObj.gstin}</span>
                            )}
                            {(selectedClientObj.pan || selectedClientObj.pannumber) && (
                              <span>• PAN: {selectedClientObj.pan || selectedClientObj.pannumber}</span>
                            )}
                            {selectedClientObj.email && <span>• ✉ {selectedClientObj.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="billing-client-selected-actions">
                        <button
                          type="button"
                          className="billing-client-action-btn change"
                          onClick={() => {
                            setIsClientSearchOpen(true);
                            clientInputRef.current?.focus();
                          }}
                        >
                          <HiOutlineMagnifyingGlass size={13} />
                          Change Client
                        </button>
                        <button
                          type="button"
                          className="billing-client-action-btn unlink"
                          title="Unlink autofill so you can edit details manually without affecting registered client"
                          onClick={() => handleClearClientSelection(false)}
                        >
                          <HiOutlineXMark size={13} />
                          Unlink Autofill
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Client Details */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <HiOutlineUser size={20} color={accentColor} />
                2. Client / Customer Details (Full Edit)
              </h3>
              <span className="billing-card-sub">Billed To / Received From Info</span>
            </div>

            <div className="billing-form-grid">
              <div className="billing-form-group">
                <label className="billing-label">Client Legal / Business Name *</label>
                <input
                  type="text"
                  required
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  className="billing-input"
                  placeholder="Enter Client or Company Name"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Contact Person</label>
                <input
                  type="text"
                  value={client.contactPerson}
                  onChange={(e) => setClient({ ...client, contactPerson: e.target.value })}
                  className="billing-input"
                  placeholder="Enter Contact Person Name"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Mobile Number *</label>
                <input
                  type="text"
                  value={client.mobile}
                  onChange={(e) => setClient({ ...client, mobile: e.target.value })}
                  className="billing-input"
                  placeholder="Enter 10-digit Mobile Number"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Email Address</label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  className="billing-input"
                  placeholder="client@example.com"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Client GSTIN</label>
                <input
                  type="text"
                  value={client.gstin}
                  onChange={(e) => setClient({ ...client, gstin: e.target.value })}
                  className="billing-input"
                  placeholder="GSTIN (e.g. 33AAAAA0000A1Z5)"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Client PAN</label>
                <input
                  type="text"
                  value={client.pan}
                  onChange={(e) => setClient({ ...client, pan: e.target.value })}
                  className="billing-input"
                  placeholder="PAN (e.g. AAAAA0000A)"
                />
              </div>

              <div className="billing-form-group full-width">
                <label className="billing-label">Billing Address</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="billing-input"
                  placeholder="Door No, Street, Landmark, City, Pincode"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">State / Place of Supply</label>
                <input
                  type="text"
                  value={client.state}
                  onChange={(e) => setClient({ ...client, state: e.target.value })}
                  className="billing-input"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">State Code</label>
                <input
                  type="text"
                  value={client.stateCode}
                  onChange={(e) => setClient({ ...client, stateCode: e.target.value })}
                  className="billing-input"
                  placeholder="33"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Line Items, Custom Columns & Table Controls */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <HiOutlineCreditCard size={20} color={accentColor} />
                {mode === "INVOICE"
                  ? "3. Billable Items, Custom Columns & Visibility Controls"
                  : "3. Payment Purpose, Particulars & Account Allocation"}
              </h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={handleAddItem}
                >
                  <HiOutlinePlus size={16} /> Add Item Row
                </button>

                <button
                  type="button"
                  className="btn-add-col-trigger"
                  onClick={() => setIsAddingCol(true)}
                  title="Add a custom column like Batch No, Period, Challan No that appears in all forms"
                >
                  <HiOutlinePlus size={14} /> + Add Custom Column
                </button>
              </div>
            </div>

            {/* RECEIPT SPECIFIC: PURPOSE & UNPAID INVOICE ALLOCATOR */}
            {mode === "RECEIPT" && (
              <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: "10px", padding: "14px 18px", marginBottom: "16px" }}>
                <div className="billing-form-group" style={{ marginBottom: "10px" }}>
                  <label className="billing-label" style={{ color: "#065f46", fontSize: "13.5px", fontWeight: "800" }}>
                    <span>Received With Thanks From / Being Payment Towards *</span>
                    <small style={{ color: "#047857" }}>Receipt Acknowledgment Purpose</small>
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptTowards}
                    onChange={(e) => setReceiptTowards(e.target.value)}
                    className="billing-input"
                    placeholder="e.g. Settlement for Tax Audit FY 2025-26, Retainer Advance, Invoice Settlement..."
                    style={{ background: "#ffffff", borderColor: "#a7f3d0", fontWeight: "600", fontSize: "14px" }}
                  />
                </div>

                {/* Quick-Fill Chips */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857" }}>Quick Purpose:</span>
                  {[
                    "Full Settlement of Outstanding Balance",
                    "Part Payment Against Invoice",
                    "Annual GST & Audit Filing Advance",
                    "Income Tax Scrutiny Representation",
                    "Quarterly Legal Retainer Fees"
                  ].map((purpose, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setReceiptTowards(purpose)}
                      style={{
                        padding: "3px 9px",
                        background: "#ffffff",
                        border: "1px solid #10b981",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#065f46",
                        cursor: "pointer",
                      }}
                    >
                      + {purpose}
                    </button>
                  ))}
                </div>

                {/* Unpaid Invoice Direct Allocation Dropdown */}
                {clientUnpaidInvoices.length > 0 && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #6ee7b7" }}>
                    <label style={{ fontSize: "12px", fontWeight: "800", color: "#065f46", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      🎯 Allocate Directly to Unpaid Client Invoice:
                      <span style={{ fontSize: "11px", color: "#047857", fontWeight: "600" }}>({clientUnpaidInvoices.length} unpaid bill(s) found)</span>
                    </label>
                    <select
                      className="billing-select"
                      style={{ background: "#ffffff", borderColor: "#10b981", fontWeight: "700", color: "#065f46" }}
                      onChange={(e) => {
                        const selectedInvNum = e.target.value;
                        if (!selectedInvNum) return;
                        const targetInv = clientUnpaidInvoices.find((u) => u.docNumber === selectedInvNum);
                        if (targetInv) {
                          setReceiptTowards(`Settlement for Tax Invoice ${targetInv.docNumber} (Dated ${targetInv.date || targetInv.docDate})`);
                          setAmountPaid(Number(targetInv.remainingBalance) || 0);
                          toast.success(`Allocated to ${targetInv.docNumber} with balance ₹${Number(targetInv.remainingBalance).toLocaleString("en-IN")}`);
                        }
                      }}
                    >
                      <option value="">-- Choose Unpaid Invoice to Allocate Payment --</option>
                      {clientUnpaidInvoices.map((inv) => (
                        <option key={inv.docNumber} value={inv.docNumber}>
                          {inv.docNumber} — Due: ₹${Number(inv.remainingBalance).toLocaleString("en-IN")} ({inv.date || inv.docDate})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Inline Custom Column Creator */}
            {isAddingCol && (
              <div
                style={{
                  background: "#eef2ff",
                  border: "1.5px solid #a5b4fc",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#3730a3" }}>
                  Create New Custom Column:
                </span>
                <input
                  type="text"
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomColumn()}
                  placeholder="e.g. Period / FY, Batch No, Vehicle No, Dept..."
                  className="billing-input"
                  style={{ width: "260px", background: "#ffffff" }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomColumn}
                  style={{
                    padding: "8px 16px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Save Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCol(false);
                    setNewColName("");
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    color: "#64748b",
                    border: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Checkbox Toolbar Strip (Standard Columns + Custom Column Pills with Delete Buttons) */}
            <div className="billing-toggle-strip">
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#334155" }}>
                Active Columns:
              </span>

              {mode === "INVOICE" ? (
                <>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={customFields.showDate}
                      onChange={(e) => setCustomFields({ ...customFields, showDate: e.target.checked })}
                    />
                    Date
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={customFields.showTime}
                      onChange={(e) => setCustomFields({ ...customFields, showTime: e.target.checked })}
                    />
                    Time
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={customFields.showHsn}
                      onChange={(e) => setCustomFields({ ...customFields, showHsn: e.target.checked })}
                    />
                    HSN/SAC
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={customFields.showUnit}
                      onChange={(e) => setCustomFields({ ...customFields, showUnit: e.target.checked })}
                    />
                    Unit
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={customFields.showDiscount}
                      onChange={(e) => setCustomFields({ ...customFields, showDiscount: e.target.checked })}
                    />
                    Disc%
                  </label>
                </>
              ) : (
                <>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showDate}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showDate: e.target.checked })}
                    />
                    Date
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showTime}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showTime: e.target.checked })}
                    />
                    Time
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showUnit}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showUnit: e.target.checked })}
                    />
                    Unit
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showQtyRate}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showQtyRate: e.target.checked })}
                    />
                    Rate Breakdown
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showPrevDue}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showPrevDue: e.target.checked })}
                    />
                    Prev Due
                  </label>
                  <label className="billing-toggle-item">
                    <input
                      type="checkbox"
                      checked={receiptFields.showRemaining}
                      onChange={(e) => setReceiptFields({ ...receiptFields, showRemaining: e.target.checked })}
                    />
                    Remaining Balance
                  </label>
                </>
              )}

              {/* Render Persistent Custom Columns */}
              {customColumns.map((col) => (
                <div key={col.id} className="custom-col-pill" title="Present across all invoice & receipt forms">
                  <label>
                    <input
                      type="checkbox"
                      checked={col.enabled}
                      onChange={() => handleToggleCustomColumn(col.id)}
                    />
                    {col.name}
                  </label>
                  <button
                    type="button"
                    className="btn-del-col"
                    onClick={() => handleDeleteCustomColumn(col.id)}
                    title={`Delete "${col.name}" column permanently`}
                  >
                    <HiOutlineTrash size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Line Items Editor Table */}
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: "30px" }}>#</th>
                    <th>Product / Service Detail *</th>
                    {(mode === "INVOICE" ? customFields.showDate : receiptFields.showDate) && (
                      <th style={{ width: "115px" }}>Date</th>
                    )}
                    {(mode === "INVOICE" ? customFields.showTime : receiptFields.showTime) && (
                      <th style={{ width: "85px" }}>Time</th>
                    )}
                    {mode === "INVOICE" && customFields.showHsn && (
                      <th style={{ width: "90px" }}>HSN/SAC</th>
                    )}
                    {(mode === "INVOICE" ? customFields.showUnit : receiptFields.showUnit) && (
                      <th style={{ width: "85px" }}>Unit</th>
                    )}

                    {activeCustomColumns.map((col) => (
                      <th key={col.id} style={{ minWidth: "110px", color: "#1e40af" }}>
                        {col.name}
                      </th>
                    ))}

                    <th style={{ width: "65px" }}>Qty</th>
                    <th style={{ width: "105px" }}>Rate (₹)</th>
                    {mode === "INVOICE" && customFields.showDiscount && (
                      <th style={{ width: "70px" }}>Disc%</th>
                    )}
                    <th style={{ width: "75px" }}>GST%</th>
                    <th style={{ width: "110px", textAlign: "right" }}>Total (₹)</th>
                    <th style={{ width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCalculated.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "700", color: "#64748b" }}>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                          placeholder="e.g. Audit, GST Filing, Tax Advisory..."
                          className="item-cell-input"
                        />
                      </td>

                      {(mode === "INVOICE" ? customFields.showDate : receiptFields.showDate) && (
                        <td>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleUpdateItem(item.id, "date", e.target.value)}
                            className="item-cell-input"
                          />
                        </td>
                      )}

                      {(mode === "INVOICE" ? customFields.showTime : receiptFields.showTime) && (
                        <td>
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => handleUpdateItem(item.id, "time", e.target.value)}
                            placeholder="10:30 AM"
                            className="item-cell-input"
                          />
                        </td>
                      )}

                      {mode === "INVOICE" && customFields.showHsn && (
                        <td>
                          <input
                            type="text"
                            value={item.hsn}
                            onChange={(e) => handleUpdateItem(item.id, "hsn", e.target.value)}
                            placeholder="9982"
                            className="item-cell-input"
                          />
                        </td>
                      )}

                      {(mode === "INVOICE" ? customFields.showUnit : receiptFields.showUnit) && (
                        <td>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                            placeholder="Nos / Hrs"
                            className="item-cell-input"
                          />
                        </td>
                      )}

                      {activeCustomColumns.map((col) => (
                        <td key={col.id}>
                          <input
                            type="text"
                            value={item.customValues?.[col.id] || ""}
                            onChange={(e) => handleUpdateItemCustomValue(item.id, col.id, e.target.value)}
                            placeholder={col.name}
                            className="item-cell-input"
                            style={{ borderColor: "#bfdbfe" }}
                          />
                        </td>
                      ))}

                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                          className="item-cell-input"
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                          className="item-cell-input"
                        />
                      </td>

                      {mode === "INVOICE" && customFields.showDiscount && (
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateItem(item.id, "discountPercent", e.target.value)}
                            className="item-cell-input"
                          />
                        </td>
                      )}

                      <td>
                        <select
                          value={item.gstPercent}
                          onChange={(e) => handleUpdateItem(item.id, "gstPercent", Number(e.target.value))}
                          className="item-cell-input"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>

                      <td style={{ textAlign: "right", fontWeight: "700" }}>
                        ₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-remove-row"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "24px", fontSize: "13px", color: "#475569" }}>
              <div>Subtotal: <strong>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div>GST: <strong>₹{totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div>Current Bill: <strong style={{ color: "#0f172a" }}>₹{currentInvoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
            </div>
          </div>

          {/* Card 4: Total Outstanding, Intermediate Rows & Declared Net Worth Payable Tracking */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <HiOutlineCurrencyRupee size={20} color={accentColor} />
                {mode === "INVOICE"
                  ? "4. Total Outstanding & Declared Net Worth Payable Tracking"
                  : "4. Account Settlement & Ledger Balance Tracking"}
              </h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-add-custom-row"
                  onClick={handleRefreshOutstanding}
                  title="Recalculate real-time outstanding balance from unpaid client invoices"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  <HiOutlineArrowPath size={14} /> Auto-Calculate Real-Time Balance
                </button>
                <button
                  type="button"
                  className="btn-add-custom-row"
                  onClick={handleAddIntermediateRow}
                >
                  <HiOutlinePlus size={14} /> Add Row Between Outstanding & Payment
                </button>
              </div>
            </div>

            <div className="billing-form-grid" style={{ marginBottom: "16px" }}>
              <div className="billing-form-group">
                <label className="billing-label">
                  <span>
                    {mode === "INVOICE"
                      ? "Total Previous Outstanding Amount (₹)"
                      : "Total Outstanding Before This Receipt (₹)"}
                  </span>
                  <small style={{ color: "#b91c1c", fontWeight: "700" }}>Real-time Ledger Field</small>
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalOutstanding}
                  onChange={(e) => setTotalOutstanding(Number(e.target.value) || 0)}
                  className="billing-input"
                  style={{ fontWeight: "700", color: "#b91c1c", fontSize: "15px" }}
                  placeholder="e.g. 5000"
                />
                {clientUnpaidInvoices.length > 0 ? (
                  <span style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "600", marginTop: "4px", display: "block" }}>
                    ⚠️ {clientUnpaidInvoices.length} unpaid bill(s) in registry: {clientUnpaidInvoices.map((u) => `${u.docNumber} (₹${u.remainingBalance})`).join(", ")}
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600", marginTop: "4px", display: "block" }}>
                    ✓ No prior unpaid invoices recorded for this client
                  </span>
                )}
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Calculated Net Payable</label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${computedNetPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  className="billing-input billing-input-readonly"
                  style={{ fontWeight: "700", color: "#475569", fontSize: "15px" }}
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">
                  <span>Effective Net Worth Payable (₹)</span>
                  <small style={{ color: "#1e40af", fontWeight: "700" }}>Declared Amount</small>
                </label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  className="billing-input billing-input-readonly"
                  style={{ fontWeight: "800", color: "#1e3a8a", fontSize: "16px" }}
                />
              </div>
            </div>

            {/* Intermediate Rows Box */}
            <div className="intermediate-rows-box">
              <div className="intermediate-header">
                <strong>
                  <HiOutlineSparkles size={16} />
                  Custom Rows Between Total Outstanding & Payment Receipt:
                </strong>
                <span style={{ fontSize: "12px", color: "#7e22ce" }}>
                  {intermediateRows.length} adjustment row{intermediateRows.length === 1 ? "" : "s"} added
                </span>
              </div>

              {intermediateRows.length === 0 ? (
                <p style={{ margin: "4px 0", fontSize: "12px", color: "#9333ea" }}>
                  No intermediate rows yet. Click the button above to add custom fee fields or deductions.
                </p>
              ) : (
                intermediateRows.map((row) => (
                  <div key={row.id} className="custom-row-item">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => handleUpdateIntermediateRow(row.id, "label", e.target.value)}
                      placeholder="e.g. Late Filing Govt Fee, Travel Expenses, Discount Credit..."
                      className="billing-input"
                      style={{ fontSize: "13px" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <select
                        value={row.type}
                        onChange={(e) => handleUpdateIntermediateRow(row.id, "type", e.target.value)}
                        className="billing-select"
                        style={{ width: "95px", fontSize: "12px", padding: "8px" }}
                      >
                        <option value="ADD">+ Add</option>
                        <option value="DEDUCT">- Less</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={row.amount}
                        onChange={(e) => handleUpdateIntermediateRow(row.id, "amount", Number(e.target.value))}
                        className="billing-input"
                        style={{ fontSize: "13px", fontWeight: "700" }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-remove-row"
                      onClick={() => handleRemoveIntermediateRow(row.id)}
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ── DECLARE & UPDATE NET WORTH PAYABLE WITH AUDIT TRACKING ── */}
            <div className="payable-declaration-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "13.5px", color: "#0f766e", display: "flex", alignItems: "center", gap: "6px" }}>
                  <HiOutlineArrowTrendingUp size={16} />
                  Declare / Update Total Net Worth Payable with Audit Tracking:
                </strong>
                <span style={{ fontSize: "12px", fontWeight: "700", color: declaredNetWorthPayable !== null ? "#047857" : "#64748b" }}>
                  Status: {declaredNetWorthPayable !== null ? "✓ Manually Declared" : "Auto-Calculated"}
                </span>
              </div>

              {declaredNetWorthPayable !== null && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px 12px",
                    background: declaredDiff < 0 ? "#ecfdf5" : declaredDiff > 0 ? "#eff6ff" : "#f8fafc",
                    border: `1px solid ${declaredDiff < 0 ? "#a7f3d0" : declaredDiff > 0 ? "#bfdbfe" : "#cbd5e1"}`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: declaredDiff < 0 ? "#065f46" : declaredDiff > 0 ? "#1e40af" : "#475569" }}>
                    Live Adjustment on Invoice:{" "}
                    <span style={{ fontSize: "13.5px", fontWeight: "900" }}>
                      {declaredDiff < 0 ? "- " : declaredDiff > 0 ? "+ " : ""}₹{Math.abs(declaredDiff).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    {activeAdjustmentNote ? ` (${activeAdjustmentNote})` : ""}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                    ✓ Directly applied above Total Net Payable & Filed Invoice
                  </span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto auto", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  placeholder={`Amount (Default: ${computedNetPayable})`}
                  value={declaredNetWorthPayable !== null ? declaredNetWorthPayable : ""}
                  onChange={(e) => setDeclaredNetWorthPayable(e.target.value === "" ? null : Number(e.target.value))}
                  className="billing-input"
                  style={{ fontWeight: "700", color: "#0f766e" }}
                />
                <input
                  type="text"
                  placeholder="Reason for override / adjustment notes..."
                  value={payableCustomNote}
                  onChange={(e) => setPayableCustomNote(e.target.value)}
                  className="billing-input"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateDeclaredPayable(declaredNetWorthPayable !== null ? declaredNetWorthPayable : computedNetPayable, payableCustomNote)}
                  style={{
                    padding: "9px 16px",
                    background: "#0d9488",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Update & Track
                </button>
                {declaredNetWorthPayable !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeclaredNetWorthPayable(null);
                      setPayableCustomNote("");
                      setLastDeclaredReason("");
                      toast.success("Reset to auto-calculated net payable.");
                    }}
                    style={{
                      padding: "9px 12px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Audit Trail Log */}
              {netWorthAuditHistory.length > 0 && (
                <div className="audit-history-list">
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#0f766e" }}>
                    Audit Adjustment Trail:
                  </span>
                  {netWorthAuditHistory.map((item, i) => (
                    <div key={i} className="audit-item">
                      <span>• {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <strong>₹{Number(item.previousAmount).toLocaleString("en-IN")} → ₹{Number(item.updatedAmount).toLocaleString("en-IN")}</strong>
                      <span>({item.note})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Payment Receipt Details & LIVE Dynamic Mode Switching */}
          <div className="billing-card">
            <div className="billing-card-header">
              <h3 className="billing-card-title">
                <HiOutlineBanknotes size={20} color={accentColor} />
                {mode === "INVOICE"
                  ? "5. Advance / Immediate Payment Received (Optional)"
                  : "5. Payment Realization & Transaction Verification (Primary)"}
              </h3>
              <span className="billing-card-sub">
                {mode === "INVOICE"
                  ? "Default is ₹0 for standard unpaid invoices. Record amount only if advance or immediate payment was received today."
                  : "Selecting a mode reveals live specific verification fields (UPI / Cash / Bank / Cheque / Card)"}
              </span>
            </div>

            <div className="billing-form-grid">
              <div className="billing-form-group">
                <label className="billing-label">Payment Mode Via *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="billing-select"
                  style={{ fontWeight: "700", color: "#1e40af" }}
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm, BHIM)</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer / IMPS</option>
                  <option value="NEFT">NEFT (National Electronic Funds Transfer)</option>
                  <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Payment Receipt Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="billing-input"
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Amount Paid / Received (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="billing-input"
                  style={{ fontWeight: "800", color: "#15803d", fontSize: "16px" }}
                />
              </div>

              <div className="billing-form-group">
                <label className="billing-label">Remaining Balance (₹)</label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  className="billing-input billing-input-readonly"
                  style={{
                    fontWeight: "800",
                    color: remainingBalance <= 0 ? "#15803d" : "#dc2626",
                    fontSize: "15px",
                  }}
                />
              </div>

              {mode === "RECEIPT" && (
                <div className="billing-form-group full-width">
                  <label className="billing-label">Received Towards / On Account of *</label>
                  <input
                    type="text"
                    value={receiptTowards}
                    onChange={(e) => setReceiptTowards(e.target.value)}
                    className="billing-input"
                    placeholder="e.g. Audit Fees, GST Filing, Legal Advisory Retainer..."
                  />
                </div>
              )}
            </div>

            {/* LIVE DYNAMIC FIELDS BASED ON PAYMENT MODE */}
            <div className="dynamic-payment-card">
              <div className="dynamic-payment-header">
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <HiOutlineSparkles size={16} />
                  Live Fields for:
                </span>
                <span className={`payment-mode-tag mode-tag-${paymentMode.toLowerCase().replace('_', '-')}`}>
                  {paymentMode}
                </span>
              </div>

              {paymentMode === "UPI" && (
                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label className="billing-label">UPI App / Platform</label>
                    <select
                      value={paymentDetails.upiApp}
                      onChange={(e) => handleUpdatePaymentDetail("upiApp", e.target.value)}
                      className="billing-select"
                    >
                      <option value="Google Pay">Google Pay (GPay)</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                      <option value="BHIM UPI">BHIM UPI</option>
                      <option value="Cred UPI">Cred UPI</option>
                      <option value="Amazon Pay">Amazon Pay</option>
                      <option value="Other UPI">Other Bank UPI App</option>
                    </select>
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">UPI Txn ID / UTR Number</label>
                    <input
                      type="text"
                      value={paymentDetails.upiTxnId}
                      onChange={(e) => handleUpdatePaymentDetail("upiTxnId", e.target.value)}
                      placeholder="e.g. UPI/AXIS/7483921049"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Payer UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={paymentDetails.upiId}
                      onChange={(e) => handleUpdatePaymentDetail("upiId", e.target.value)}
                      placeholder="e.g. client@oksbi"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Firm Receiver UPI ID</label>
                    <input
                      type="text"
                      value={paymentDetails.receiverUpiId}
                      onChange={(e) => handleUpdatePaymentDetail("receiverUpiId", e.target.value)}
                      className="billing-input"
                    />
                  </div>
                </div>
              )}

              {paymentMode === "CASH" && (
                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label className="billing-label">Cash Received By (Admin/Staff)</label>
                    <input
                      type="text"
                      value={paymentDetails.cashReceivedBy}
                      onChange={(e) => handleUpdatePaymentDetail("cashReceivedBy", e.target.value)}
                      placeholder="e.g. Kathiravan & Co. (Admin Desk)"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Cash Voucher / Slip No</label>
                    <input
                      type="text"
                      value={paymentDetails.cashVoucherNo}
                      onChange={(e) => handleUpdatePaymentDetail("cashVoucherNo", e.target.value)}
                      placeholder="e.g. CSH-2026-041"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group full-width">
                    <label className="billing-label">Cash Notes / Denominations</label>
                    <input
                      type="text"
                      value={paymentDetails.cashDenominations}
                      onChange={(e) => handleUpdatePaymentDetail("cashDenominations", e.target.value)}
                      placeholder="e.g. Received 50 x ₹500 notes at Salem billing counter"
                      className="billing-input"
                    />
                  </div>
                </div>
              )}

              {(paymentMode === "BANK_TRANSFER" || paymentMode === "NEFT" || paymentMode === "RTGS") && (
                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label className="billing-label">Deposit Bank Name</label>
                    <input
                      type="text"
                      value={paymentDetails.bankName}
                      onChange={(e) => handleUpdatePaymentDetail("bankName", e.target.value)}
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Beneficiary Account No</label>
                    <input
                      type="text"
                      value={paymentDetails.bankAccountNo}
                      onChange={(e) => handleUpdatePaymentDetail("bankAccountNo", e.target.value)}
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">UTR / NEFT / RTGS Ref No</label>
                    <input
                      type="text"
                      value={paymentDetails.bankUtrNo}
                      onChange={(e) => handleUpdatePaymentDetail("bankUtrNo", e.target.value)}
                      placeholder="e.g. HDFCR52026102000192"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Sender / Remitter Bank Name</label>
                    <input
                      type="text"
                      value={paymentDetails.senderBank}
                      onChange={(e) => handleUpdatePaymentDetail("senderBank", e.target.value)}
                      placeholder="e.g. State Bank of India - Fairlands Branch"
                      className="billing-input"
                    />
                  </div>
                </div>
              )}

              {paymentMode === "CHEQUE" && (
                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label className="billing-label">Cheque / DD Number (6-digits)</label>
                    <input
                      type="text"
                      value={paymentDetails.chequeNo}
                      onChange={(e) => handleUpdatePaymentDetail("chequeNo", e.target.value)}
                      placeholder="e.g. 402911"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Cheque Date</label>
                    <input
                      type="date"
                      value={paymentDetails.chequeDate}
                      onChange={(e) => handleUpdatePaymentDetail("chequeDate", e.target.value)}
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Drawn on Bank Name</label>
                    <input
                      type="text"
                      value={paymentDetails.chequeBank}
                      onChange={(e) => handleUpdatePaymentDetail("chequeBank", e.target.value)}
                      placeholder="e.g. Axis Bank Ltd"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Bank Branch</label>
                    <input
                      type="text"
                      value={paymentDetails.chequeBranch}
                      onChange={(e) => handleUpdatePaymentDetail("chequeBranch", e.target.value)}
                      placeholder="e.g. Salem Main Branch"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Cheque Status</label>
                    <select
                      value={paymentDetails.chequeStatus}
                      onChange={(e) => handleUpdatePaymentDetail("chequeStatus", e.target.value)}
                      className="billing-select"
                    >
                      <option value="Received & Deposited">Received & Deposited</option>
                      <option value="Subject to Realization">Subject to Realization</option>
                      <option value="Cleared & Realized">Cleared & Realized</option>
                      <option value="Post-Dated Cheque (PDC)">Post-Dated Cheque (PDC)</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMode === "CARD" && (
                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label className="billing-label">Card Network</label>
                    <select
                      value={paymentDetails.cardNetwork}
                      onChange={(e) => handleUpdatePaymentDetail("cardNetwork", e.target.value)}
                      className="billing-select"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay</option>
                      <option value="American Express">American Express</option>
                    </select>
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Card Type</label>
                    <select
                      value={paymentDetails.cardType}
                      onChange={(e) => handleUpdatePaymentDetail("cardType", e.target.value)}
                      className="billing-select"
                    >
                      <option value="Debit Card">Debit Card</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Corporate Card">Corporate Card</option>
                    </select>
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={paymentDetails.cardLast4}
                      onChange={(e) => handleUpdatePaymentDetail("cardLast4", e.target.value)}
                      placeholder="8842"
                      className="billing-input"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label className="billing-label">POS Auth / Approval Code</label>
                    <input
                      type="text"
                      value={paymentDetails.cardAuthCode}
                      onChange={(e) => handleUpdatePaymentDetail("cardAuthCode", e.target.value)}
                      placeholder="e.g. AUTH-892301"
                      className="billing-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Generated Words Display */}
            <div style={{ marginTop: "14px" }}>
              <label className="billing-label">
                <span>Amount in Words (Auto-Generated):</span>
                <small style={{ color: "#059669", fontWeight: "700" }}>Live Indian Currency Grammar</small>
              </label>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: "9px",
                  padding: "10px 14px",
                  fontWeight: "700",
                  color: "#166534",
                  fontSize: "13.5px",
                }}
              >
                🗣️ {amountInWords}
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM: REAL DOCUMENT PREVIEW (FULL WIDTH A4/LANDSCAPE) */}
        <section className="billing-preview-pane" id="billing-preview-section">
          <div className="preview-toolbar">
            <span className="preview-badge">
              <HiOutlineEye size={20} color={accentColor} />
              Real Document Preview ({mode === "INVOICE" ? "Vertical Portrait A4" : "Horizontal Landscape Voucher"})
            </span>

            <div className="color-swatch-picker" title="Select Document Accent Theme">
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Theme Color:</span>
              {ACCENT_COLORS.map((c) => (
                <div
                  key={c.hex}
                  className={`color-dot ${accentColor === c.hex ? "active-color" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setAccentColor(c.hex)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div id="billing-printable-area">
            {mode === "INVOICE" ? (
              /* INVOICE LAYOUT: VERTICAL PORTRAIT A4 */
              <div className="doc-paper-invoice">
                <div className="doc-invoice-stripe" style={{ background: accentColor }} />

                <div className="doc-invoice-header">
                  <div className="doc-firm-info">
                    <h2 style={{ color: accentColor }}>{firm.name}</h2>
                    <p style={{ fontWeight: "700", color: "#334155" }}>{firm.subTitle}</p>
                    <p>{firm.address}</p>
                    <p>{firm.city}</p>
                    <p>Phone: <strong>{firm.phone}</strong> • Email: {firm.email}</p>
                    <p>GSTIN: <strong>{firm.gstin}</strong> • PAN: {firm.pan}</p>
                  </div>

                  <div className="doc-invoice-title-block">
                    <h1 style={{ color: accentColor }}>TAX INVOICE</h1>
                    <div className="doc-meta-badge">
                      <span>Invoice No: <strong style={{ color: "#0f172a" }}>{invoiceNumber}</strong></span>
                      <span>Invoice Date: <strong>{docDate}</strong></span>
                      <span>Due Date: <strong>{dueDate}</strong></span>
                      {referenceNo && <span>Ref / PO: <strong>{referenceNo}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="doc-addresses-grid">
                  <div className="doc-billed-to">
                    <h4>Billed To (Client / Customer):</h4>
                    <div className="doc-client-name">{client.name || "Customer Legal Name"}</div>
                    {client.contactPerson && (
                      <p className="doc-address-text">Attn: <strong>{client.contactPerson}</strong></p>
                    )}
                    <p className="doc-address-text">{client.address}</p>
                    <p className="doc-address-text">
                      Mobile: <strong>{client.mobile}</strong>
                      {client.email && ` • ${client.email}`}
                    </p>
                    <p className="doc-address-text">
                      GSTIN: <strong>{client.gstin || "Unregistered"}</strong>
                      {client.pan && ` • PAN: ${client.pan}`}
                    </p>
                  </div>

                  <div className="doc-invoice-dates">
                    <h4>Supply & Compliance Details:</h4>
                    <p className="doc-address-text">Place of Supply: <strong>{client.state}</strong></p>
                    <p className="doc-address-text">State Code: <strong>{client.stateCode}</strong></p>
                    <p className="doc-address-text">Reverse Charge: <strong>No</strong></p>
                    <p className="doc-address-text">Nature of Service: <strong>Professional Advisory</strong></p>
                  </div>
                </div>

                <table className="doc-table">
                  <colgroup>
                    <col style={{ width: colWidths.idx }} />
                    <col style={{ width: colWidths.desc }} />
                    {customFields.showDate && <col style={{ width: colWidths.date }} />}
                    {customFields.showHsn && <col style={{ width: colWidths.hsn }} />}
                    {customFields.showUnit && <col style={{ width: colWidths.unit }} />}
                    {activeCustomColumns.map((col) => (
                      <col key={col.id} style={{ width: colWidths.custom }} />
                    ))}
                    <col style={{ width: colWidths.qty }} />
                    <col style={{ width: colWidths.rate }} />
                    {customFields.showDiscount && <col style={{ width: colWidths.disc }} />}
                    <col style={{ width: colWidths.gst }} />
                    <col style={{ width: colWidths.total }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: accentColor }}>
                      <th style={{ width: colWidths.idx, textAlign: "center" }}>#</th>
                      <th style={{ width: colWidths.desc, textAlign: "left" }}>Product / Service Description</th>
                      {customFields.showDate && <th style={{ width: colWidths.date, textAlign: "left" }}>Date</th>}
                      {customFields.showHsn && <th style={{ width: colWidths.hsn, textAlign: "left" }}>HSN/SAC</th>}
                      {customFields.showUnit && <th style={{ width: colWidths.unit, textAlign: "left" }}>Unit</th>}

                      {activeCustomColumns.map((col) => (
                        <th key={col.id} style={{ width: colWidths.custom, textAlign: "left" }}>{col.name}</th>
                      ))}

                      <th style={{ width: colWidths.qty, textAlign: "center" }}>Qty</th>
                      <th style={{ width: colWidths.rate, textAlign: "right" }}>Rate (₹)</th>
                      {customFields.showDiscount && <th style={{ width: colWidths.disc, textAlign: "center" }}>Disc%</th>}
                      <th style={{ width: colWidths.gst, textAlign: "center" }}>GST%</th>
                      <th style={{ width: colWidths.total, textAlign: "right" }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsCalculated.map((it, i) => (
                      <tr key={it.id}>
                        <td style={{ textAlign: "center", fontWeight: "700" }}>{i + 1}</td>
                        <td style={{ textAlign: "left" }}>
                          <strong style={{ display: "block", color: "#0f172a" }}>
                            {it.description || "Service Description"}
                          </strong>
                        </td>
                        {customFields.showDate && <td style={{ textAlign: "left" }}>{it.date}</td>}
                        {customFields.showHsn && <td style={{ textAlign: "left" }}>{it.hsn}</td>}
                        {customFields.showUnit && <td style={{ textAlign: "left" }}>{it.unit}</td>}

                        {activeCustomColumns.map((col) => (
                          <td key={col.id} style={{ textAlign: "left", fontWeight: "600", color: "#1e40af" }}>
                            {it.customValues?.[col.id] || "—"}
                          </td>
                        ))}

                        <td style={{ textAlign: "center" }}>{it.quantity}</td>
                        <td style={{ textAlign: "right" }}>{Number(it.rate).toLocaleString("en-IN")}</td>
                        {customFields.showDiscount && (
                          <td style={{ textAlign: "center" }}>{it.discountPercent}%</td>
                        )}
                        <td style={{ textAlign: "center" }}>{it.gstPercent}%</td>
                        <td style={{ textAlign: "right", fontWeight: "700" }}>
                          ₹{it.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="doc-summary-split">
                  {customFields.showBankDetails ? (
                    <div className="doc-bank-box">
                      <strong>🏦 Bank Transfer & UPI Details</strong>
                      <p>Bank: <strong>{firm.bankName}</strong></p>
                      <p>A/C Name: <strong>{firm.accountName}</strong></p>
                      <p>A/C No: <strong>{firm.accountNumber}</strong></p>
                      <p>IFSC: <strong>{firm.ifscCode}</strong> • Branch: {firm.branch}</p>
                      <p style={{ marginTop: "6px", color: "#166534" }}>
                        UPI ID: <strong>{firm.upiId}</strong>
                      </p>
                    </div>
                  ) : <div />}

                  <div className="doc-calc-table-wrap">
                    <table className="doc-calc-table">
                      <tbody>
                        <tr>
                          <td>Subtotal (Taxable Value):</td>
                          <td className="val-col">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {customFields.showTaxBreakup && (
                          <>
                            <tr>
                              <td>CGST (9%):</td>
                              <td className="val-col">₹ {(totalGst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td>SGST (9%):</td>
                              <td className="val-col">₹ {(totalGst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td>Current Invoice Amount:</td>
                          <td className="val-col">₹ {currentInvoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>

                        {totalOutstanding > 0 && (
                          <tr style={{ color: "#b91c1c", fontWeight: "700" }}>
                            <td>Previous Total Outstanding:</td>
                            <td className="val-col">+ ₹ {Number(totalOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}

                        {intermediateRows.map((r) => (
                          <tr key={r.id} style={{ color: "#6b21a8" }}>
                            <td>{r.label}:</td>
                            <td className="val-col">
                              {r.type === "DEDUCT" ? "- " : "+ "}
                              ₹ {Number(r.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}

                        {declaredNetWorthPayable !== null && (declaredDiff !== 0 || activeAdjustmentNote) && (
                          <tr
                            style={{
                              color: declaredDiff < 0 ? "#15803d" : declaredDiff > 0 ? "#1d4ed8" : "#0f766e",
                              fontWeight: "700",
                              background: declaredDiff < 0 ? "#f0fdf4" : declaredDiff > 0 ? "#eff6ff" : "#f0fdfa",
                            }}
                          >
                            <td>
                              {declaredDiff < 0
                                ? "Declared Adjustment / Concession"
                                : declaredDiff > 0
                                ? "Declared Adjustment / Surcharge"
                                : "Declared Adjustment"}
                              {activeAdjustmentNote ? ` (${activeAdjustmentNote})` : ""}:
                            </td>
                            <td className="val-col">
                              {declaredDiff < 0 ? "- " : declaredDiff > 0 ? "+ " : ""}₹{" "}
                              {Math.abs(declaredDiff).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        <tr className="doc-grand-total-row">
                          <td>TOTAL NET PAYABLE:</td>
                          <td className="val-col" style={{ color: accentColor }}>
                            ₹ {netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>

                        <tr>
                          <td>Amount Paid:</td>
                          <td className="val-col" style={{ color: "#166534" }}>
                            ₹ {Number(amountPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr style={{ fontWeight: "800", color: remainingBalance <= 0 ? "#166534" : "#dc2626" }}>
                          <td>Remaining Balance Due:</td>
                          <td className="val-col">
                            ₹ {remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {customFields.showAmountInWords && (
                  <div className="doc-amount-words" style={{ borderLeftColor: accentColor }}>
                    <strong>Amount in Words: </strong> {amountInWords}
                  </div>
                )}

                <div className="doc-payment-status">
                  <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                    Payment Mode: <strong style={{ color: "#1e40af" }}>{paymentMode}</strong>{" "}
                    {renderPaymentPreviewSummary()}
                  </div>
                  <div>
                    <span
                      className={`stamp-badge ${
                        remainingBalance <= 0
                          ? "stamp-paid"
                          : amountPaid > 0
                          ? "stamp-partial"
                          : "stamp-due"
                      }`}
                    >
                      {remainingBalance <= 0
                        ? "✓ FULLY PAID"
                        : amountPaid > 0
                        ? "PARTIALLY PAID"
                        : "PAYMENT DUE"}
                    </span>
                  </div>
                </div>

                <div className="doc-footer-grid">
                  <div className="doc-terms">
                    <strong>Terms & Conditions:</strong>
                    <p style={{ margin: "3px 0" }}>
                      1. All payments must be made to "{firm.accountName || firm.name || "Sri Kathiravan & Co."}" bank account or official UPI.<br />
                      2. This is a computer generated tax invoice and is legally binding.<br />
                      3. Subject to Salem jurisdiction.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
                    {brandingSettings.showSeal && (
                      <div className="doc-seal-box" title="Official Office Seal">
                        {brandingSettings.sealType === "custom" && brandingSettings.sealImage ? (
                          <img
                            src={brandingSettings.sealImage}
                            alt="Office Seal"
                            className="doc-seal-img"
                          />
                        ) : (
                          <svg viewBox="0 0 100 100" className="doc-svg-seal">
                            <circle cx="50" cy="50" r="46" stroke="#059669" strokeWidth="2.5" fill="none" strokeDasharray="3 2" />
                            <circle cx="50" cy="50" r="41" stroke="#059669" strokeWidth="1.5" fill="none" />
                            <circle cx="50" cy="50" r="28" stroke="#059669" strokeWidth="1" fill="none" />
                            <path id="curve-top-inv" d="M 16 50 A 34 34 0 0 1 84 50" fill="none" />
                            <path id="curve-bot-inv" d="M 84 50 A 34 34 0 0 1 16 50" fill="none" />
                            <text fontSize="7" fontWeight="900" fill="#059669" letterSpacing="0.8">
                              <textPath href="#curve-top-inv" startOffset="50%" textAnchor="middle">
                                {firm.name || "Sri Kathiravan & Co."}
                              </textPath>
                            </text>
                            <text fontSize="5.5" fontWeight="700" fill="#059669" letterSpacing="0.6">
                              <textPath href="#curve-bot-inv" startOffset="50%" textAnchor="middle">
                                TAX & AUDIT CONSULTANTS
                              </textPath>
                            </text>
                            <text x="50" y="47" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#059669">
                              OFFICIAL
                            </text>
                            <text x="50" y="55" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#059669">
                              ★ SEAL ★
                            </text>
                            <text x="50" y="63" fontSize="5" fontWeight="700" textAnchor="middle" fill="#059669">
                              SALEM
                            </text>
                          </svg>
                        )}
                      </div>
                    )}

                    {brandingSettings.showSignature && (
                      <div className="doc-signatory">
                        {brandingSettings.signatureType === "custom" && brandingSettings.signatureImage ? (
                          <img
                            src={brandingSettings.signatureImage}
                            alt="Authorized Signature"
                            className="doc-sign-img"
                          />
                        ) : (
                          <div className="doc-digital-sign">
                            {brandingSettings.signatoryName || "Kathiravan & Co."}
                          </div>
                        )}
                        <div className="doc-sign-line" />
                        <span style={{ fontWeight: "700" }}>FOR {firm.name}</span>
                        <small>{brandingSettings.signatoryName} • {brandingSettings.signatoryDesignation}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* PAYMENT RECEIPT LAYOUT: HORIZONTAL LANDSCAPE VOUCHER */
              <div className="doc-paper-receipt">
                <div className="doc-receipt-header">
                  <div>
                    <h2 style={{ margin: "0 0 2px 0", fontSize: "20px", fontWeight: "900", color: "#065f46" }}>
                      {firm.name}
                    </h2>
                    <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
                      {firm.subTitle} • {firm.city} • Phone: {firm.phone}
                    </p>
                  </div>

                  <div className="doc-receipt-badge">
                    OFFICIAL PAYMENT RECEIPT
                  </div>

                  <div className="doc-receipt-meta">
                    <div>Receipt No: <strong style={{ color: "#065f46" }}>{receiptNumber}</strong></div>
                    <div>Date: <strong>{docDate}</strong></div>
                    {receiptFields.showTime && <div>Time: <strong>{docTime}</strong></div>}
                  </div>
                </div>

                <div className="doc-receipt-body">
                  <div className="doc-receipt-line">
                    Received with thanks from:
                    <span className="doc-receipt-fill" style={{ fontSize: "15px" }}>
                      {client.name || "Client Legal Name"}
                    </span>
                    {client.mobile && <span>(Mobile: <strong>{client.mobile}</strong>)</span>}
                  </div>

                  <div className="doc-receipt-line">
                    The sum of Rupees:
                    <span className="doc-receipt-fill" style={{ flex: 1, color: "#065f46" }}>
                      {amountInWords}
                    </span>
                  </div>

                  <div className="doc-receipt-line">
                    Being payment towards / on account of:
                    <span className="doc-receipt-fill" style={{ flex: 1 }}>
                      {receiptTowards}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", margin: "14px 0", gap: "14px" }}>
                    <div className="doc-receipt-amount-card">
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#047857" }}>AMOUNT RECEIVED:</span>
                      <strong>₹ {Number(amountPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div style={{ fontSize: "12.5px", background: "#f8fafc", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      Payment Mode: <strong style={{ color: "#065f46" }}>{paymentMode}</strong>{" "}
                      {renderPaymentPreviewSummary()}
                      <span> • Date: <strong>{paymentDate}</strong></span>
                    </div>
                  </div>

                  <table className="receipt-items-table">
                    <colgroup>
                      {receiptFields.showDate && <col style={{ width: receiptColWidths.date }} />}
                      {receiptFields.showTime && <col style={{ width: receiptColWidths.time }} />}
                      <col style={{ width: receiptColWidths.desc }} />
                      {receiptFields.showUnit && <col style={{ width: receiptColWidths.unit }} />}
                      {activeCustomColumns.map((col) => (
                        <col key={col.id} style={{ width: receiptColWidths.custom }} />
                      ))}
                      {receiptFields.showQtyRate && <col style={{ width: receiptColWidths.rate }} />}
                      {receiptFields.showPrevDue && <col style={{ width: receiptColWidths.prev }} />}
                      <col style={{ width: receiptColWidths.amt }} />
                      {receiptFields.showRemaining && <col style={{ width: receiptColWidths.rem }} />}
                    </colgroup>
                    <thead>
                      <tr>
                        {receiptFields.showDate && <th style={{ width: receiptColWidths.date, textAlign: "left" }}>Date</th>}
                        {receiptFields.showTime && <th style={{ width: receiptColWidths.time, textAlign: "left" }}>Time</th>}
                        <th style={{ width: receiptColWidths.desc, textAlign: "left" }}>Service / Product Detail</th>
                        {receiptFields.showUnit && <th style={{ width: receiptColWidths.unit, textAlign: "left" }}>Unit</th>}

                        {activeCustomColumns.map((col) => (
                          <th key={col.id} style={{ width: receiptColWidths.custom, textAlign: "left", color: "#065f46" }}>{col.name}</th>
                        ))}

                        {receiptFields.showQtyRate && (
                          <th style={{ width: receiptColWidths.rate, textAlign: "right" }}>Charge</th>
                        )}
                        {receiptFields.showPrevDue && (
                          <th style={{ width: receiptColWidths.prev, textAlign: "right" }}>Prev Due</th>
                        )}
                        <th style={{ width: receiptColWidths.amt, textAlign: "right" }}>Amount Received</th>
                        {receiptFields.showRemaining && (
                          <th style={{ width: receiptColWidths.rem, textAlign: "right" }}>Remaining Due</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id}>
                          {receiptFields.showDate && <td>{it.date || docDate}</td>}
                          {receiptFields.showTime && <td>{it.time || docTime}</td>}
                          <td>
                            <strong>{it.description || receiptTowards}</strong>
                          </td>
                          {receiptFields.showUnit && <td>{it.unit || "Service"}</td>}

                          {activeCustomColumns.map((col) => (
                            <td key={col.id} style={{ fontWeight: "600", color: "#047857" }}>
                              {it.customValues?.[col.id] || "—"}
                            </td>
                          ))}

                          {receiptFields.showQtyRate && (
                            <td style={{ textAlign: "right", fontWeight: "700" }}>
                              ₹{Number(it.rate * it.quantity).toLocaleString("en-IN")}
                            </td>
                          )}
                          {receiptFields.showPrevDue && (
                            <td style={{ textAlign: "right", color: "#b91c1c" }}>
                              ₹{Number(totalOutstanding).toLocaleString("en-IN")}
                            </td>
                          )}
                          <td style={{ textAlign: "right", color: "#047857", fontWeight: "700" }}>
                            ₹{Number(amountPaid).toLocaleString("en-IN")}
                          </td>
                          {receiptFields.showRemaining && (
                            <td style={{ textAlign: "right", fontWeight: "800", color: remainingBalance <= 0 ? "#15803d" : "#b91c1c" }}>
                              ₹{remainingBalance.toLocaleString("en-IN")}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="doc-receipt-footer">
                  <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "55%" }}>
                    <p style={{ margin: "2px 0" }}>* Subject to realization of Cheque / Electronic Bank settlement.</p>
                    <p style={{ margin: "2px 0" }}>* Thank you for your continued association with {firm.name || "Sri Kathiravan & Co."}.</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
                    {brandingSettings.showSeal && (
                      <div className="doc-seal-box" title="Official Office Seal">
                        {brandingSettings.sealType === "custom" && brandingSettings.sealImage ? (
                          <img
                            src={brandingSettings.sealImage}
                            alt="Office Seal"
                            className="doc-seal-img"
                          />
                        ) : (
                          <svg viewBox="0 0 100 100" className="doc-svg-seal">
                            <circle cx="50" cy="50" r="46" stroke="#059669" strokeWidth="2.5" fill="none" strokeDasharray="3 2" />
                            <circle cx="50" cy="50" r="41" stroke="#059669" strokeWidth="1.5" fill="none" />
                            <circle cx="50" cy="50" r="28" stroke="#059669" strokeWidth="1" fill="none" />
                            <path id="curve-top-rcp" d="M 16 50 A 34 34 0 0 1 84 50" fill="none" />
                            <path id="curve-bot-rcp" d="M 84 50 A 34 34 0 0 1 16 50" fill="none" />
                            <text fontSize="7" fontWeight="900" fill="#059669" letterSpacing="0.8">
                              <textPath href="#curve-top-rcp" startOffset="50%" textAnchor="middle">
                                {firm.name || "Sri Kathiravan & Co."}
                              </textPath>
                            </text>
                            <text fontSize="5.5" fontWeight="700" fill="#059669" letterSpacing="0.6">
                              <textPath href="#curve-bot-rcp" startOffset="50%" textAnchor="middle">
                                TAX & AUDIT CONSULTANTS
                              </textPath>
                            </text>
                            <text x="50" y="47" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#059669">
                              OFFICIAL
                            </text>
                            <text x="50" y="55" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#059669">
                              ★ SEAL ★
                            </text>
                            <text x="50" y="63" fontSize="5" fontWeight="700" textAnchor="middle" fill="#059669">
                              SALEM
                            </text>
                          </svg>
                        )}
                      </div>
                    )}

                    {brandingSettings.showSignature && (
                      <div className="doc-signatory">
                        {brandingSettings.signatureType === "custom" && brandingSettings.signatureImage ? (
                          <img
                            src={brandingSettings.signatureImage}
                            alt="Authorized Signature"
                            className="doc-sign-img"
                          />
                        ) : (
                          <div className="doc-digital-sign" style={{ color: "#065f46" }}>
                            {brandingSettings.signatoryName || "Kathiravan & Co."}
                          </div>
                        )}
                        <div className="doc-sign-line" />
                        <span style={{ color: "#065f46", fontWeight: "700" }}>FOR {firm.name}</span>
                        <small>{brandingSettings.signatoryName} • {brandingSettings.signatoryDesignation}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
