import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import {
  HiOutlineSquares2X2,
  HiOutlineEye,
  HiOutlinePlusCircle,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineTag,
  HiOutlineInformationCircle,
  HiXMark,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import DynamicField from "../../components/DynamicFormFiled";
import LoadingAnimation2 from "../../components/LoadingAnimation2";
import "../../styles/SettingsStyles/CustomizableClientForm.css";

export default function CustomizableClientForm() {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'fields'
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [fields, setFields] = useState([]);
  const [previewFormData, setPreviewFormData] = useState({});
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [newFieldData, setNewFieldData] = useState({
    versionMode: "existing", // 'existing' | 'new'
    newVersionNumber: "",
    fieldLabel: "",
    fieldKey: "",
    fieldType: "TEXT",
    placeholder: "",
    required: false,
    active: true,
    options: "",
  });

  // Load versions
  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await api.get("/Admin/ClientForm/Versions");
      const vList = (Array.isArray(res.data) ? res.data : []).map(Number).sort((a, b) => a - b);
      setVersions(vList);
      if (vList.length > 0) {
        if (!selectedVersion || !vList.includes(Number(selectedVersion))) {
          setSelectedVersion(String(vList[vList.length - 1])); // default to latest
        }
      } else {
        setSelectedVersion("");
      }
    } catch (err) {
      console.error("Error loading versions:", err);
      toast.error("Failed to load form versions");
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  // Load all fields for selected version
  const loadFields = async (versionNum) => {
    if (!versionNum) {
      setFields([]);
      return;
    }
    setLoadingFields(true);
    try {
      const res = await api.get("/Admin/ClientForm/Fields/All", {
        params: { formversion: Number(versionNum) },
      });
      setFields(res.data || []);
    } catch (err) {
      console.error("Error loading fields:", err);
      toast.error("Failed to load fields for version " + versionNum);
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    if (selectedVersion) {
      loadFields(selectedVersion);
      setPreviewFormData({});
    }
  }, [selectedVersion]);

  // Toggle field active/inactive
  const handleToggleActive = async (field) => {
    try {
      const res = await api.patch(`/Admin/ClientForm/Field/${field.id}/ToggleActive`);
      const updatedStatus = res.data.active;
      setFields((prev) =>
        prev.map((f) => (f.id === field.id ? { ...f, active: updatedStatus } : f))
      );
      toast.success(
        `Field "${field.fieldLabel}" is now ${updatedStatus ? "Activated" : "Deactivated"}`
      );
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("Failed to toggle field status");
    }
  };

  // Delete field
  const handleDeleteField = async (field) => {
    if (!window.confirm(`Are you sure you want to delete "${field.fieldLabel}" from Version ${selectedVersion}?`)) {
      return;
    }
    try {
      await api.delete(`/Admin/ClientForm/Field/${field.id}`);
      setFields((prev) => prev.filter((f) => f.id !== field.id));
      toast.success(`Field "${field.fieldLabel}" deleted`);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete field");
    }
  };

  // Auto-generate key from label in modal
  const handleLabelChange = (val) => {
    const key = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setNewFieldData((prev) => ({
      ...prev,
      fieldLabel: val,
      fieldKey: key,
    }));
  };

  // Save new field
  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newFieldData.fieldLabel.trim()) {
      toast.error("Field label is required");
      return;
    }
    if (!newFieldData.fieldKey.trim()) {
      toast.error("Field key is required");
      return;
    }

    let targetVersion = Number(selectedVersion);
    if (newFieldData.versionMode === "new") {
      targetVersion = Number(newFieldData.newVersionNumber);
      if (!targetVersion || targetVersion < 1) {
        toast.error("Please enter a valid version number (>= 1)");
        return;
      }
    }

    setSavingField(true);
    try {
      const payload = {
        fieldLabel: newFieldData.fieldLabel.trim(),
        fieldKey: newFieldData.fieldKey.trim(),
        fieldType: newFieldData.fieldType,
        placeholder: newFieldData.placeholder.trim(),
        required: newFieldData.required,
        active: newFieldData.active,
        formversion: targetVersion,
        options: newFieldData.options.trim(),
      };

      await api.post("/Admin/ClientForm/Field", payload);
      toast.success(`Field created successfully in Version ${targetVersion}!`);
      setShowAddModal(false);
      setNewFieldData({
        versionMode: "existing",
        newVersionNumber: "",
        fieldLabel: "",
        fieldKey: "",
        fieldType: "TEXT",
        placeholder: "",
        required: false,
        active: true,
        options: "",
      });

      // Reload versions and switch to this version
      await loadVersions();
      setSelectedVersion(String(targetVersion));
      loadFields(targetVersion);
    } catch (err) {
      console.error("Error creating field:", err);
      toast.error(err.response?.data?.message || "Failed to create field. Key might already exist.");
    } finally {
      setSavingField(false);
    }
  };

  const activeFields = fields.filter((f) => f.active);

  return (
    <div className="custom-form-studio">
      {/* Studio Header */}
      <div className="studio-header">
        <div className="studio-title-area">
          <div className="studio-badge">
            <HiOutlineSparkles size={14} />
            <span>Form Architecture Engine</span>
          </div>
          <h1>Client Form Customizer</h1>
          <p>
            Build, version, preview, and configure dynamic custom fields for client registration and profile management.
          </p>
        </div>

        <div className="studio-actions-area">
          {/* Version Selector */}
          <div className="version-selector-card">
            <span className="selector-label">Form Version:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              disabled={loadingVersions || versions.length === 0}
              className="version-dropdown"
            >
              {versions.length === 0 ? (
                <option value="">No Versions Configured</option>
              ) : (
                versions.map((v) => (
                  <option key={v} value={String(v)}>
                    Version {v} {v === Math.max(...versions) ? "(Latest)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            className="studio-btn studio-btn--primary"
            onClick={() => {
              const nextV = versions.length ? Math.max(...versions) + 1 : 1;
              setNewFieldData((p) => ({ ...p, newVersionNumber: String(nextV) }));
              setShowAddModal(true);
            }}
          >
            <HiOutlinePlusCircle size={18} />
            <span>Create New Field</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="studio-tabs-bar">
        <button
          className={`studio-tab-btn ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          <HiOutlineEye size={18} />
          <span>Interactive Form Preview</span>
          <span className="tab-pill">{activeFields.length} Active Fields</span>
        </button>

        <button
          className={`studio-tab-btn ${activeTab === "fields" ? "active" : ""}`}
          onClick={() => setActiveTab("fields")}
        >
          <HiOutlineAdjustmentsHorizontal size={18} />
          <span>Manage Fields & Activation</span>
          <span className="tab-pill">{fields.length} Total</span>
        </button>

        <button
          className="studio-refresh-btn"
          onClick={() => {
            loadVersions();
            if (selectedVersion) loadFields(selectedVersion);
          }}
          title="Refresh Form Data"
        >
          <HiOutlineArrowPath size={16} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="studio-body">
        {loadingFields ? (
          <div className="studio-loading-wrap">
            <LoadingAnimation2 />
            <p>Loading form version schema...</p>
          </div>
        ) : (
          <>
            {/* ──────── TAB 1: FORM PREVIEW ──────── */}
            {activeTab === "preview" && (
              <div className="preview-container">
                <div className="preview-banner">
                  <HiOutlineInformationCircle size={20} />
                  <span>
                    Previewing client intake form under <strong>Version {selectedVersion || "None"}</strong>. Fields marked with <span style={{ color: "#ef4444" }}>*</span> are mandatory.
                  </span>
                </div>

                <div className="preview-form-card">
                  {/* Fixed Section 1 */}
                  <div className="preview-section">
                    <div className="preview-section-header">
                      <span className="preview-step-num">1</span>
                      <h4>Basic Client Details</h4>
                    </div>
                    <div className="preview-grid-2">
                      <div className="preview-field">
                        <label>Client Full Name *</label>
                        <input type="text" placeholder="e.g. Rajesh Kannan" disabled />
                      </div>
                      <div className="preview-field">
                        <label>Legal Business Name</label>
                        <input type="text" placeholder="e.g. Kannan Industries Ltd" disabled />
                      </div>
                      <div className="preview-field">
                        <label>Mobile Number *</label>
                        <input type="text" placeholder="e.g. 9876543210" disabled />
                      </div>
                      <div className="preview-field">
                        <label>Email Address</label>
                        <input type="email" placeholder="e.g. contact@kannan.com" disabled />
                      </div>
                    </div>
                  </div>

                  {/* Fixed Section 2 */}
                  <div className="preview-section">
                    <div className="preview-section-header">
                      <span className="preview-step-num">2</span>
                      <h4>Business & Tax Information</h4>
                    </div>
                    <div className="preview-grid-2">
                      <div className="preview-field">
                        <label>GSTIN (GST Number)</label>
                        <input type="text" placeholder="15-character GSTIN" disabled />
                      </div>
                      <div className="preview-field">
                        <label>PAN Number</label>
                        <input type="text" placeholder="10-character PAN" disabled />
                      </div>
                      <div className="preview-field">
                        <label>City / Location</label>
                        <input type="text" placeholder="e.g. Coimbatore" disabled />
                      </div>
                    </div>
                  </div>

                  {/* Fixed Section 3 */}
                  <div className="preview-section">
                    <div className="preview-section-header">
                      <span className="preview-step-num">3</span>
                      <h4>Portal Authentication</h4>
                    </div>
                    <div className="preview-grid-2">
                      <div className="preview-field">
                        <label>Temporary Access Password *</label>
                        <input type="password" value="••••••••" disabled />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Dynamic Custom Fields */}
                  <div className="preview-section preview-section--dynamic">
                    <div className="preview-section-header">
                      <span className="preview-step-num preview-step-num--purple">4</span>
                      <div>
                        <h4>Additional Information (Dynamic Version {selectedVersion})</h4>
                        <p className="preview-subtext">Configured dynamically via Form Customizer Studio</p>
                      </div>
                    </div>

                    {activeFields.length === 0 ? (
                      <div className="preview-empty-state">
                        <HiOutlineExclamationTriangle size={32} />
                        <h5>No Active Dynamic Fields</h5>
                        <p>
                          Version {selectedVersion} does not currently have any active custom fields. Click "Create New Field" or activate existing fields in the manager tab.
                        </p>
                      </div>
                    ) : (
                      <div className="dynamic-form-layout">
                        {activeFields.map((field) => (
                          <DynamicField
                            key={field.id}
                            field={field}
                            formData={previewFormData}
                            setFormData={setPreviewFormData}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ──────── TAB 2: FIELD MANAGER & ACTIVATION ──────── */}
            {activeTab === "fields" && (
              <div className="fields-manager-container">
                <div className="manager-toolbar">
                  <div className="manager-info">
                    <h3>Schema Attributes for Version {selectedVersion}</h3>
                    <p>Toggle switch to instantly activate or deactivate fields without deleting client historical records.</p>
                  </div>
                  <button
                    className="studio-btn studio-btn--outline"
                    onClick={() => {
                      const nextV = versions.length ? Math.max(...versions) + 1 : 1;
                      setNewFieldData((p) => ({ ...p, newVersionNumber: String(nextV) }));
                      setShowAddModal(true);
                    }}
                  >
                    <HiOutlinePlusCircle size={16} />
                    <span>Add Attribute</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="empty-fields-card">
                    <HiOutlineTag size={36} />
                    <h4>No Fields Found for Version {selectedVersion}</h4>
                    <p>Get started by adding the first custom attribute to this form version.</p>
                  </div>
                ) : (
                  <div className="fields-table-wrap">
                    <table className="fields-table">
                      <thead>
                        <tr>
                          <th>Field Label & Key</th>
                          <th>Data Type</th>
                          <th>Constraint</th>
                          <th>Status</th>
                          <th>Toggle Active</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f) => (
                          <tr key={f.id} className={!f.active ? "row-inactive" : ""}>
                            <td>
                              <div className="field-meta-cell">
                                <span className="field-label-bold">{f.fieldLabel}</span>
                                <code className="field-key-code">{f.fieldKey}</code>
                              </div>
                            </td>
                            <td>
                              <span className={`type-tag type-${f.fieldType.toLowerCase()}`}>
                                {f.fieldType}
                              </span>
                            </td>
                            <td>
                              {f.required ? (
                                <span className="badge-required">Required</span>
                              ) : (
                                <span className="badge-optional">Optional</span>
                              )}
                            </td>
                            <td>
                              {f.active ? (
                                <span className="status-badge-active">
                                  <HiOutlineCheckCircle size={14} /> Active
                                </span>
                              ) : (
                                <span className="status-badge-inactive">
                                  <HiOutlineXCircle size={14} /> Inactive
                                </span>
                              )}
                            </td>
                            <td>
                              <label className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={f.active}
                                  onChange={() => handleToggleActive(f)}
                                />
                                <span className="toggle-slider" />
                              </label>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="action-delete-btn"
                                onClick={() => handleDeleteField(f)}
                                title="Delete Field"
                              >
                                <HiOutlineTrash size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ──────── CREATE NEW FIELD MODAL ──────── */}
      {showAddModal && (
        <div className="studio-modal-backdrop">
          <div className="studio-modal-card">
            <div className="studio-modal-header">
              <div>
                <h3>Create Custom Field Attribute</h3>
                <p>Define a new data point for client registration</p>
              </div>
              <button
                className="studio-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <HiXMark size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateField} className="studio-modal-form">
              {/* Version Mode Selection */}
              <div className="form-group">
                <label>Form Version Target</label>
                <div className="version-mode-toggle">
                  <label className={`mode-choice ${newFieldData.versionMode === "existing" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="versionMode"
                      value="existing"
                      checked={newFieldData.versionMode === "existing"}
                      onChange={(e) =>
                        setNewFieldData((p) => ({ ...p, versionMode: e.target.value }))
                      }
                    />
                    <span>Add to Current Version ({selectedVersion || "1"})</span>
                  </label>

                  <label className={`mode-choice ${newFieldData.versionMode === "new" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="versionMode"
                      value="new"
                      checked={newFieldData.versionMode === "new"}
                      onChange={(e) =>
                        setNewFieldData((p) => ({ ...p, versionMode: e.target.value }))
                      }
                    />
                    <span>Create in New Version</span>
                  </label>
                </div>

                {newFieldData.versionMode === "new" && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12px", color: "#64748b" }}>New Version Number</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 3"
                      value={newFieldData.newVersionNumber}
                      onChange={(e) =>
                        setNewFieldData((p) => ({ ...p, newVersionNumber: e.target.value }))
                      }
                      className="studio-input"
                    />
                  </div>
                )}
              </div>

              {/* Field Label */}
              <div className="form-group">
                <label>Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Turnover"
                  value={newFieldData.fieldLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="studio-input"
                />
              </div>

              {/* Field Key */}
              <div className="form-group">
                <label>Field Identifier Key (Auto-Generated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. annual_turnover"
                  value={newFieldData.fieldKey}
                  onChange={(e) =>
                    setNewFieldData((p) => ({ ...p, fieldKey: e.target.value }))
                  }
                  className="studio-input"
                />
                <span className="field-hint">Used as internal property key for storage.</span>
              </div>

              {/* Field Type */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Data Input Type</label>
                  <select
                    value={newFieldData.fieldType}
                    onChange={(e) =>
                      setNewFieldData((p) => ({ ...p, fieldType: e.target.value }))
                    }
                    className="studio-input"
                  >
                    <option value="TEXT">Short Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="EMAIL">Email Address</option>
                    <option value="DATE">Calendar Date</option>
                    <option value="TEXTAREA">Multi-line Text Area</option>
                    <option value="SELECT">Dropdown (Select Option)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Input Placeholder</label>
                  <input
                    type="text"
                    placeholder="e.g. Enter total in ₹ Lakhs"
                    value={newFieldData.placeholder}
                    onChange={(e) =>
                      setNewFieldData((p) => ({ ...p, placeholder: e.target.value }))
                    }
                    className="studio-input"
                  />
                </div>
              </div>

              {/* If SELECT type, options */}
              {newFieldData.fieldType === "SELECT" && (
                <div className="form-group">
                  <label>Dropdown Options (Comma-Separated) *</label>
                  <textarea
                    required
                    placeholder="e.g. Tier 1, Tier 2, Tier 3, Enterprise"
                    value={newFieldData.options}
                    onChange={(e) =>
                      setNewFieldData((p) => ({ ...p, options: e.target.value }))
                    }
                    className="studio-input"
                    rows={2}
                  />
                </div>
              )}

              {/* Checkboxes */}
              <div className="form-checkbox-row">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={newFieldData.required}
                    onChange={(e) =>
                      setNewFieldData((p) => ({ ...p, required: e.target.checked }))
                    }
                  />
                  <span>Mandatory / Required Field</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={newFieldData.active}
                    onChange={(e) =>
                      setNewFieldData((p) => ({ ...p, active: e.target.checked }))
                    }
                  />
                  <span>Immediately Active in Client Forms</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="studio-modal-actions">
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingField}
                  className="studio-btn studio-btn--primary"
                >
                  {savingField ? "Saving..." : "Save Field Attribute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}