
import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "../../styles/SettingsStyles/ClientSetting.css";

const initialForm = {
    fieldKey: "",
    fieldLabel: "",
    fieldType: "TEXT",
    placeholder: "",
    required: false,
    active: true,
    formversion: "",
    options: ""
};

const normalizeVersions = (data) => {
    return [
        ...new Set(
            (Array.isArray(data) ? data : [])
                .map(Number)
                .filter(
                    (version) =>
                        Number.isInteger(version) && version >= 1
                )
        )
    ].sort((a, b) => a - b);
};

export default function AddClientField ({handleOpenAddField})  {
    const [formData, setFormData] = useState(initialForm);

    const [versions, setVersions] = useState([]);
    const [versionMode, setVersionMode] = useState("existing");

    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info");

    const [loading, setLoading] = useState(false);
    const [versionsLoading, setVersionsLoading] = useState(true);

    const nextVersion = versions.length
        ? Math.max(...versions) + 1
        : 1;

    // Load existing versions from the backend
    const loadVersions = async () => {
        try {
            const response = await api.get(
                "/Admin/ClientForm/Versions"
            );

            const loadedVersions = normalizeVersions(response.data);

            setVersions(loadedVersions);

            return loadedVersions;
        } catch (error) {
            console.error(
                "Unable to load versions:",
                error.response?.data || error
            );

            setMessage("Unable to load form versions.");
            setMessageType("error");

            throw error;
        }
    };

    useEffect(() => {
        const initializeVersions = async () => {
            try {
                const loadedVersions = await loadVersions();

                if (loadedVersions.length > 0) {
                    const latestVersion =
                        loadedVersions[loadedVersions.length - 1];

                    setVersionMode("existing");

                    setFormData((previous) => ({
                        ...previous,
                        formversion: String(latestVersion)
                    }));
                } else {
                    setVersionMode("new");

                    setFormData((previous) => ({
                        ...previous,
                        formversion: "1"
                    }));
                }
            } catch {
                setVersions([]);
                setVersionMode("new");

                setFormData((previous) => ({
                    ...previous,
                    formversion: "1"
                }));
            } finally {
                setVersionsLoading(false);
            }
        };

        initializeVersions();
    }, []);

    // Handle ordinary inputs and checkboxes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Generate a field key from its label
    const handleLabelChange = (e) => {
        const label = e.target.value;

        const key = label
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        setFormData((previous) => ({
            ...previous,
            fieldLabel: label,
            fieldKey: key
        }));
    };

    // Switch between an existing version and a new version
    const handleVersionModeChange = (e) => {
        const mode = e.target.value;

        setVersionMode(mode);
        setSuggestions([]);
        setMessage("");

        if (mode === "new") {
            setFormData((previous) => ({
                ...previous,
                formversion: String(nextVersion)
            }));
        } else if (versions.length > 0) {
            setFormData((previous) => ({
                ...previous,
                formversion: versions.includes(
                    Number(previous.formversion)
                )
                    ? String(previous.formversion)
                    : String(versions[versions.length - 1])
            }));
        } else {
            // There are no existing versions to select.
            setVersionMode("new");

            setFormData((previous) => ({
                ...previous,
                formversion: String(nextVersion)
            }));
        }
    };

    // Search for matching labels in the selected version
    useEffect(() => {
        const label = formData.fieldLabel.trim();
        const version = Number(formData.formversion);

        setSuggestions([]);

        if (
            !label ||
            !Number.isInteger(version) ||
            version < 1
        ) {
            setSearching(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            setSearching(true);

            try {
                const response = await api.get(
                    "/Admin/ClientForm/Fields/Search",
                    {
                        params: {
                            version,
                            label
                        }
                    }
                );

                if (!cancelled) {
                    setSuggestions(
                        Array.isArray(response.data)
                            ? response.data
                            : []
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Field search failed:",
                        error.response?.data || error
                    );

                    setSuggestions([]);
                }
            } finally {
                if (!cancelled) {
                    setSearching(false);
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [formData.fieldLabel, formData.formversion]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setSuggestions([]);

        const version = Number(formData.formversion);
        const label = formData.fieldLabel.trim();
        const fieldKey = formData.fieldKey.trim();

        if (!Number.isInteger(version) || version < 1) {
            setMessage("Please select a valid form version.");
            setMessageType("error");
            return;
        }

        if (!label || !fieldKey) {
            setMessage("Field title and field key are required.");
            setMessageType("error");
            return;
        }

        if (
            ["SELECT", "RADIO"].includes(formData.fieldType) &&
            !formData.options.trim()
        ) {
            setMessage("Please provide options for this input type.");
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            // Check for an exact duplicate in this version.
            const searchResponse = await api.get(
                "/Admin/ClientForm/Fields/Search",
                {
                    params: {
                        version,
                        label
                    }
                }
            );

            const matchingFields = Array.isArray(searchResponse.data)
                ? searchResponse.data
                : [];

            const duplicateLabel = matchingFields.some(
                (field) =>
                    field.fieldLabel?.trim().toLowerCase() ===
                    label.toLowerCase()
            );

            if (duplicateLabel) {
                setSuggestions(matchingFields);
                setMessage(
                    "This field title already exists in the selected version."
                );
                setMessageType("error");
                return;
            }

            const payload = {
                ...formData,
                fieldKey,
                fieldLabel: label,
                formversion: version,
                options: formData.options.trim()
            };

            const response = await api.post(
                "/Admin/ClientForm/Field",
                payload
            );

            // Refresh versions so a newly created version becomes selectable.
            const updatedVersions = await loadVersions();

            setMessage(
                `Field "${label}" created successfully in Version ${version}.`
            );
            setMessageType("success");

            // Keep the same version selected so more fields can be added.
            setFormData({
                ...initialForm,
                formversion: String(version)
            });

            // If the user is creating a new version, keep that mode active.
            // The version number remains the same for additional fields.
            if (!updatedVersions.includes(version)) {
                setMessage(
                    "Field was saved, but the version list did not refresh correctly. Check the backend version query."
                );
                setMessageType("error");
            }

            console.log("Saved field:", response.data);
        } catch (error) {
            console.error(
                "Field creation failed:",
                error.response?.data || error
            );

            setMessage(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Unable to create the field. Check the backend logs."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="client-setting-dash">
            <section className="split-into-two">
                <section><h2>Create Client Form Field</h2>
                <p>Configure custom fields for client registration. </p>
           </section>
           <section >
                <button className="close-red" onClick={handleOpenAddField}>X</button>
            </section>
                 </section>

            <form
                onSubmit={handleSubmit}
                className="common-form-layout client-field-form"
            >
                {/* Row 1: Form setup mode + selected version */}

                <label htmlFor="versionMode">
                    Form Setup *
                </label>

                <select
                    id="versionMode"
                    value={versionMode}
                    onChange={handleVersionModeChange}
                    disabled={versionsLoading || loading}
                    required
                >
                    <option value="existing" disabled={versions.length === 0}>
                        Use Existing Version
                    </option>
                    <option value="new">
                        Create New Version
                    </option>
                </select>

                <label htmlFor="formversion">
                    Form Version *
                </label>

                {versionMode === "existing" ? (
                    <select
                        id="formversion"
                        name="formversion"
                        value={formData.formversion}
                        onChange={(e) => {
                            handleChange(e);
                            setSuggestions([]);
                            setMessage("");
                        }}
                        disabled={
                            versionsLoading ||
                            loading ||
                            versions.length === 0
                        }
                        required
                    >
                        <option value="" disabled>
                            Select version
                        </option>

                        {versions.map((version) => (
                            <option
                                key={version}
                                value={String(version)}
                            >
                                Version {version}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        id="formversion"
                        name="formversion"
                        type="number"
                        min="1"
                        value={formData.formversion}
                        readOnly
                        required
                    />
                )}

                {/* New version information spans all four columns */}
                {versionMode === "new" && (
                    <small className="client-field-full-width version-hint">
                        {versions.length > 0
                            ? `Next available version: ${nextVersion}`
                            : "No existing versions found. The first version will be Version 1."}
                    </small>
                )}

                {/* Row 2: Field title + field key */}

                <label htmlFor="fieldLabel">
                    Field Title *
                </label>

                <input
                    id="fieldLabel"
                    type="text"
                    name="fieldLabel"
                    value={formData.fieldLabel}
                    onChange={handleLabelChange}
                    placeholder="e.g. Annual Turnover"
                    required
                    disabled={loading}
                />

                <label htmlFor="fieldKey">
                    Field Key *
                </label>

                <input
                    id="fieldKey"
                    type="text"
                    name="fieldKey"
                    value={formData.fieldKey}
                    onChange={handleChange}
                    placeholder="e.g. annual_turnover"
                    required
                    disabled={loading}
                />

                {/* Search status spans all four columns */}
                {searching && (
                    <small className="client-field-full-width">
                        Searching existing fields...
                    </small>
                )}

                {/* Matching fields span all four columns */}
                {suggestions.length > 0 && (
                    <div className="field-suggestions client-field-full-width">
                        <strong>
                            Matching or similar fields found
                        </strong>

                        {suggestions.map((field) => (
                            <div
                                key={field.id}
                                className="field-suggestion-item"
                            >
                                <strong>{field.fieldLabel}</strong>
                                {" — "}
                                {field.fieldType}

                                <p>
                                    Key: {field.fieldKey}
                                </p>

                                <small>
                                    Existing in Version {field.formversion}.
                                    Consider reusing it or choosing another title.
                                </small>
                            </div>
                        ))}
                    </div>
                )}

                {/* Row 3: Input type + placeholder */}

                <label htmlFor="fieldType">
                    Input Type *
                </label>

                <select
                    id="fieldType"
                    name="fieldType"
                    value={formData.fieldType}
                    onChange={(e) => {
                        handleChange(e);

                        if (
                            !["SELECT", "RADIO"].includes(e.target.value)
                        ) {
                            setFormData((previous) => ({
                                ...previous,
                                fieldType: e.target.value,
                                options: ""
                            }));
                        }
                    }}
                    required
                    disabled={loading}
                >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="DATE">Date</option>
                    <option value="TEXTAREA">Long Text</option>
                    <option value="SELECT">Dropdown</option>
                    <option value="RADIO">Radio Buttons</option>
                    <option value="CHECKBOX">Checkbox</option>
                </select>

                <label htmlFor="placeholder">
                    Placeholder
                </label>

                <input
                    id="placeholder"
                    type="text"
                    name="placeholder"
                    value={formData.placeholder}
                    onChange={handleChange}
                    placeholder="e.g. Enter annual turnover"
                    disabled={loading}
                />

                {/* Options: label + input spanning remaining columns */}

                {["SELECT", "RADIO"].includes(formData.fieldType) && (
                    <>
                        <label
                            htmlFor="options"
                            className="options-label"
                        >
                            Options *
                        </label>

                        <textarea
                            id="options"
                            name="options"
                            className="options-input"
                            value={formData.options}
                            onChange={handleChange}
                            placeholder="Trading, Manufacturing, Services"
                            required
                            disabled={loading}
                            rows={3}
                        />
                    </>
                )}

                {/* Checkbox and submit button use full-width rows */}

                <div className="client-field-checkbox client-field-full-width">
                    <label htmlFor="required">
                        <input
                            id="required"
                            type="checkbox"
                            name="required"
                            checked={formData.required}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        Required field
                    </label>
                </div>

                <div className="client-field-checkbox client-field-full-width">
                    <label htmlFor="active">
                        <input
                            id="active"
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        Active field
                    </label>
                </div>

                <button
                    type="submit"
                    className="client-field-submit client-field-full-width blue-btn"
                    disabled={loading || versionsLoading}
                >
                    {loading ? "Saving Field..." : "Create Field"}
                </button>
            </form>

            {message && (
                <p
                    className={`client-field-message ${messageType}`}
                    role="status"
                >
                    {message}
                </p>
            )}
        </div>
    );
};


