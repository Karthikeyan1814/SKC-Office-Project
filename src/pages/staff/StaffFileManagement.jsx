import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/FileManagementHub.css";
import FileUploadProgress from "../../components/FileUploadProgress";
import { triggerBrowserDownload, extractFileNameFromHeaders } from "../../utils/fileDownloader";
import {
  HiOutlineFolderArrowDown,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowUpTray,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineFolderPlus,
  HiOutlineFolderOpen,
  HiOutlineEye,
} from "react-icons/hi2";

const CATEGORIES = [
  { key: "ALL", label: "All Documents", icon: "/all_files.svg" },
  { key: "GST", label: "Gst Documents", icon: "/gst.svg" },
  { key: "ROC", label: "Roc Documents", icon: "/roc.svg" },
  { key: "TAX", label: "Tax Documents", icon: "/tax.svg" },
  { key: "FINANCIAL", label: "Financial Statements", icon: "/finance.svg" },
  { key: "PAYROLL", label: "Pay Rolls", icon: "/payroll.svg" },
  { key: "CERTIFICATE", label: "Certificates", icon: "/certificate.svg" },
  { key: "COMPLIANCE", label: "Compliance Notice", icon: "/complaint.svg" },
  { key: "IMPORTANT", label: "Important File", icon: "/important.svg" },
  { key: "OTHER", label: "Other Documents", icon: "/other.svg" },
];

export default function StaffFileManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialSearch = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Folders State
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("ALL");

  // Strictly filter folders to the active category only
  const displayedFolders = useMemo(() => {
    if (activeCategory === "ALL") return folders;
    return folders.filter((f) => f.category && f.category.toUpperCase() === activeCategory.toUpperCase());
  }, [folders, activeCategory]);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFolderName, setUploadFolderName] = useState("");

  // Batch Selection & Delete Confirmation Modal State
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);

  // Inline Document View Modal State for Staff (Staff can only View, not Download)
  const [viewingFile, setViewingFile] = useState(null);

  // Staff Deletion Request Modal State (Staff must submit request with reason)
  const [requestDeleteModal, setRequestDeleteModal] = useState({
    open: false,
    fileIds: [],
    fileNames: [],
    reason: "",
    submitting: false,
  });

  // Create / Rename Folder Modal on Staff Page
  const [folderModal, setFolderModal] = useState({
    open: false,
    isEdit: false,
    folderId: null,
    folderName: "",
    description: "",
    category: "GST",
    isCommon: true,
    clientId: "",
    folderColor: "#4f46e5",
    saving: false,
  });

  // Inline folder creation inside Upload Modal
  const [showInlineCreateFolder, setShowInlineCreateFolder] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState("");
  const [inlineIsCommon, setInlineIsCommon] = useState(true);
  const [inlineColor, setInlineColor] = useState("#4f46e5");
  const [inlineCreating, setInlineCreating] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [customUploadFileName, setCustomUploadFileName] = useState("");
  const [uploadCategory, setUploadCategory] = useState(
    initialCategory !== "ALL" ? initialCategory : "GST"
  );
  const [targetAudience, setTargetAudience] = useState("PERSONAL");
  const [expirationDate, setExpirationDate] = useState("");
  const [showPlatinumExpiryPopup, setShowPlatinumExpiryPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytes, setUploadBytes] = useState({ loaded: 0, total: 0 });
  const [uploadPhase, setUploadPhase] = useState("IDLE"); // 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");
  const uploadAbortRef = useRef(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }

    const searchVal = searchParams.get("search");
    if (searchVal !== null && searchVal !== undefined) {
      setSearchQuery(searchVal);
    }

    const openUpload = searchParams.get("openUpload");
    if (openUpload === "true") {
      setShowUploadModal(true);
      const preClientId = searchParams.get("clientId");
      const preClientName = searchParams.get("clientName");
      if (preClientId) {
        setSelectedClient({
          id: Number(preClientId),
          name: preClientName || "Selected Client",
          mobile: searchParams.get("clientMobile") || "",
          email: searchParams.get("clientEmail") || "",
          gstnumber: searchParams.get("clientGst") || "",
        });
      }
      const initialUploadCat = searchParams.get("uploadCat") || (cat && cat !== "ALL" ? cat : "GST");
      setUploadCategory(initialUploadCat);

      api.get("/Staff/FileManagement/Clients")
        .then((res) => setAvailableClients(res.data || []))
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSelectCategory = (catKey) => {
    setActiveCategory(catKey);
    setSelectedFolderId("ALL");
    const newParams = {};
    if (catKey !== "ALL") newParams.category = catKey;
    if (searchQuery) newParams.search = searchQuery;
    setSearchParams(newParams);
  };

  const fetchFolders = async () => {
    try {
      const res = await api.get("/Staff/Folders");
      setFolders(res.data || []);
    } catch {}
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Staff/FileManagement/AllFiles?category=${activeCategory}`);
      setFiles(res.data || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [activeCategory]);

  const availableUploadFolders = useMemo(() => {
    if (!folders || folders.length === 0) return [];
    const selId = selectedClient ? String(selectedClient.id || selectedClient) : null;
    const clientMatching = folders.filter((f) => {
      if (f.isCommon) return true;
      if (selId) {
        const fClientId = f.client?.id ?? f.clientId;
        return fClientId != null && String(fClientId) === selId;
      }
      return false;
    });

    return clientMatching.sort((a, b) => {
      if (!a.isCommon && b.isCommon) return -1;
      if (a.isCommon && !b.isCommon) return 1;
      return (a.folderName || "").localeCompare(b.folderName || "");
    });
  }, [folders, selectedClient]);

  const openUploadModal = async () => {
    setShowUploadModal(true);
    const defaultCat = activeCategory !== "ALL" ? activeCategory : "GST";
    setUploadCategory(defaultCat);
    if (defaultCat === "IMPORTANT") {
      setTargetAudience("PERSONAL");
    }
    setSelectedClient(null);
    setClientSearchQuery("");
    setUploadFile(null);
    setUploadFolderId("");
    setUploadFolderName("");
    setShowInlineCreateFolder(false);
    try {
      const res = await api.get("/Staff/FileManagement/Clients");
      setAvailableClients(res.data || []);
    } catch {
      toast.error("Failed to fetch clients list");
    }
    fetchFolders();
  };

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return availableClients;
    const q = clientSearchQuery.toLowerCase();
    return availableClients.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.gstnumber && c.gstnumber.toLowerCase().includes(q)) ||
      (c.legalname && c.legalname.toLowerCase().includes(q))
    );
  }, [availableClients, clientSearchQuery]);

  const filteredFiles = useMemo(() => {
    let result = files;
    if (selectedFolderId !== "ALL") {
      result = result.filter((f) => {
        const idMatch = f.folderId && String(f.folderId) === String(selectedFolderId);
        const nameMatch = f.folderName && String(f.folderName).toLowerCase() === String(selectedFolderId).toLowerCase();
        const activeFolderObj = folders.find((fd) => String(fd.id) === String(selectedFolderId));
        const objNameMatch = activeFolderObj && f.folderName && f.folderName.trim().toLowerCase() === activeFolderObj.folderName.trim().toLowerCase();
        return idMatch || nameMatch || objNameMatch;
      });
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((f) => {
      const matchFile = f.fileName && f.fileName.toLowerCase().includes(q);
      const matchFolder = f.folderName && f.folderName.toLowerCase().includes(q);
      const c = f.client;
      const matchClient = c && (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.gstnumber && c.gstnumber.toLowerCase().includes(q)) ||
        (c.legalname && c.legalname.toLowerCase().includes(q))
      );
      const matchInternal = !c && (
        (f.direction && f.direction.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        "personal".includes(q) ||
        "staff".includes(q)
      );
      return matchFile || matchFolder || matchClient || matchInternal;
    });
  }, [files, searchQuery, selectedFolderId]);

  // Folder Actions
  const handleOpenCreateFolder = () => {
    setFolderModal({
      open: true,
      isEdit: false,
      folderId: null,
      folderName: "",
      description: "",
      category: activeCategory !== "ALL" ? activeCategory : "GST",
      isCommon: true,
      clientId: selectedClient ? String(selectedClient.id) : "",
      folderColor: "#4f46e5",
      saving: false,
    });
  };

  const handleOpenRenameFolder = (f, e) => {
    if (e) e.stopPropagation();
    setFolderModal({
      open: true,
      isEdit: true,
      folderId: f.id,
      folderName: f.folderName || "",
      description: f.description || "",
      isCommon: f.isCommon,
      clientId: f.client?.id ? String(f.client.id) : "",
      folderColor: f.folderColor || "#4f46e5",
      saving: false,
    });
  };

  const handleSaveFolderModal = async (e) => {
    e.preventDefault();
    if (!folderModal.folderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    setFolderModal((prev) => ({ ...prev, saving: true }));
    try {
      if (folderModal.isEdit) {
        await api.put(`/Admin/Folders/${folderModal.folderId}`, {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          category: folderModal.category,
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : folderModal.clientId,
          folderColor: folderModal.folderColor,
        });
        toast.success("Folder updated successfully!");
      } else {
        await api.post("/Staff/Folders", {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          category: folderModal.category,
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : folderModal.clientId,
          folderColor: folderModal.folderColor,
        });
        toast.success("Folder created successfully!");
      }
      setFolderModal((prev) => ({ ...prev, open: false, saving: false }));
      fetchFolders();
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save folder");
      setFolderModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCreateInlineFolder = async (e) => {
    e.preventDefault();
    if (!inlineFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    setInlineCreating(true);
    try {
      const targetCat = uploadCategory && uploadCategory !== "ALL" ? uploadCategory : (activeCategory !== "ALL" ? activeCategory : "OTHER");
      const res = await api.post("/Staff/Folders", {
        folderName: inlineFolderName.trim(),
        description: "",
        category: targetCat,
        isCommon: inlineIsCommon,
        clientId: inlineIsCommon ? null : (selectedClient ? selectedClient.id : null),
        folderColor: inlineColor,
      });
      toast.success("Folder created and selected!");
      const newF = res.data?.folder;
      if (newF) {
        if (!inlineIsCommon && selectedClient && !newF.client) {
          newF.client = selectedClient;
        }
        setFolders((prev) => [newF, ...prev.filter((f) => String(f.id) !== String(newF.id))]);
        setUploadFolderId(String(newF.id));
        setUploadFolderName(newF.folderName);
      }
      await fetchFolders();
      setShowInlineCreateFolder(false);
      setInlineFolderName("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create folder");
    } finally {
      setInlineCreating(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const needsClient = uploadCategory !== "IMPORTANT" || targetAudience === "CLIENT";
    if (needsClient && !selectedClient) {
      toast.error("Please select a client from the list");
      return;
    }
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadBytes({ loaded: 0, total: uploadFile.size || 0 });
    setUploadPhase("UPLOADING");
    setUploadErrorMsg("");

    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (customUploadFileName.trim()) {
        formData.append("customFileName", customUploadFileName.trim());
      }

      if (uploadCategory === "IMPORTANT") {
        formData.append("targetAudience", targetAudience);
        if (targetAudience === "CLIENT" && selectedClient) {
          formData.append("clientId", selectedClient.id);
        }
      } else {
        formData.append("clientId", selectedClient.id);
        formData.append("targetAudience", "CLIENT");
      }

      if (uploadFolderId) {
        formData.append("folderId", uploadFolderId);
      }
      if (uploadFolderName) {
        formData.append("folderName", uploadFolderName);
      }

      if (expirationDate) {
        formData.append("expirationDate", expirationDate);
      }

      const res = await api.post("/Staff/FileManagement/Upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, // Disable timeout to support large file uploads without premature abort
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
            setUploadProgress(percent);
            setUploadBytes({ loaded: progressEvent.loaded, total: progressEvent.total });
            if (progressEvent.loaded >= progressEvent.total) {
              setUploadProgress(100);
              setUploadPhase("PROCESSING");
            }
          }
        },
      });

      if (res.data?.status === "success") {
        setUploadPhase("SUCCESS");
        setUploadProgress(100);
        const dest = uploadCategory === "IMPORTANT" && targetAudience === "PERSONAL"
          ? "Personal Storage"
          : selectedClient?.name || "Target Portal";
        toast.success(`Document uploaded successfully to ${dest}!`);
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setCustomUploadFileName("");
          setExpirationDate("");
          setSelectedClient(null);
          setUploadFolderId("");
          setUploadFolderName("");
          setUploadPhase("IDLE");
          setUploadProgress(0);
          fetchFiles();
        }, 800);
      } else {
        setUploadPhase("ERROR");
        const errMsg = res.data?.message || "Upload failed";
        setUploadErrorMsg(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        toast.info("Upload cancelled");
        setUploadPhase("IDLE");
        setUploadProgress(0);
      } else {
        console.error(err);
        setUploadPhase("ERROR");
        const msg = err.response?.data?.message || err.message || "Upload failed. Please try again.";
        setUploadErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelStaffUpload = () => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
  };

  // Staff View File Inline Modal Handler (Preview without download)
  const handleStaffViewFile = async (f) => {
    try {
      toast.loading(`Loading ${f.fileName} for preview...`, { id: "staff-view" });
      const res = await api.get(`/Staff/Files/${f.id}/View`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      toast.dismiss("staff-view");
      setViewingFile({ ...f, url: blobUrl });
    } catch {
      toast.dismiss("staff-view");
      toast.error("Failed to load document preview from AWS S3");
    }
  };

  // ─── Batch File Selection Handlers ────────────────────────────────────
  const toggleSelectFile = (fileId, e) => {
    if (e) e.stopPropagation();
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const isAllSelected = useMemo(() => {
    if (!filteredFiles || filteredFiles.length === 0) return false;
    return filteredFiles.every((f) => selectedFileIds.includes(f.id));
  }, [filteredFiles, selectedFileIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(filteredFiles.map((f) => f.id));
      setSelectedFileIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const newIds = new Set([...selectedFileIds, ...filteredFiles.map((f) => f.id)]);
      setSelectedFileIds(Array.from(newIds));
    }
  };

  // Staff Deletion Request Handlers
  const openSingleDeleteRequest = (f, e) => {
    if (e) e.stopPropagation();
    setRequestDeleteModal({
      open: true,
      fileIds: [f.id],
      fileNames: [f.fileName],
      reason: "",
      submitting: false,
    });
  };

  const openBatchDeleteRequest = () => {
    if (selectedFileIds.length === 0) return;
    const names = files.filter((f) => selectedFileIds.includes(f.id)).map((f) => f.fileName);
    setRequestDeleteModal({
      open: true,
      fileIds: selectedFileIds,
      fileNames: names,
      reason: "",
      submitting: false,
    });
  };

  const handleSubmitDeleteRequest = async (e) => {
    e.preventDefault();
    if (!requestDeleteModal.reason.trim()) {
      toast.error("Please provide a reason for requesting deletion");
      return;
    }
    setRequestDeleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      if (requestDeleteModal.fileIds.length === 1) {
        await api.post(`/Staff/FileManagement/RequestDelete/${requestDeleteModal.fileIds[0]}`, {
          reason: requestDeleteModal.reason.trim(),
        });
      } else {
        await api.post("/Staff/FileManagement/RequestDeleteBatch", {
          fileIds: requestDeleteModal.fileIds,
          reason: requestDeleteModal.reason.trim(),
        });
      }
      toast.success("Deletion request sent to Administrator with reason!");
      setRequestDeleteModal({ open: false, fileIds: [], fileNames: [], reason: "", submitting: false });
      setSelectedFileIds([]);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit deletion request");
      setRequestDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/Staff/Files/${fileId}/Download`, {
        responseType: "blob",
      });
      const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
      const contentType = res.headers["content-type"] || res.data?.type;
      triggerBrowserDownload(res.data, resolvedName, contentType);
      toast.success(`Downloading ${resolvedName}...`);
    } catch {
      toast.error("Download failed");
    }
  };

  // Rename file state & handler
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRenameModal = (file) => {
    setRenamingFile(file);
    setNewFileName(file.fileName || "");
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }
    setRenaming(true);
    try {
      await api.put(`/Staff/FileManagement/Rename/${renamingFile.id}`, {
        newFileName: newFileName.trim(),
      });
      toast.success("File renamed successfully!");
      setRenamingFile(null);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename file");
    } finally {
      setRenaming(false);
    }
  };

  // Delete file handler
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to permanently delete this file from AWS S3 and database?")) return;
    try {
      await api.delete(`/Staff/FileManagement/Delete/${fileId}`);
      toast.success("File deleted successfully");
      fetchFiles();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  // Helper: Format date with time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
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

  // Helper: Render uploader badge
  const renderUploaderBadge = (f) => {
    const name = f.userName || (f.uploadedByRole ? `${f.uploadedByRole}` : "Staff");
    const isClient = (f.uploadedByRole === "CLIENT") || name.toLowerCase().includes("client");
    const isStaff = (f.uploadedByRole === "STAFF") || name.toLowerCase().includes("staff");
    const bg = isClient ? "#e0f2fe" : isStaff ? "#f3e8ff" : "#fef3c7";
    const color = isClient ? "#0369a1" : isStaff ? "#7e22ce" : "#b45309";
    const icon = isClient ? "👤" : isStaff ? "👔" : "👑";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          background: bg,
          color: color,
        }}
        title={`Uploaded by: ${name}`}
      >
        <span>{icon}</span> {name}
      </span>
    );
  };

  return (
    <div style={{ padding: "30px 20px", fontFamily: "var(--font2, sans-serif)", color: "#1f2937" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
            <HiOutlineFolderArrowDown size={32} color="#2563eb" /> Staff File Hub
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Manage client documents, upload compliance filings, and access personal staff storage.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={fetchFiles}
            disabled={loading}
            style={{
              padding: "11px 18px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
            title="Refresh documents list"
          >
            <HiOutlineArrowPath size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Hide create folder button when All Documents is selected per requirements */}
          {activeCategory !== "ALL" && (
            <button
              onClick={handleOpenCreateFolder}
              style={{
                padding: "11px 18px",
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1.5px solid #bfdbfe",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
                transition: "all 0.2s",
              }}
              title={`Create a new folder under ${CATEGORIES.find((c) => c.key === activeCategory)?.label || "this category"}`}
            >
              <HiOutlineFolderPlus size={18} /> + New {CATEGORIES.find((c) => c.key === activeCategory)?.label || ""} Folder
            </button>
          )}

          <button
            onClick={openUploadModal}
            style={{
              padding: "11px 22px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(37, 99, 235, 0.35)",
            }}
          >
            <HiOutlineArrowUpTray size={18} /> Upload New Document
          </button>
        </div>
      </div>

      {/* Universal Sticky Search Bar with Glow Effect */}
      <div
        className={`sticky-search-wrapper ${isSearchFocused ? "is-focused" : ""} ${searchQuery ? "is-searching" : ""}`}
        style={{
          top: "74px",
          position: "sticky",
          zIndex: 40,
        }}
      >
        <HiOutlineMagnifyingGlass
          size={22}
          color={isSearchFocused ? "#2563eb" : (searchQuery ? "#3b82f6" : "#9ca3af")}
          style={{ transition: "color 0.2s ease" }}
        />
        <input
          className="sticky-search-input"
          type="text"
          placeholder="Search by file name, client name, mobile, email, or GST number..."
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: "4px" }}
            title="Clear search query"
          >
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {/* Categories Cards Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "600", color: "#374151" }}>
          Categories
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <div
                key={cat.key}
                onClick={() => handleSelectCategory(cat.key)}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 10px 30px rgba(37, 99, 235, 0.2)" : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isActive ? "2px solid #2563eb" : "1px solid #f3f4f6",
                  borderBottom: isActive ? "4px solid #2563eb" : "1px solid #f3f4f6",
                  transform: isActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <img src={cat.icon} alt={cat.label} style={{ height: "36px", width: "36px", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: isActive ? "700" : "600", color: isActive ? "#2563eb" : "#374151", textAlign: "center" }}>
                  {cat.label}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Folders Grid Section (Below Categories) */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
              <HiOutlineFolderOpen size={22} color="#2563eb" />
              Document Folders
              <span style={{ fontSize: "12px", background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                {displayedFolders.length} {displayedFolders.length === 1 ? "Folder" : "Folders"}
              </span>
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Select a folder below to filter documents under <strong>{CATEGORIES.find((c) => c.key === activeCategory)?.label || "Selected Category"}</strong>, or choose All Files.
            </p>
          </div>

          {activeCategory !== "ALL" && (
            <button
              onClick={handleOpenCreateFolder}
              style={{
                background: "#eff6ff",
                border: "1.5px solid #bfdbfe",
                color: "#1d4ed8",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <HiOutlineFolderPlus size={16} /> + New Folder for {CATEGORIES.find((c) => c.key === activeCategory)?.label || ""}
            </button>
          )}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}>
          {/* "All Files / All Folders" Card */}
          {(() => {
            const isAllActive = selectedFolderId === "ALL";
            return (
              <div
                onClick={() => setSelectedFolderId("ALL")}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: isAllActive
                    ? "0 10px 30px rgba(37, 99, 235, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isAllActive ? "2px solid #2563eb" : "1px solid #f3f4f6",
                  borderBottom: isAllActive ? "4px solid #2563eb" : "1px solid #f3f4f6",
                  transform: isAllActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                  position: "relative",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isAllActive ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f3f4f6",
                  color: isAllActive ? "#1d4ed8" : "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}>
                  <HiOutlineFolderOpen size={28} />
                </div>

                <h4 style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: isAllActive ? "700" : "600",
                  color: isAllActive ? "#1d4ed8" : "#374151",
                  textAlign: "center"
                }}>
                  All Files ({files.length})
                </h4>

                <span style={{
                  fontSize: "11px",
                  color: isAllActive ? "#1e40af" : "#6b7280",
                  background: isAllActive ? "#eff6ff" : "#f3f4f6",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontWeight: "600"
                }}>
                  All Folders Combined
                </span>
              </div>
            );
          })()}

          {/* Individual Folder Cards */}
          {displayedFolders.map((folder) => {
            const isSelected = String(selectedFolderId) === String(folder.id);
            const folderColor = folder.folderColor || "#2563eb";
            const folderFileCount = files.filter(
              (f) =>
                (f.folderId && String(f.folderId) === String(folder.id)) ||
                (f.folderName && folder.folderName && f.folderName.trim().toLowerCase() === folder.folderName.trim().toLowerCase())
            ).length;

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 10px 30px rgba(37, 99, 235, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isSelected ? `2px solid ${folderColor}` : "1px solid #f3f4f6",
                  borderBottom: isSelected ? `4px solid ${folderColor}` : "1px solid #f3f4f6",
                  transform: isSelected ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                  position: "relative",
                }}
              >
                {/* Rename Button in top right */}
                <button
                  type="button"
                  onClick={(e) => handleOpenRenameFolder(folder, e)}
                  title="Rename folder"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(243, 244, 246, 0.85)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#2563eb";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.background = "rgba(243, 244, 246, 0.85)";
                  }}
                >
                  <HiOutlinePencilSquare size={14} />
                </button>

                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isSelected ? `${folderColor}20` : "#f8fafc",
                  color: folderColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${isSelected ? folderColor : "#e2e8f0"}`,
                  transition: "all 0.2s ease"
                }}>
                  <HiOutlineFolderOpen size={28} />
                </div>

                <h4 style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: isSelected ? "700" : "600",
                  color: isSelected ? folderColor : "#1e293b",
                  textAlign: "center",
                  wordBreak: "break-word",
                  lineHeight: 1.3
                }}>
                  {folder.folderName}
                </h4>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{
                    fontSize: "11px",
                    background: isSelected ? `${folderColor}18` : "#f1f5f9",
                    color: isSelected ? folderColor : "#64748b",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontWeight: "700"
                  }}>
                    {folderFileCount} {folderFileCount === 1 ? "file" : "files"}
                  </span>

                  <span style={{
                    fontSize: "10px",
                    background: folder.isCommon ? "#ecfdf5" : "#fdf2f8",
                    color: folder.isCommon ? "#047857" : "#be185d",
                    border: folder.isCommon ? "1px solid #a7f3d0" : "1px solid #fbcfe8",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    fontWeight: "600"
                  }}>
                    {folder.isCommon ? "🌐 Common" : `🔒 ${folder.client?.name || "Client"}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files List */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{CATEGORIES.find((c) => c.key === activeCategory)?.label || "Documents"}</span>
              <span style={{ color: "#9ca3af", fontWeight: "400" }}>/</span>
              <span style={{ color: "#2563eb" }}>
                {selectedFolderId === "ALL" ? "All Folders" : (folders.find(f => String(f.id) === String(selectedFolderId))?.folderName || "Folder Files")}
              </span>
            </h3>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing {filteredFiles.length} {filteredFiles.length === 1 ? "document" : "documents"}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </span>
          </div>

          {filteredFiles.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                padding: "7px 14px",
                borderRadius: "8px",
                background: isAllSelected ? "#fee2e2" : "#f3f4f6",
                border: isAllSelected ? "1.5px solid #f87171" : "1px solid #d1d5db",
                fontSize: "13px",
                fontWeight: "600",
                color: isAllSelected ? "#991b1b" : "#374151",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#dc2626" }}
                />
                <span>Select All ({filteredFiles.length})</span>
              </label>

              {selectedFileIds.length > 0 && (
                <>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#dc2626",
                    background: "#fee2e2",
                    padding: "5px 12px",
                    borderRadius: "999px",
                  }}>
                    {selectedFileIds.length} Selected
                  </span>

                  <button
                    type="button"
                    onClick={openBatchDeleteRequest}
                    style={{
                      padding: "8px 18px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <HiOutlineTrash size={16} /> Request Deletion for Selected ({selectedFileIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFileIds([])}
                    style={{
                      padding: "8px 12px",
                      background: "#fff",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>Loading files...</p>
        ) : filteredFiles.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No files found in this category.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredFiles.map((f) => {
              const isSelected = selectedFileIds.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleSelectFile(f.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    background: isSelected ? "#fff5f5" : "#f9fafb",
                    borderRadius: "12px",
                    border: isSelected ? "1.5px solid #fca5a5" : "1px solid #e5e7eb",
                    flexWrap: "wrap",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.18s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectFile(f.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                        accentColor: "#dc2626",
                        flexShrink: 0,
                      }}
                      title="Select file for deletion"
                    />
                    <HiOutlineDocumentText size={28} color="#2563eb" />
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600" }}>{f.fileName}</h4>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      {f.client ? (
                        <span>Client: <strong>{f.client.name}</strong> ({f.client.mobile})</span>
                      ) : f.direction === "SHARED_WITH_STAFF" ? (
                        <span style={{ color: "#7c3aed", fontWeight: "600" }}>👥 Shared from Admin</span>
                      ) : (
                        <span style={{ color: "#0d9488", fontWeight: "600" }}>🔒 Personal Storage</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created on & Uploader Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563" }}>
                    <span style={{ color: "#6b7280" }}>Uploaded by:</span>
                    {renderUploaderBadge(f)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                    <HiOutlineCalendarDays size={14} color="#9ca3af" />
                    <span>Created: <strong style={{ color: "#374151" }}>{formatDateTime(f.createdAt)}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{
                    padding: "4px 10px",
                    background: f.folderName ? "#fef3c7" : "#f1f5f9",
                    color: f.folderName ? "#92400e" : "#475569",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    border: f.folderName ? "1px solid #fde68a" : "1px solid #e2e8f0"
                  }}>
                    <HiOutlineFolderOpen size={14} color={f.folderName ? "#d97706" : "#64748b"} />
                    Folder: {f.folderName || "General / Root"}
                  </span>
                  <span style={{ padding: "4px 10px", background: "#e0e7ff", color: "#3730a3", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{f.category}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(f.id, f.fileName);
                    }}
                    style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}
                  >
                    <HiOutlineArrowDownTray size={15} /> Download
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(f);
                    }}
                    title="Rename Document"
                    style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}
                  >
                    <HiOutlinePencilSquare size={15} color="#475569" /> Rename
                  </button>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><HiOutlineXMark size={22} /></button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              {/* Category & Expiry */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setUploadCategory(newCat);
                      if (newCat === "IMPORTANT") setTargetAudience("PERSONAL");
                    }}
                    style={{ width: "100%", padding: "9px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none" }}
                  >
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Expiry Date (Optional)</label>
                  <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none" }} />
                </div>
              </div>

              {/* Target / Client Selector */}
              {uploadCategory === "IMPORTANT" ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "#166534", display: "block", marginBottom: "8px" }}>
                    Important File Storage Scope
                  </label>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
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
                    }}>
                      <input type="radio" name="staffTarget" value="PERSONAL" checked={targetAudience === "PERSONAL"} onChange={() => setTargetAudience("PERSONAL")} />
                      🔒 Personal (Self Only)
                    </label>
                    <label style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: targetAudience === "CLIENT" ? "#e0e7ff" : "#fff",
                      border: targetAudience === "CLIENT" ? "2px solid #4f46e5" : "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: targetAudience === "CLIENT" ? "700" : "500",
                    }}>
                      <input type="radio" name="staffTarget" value="CLIENT" checked={targetAudience === "CLIENT"} onChange={() => setTargetAudience("CLIENT")} />
                      👤 Share with Client
                    </label>
                  </div>

                  {targetAudience === "PERSONAL" && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#15803d" }}>
                      This file is saved to your personal staff repository. No client details required.
                    </p>
                  )}
                </div>
              ) : null}

              {(uploadCategory !== "IMPORTANT" || targetAudience === "CLIENT") && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Target Client</label>
                    {selectedClient && (
                      <button type="button" onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", cursor: "pointer" }}>
                        Change
                      </button>
                    )}
                  </div>

                  {selectedClient ? (
                    <div style={{ padding: "10px 12px", background: "#e0e7ff", borderRadius: "8px", border: "1px solid #6366f1", fontSize: "13px" }}>
                      <strong>{selectedClient.name}</strong> ({selectedClient.mobile}) • {selectedClient.email}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Type client name, mobile, email..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "8px", outline: "none" }}
                      />
                      <div style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px" }}>
                        {filteredClients.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              if (c.membershipPlan && c.membershipPlan.toUpperCase() === "PLATINUM") {
                                setExpirationDate("");
                                setShowPlatinumExpiryPopup(true);
                              }
                            }}
                            style={{
                              padding: "8px 10px",
                              cursor: "pointer",
                              borderRadius: "6px",
                              background: selectedClient?.id === c.id ? "#e0e7ff" : "transparent",
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "13px",
                            }}
                          >
                            <span><strong>{c.name}</strong> ({c.mobile})</span>
                            {selectedClient?.id === c.id && <HiOutlineCheck color="#4338ca" />}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Select Folder or Create New Folder */}
              <div style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <HiOutlineFolderOpen size={16} color="#4f46e5" />
                    Target Folder (Optional / Recommended)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showInlineCreateFolder;
                      setShowInlineCreateFolder(next);
                      if (next && selectedClient) {
                        setInlineIsCommon(false);
                      }
                    }}
                    style={{
                      background: showInlineCreateFolder ? "#fee2e2" : "#eef2ff",
                      color: showInlineCreateFolder ? "#991b1b" : "#4338ca",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <HiOutlineFolderPlus size={14} />
                    {showInlineCreateFolder ? "Cancel New Folder" : "+ Create New Folder"}
                  </button>
                </div>

                {!showInlineCreateFolder ? (
                  <div>
                    <select
                      value={uploadFolderId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUploadFolderId(val);
                        const match = availableUploadFolders.find((f) => String(f.id) === String(val));
                        setUploadFolderName(match ? match.folderName : "");
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none",
                        background: "#fff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">-- No Specific Folder (Root Level) --</option>
                      {availableUploadFolders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.folderName} {f.isCommon ? "(Common to All Clients)" : `(Client: ${f.client?.name || selectedClient?.name || "Allocated"})`}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Choose an existing folder or click "+ Create New Folder" to create one on the fly.
                    </span>
                  </div>
                ) : (
                  <div style={{
                    background: "#ffffff",
                    border: "1px dashed #6366f1",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                        New Folder Name *
                      </label>
                      <input
                        type="text"
                        value={inlineFolderName}
                        onChange={(e) => setInlineFolderName(e.target.value)}
                        placeholder="e.g. FY 2025-26 Tax Invoices"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="staffInlineCommon"
                          checked={inlineIsCommon}
                          onChange={() => setInlineIsCommon(true)}
                        />
                        <span>🌐 Common Folder (Visible to All)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="staffInlineCommon"
                          checked={!inlineIsCommon}
                          onChange={() => setInlineIsCommon(false)}
                        />
                        <span>🔒 Allocate to {selectedClient ? selectedClient.name : "This Client"}</span>
                      </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setShowInlineCreateFolder(false)}
                        style={{
                          padding: "5px 10px",
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "600",
                          color: "#475569"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={inlineCreating}
                        onClick={handleCreateInlineFolder}
                        style={{
                          padding: "5px 14px",
                          background: "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: inlineCreating ? "not-allowed" : "pointer",
                          fontWeight: "700"
                        }}
                      >
                        {inlineCreating ? "Creating..." : "Create & Select"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Choose File (AWS S3)</label>
                <input
                  type="file"
                  required={!uploadFile}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setUploadFile(f || null);
                    if (f) setCustomUploadFileName(f.name);
                  }}
                  style={{ width: "100%", padding: "8px", border: "1px dashed #d1d5db", borderRadius: "8px" }}
                />
              </div>

              {uploadFile && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                      Selected File Properties
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setCustomUploadFileName("");
                      }}
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Discard file"
                    >
                      <HiOutlineTrash size={12} /> Discard
                    </button>
                  </div>

                  <div style={{ marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Rename Before Upload (Optional):
                    </label>
                    <input
                      type="text"
                      value={customUploadFileName}
                      onChange={(e) => setCustomUploadFileName(e.target.value)}
                      placeholder="Custom file name..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #94a3b8",
                        borderRadius: "6px",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Original: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              {/* Expiration Date Input with Platinum Protection */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Expiration Date (Optional)</label>
                  {selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM" && (
                    <span style={{
                      background: "#f3e8ff",
                      color: "#6b21a8",
                      border: "1px solid #d8b4fe",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}>
                      ✨ Platinum: Expiration-Free
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM") {
                      setShowPlatinumExpiryPopup(true);
                    }
                    setExpirationDate(val);
                  }}
                  onClick={() => {
                    if (selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM") {
                      setShowPlatinumExpiryPopup(true);
                    }
                  }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                />
              </div>

              {/* Real-time File Upload Tracking Progress Bar with Animations */}
              <FileUploadProgress
                progress={uploadProgress}
                loadedBytes={uploadBytes.loaded}
                totalBytes={uploadBytes.total}
                phase={uploadPhase}
                fileName={customUploadFileName || uploadFile?.name}
                destination={
                  uploadCategory === "IMPORTANT"
                    ? targetAudience === "STAFF"
                      ? "Staff Workspace"
                      : "Personal Storage"
                    : selectedClient?.name || "Client Portal"
                }
                errorMessage={uploadErrorMsg}
                onCancel={handleCancelStaffUpload}
                onRetry={handleUploadSubmit}
                theme="light"
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    if (uploading) return;
                    setShowUploadModal(false);
                    setUploadPhase("IDLE");
                    setUploadProgress(0);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#f3f4f6",
                    color: uploading ? "#9ca3af" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: "8px 20px",
                    background: uploading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: uploading ? "none" : "0 3px 12px rgba(37, 99, 235, 0.35)",
                  }}
                >
                  <HiOutlineArrowUpTray size={16} />
                  {uploadPhase === "PROCESSING"
                    ? "Securing in AWS S3..."
                    : uploading
                    ? `Uploading (${uploadProgress}%)`
                    : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renamingFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "460px",
            padding: "28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <HiOutlinePencilSquare size={22} color="#2563eb" /> Rename Document
              </h3>
              <button onClick={() => setRenamingFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Enter the new display name for this document. Original file extension will be preserved if omitted.
            </p>

            <form onSubmit={handleRenameSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  New Document Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Audited_Filing_2026.pdf"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  style={{
                    padding: "10px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "10px",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: renaming ? "not-allowed" : "pointer",
                  }}
                >
                  {renaming ? "Renaming..." : "Save New Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Platinum Expiration Free Popup */}
      {showPlatinumExpiryPopup && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            maxWidth: "460px",
            width: "100%",
            padding: "32px 28px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            textAlign: "center",
            border: "1.5px solid #e9d5ff",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#f3e8ff",
              color: "#7e22ce",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: "28px"
            }}>
              🏆
            </div>

            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "#faf5ff",
              border: "1px solid #d8b4fe",
              color: "#6b21a8",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "10px",
            }}>
              PLATINUM CARD PRIVILEGE
            </div>

            <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: "800", color: "#1e1b4b" }}>
              Expiration-Free File Storage
            </h3>

            <p style={{ margin: "0 0 18px 0", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              <strong>{selectedClient?.name || "This client"}</strong> holds an active <strong>Platinum Card</strong>.
              All files for Platinum members have <strong>permanent lifetime storage</strong> with zero expiration limits.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setExpirationDate("");
                  setShowPlatinumExpiryPopup(false);
                  toast.success("Lifetime expiration-free storage preserved for Platinum member!");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #9333ea, #7e22ce)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                ✓ Keep Expiration-Free (Recommended)
              </button>

              <button
                type="button"
                onClick={() => setShowPlatinumExpiryPopup(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Set Custom Expiry Anyway (Override)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / RENAME FOLDER MODAL ──────────────────────── */}
      {folderModal.open && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "500px",
            padding: "28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <HiOutlineFolderPlus size={22} color="#4f46e5" />
                {folderModal.isEdit ? "Rename / Edit Folder" : "Create New Document Folder"}
              </h3>
              <button
                onClick={() => setFolderModal((prev) => ({ ...prev, open: false }))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveFolderModal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 1. Category Indicator (Strictly bound to chosen category) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  Selected Category
                </label>
                <div style={{
                  padding: "10px 14px",
                  background: "#f5f3ff",
                  border: "1.5px solid #ddd6fe",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>📁</span>
                    <strong style={{ fontSize: "14px", color: "#6d28d9" }}>
                      {CATEGORIES.find((c) => c.key === (folderModal.category || activeCategory))?.label || (folderModal.category || activeCategory)}
                    </strong>
                  </div>
                  <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", background: "#ede9fe", padding: "2px 8px", borderRadius: "999px" }}>
                    Strict Category Isolation
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  This folder will strictly reside inside this category only. It will not leak into other categories.
                </span>
              </div>

              {/* 2. Folder Name */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  value={folderModal.folderName}
                  onChange={(e) => setFolderModal((prev) => ({ ...prev, folderName: e.target.value }))}
                  placeholder="e.g. Tax Returns 2026"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              {/* 3. Description (Displayed under Folder Name) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  Description (Displayed under folder name)
                </label>
                <input
                  type="text"
                  value={folderModal.description}
                  onChange={(e) => setFolderModal((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short note about folder contents..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  This description will appear directly beneath the folder name on its card.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setFolderModal((prev) => ({ ...prev, open: false }))}
                  style={{
                    padding: "10px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "10px",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderModal.saving}
                  style={{
                    padding: "10px 20px",
                    background: "#4f46e5",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: folderModal.saving ? "not-allowed" : "pointer",
                  }}
                >
                  {folderModal.saving ? "Saving..." : folderModal.isEdit ? "Update Folder Name" : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── Delete Confirmation Modal with Detailed File Information ─── */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            maxWidth: "640px",
            width: "100%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
            border: "1px solid #fee2e2",
            overflow: "hidden",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #fee2e2",
              background: "linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
                }}>
                  <HiOutlineTrash size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#991b1b" }}>
                    Confirm Permanent Deletion
                  </h3>
                  <span style={{ fontSize: "13px", color: "#b91c1c" }}>
                    {selectedFileIds.length} {selectedFileIds.length === 1 ? "document" : "documents"} selected for removal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  padding: "6px",
                  borderRadius: "8px",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            {/* Modal Body: File Information Details */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}>
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <p style={{ margin: 0, fontSize: "13px", color: "#991b1b", lineHeight: 1.5 }}>
                  This action will permanently purge the selected document(s) from <strong>AWS S3 storage</strong> and erase their database records. This cannot be undone.
                </p>
              </div>

              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>
                  Selected Document Details ({selectedFilesList.length}):
                </h4>

                <div style={{
                  background: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}>
                  {selectedFilesList.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        background: "#fff",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <strong style={{ fontSize: "14px", color: "#111827", wordBreak: "break-all" }}>
                          📄 {file.fileName}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#9ca3af", flexShrink: 0 }}>
                          ID: #{file.id}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                        <span style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          border: "1px solid #fde68a",
                        }}>
                          📁 {file.folderName || "General / Root"}
                        </span>

                        <span style={{
                          background: "#e0e7ff",
                          color: "#3730a3",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "600",
                        }}>
                          {file.category}
                        </span>

                        {file.client ? (
                          <span style={{ color: "#374151", fontWeight: "500" }}>
                            👤 Client: <strong>{file.client.name}</strong>
                          </span>
                        ) : (
                          <span style={{ color: "#6b7280" }}>
                            🔒 Personal / Staff
                          </span>
                        )}

                        <span style={{ color: "#9ca3af", marginLeft: "auto", fontSize: "11px" }}>
                          Created: {formatDateTime(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}>
              <button
                type="button"
                disabled={deletingBatch}
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "10px 18px",
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: deletingBatch ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingBatch}
                onClick={handleConfirmBatchDelete}
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: deletingBatch ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                  transition: "opacity 0.2s ease",
                }}
              >
                <HiOutlineTrash size={18} />
                {deletingBatch ? "Deleting Document(s)..." : `Confirm Delete (${selectedFileIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── STAFF SECURE INLINE DOCUMENT VIEWER (PREVIEW ONLY) ─── */}
      {viewingFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            maxWidth: "900px",
            width: "100%",
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#1e293b",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{viewingFile.fileName}</h4>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Protected Document Viewer (Download Restricted for Staff)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer" }}
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>

            <div style={{ flex: 1, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {viewingFile.url && (
                <iframe
                  src={viewingFile.url}
                  title={viewingFile.fileName}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STAFF REQUEST DELETION MODAL WITH REASON ─── */}
      {requestDeleteModal.open && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            maxWidth: "560px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            overflow: "hidden",
            border: "1px solid #fee2e2"
          }}>
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #fff5f5, #fef2f2)",
              borderBottom: "1px solid #fee2e2",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiOutlineTrash size={20} color="#dc2626" /> Request Document Deletion
                </h3>
                <span style={{ fontSize: "12px", color: "#b91c1c" }}>
                  Submit request to Administrator with justification
                </span>
              </div>
              <button
                onClick={() => setRequestDeleteModal({ open: false, fileIds: [], fileNames: [], reason: "", submitting: false })}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeleteRequest} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#991b1b"
              }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Selected Document(s):</strong>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {requestDeleteModal.fileNames.map((name, i) => (
                    <li key={i} style={{ wordBreak: "break-all" }}>{name}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                  Reason for Deletion Request *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why this document needs to be permanently deleted by Admin (e.g. uploaded in error, obsolete draft, client updated GST filing)..."
                  value={requestDeleteModal.reason}
                  onChange={(e) => setRequestDeleteModal((prev) => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Your name, role, and this explanation will be presented to the Administrator for approval.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setRequestDeleteModal({ open: false, fileIds: [], fileNames: [], reason: "", submitting: false })}
                  style={{
                    padding: "9px 16px",
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestDeleteModal.submitting}
                  style={{
                    padding: "9px 20px",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: requestDeleteModal.submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 10px rgba(220,38,38,0.3)"
                  }}
                >
                  {requestDeleteModal.submitting ? "Submitting Request..." : "Send Request to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
