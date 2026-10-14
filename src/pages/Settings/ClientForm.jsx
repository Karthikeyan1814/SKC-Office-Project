
import "../../styles/SettingsStyles/ClientForm.css";
import "../../styles/Detailspage.css";

import api from "../../api/axiosInstance";
import DynamicField from "../../components/DynamicFormFiled";
import LoadingAnimation2 from "../../components/LoadingAnimation2";

import { useEffect, useState } from "react";

export default function ClientForm({
    editClient,
    isDisabled,
    handleOpenAddField,
    handleOpenDeactiavte
}) {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});

    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState("");

    const [loadingVersions, setLoadingVersions] = useState(false);
    const [loadingFields, setLoadingFields] = useState(false);
    const [error, setError] = useState("");

    // STEP 1: Load available form versions
    useEffect(() => {
        const loadVersions = async () => {
            setLoadingVersions(true);
            setError("");

            try {
                const response = await api.get(
                    "/Admin/ClientForm/Versions"
                );

                const versionList = response.data;
                setVersions(versionList);

                if (versionList.length > 0) {
                    setSelectedVersion(String(versionList[0]));
                } else {
                    setSelectedVersion("");
                    setFields([]);
                }
            } catch (error) {
                console.error("Error loading form versions:", error);
                setError("Unable to load form versions.");
            } finally {
                setLoadingVersions(false);
            }
        };

        loadVersions();
    }, []);

    // STEP 2: Load fields whenever the selected version changes
    useEffect(() => {
        if (!selectedVersion) {
            setFields([]);
            return;
        }

        const loadFields = async () => {
            setLoadingFields(true);
            setError("");

            try {
                const response = await api.get(
                    "/Admin/ClientForm/Fields",
                    {
                        params: {
                            formversion: Number(selectedVersion)
                        }
                    }
                );

                setFields(response.data);
            } catch (error) {
                console.error("Error loading dynamic fields:", error);
                setFields([]);
                setError("Unable to load fields for this form version.");
            } finally {
                setLoadingFields(false);
            }
        };

        loadFields();
    }, [selectedVersion]);

    return (
        <div className="client-box">

            {editClient && (
                <>
                    <h1
                        style={{
                            fontFamily: "var(--font3)",
                            color: "var(--primary)"
                        }}
                    >
                        Client Form Settings
                    </h1>

                    <section className="client-top-buttons">
                        <button
                            type="button"
                            className="blue-btn"
                            onClick={handleOpenAddField}
                        >
                            Add New Field
                        </button>

                        <button
                            type="button"
                            className="blue-btn"
                            onClick={handleOpenDeactiavte}
                        >
                            Manage Existing Field
                        </button>
                    </section>

                    <h3
                        style={{
                            textAlign: "center",
                            color: "var(--primary)",
                            fontFamily: "var(--font3)"
                        }}
                    >
                        Preview of Client Form
                    </h3>
                </>
            )}

            <form
                className="client-settings-cont common-form-layout disabled-form"
                onSubmit={(event) => event.preventDefault()}
            >
                <h2>Basic Details</h2>

                <label>Client Name</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    required
                    name="name"
                />

                <label>Legal Name</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    name="legalname"
                    placeholder="Company / Organization / Shop Name"
                />

                <label>Mobile Number</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    required
                    name="mobile"
                />

                <label>Email</label>
                <input
                    type="email"
                    disabled={!isDisabled}
                    required
                    name="email"
                />

                <label>GST Number</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    required
                    name="gstnumber"
                />

                <label>PAN Number</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    required
                    name="pannumber"
                />

                <label>Temp Password</label>
                <input
                    type="password"
                    disabled={!isDisabled}
                    required
                    name="password"
                />

                <label>Location</label>
                <input
                    type="text"
                    disabled={!isDisabled}
                    required
                    name="location"
                />

                <p
                    style={{
                        gridColumn: "span 2",
                        textAlign: "center",
                        color: "red"
                    }}
                >
                    * The temporary password is used to provide dedicated
                    access to this client. The client can reset it after login.
                </p>

                <hr
                    style={{
                        gridColumn: "span 4",
                        border: "2px solid var(--lite)",
                        borderRadius: "2px",
                        margin: "10px 0"
                    }}
                />

                <h2>Additional Details</h2>

                {/* STEP 3: Form version selector */}
                <div
                    style={{
                        gridColumn: "span 4",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "12px"
                    }}
                >
                    <label
                        htmlFor="formVersion"
                        style={{ margin: 0 }}
                    >
                        Select Form Version
                    </label>

                    <select
                        id="formVersion"
                        value={selectedVersion}
                        onChange={(event) => {
                            setSelectedVersion(event.target.value);
                        }}
                        disabled={
                            loadingVersions || versions.length === 0
                        }
                    >
                        {versions.length === 0 && (
                            <option value="">
                                No versions available
                            </option>
                        )}

                        {versions.map((version) => (
                            <option key={version} value={String(version)}>
                                Version {version}
                            </option>
                        ))}
                    </select>
                </div>

                {/* STEP 4: Show fields belonging to the selected version */}
                {loadingVersions || loadingFields ? (
                    <div style={{ gridColumn: "span 4" }}>
                        <LoadingAnimation2 />
                    </div>
                ) : error ? (
                    <p
                        style={{
                            gridColumn: "span 4",
                            color: "red",
                            textAlign: "center"
                        }}
                    >
                        {error}
                    </p>
                ) : fields.length === 0 ? (
                    <p
                        style={{
                            gridColumn: "span 4",
                            textAlign: "center"
                        }}
                    >
                        No additional fields found for this version.
                    </p>
                ) : (
                    <div
                        className="dynamic-form-layout"
                        style={{ gridColumn: "span 4" }}
                    >
                        {fields.map((field) => (
                            <DynamicField
                                key={field.id}
                                field={field}
                                formData={formData}
                                setFormData={setFormData}
                            />
                        ))}
                    </div>
                )}

                {!editClient && (
                    <button
                        type="submit"
                        style={{ gridColumn: "span 4" }}
                        className="blue-btn"
                    >
                        Submit
                    </button>
                )}
            </form>
        </div>
    );
}
