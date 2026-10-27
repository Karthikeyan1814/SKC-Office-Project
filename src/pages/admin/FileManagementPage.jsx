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
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineFolderPlus,
  HiOutlineFolderOpen,
  HiOutlineEye,
} from "react-icons/hi2";
import { FaWhatsapp, FaEnvelope, FaShareAlt } from "react-icons/fa";
import { shareViaWhatsApp } from "../../utils/whatsappShareHelper";

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

export default function FileManagementPage() {
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

  // Staff Deletion Requests Review State
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [showDeleteRequestsModal, setShowDeleteRequestsModal] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Inline Document View Modal State
  const [viewingFile, setViewingFile] = useState(null);

  // Document Sharing State (WhatsApp & Automated Email)
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingFile, setSharingFile] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSubject, setShareSubject] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Create / Rename Folder Modal on Hub Page
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

  // Sync category & search & openUpload with URL
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

      api.get("/Admin/FileManagement/Clients")
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

  // Fetch pending staff deletion requests
  const fetchDeleteRequests = async () => {
    try {
      const res = await api.get("/Admin/FileManagement/DeleteRequests");
      setDeleteRequests(res.data || []);
    } catch {}
  };

  const handleApproveDeleteRequest = async (fileId) => {
    if (!window.confirm("Approve staff deletion request and permanently delete this file from AWS S3?")) return;
    setProcessingRequestId(fileId);
    try {
      await api.post(`/Admin/FileManagement/ApproveDelete/${fileId}`);
      toast.success("Document permanently purged from storage!");
      fetchDeleteRequests();
      fetchFiles();
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve deletion");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectDeleteRequest = async (fileId) => {
    const note = window.prompt("Enter rejection note / explanation for the staff member:", "Deletion request reviewed and declined by Administrator.");
    if (note === null) return;
    setProcessingRequestId(fileId);
    try {
      await api.post(`/Admin/FileManagement/RejectDelete/${fileId}`, { note });
      toast.success("Deletion request declined and staff notified.");
      fetchDeleteRequests();
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline deletion request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Inline Document Viewer
  const handleViewFile = async (f) => {
    try {
      toast.loading(`Loading ${f.fileName} for preview...`, { id: "view-load" });
      const res = await api.get(`/Admin/Files/${f.id}/View`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      toast.dismiss("view-load");
      setViewingFile({ ...f, url: blobUrl });
    } catch (err) {
      toast.dismiss("view-load");
      toast.error("Failed to load document preview from AWS S3");
    }
  };

  // Sharing Modal & Handlers
  const openShareModal = (f) => {
    setSharingFile(f);
    setShareEmail(f.client?.email || "");
    setShareSubject(`Sri Kathiravan & Co. Document: ${f.fileName}`);
    setShareMessage(`Dear ${f.client?.name || "Client"},\n\nPlease find attached the document "${f.fileName}" from Sri Kathiravan & Co.\n\nBest Regards,\nSri Kathiravan & Co. Team`);
    setShowShareModal(true);
  };

  const handleWhatsAppShare = async (f) => {
    if (!f) return;
    try {
      const clientInfo = f.client ? `${f.client.name}` : "Personal / Internal";
      const phoneClean = (f.client?.mobile || "").replace(/\D/g, "");
      const directDocUrl = `${window.location.protocol}//${window.location.hostname}:8080/skc/Public/Files/${f.id}/View`;
      const text = `*Sri Kathiravan & Co. - Document Share*\n\n` +
        `Hello ${f.client?.name || "Client"},\n` +
        `Here is your official document from Sri Kathiravan & Co.:\n` +
        `📄 *File:* ${f.fileName}\n` +
        `📁 *Category:* ${f.category || "General"}\n` +
        `👤 *Client:* ${clientInfo}\n\n` +
        `🔗 *View / Download Document:* ${directDocUrl}\n` +
        `🌐 *Client Portal:* ${window.location.origin}`;

      await shareViaWhatsApp({
        fileName: f.fileName,
        fileMimeType: f.fileType || "application/octet-stream",
        phone: phoneClean,
        title: `Document: ${f.fileName}`,
        message: text,
        directUrl: directDocUrl,
      });
    } catch (e) {
      toast.error("Error launching WhatsApp share");
    }
  };

  const handleSendAutomatedEmail = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) {
      toast.error("Receiver email address is required");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await api.post("/Admin/FileManagement/ShareEmail", {
        fileId: sharingFile.id,
        receiverEmail: shareEmail.trim(),
        subject: shareSubject.trim(),
        message: shareMessage.trim(),
      });
      if (res.data?.status === "success") {
        toast.success(res.data?.message || "Document dispatched to " + shareEmail);
        setShowShareModal(false);
      } else {
        toast.error(res.data?.message || "Failed to send email");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch automated email");
    } finally {
      setSendingEmail(false);
    }
  };

  // Fetch all folders
  // Fetch all folders across categories so full folder catalog is available
  const fetchFolders = async () => {
    try {
      const res = await api.get("/Admin/Folders");
      setFolders(res.data || []);
    } catch {}
  };

  // Fetch all files
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Admin/FileManagement/AllFiles?category=${activeCategory}`);
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
    fetchDeleteRequests();
  }, [activeCategory]);

  // Available Folders for Upload (Common + allocated to selectedClient, sorted client-specific first)
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

    // Client-specific folders first, then common folders
    return clientMatching.sort((a, b) => {
      if (!a.isCommon && b.isCommon) return -1;
      if (a.isCommon && !b.isCommon) return 1;
      return (a.folderName || "").localeCompare(b.folderName || "");
    });
  }, [folders, selectedClient]);

  // Fetch all clients when upload modal opens
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
      const res = await api.get("/Admin/FileManagement/Clients");
      setAvailableClients(res.data || []);
    } catch {
      toast.error("Failed to fetch clients list");
    }
    fetchFolders();
  };

  // Filter available clients in modal
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

  // Filter files live by search query & folder selection
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

  // Handle direct AWS S3 Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadCategory !== "IMPORTANT" && !selectedClient) {
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

      const res = await api.post("/Admin/FileManagement/Upload", formData, {
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
        const dest = uploadCategory === "IMPORTANT"
          ? (targetAudience === "STAFF" ? "Staff Workspace" : "Personal Storage")
          : selectedClient?.name || "Client Portal";
        toast.success(`File successfully uploaded to ${dest}!`);
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
          fetchFolders();
        }, 800);
      } else {
        setUploadPhase("ERROR");
        const errMsg = res.data?.message || "File upload failed.";
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
        const msg = err.response?.data?.message || err.message || "File upload failed. Please try again.";
        setUploadErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelAdminUpload = () => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
  };

  // Download file
  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/Admin/Files/${fileId}/Download`, {
        responseType: "blob",
      });
      const resolvedName = extractFileNameFromHeaders(res.headers, fileName);
      const contentType = res.headers["content-type"] || res.data?.type;
      triggerBrowserDownload(res.data, resolvedName, contentType);
      toast.success(`Downloading ${resolvedName}...`);
    } catch {
      toast.error("Failed to download file from S3");
    }
  };

  // ─── Batch File Selection & Modal Handlers ──────────────────────────
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

  const selectedFilesList = useMemo(() => {
    return files.filter((f) => selectedFileIds.includes(f.id));
  }, [files, selectedFileIds]);

  const handleConfirmBatchDelete = async () => {
    if (selectedFileIds.length === 0) return;
    setDeletingBatch(true);
    try {
      let success = false;
      try {
        const res = await api.post("/Admin/FileManagement/DeleteBatch", {
          fileIds: selectedFileIds,
        });
        if (res.data?.status === "success") {
          success = true;
        }
      } catch {
        // Fallback to parallel deletes
        await Promise.all(
          selectedFileIds.map((id) => api.delete(`/Admin/FileManagement/Delete/${id}`))
        );
        success = true;
      }

      if (success) {
        toast.success(`Successfully deleted ${selectedFileIds.length} document(s)!`);
        setShowDeleteModal(false);
        setSelectedFileIds([]);
        fetchFiles();
        fetchFolders();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected document(s)");
    } finally {
      setDeletingBatch(false);
    }
  };

  // Rename file
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
      await api.put(`/Admin/FileManagement/Rename/${renamingFile.id}`, {
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

  // ─── Folder Management Handlers for Hub Page ──────────────────────────
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
      const targetCat = folderModal.category || (activeCategory !== "ALL" ? activeCategory : "OTHER");
      if (folderModal.isEdit) {
        await api.put(`/Admin/Folders/${folderModal.folderId}`, {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          category: targetCat,
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : (folderModal.clientId || null),
          folderColor: folderModal.folderColor,
        });
        toast.success("Folder updated successfully!");
      } else {
        await api.post("/Admin/Folders", {
          folderName: folderModal.folderName.trim(),
          description: folderModal.description.trim(),
          category: targetCat,
          isCommon: folderModal.isCommon,
          clientId: folderModal.isCommon ? null : (folderModal.clientId || null),
          folderColor: folderModal.folderColor,
        });
        toast.success(`Folder created under ${CATEGORIES.find((c) => c.key === targetCat)?.label || targetCat}!`);
      }
      setFolderModal((prev) => ({ ...prev, open: false, saving: false }));
      fetchFolders();
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save folder");
      setFolderModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Inline folder creation inside Upload Modal
  const handleCreateInlineFolder = async (e) => {
    e.preventDefault();
    if (!inlineFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    setInlineCreating(true);
    try {
      const targetCat = uploadCategory && uploadCategory !== "ALL" ? uploadCategory : (activeCategory !== "ALL" ? activeCategory : "OTHER");
      const res = await api.post("/Admin/Folders", {
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
    const name = f.userName || (f.uploadedByRole ? `${f.uploadedByRole}` : "Admin");
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
      {/* Header & Upload Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
            <HiOutlineFolderArrowDown size={32} color="#d97706" /> Document Distribution Hub
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Select a category to view files, search by client details, or distribute new documents to client portals.
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

          {/* Review Staff Deletion Requests Button */}
          <button
            onClick={() => setShowDeleteRequestsModal(true)}
            style={{
              padding: "11px 18px",
              background: deleteRequests.length > 0 ? "#fef2f2" : "#fff",
              color: deleteRequests.length > 0 ? "#b91c1c" : "#374151",
              border: deleteRequests.length > 0 ? "1.5px solid #fca5a5" : "1px solid #d1d5db",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: deleteRequests.length > 0 ? "0 2px 10px rgba(239,68,68,0.2)" : "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
            title="Review Staff Document Deletion Requests"
          >
            <HiOutlineTrash size={18} color={deleteRequests.length > 0 ? "#dc2626" : "#6b7280"} />
            Deletion Requests
            {deleteRequests.length > 0 && (
              <span style={{
                background: "#dc2626",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "999px"
              }}>
                {deleteRequests.length}
              </span>
            )}
          </button>

          {/* Create folder button - hidden when 'All Documents' is selected per requirements */}
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
              background: "linear-gradient(135deg, #d97706, #b45309)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(217, 119, 6, 0.35)",
              transition: "0.2s transform",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
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
          color={isSearchFocused ? "#6366f1" : (searchQuery ? "#8b5cf6" : "#9ca3af")}
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
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
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
                  boxShadow: isActive
                    ? "0 10px 30px rgba(142, 45, 226, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isActive ? "2px solid #8b5cf6" : "1px solid #f3f4f6",
                  borderBottom: isActive ? "4px solid #8b5cf6" : "1px solid #f3f4f6",
                  transform: isActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <img
                  src={cat.icon}
                  alt={cat.label}
                  style={{ height: "36px", width: "36px", objectFit: "contain" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <h4 style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "600",
                  color: isActive ? "#7c3aed" : "#374151",
                  textAlign: "center"
                }}>
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
              <HiOutlineFolderOpen size={22} color="#8b5cf6" />
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
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
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
                    ? "0 10px 30px rgba(142, 45, 226, 0.2)"
                    : "0 4px 15px rgba(0,0,0,0.05)",
                  border: isAllActive ? "2px solid #8b5cf6" : "1px solid #f3f4f6",
                  borderBottom: isAllActive ? "4px solid #8b5cf6" : "1px solid #f3f4f6",
                  transform: isAllActive ? "translateY(-3px)" : "none",
                  transition: "all 0.25s ease",
                  position: "relative",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isAllActive ? "linear-gradient(135deg, #ede9fe, #ddd6fe)" : "#f3f4f6",
                  color: isAllActive ? "#7c3aed" : "#4b5563",
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
                  color: isAllActive ? "#7c3aed" : "#374151",
                  textAlign: "center"
                }}>
                  All Files ({files.length})
                </h4>

                <span style={{
                  fontSize: "11px",
                  color: isAllActive ? "#6d28d9" : "#6b7280",
                  background: isAllActive ? "#f5f3ff" : "#f3f4f6",
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
            const folderColor = folder.folderColor || "#8b5cf6";
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
                    ? "0 10px 30px rgba(142, 45, 226, 0.2)"
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
                    e.currentTarget.style.color = "#4f46e5";
                    e.currentTarget.style.background = "#eef2ff";
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

      {/* Files List Section */}
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{CATEGORIES.find((c) => c.key === activeCategory)?.label || "Documents"}</span>
              <span style={{ color: "#9ca3af", fontWeight: "400" }}>/</span>
              <span style={{ color: "#8b5cf6" }}>
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
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      padding: "8px 18px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <HiOutlineTrash size={16} /> Delete Selected ({selectedFileIds.length})
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
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
            Loading files...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <HiOutlineDocumentText size={48} color="#d1d5db" style={{ marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#374151", fontSize: "16px" }}>No documents found</h4>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {searchQuery ? "Try refining your search terms or category filter." : "Click 'Upload New Document' to add files to this category."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredFiles.map((f) => {
              const isExpired = f.expirationDate && new Date(f.expirationDate) < new Date();
              const isSelected = selectedFileIds.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleSelectFile(f.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: isSelected ? "#fff5f5" : "#f9fafb",
                    borderRadius: "12px",
                    border: isSelected ? "1.5px solid #fca5a5" : "1px solid #e5e7eb",
                    flexWrap: "wrap",
                    gap: "14px",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  {/* File Checkbox & Client Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "280px", flex: 2 }}>
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

                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#fef3c7",
                      color: "#d97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <HiOutlineDocumentText size={24} />
                    </div>

                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                        {f.fileName || "Untitled Document"}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "#6b7280" }}>
                        {f.client ? (
                          <>
                            <span style={{ fontWeight: "600", color: "#1f2937" }}>
                              👤 {f.client.name}
                            </span>
                            <span>•</span>
                            <span>📞 {f.client.mobile}</span>
                            {f.client.gstnumber && (
                              <>
                                <span>•</span>
                                <span style={{ color: "#4f46e5" }}>GST: {f.client.gstnumber}</span>
                              </>
                            )}
                          </>
                        ) : f.direction === "SHARED_WITH_STAFF" ? (
                          <span style={{ fontWeight: "600", color: "#7c3aed" }}>
                            👥 Shared with Staff Members
                          </span>
                        ) : (
                          <span style={{ fontWeight: "600", color: "#0d9488" }}>
                            🔒 Personal Storage (Internal)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Created On & Uploader Properties */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563" }}>
                      <span style={{ color: "#6b7280" }}>Uploaded by:</span>
                      {renderUploaderBadge(f)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                      <HiOutlineCalendarDays size={14} color="#9ca3af" />
                      <span>Created: <strong style={{ color: "#374151" }}>{formatDateTime(f.createdAt)}</strong></span>
                    </div>
                  </div>

                  {/* Category & Expiry & Folder */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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

                    <span style={{
                      padding: "4px 10px",
                      background: "#e0e7ff",
                      color: "#3730a3",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {f.category}
                    </span>

                    {isExpired ? (
                      <span style={{
                        padding: "4px 10px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}>
                        Expired ({f.expirationDate})
                      </span>
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <HiOutlineClock size={15} />
                        {f.expirationDate ? `Expires: ${f.expirationDate}` : "No Expiry"}
                      </span>
                    )}
                  </div>

                  {/* Actions: View, Download, Share, Rename */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {f.deleteRequested && (
                      <span style={{
                        padding: "4px 10px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "1px solid #fca5a5"
                      }} title={`Requested by: ${f.deleteRequestedBy || "Staff"} - Reason: ${f.deleteReason || "N/A"}`}>
                        ⚠️ Deletion Pending Review
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFile(f);
                      }}
                      title="View document inline"
                      style={{
                        padding: "8px 14px",
                        background: "#059669",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(5,150,105,0.2)",
                      }}
                    >
                      <HiOutlineEye size={16} /> View
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(f.id, f.fileName);
                      }}
                      title="Download from AWS S3"
                      style={{
                        padding: "8px 14px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <HiOutlineArrowDownTray size={15} /> Download
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openShareModal(f);
                      }}
                      title="Share via WhatsApp or Automated Email"
                      style={{
                        padding: "8px 14px",
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(124,58,237,0.2)",
                      }}
                    >
                      <FaShareAlt size={14} /> Share
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(f);
                      }}
                      title="Rename Document"
                      style={{
                        padding: "8px 12px",
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <HiOutlinePencilSquare size={15} color="#475569" /> Rename
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal with Interactive Client Search */}
      {showUploadModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "580px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            padding: "28px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827" }}>
                Upload & Assign Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* Category & Expiry Selection First */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setUploadCategory(newCat);
                      if (newCat === "IMPORTANT") {
                        setTargetAudience("PERSONAL");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      background: "#fff"
                    }}
                  >
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Conditional Client Selector OR Important File Internal Target */}
              {uploadCategory === "IMPORTANT" ? (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "18px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#166534", marginBottom: "6px" }}>
                    <span>🔒 Personal / Office Storage Target</span>
                  </div>
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#15803d" }}>
                    Important files are reserved for personal administrative or internal staff use. Client selection is not involved.
                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <label style={{
                      flex: 1,
                      minWidth: "180px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: targetAudience === "PERSONAL" ? "#dcfce7" : "#fff",
                      border: targetAudience === "PERSONAL" ? "2px solid #16a34a" : "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: targetAudience === "PERSONAL" ? "700" : "500",
                      color: "#14532d"
                    }}>
                      <input
                        type="radio"
                        name="targetAudience"
                        value="PERSONAL"
                        checked={targetAudience === "PERSONAL"}
                        onChange={() => setTargetAudience("PERSONAL")}
                      />
                      🔒 Personal (Only Me)
                    </label>

                    <label style={{
                      flex: 1,
                      minWidth: "180px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: targetAudience === "STAFF" ? "#ede9fe" : "#fff",
                      border: targetAudience === "STAFF" ? "2px solid #7c3aed" : "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: targetAudience === "STAFF" ? "700" : "500",
                      color: "#5b21b6"
                    }}>
                      <input
                        type="radio"
                        name="targetAudience"
                        value="STAFF"
                        checked={targetAudience === "STAFF"}
                        onChange={() => setTargetAudience("STAFF")}
                      />
                      👥 Send to Staff Members
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                      Select Target Client
                    </label>
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        style={{ background: "none", border: "none", color: "#6366f1", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                      >
                        Change Client
                      </button>
                    )}
                  </div>

                  {selectedClient ? (
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: "#e0e7ff",
                      border: "1px solid #6366f1",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <strong style={{ color: "#3730a3", fontSize: "14px" }}>{selectedClient.name}</strong>
                        <div style={{ color: "#4f46e5", fontSize: "12px", marginTop: "2px" }}>
                          📞 {selectedClient.mobile} • ✉️ {selectedClient.email} {selectedClient.gstnumber ? `• GST: ${selectedClient.gstnumber}` : ""}
                        </div>
                      </div>
                      <span style={{ background: "#4338ca", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                        Selected
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Filter client by name, mobile, email, or GST..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          marginBottom: "10px",
                          outline: "none"
                        }}
                      />

                      <div style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: "#f9fafb",
                        padding: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}>
                        {filteredClients.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                            No clients found
                          </div>
                        ) : (
                          filteredClients.map((c) => {
                            const isSelected = selectedClient?.id === c.id;
                            return (
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
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  background: isSelected ? "#e0e7ff" : "#fff",
                                  border: isSelected ? "1px solid #6366f1" : "1px solid #f3f4f6",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "13px",
                                }}
                              >
                                <div>
                                  <strong style={{ color: isSelected ? "#4338ca" : "#111827" }}>{c.name}</strong>
                                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                                    {c.mobile} • {c.email} {c.gstnumber ? `• GST: ${c.gstnumber}` : ""}
                                  </div>
                                </div>
                                {isSelected && <HiOutlineCheck size={18} color="#4338ca" />}
                              </div>
                            );
                          })
                        )}
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
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <HiOutlineFolderOpen size={18} color="#4f46e5" />
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
                      padding: "4px 10px",
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
                        padding: "10px 14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        background: "#fff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">-- No Specific Folder (Root Level) --</option>
                      {availableUploadFolders.map((f) => (
                        <option key={f.id} value={String(f.id)}>
                          📁 {f.folderName} {f.isCommon ? "• Common Folder" : `• Specific: ${f.client?.name || selectedClient?.name || "Client"}`} [{f.category || "General"}]
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Choose an existing folder or click "+ Create New Folder" to create one on the fly.
                    </span>
                  </div>
                ) : (
                  <div style={{
                    background: "#ffffff",
                    border: "1px dashed #6366f1",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
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
                          padding: "8px 12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      {selectedClient && (
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: !inlineIsCommon ? "#4338ca" : "#475569", cursor: "pointer", fontWeight: !inlineIsCommon ? "700" : "500" }}>
                          <input
                            type="radio"
                            name="inlineCommon"
                            checked={!inlineIsCommon}
                            onChange={() => setInlineIsCommon(false)}
                            style={{ accentColor: "#4f46e5" }}
                          />
                          <span>🔒 Specific to {selectedClient.name} (Only this client)</span>
                        </label>
                      )}
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: inlineIsCommon ? "#047857" : "#475569", cursor: "pointer", fontWeight: inlineIsCommon ? "700" : "500" }}>
                        <input
                          type="radio"
                          name="inlineCommon"
                          checked={inlineIsCommon}
                          onChange={() => setInlineIsCommon(true)}
                          style={{ accentColor: "#059669" }}
                        />
                        <span>🌐 Common Folder (Visible to All Clients)</span>
                      </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setShowInlineCreateFolder(false)}
                        style={{
                          padding: "6px 12px",
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
                          padding: "6px 16px",
                          background: "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: inlineCreating ? "not-allowed" : "pointer",
                          fontWeight: "700"
                        }}
                      >
                        {inlineCreating ? "Creating..." : "Create & Select Folder"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Choose File (Upload to AWS S3) */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>
                  Choose Document (Upload to AWS S3)
                </label>
                <input
                  type="file"
                  required={!uploadFile}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setUploadFile(f || null);
                    if (f) setCustomUploadFileName(f.name);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px dashed #d1d5db",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    cursor: "pointer",
                  }}
                />
              </div>

              {/* Selected File Box with Rename & Discard Properties */}
              {uploadFile && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Discard selected file"
                    >
                      <HiOutlineTrash size={13} /> Discard File
                    </button>
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Rename File Before Upload (Optional):
                    </label>
                    <input
                      type="text"
                      value={customUploadFileName}
                      onChange={(e) => setCustomUploadFileName(e.target.value)}
                      placeholder="Enter custom file name..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
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
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                    Document Expiration Date (Optional)
                  </label>
                  {selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM" && (
                    <span style={{
                      background: "linear-gradient(135deg, #f3e8ff, #ede9fe)",
                      color: "#6b21a8",
                      border: "1px solid #d8b4fe",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      ✨ Platinum Card: Expiration-Free
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
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {selectedClient?.membershipPlan?.toUpperCase() === "PLATINUM" ? (
                  <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#7c3aed", fontWeight: "600" }}>
                    💎 Platinum Member: Files have permanent lifetime storage with no expiration required.
                  </p>
                ) : (
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Leave empty for no expiration. If set, file will automatically expire on this date.
                  </span>
                )}
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
                onCancel={handleCancelAdminUpload}
                onRetry={handleUploadSubmit}
                theme="light"
              />

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
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
                    padding: "10px 18px",
                    background: "#f3f4f6",
                    color: uploading ? "#9ca3af" : "#374151",
                    border: "none",
                    borderRadius: "8px",
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
                    padding: "10px 22px",
                    background: uploading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: uploading ? "none" : "0 4px 14px rgba(37, 99, 235, 0.35)",
                  }}
                >
                  <HiOutlineArrowUpTray size={18} />
                  {uploadPhase === "PROCESSING"
                    ? "Securing in AWS S3..."
                    : uploading
                    ? `Uploading (${uploadProgress}%)`
                    : "Upload & Save"}
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
                  placeholder="e.g. Audited_Balance_Sheet_2026.pdf"
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

      {/* ── PLATINUM EXPIRATION-FREE NOTICE POPUP ──────────────── */}
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
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f3e8ff, #ede9fe)",
              color: "#7e22ce",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px auto",
              boxShadow: "0 4px 20px rgba(147, 51, 234, 0.2)",
            }}>
              <span style={{ fontSize: "32px" }}>🏆</span>
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
              letterSpacing: "0.5px",
              marginBottom: "10px",
            }}>
              PLATINUM CARD PRIVILEGE
            </div>

            <h3 style={{ margin: "0 0 10px 0", fontSize: "21px", fontWeight: "800", color: "#1e1b4b" }}>
              Expiration-Free File Access
            </h3>

            <p style={{ margin: "0 0 18px 0", fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
              <strong>{selectedClient?.name || "This client"}</strong> holds a prestigious <strong>Platinum Membership</strong>.
              All files for Platinum members are granted <strong>permanent lifetime cloud storage</strong> with zero expiration limits.
            </p>

            <div style={{
              background: "#faf5ff",
              border: "1px dashed #c084fc",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "24px",
              fontSize: "13px",
              color: "#581c87",
              textAlign: "left",
            }}>
              ✨ <strong>VIP Guarantee:</strong> Platinum clients never experience file link expirations.
            </div>

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
                  boxShadow: "0 4px 14px rgba(147, 51, 234, 0.3)",
                }}
              >
                ✓ Keep Expiration-Free (Recommended)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPlatinumExpiryPopup(false);
                }}
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

              {/* 3. Description (Shown prominently under Folder Name) */}
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

              {/* 4. Folder Allocation (Common to all clients OR specific client) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
                  Folder Access &amp; Allocation
                </label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: folderModal.isCommon ? "#047857" : "#374151", cursor: "pointer", fontWeight: folderModal.isCommon ? "700" : "500" }}>
                    <input
                      type="radio"
                      name="folderModalCommon"
                      checked={folderModal.isCommon}
                      onChange={() => setFolderModal((prev) => ({ ...prev, isCommon: true, clientId: "" }))}
                      style={{ accentColor: "#059669" }}
                    />
                    <span>🌐 Common Folder (Visible to All Clients)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: !folderModal.isCommon ? "#4338ca" : "#374151", cursor: "pointer", fontWeight: !folderModal.isCommon ? "700" : "500" }}>
                    <input
                      type="radio"
                      name="folderModalCommon"
                      checked={!folderModal.isCommon}
                      onChange={() => setFolderModal((prev) => ({ ...prev, isCommon: false }))}
                      style={{ accentColor: "#4f46e5" }}
                    />
                    <span>🔒 Allocate to Specific Client</span>
                  </label>
                </div>

                {!folderModal.isCommon && (
                  <div style={{ marginTop: "8px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                      Select Target Client *
                    </label>
                    <select
                      value={folderModal.clientId}
                      required={!folderModal.isCommon}
                      onChange={(e) => setFolderModal((prev) => ({ ...prev, clientId: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        outline: "none",
                        background: "#fff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">-- Choose Target Client --</option>
                      {availableClients.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} {c.mobile ? `(${c.mobile})` : ""} {c.email ? `• ${c.email}` : ""}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Only the selected client (and office admins/staff) will be able to see and access this folder.
                    </span>
                  </div>
                )}
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
      {/* ─── STAFF DELETION REQUESTS REVIEW MODAL ─── */}
      {showDeleteRequestsModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1150,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            maxWidth: "760px",
            width: "100%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
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
                  <HiOutlineTrash size={22} color="#dc2626" /> Review Staff Document Deletion Requests
                </h3>
                <span style={{ fontSize: "13px", color: "#b91c1c" }}>
                  {deleteRequests.length} pending request{deleteRequests.length === 1 ? "" : "s"} submitted by staff members
                </span>
              </div>
              <button
                onClick={() => setShowDeleteRequestsModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {deleteRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>🎉 No pending deletion requests from staff members.</p>
                </div>
              ) : (
                deleteRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #fee2e2",
                      borderRadius: "14px",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      boxShadow: "0 2px 8px rgba(220,38,38,0.06)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                          📄 {req.fileName}
                        </h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                          <span>Category: <strong style={{ color: "#3730a3" }}>{req.category}</strong></span>
                          <span>•</span>
                          <span>Client: <strong style={{ color: "#1f2937" }}>{req.client?.name || "General / Internal"}</strong></span>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "#9ca3af", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>
                        Requested: {formatDateTime(req.deleteRequestedAt)}
                      </span>
                    </div>

                    <div style={{
                      background: "#fff1f2",
                      border: "1px solid #ffe4e6",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#9f1239"
                    }}>
                      <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                        👤 Requested By: {req.deleteRequestedBy || "Staff Member"}
                      </div>
                      <div>
                        📝 <strong>Staff Reason:</strong> {req.deleteReason || "No explanation provided."}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                      <button
                        onClick={() => handleViewFile(req)}
                        style={{
                          padding: "8px 14px",
                          background: "#059669",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <HiOutlineEye size={16} /> View Document
                      </button>

                      <button
                        disabled={processingRequestId === req.id}
                        onClick={() => handleRejectDeleteRequest(req.id)}
                        style={{
                          padding: "8px 14px",
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Reject
                      </button>

                      <button
                        disabled={processingRequestId === req.id}
                        onClick={() => handleApproveDeleteRequest(req.id)}
                        style={{
                          padding: "8px 18px",
                          background: "linear-gradient(135deg, #ef4444, #dc2626)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(220,38,38,0.3)"
                        }}
                      >
                        <HiOutlineTrash size={16} /> {processingRequestId === req.id ? "Purging..." : "Approve & Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── INLINE DOCUMENT VIEWER POPUP MODAL ─── */}
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
                    Category: {viewingFile.category} {viewingFile.client ? `• Client: ${viewingFile.client.name}` : ""}
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

      {/* ─── DOCUMENT SHARING MODAL (WHATSAPP & AUTOMATED EMAIL) ─── */}
      {showShareModal && sharingFile && (
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
            maxWidth: "580px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
              borderBottom: "1px solid #ddd6fe",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#5b21b6", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaShareAlt size={18} color="#7c3aed" /> Share Document
                </h3>
                <span style={{ fontSize: "13px", color: "#6d28d9" }}>
                  {sharingFile.fileName}
                </span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Option 1: WhatsApp Share */}
              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "14px",
                padding: "16px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#22c55e",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(34,197,94,0.3)"
                  }}>
                    <FaWhatsapp size={24} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "#166534", display: "block" }}>
                      WhatsApp Direct Share
                    </strong>
                    <span style={{ fontSize: "12px", color: "#15803d" }}>
                      Send document attachment link directly via WhatsApp message.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(sharingFile)}
                  style={{
                    padding: "10px 18px",
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 10px rgba(34,197,94,0.3)"
                  }}
                >
                  <FaWhatsapp size={16} /> Share on WhatsApp
                </button>
              </div>

              {/* Option 2: Automated Email Service */}
              <div style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FaEnvelope size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>
                      Automated Email Dispatch
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Sends email with document file attachment via Sri Kathiravan & Co. automated mail service.
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSendAutomatedEmail} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                      Receiver Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@example.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={shareSubject}
                      onChange={(e) => setShareSubject(e.target.value)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                      Custom Message
                    </label>
                    <textarea
                      rows={3}
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      style={{
                        padding: "8px 16px",
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#475569",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      style={{
                        padding: "9px 20px",
                        background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: sendingEmail ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 10px rgba(79,70,229,0.3)"
                      }}
                    >
                      <FaEnvelope size={14} />
                      {sendingEmail ? "Dispatching Email..." : "Send Document Email"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
