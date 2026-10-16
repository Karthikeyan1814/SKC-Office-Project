
import { useEffect, useState } from "react";

import api from "../../api/axiosInstance";
import "../../styles/SettingsStyles/ClientSetting.css"
export default function DeactivateClientField({handleOpenDeactiavte}) {
    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState("");

    const [fields, setFields] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [loadingFields, setLoadingFields] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // STEP 1: Load available versions
    useEffect(() => {
        const loadVersions = async () => {
            setLoadingVersions(true);
            setError("");

            try {
                const response = await api.get(
                    "/Admin/ClientForm/Versions"
                );

                setVersions(response.data);

                if (response.data.length > 0) {
                    setSelectedVersion(String(response.data[0]));
                }
            } catch (err) {
                console.error("Failed to load versions:", err);
                setError("Unable to load form versions.");
            } finally {
                setLoadingVersions(false);
            }
        };

        loadVersions();
    }, []);

    // STEP 2: Load all fields when version changes
    useEffect(() => {
        if (!selectedVersion) {
            setFields([]);
            return;
        }

        let cancelled = false;

        const loadFields = async () => {
            setLoadingFields(true);
            setError("");
            setMessage("");

            try {
                const response = await api.get(
                    "/Admin/ClientForm/Fields/All",
                    {
                        params: {
                            formversion: Number(selectedVersion)
                        }
                    }
                );

                if (!cancelled) {
                    setFields(response.data);
                }
            } catch (err) {
                console.error("Failed to load fields:", err);

                if (!cancelled) {
                    setFields([]);
                    setError("Unable to load fields for this version.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingFields(false);
                }
            }
        };

        loadFields();

        return () => {
            cancelled = true;
        };
    }, [selectedVersion]);

    // STEP 3: Deactivate the selected field
    const handleDeactivate = async (field) => {
        if (!field.active) {
            return;
        }

        const confirmed = window.confirm(
            `Deactivate "${field.fieldLabel}" in Version ${selectedVersion}?`
        );

        if (!confirmed) {
            return;
        }

        setDeactivatingId(field.id);
        setError("");
        setMessage("");

        try {
            await api.patch(
                `/Admin/ClientForm/Field/${field.id}/Deactivate`
            );

            // Update only the selected field in the UI
            setFields((previousFields) =>
                previousFields.map((item) =>
                    item.id === field.id
                        ? { ...item, active: false }
                        : item
                )
            );

            setMessage(
                `"${field.fieldLabel}" was deactivated successfully.`
            );
        } catch (err) {
            console.error("Failed to deactivate field:", err);

            setError(
                err.response?.data?.message ||
                "Unable to deactivate this field."
            );
        } finally {
            setDeactivatingId(null);
        }
    };

    // STEP 4: Permanently delete the selected field
    const handleDeleteField = async (field) => {
        const confirmed = window.confirm(
            `Permanently delete field "${field.fieldLabel}" (${field.fieldKey})? This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.delete(`/Admin/ClientForm/Field/${field.id}`);
            setFields((previousFields) =>
                previousFields.filter((item) => item.id !== field.id)
            );
            setMessage(`"${field.fieldLabel}" was deleted successfully.`);
        } catch (err) {
            console.error("Failed to delete field:", err);
            setError("Unable to delete this field.");
        }
    };

    return (
        <div className="deactivate-main-box parent-layout">
           <section className="split-into-two">
            <section>
                 <h2
                style={{
                    fontFamily: "var(--font3)",
                    color: "var(--primary)"
                }}
            >
                Manage Existing Fields
            </h2>

            {/* Version selector */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "30px",
                    flexWrap: "wrap",
                    marginBottom: "20px"
                }}
            >
                <label htmlFor="deactivateFormVersion" style={{color:"var(--lite)",fontFamily:"var(--font3)",margin:"30px 0px"}}>
                    Select Form Version
                </label>

                <select
                    className="select-styling"
                    id="deactivateFormVersion"
                    value={selectedVersion}
                    onChange={(event) =>
                        setSelectedVersion(event.target.value)
                    }
                    disabled={loadingVersions || versions.length === 0}
                >
                    {versions.length === 0 && (
                        <option value="">No versions available</option>
                    )}

                    {versions.map((version) => (
                        <option key={version} value={String(version)}>
                            Version {version}
                        </option>
                    ))}
                </select>
            </div>
            </section>
            <button className="close-red" onClick={handleOpenDeactiavte}>X</button>
           </section>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {message && (
                <p role="status" style={{ color: "green" }}>
                    {message}
                </p>
            )}

            {loadingVersions || loadingFields ? (
                <p>Loading fields...</p>
            ) : fields.length === 0 ? (
                <p>No fields found for this version.</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={cellStyle}>Field Label</th>
                                <th style={cellStyle}>Field Key</th>
                                <th style={cellStyle}>Type</th>
                                <th style={cellStyle}>Status</th>
                                <th style={cellStyle}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {fields.map((field) => (
                                <tr key={field.id} className="common-table">
                                    <td style={cellStyle}>
                                        {field.fieldLabel}
                                    </td>

                                    <td style={cellStyle}>
                                        {field.fieldKey}
                                    </td>

                                    <td style={cellStyle}>
                                        {field.fieldType}
                                    </td>

                                    <td style={cellStyle}>
                                        <span
                                            style={{
                                                color: field.active
                                                    ? "green"
                                                    : "gray",
                                                fontWeight: 600
                                            }}
                                        >
                                            {field.active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>

                                    <td style={cellStyle}>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <button
                                                type="button"
                                                className="close-red"
                                                disabled={
                                                    !field.active ||
                                                    deactivatingId === field.id
                                                }
                                                onClick={() =>
                                                    handleDeactivate(field)
                                                }
                                            >
                                                {deactivatingId === field.id
                                                    ? "Deactivating..."
                                                    : field.active
                                                    ? "Deactivate"
                                                    : "Deactivated"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteField(field)}
                                                style={{
                                                    background: "#ef4444",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "6px 12px",
                                                    cursor: "pointer",
                                                    fontWeight: "700",
                                                    fontSize: "12px",
                                                    transition: "all 0.2s ease",
                                                }}
                                                title="Permanently delete field"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const cellStyle = {
    padding: "12px",
    borderBottom: "1px solid var(--lite)",
    textAlign: "left",
    whiteSpace: "nowrap"
};
