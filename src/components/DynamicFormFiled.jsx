const DynamicField = ({
    field,
    formData,
    setFormData
}) => {

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [field.fieldKey]: e.target.value
        });
    };

    if (field.fieldType === "TEXT") {
        return (
            <div className="dynamic-form-layout-child form-field-group">
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <input
                    type="text"
                    name={field.fieldKey}
                    placeholder={field.placeholder || `Enter ${field.fieldLabel}`}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                />
            </div>
        );
    }

    if (field.fieldType === "NUMBER") {
        return (
            <div className="dynamic-form-layout-child form-field-group">
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <input
                    type="number"
                    name={field.fieldKey}
                    placeholder={field.placeholder || `Enter ${field.fieldLabel}`}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                />
            </div>
        );
    }

    if (field.fieldType === "EMAIL") {
        return (
            <div className="dynamic-form-layout-child form-field-group">
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <input
                    type="email"
                    name={field.fieldKey}
                    placeholder={field.placeholder || `Enter ${field.fieldLabel}`}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                />
            </div>
        );
    }

    if (field.fieldType === "DATE") {
        return (
            <div className="dynamic-form-layout-child form-field-group">
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <input
                    type="date"
                    name={field.fieldKey}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                />
            </div>
        );
    }

    if (field.fieldType === "TEXTAREA") {
        return (
            <div className="dynamic-form-layout-child form-field-group" style={{ gridColumn: "span 2" }}>
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <textarea
                    name={field.fieldKey}
                    placeholder={field.placeholder || `Enter ${field.fieldLabel}`}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                    rows={3}
                />
            </div>
        );
    }

    if (field.fieldType === "SELECT") {
        const options = field.options ? field.options.split(",") : [];

        return (
            <div className="dynamic-form-layout-child form-field-group">
                <label>
                    {field.fieldLabel} {field.required && <span className="req">*</span>}
                </label>
                <select
                    name={field.fieldKey}
                    required={field.required}
                    value={formData[field.fieldKey] || ""}
                    onChange={handleChange}
                >
                    <option value="">Select {field.fieldLabel}</option>
                    {options.map((option) => (
                        <option key={option} value={option.trim()}>
                            {option.trim()}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return null;
};

export default DynamicField;