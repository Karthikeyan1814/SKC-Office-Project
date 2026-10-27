import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import "../styles/SignIn.css";
import { authLogin, sendForgotPasswordOtp, verifyAndResetPassword, verifyStaffLoginOtp, resendStaffLoginOtp } from "../api/authlogin";
import { useNavigate } from "react-router-dom";

const TRANSLATIONS = {
    en: {
        firmName: "Sri Kathiravan & Co.",
        portalBadge: "Chartered Tax & Client Portal",
        welcomeMsg: "Welcome to Sri Kathiravan & Co. enterprise portal. If you are a new client, please schedule an initial appointment with our office desk.",
        consultantMsg: "Dashboard access is securely encrypted and managed by your designated tax consultant.",
        signInTitle: "Sign In",
        roles: {
            client: "Client",
            staff: "Staff",
            admin: "Admin",
        },
        usernameLabel: "Email or Mobile",
        usernamePlaceholder: "Enter Registered Email or Mobile",
        passwordLabel: "Password",
        passwordPlaceholder: "Password",
        forgotBtn: "Forgot Password? Reset via OTP",
        firstTimeNoteTitle: "First Time Sign-In:",
        firstTimeNoteDesc: "Enter your registered email/phone and your assigned temporary credentials. You will be prompted to set your personal security password upon first access.",
        signInBtn: "Sign In to Portal",
        authenticating: "Authenticating...",
        translateBtnText: "Translate to தமிழ் (Tamil)",
        translateActiveText: "தமிழ் (இயங்குகிறது) • English",

        // Forgot Modal
        modalTitle: "Reset Password",
        step1Sub: "Step 1 of 2: Verify your registered email",
        step2Sub: "Step 2 of 2: Enter 6-digit OTP & new password",
        emailLabel: "Registered Email Address",
        emailPlaceholder: "e.g. client@example.com",
        sendOtpBtn: "Send 6-Digit OTP",
        sendingOtp: "Sending OTP...",
        cancelBtn: "Cancel",
        sentTo: "Sent to:",
        changeEmail: "Change Email",
        otpLabel: "6-Digit Verification Code (OTP)",
        otpPlaceholder: "Enter 6-digit OTP",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "Min 4 characters",
        confirmPasswordLabel: "Confirm New Password",
        confirmPasswordPlaceholder: "Re-type new password",
        resendCode: "Resend Code",
        resetPasswordBtn: "Reset Password",
        resetting: "Resetting...",
    },
    ta: {
        firmName: "ஸ்ரீ கதிரவன் & கோ.",
        portalBadge: "பட்டய வரி ஆலோசகர் & வாடிக்கையாளர் தளம்",
        welcomeMsg: "ஸ்ரீ கதிரவன் & கோ நிறுவன பிரத்யேக போர்ட்டலுக்கு வரவேற்கிறோம். புதிய வாடிக்கையாளர் எனில், எங்கள் அலுவலக மேசையுடன் முன்பதிவு செய்யவும்.",
        consultantMsg: "டாஷ்போர்டு அணுகல் உங்கள் நியமிக்கப்பட்ட வரி ஆலோசகரால் பாதுகாப்பாக நிர்வகிக்கப்படுகிறது.",
        signInTitle: "உள்நுழைவு",
        roles: {
            client: "வாடிக்கையாளர்",
            staff: "பணியாளர்",
            admin: "நிர்வாகி",
        },
        usernameLabel: "மின்னஞ்சல் அல்லது கைபேசி எண்",
        usernamePlaceholder: "பதிவுசெய்த மின்னஞ்சல் அல்லது கைபேசி எண் உள்ளிடவும்",
        passwordLabel: "கடவுச்சொல்",
        passwordPlaceholder: "ரகசிய கடவுச்சொல் உள்ளிடவும்",
        forgotBtn: "கடவுச்சொல் மறந்துவிட்டதா? OTP மூலம் மீட்டமைக்க",
        firstTimeNoteTitle: "முதல் முறை உள்நுழைவு:",
        firstTimeNoteDesc: "உங்கள் பதிவுசெய்த மின்னஞ்சல்/தொலைபேசி மற்றும் வழங்கப்பட்ட தற்காலிக கடவுச்சொல்லை உள்ளிடவும். முதல் அணுகலில் புதிய கடவுச்சொல்லை அமைக்கும்படி கேட்கப்படுவீர்கள்.",
        signInBtn: "தளத்திற்குள் நுழையவும்",
        authenticating: "சரிபார்க்கிறது...",
        translateBtnText: "Translate to தமிழ் (Tamil)",
        translateActiveText: "தமிழ் (இயங்குகிறது) • English",

        // Forgot Modal
        modalTitle: "கடவுச்சொல்லை மீட்டமைக்க",
        step1Sub: "படி 1 / 2: பதிவுசெய்த மின்னஞ்சலை சரிபார்க்கவும்",
        step2Sub: "படி 2 / 2: 6 இலக்க OTP & புதிய கடவுச்சொல் உள்ளிடவும்",
        emailLabel: "பதிவுசெய்த மின்னஞ்சல் முகவரி",
        emailPlaceholder: "உதா: client@example.com",
        sendOtpBtn: "6-இலக்க OTP அனுப்பவும்",
        sendingOtp: "OTP அனுப்புகிறது...",
        cancelBtn: "ரத்து செய்",
        sentTo: "அனுப்பப்பட்ட மின்னஞ்சல்:",
        changeEmail: "மின்னஞ்சலை மாற்று",
        otpLabel: "6-இலக்க சரிபார்ப்புக் குறியீடு (OTP)",
        otpPlaceholder: "6-இலக்க OTP உள்ளிடவும்",
        newPasswordLabel: "புதிய கடவுச்சொல்",
        newPasswordPlaceholder: "குறைந்தது 4 எழுத்துக்கள்",
        confirmPasswordLabel: "புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்",
        confirmPasswordPlaceholder: "புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடவும்",
        resendCode: "குறியீட்டை மீண்டும் அனுப்பு",
        resetPasswordBtn: "கடவுச்சொல்லை மீட்டமை",
        resetting: "மாற்றப்படுகிறது...",
    }
};

export default function SignIn() {
    const [currentRole, setCurrentRole] = useState("client");
    const [redirectUrl, setRedirectUrl] = useState("/Client");
    const [auth, setAuth] = useState({
        username: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [isTamil, setIsTamil] = useState(false);

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp & new pass
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState({ type: "", text: "", devOtp: "" });

    // Staff Login Authorization with Admin Email OTP
    const [staffOtpModal, setStaffOtpModal] = useState({
        open: false,
        sessionId: "",
        staffName: "",
        adminEmailMasked: "",
        otp: "",
        loading: false,
        resending: false,
        error: "",
        successMsg: "",
    });

    const t = isTamil ? TRANSLATIONS.ta : TRANSLATIONS.en;

    const navigate = useNavigate();

    const handleRoleChange = (role) => {
        setCurrentRole(role);
        if (role === "client") setRedirectUrl("/Client");
        else if (role === "staff") setRedirectUrl("/Staff");
        else if (role === "admin") setRedirectUrl("/Admin");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuth({ ...auth, [name]: value });
        setLoginError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);
        try {
            const response = await authLogin(redirectUrl, auth);
            if (response.status === "OTP_REQUIRED") {
                const adminList = response.adminEmailMasked || "all Administrators";
                toast.success(`Authorization code dispatched to all Administrators (${adminList})!`, {
                    duration: 6000,
                    icon: "🔐",
                });
                setStaffOtpModal({
                    open: true,
                    sessionId: response.sessionId,
                    staffName: response.staffName || auth.username,
                    adminEmailMasked: response.adminEmailMasked || "Administrator Email",
                    otp: "",
                    loading: false,
                    resending: false,
                    error: "",
                    successMsg: response.message || "An authorization OTP has been dispatched to all Admin emails.",
                });
                return;
            }
            if (response.status === "success") {
                if (response.role === "ADMIN") {
                    navigate("/Admin");
                } else if (response.role === "STAFF") {
                    navigate("/Staff");
                } else if (response.role === "CLIENT") {
                    navigate("/Client");
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid credentials or server error. Please try again.";
            setLoginError(msg);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleVerifyStaffOtp = async (e) => {
        e.preventDefault();
        if (!staffOtpModal.otp || staffOtpModal.otp.trim().length !== 6) {
            setStaffOtpModal(prev => ({ ...prev, error: "Please enter the 6-digit OTP provided by Admin." }));
            return;
        }

        setStaffOtpModal(prev => ({ ...prev, loading: true, error: "" }));
        try {
            const res = await verifyStaffLoginOtp(staffOtpModal.sessionId, staffOtpModal.otp.trim());
            if (res.status === "success") {
                setStaffOtpModal(prev => ({ ...prev, open: false }));
                navigate("/Staff");
            } else {
                setStaffOtpModal(prev => ({ ...prev, error: res.message || "Invalid OTP code." }));
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Verification failed. Please check the OTP or try logging in again.";
            setStaffOtpModal(prev => ({ ...prev, error: msg }));
        } finally {
            setStaffOtpModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleResendStaffOtp = async () => {
        setStaffOtpModal(prev => ({ ...prev, resending: true, error: "", successMsg: "" }));
        try {
            const res = await resendStaffLoginOtp(staffOtpModal.sessionId);
            const adminList = res.adminEmailMasked || staffOtpModal.adminEmailMasked || "all Administrators";
            toast.success(`New authorization OTP sent to all Administrators (${adminList})!`, {
                duration: 6000,
                icon: "✉️",
            });
            setStaffOtpModal(prev => ({
                ...prev,
                resending: false,
                adminEmailMasked: res.adminEmailMasked || prev.adminEmailMasked,
                successMsg: res.message || "A fresh authorization code has been dispatched to all Admin emails."
            }));
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to resend OTP. Please try again.";
            toast.error(msg);
            setStaffOtpModal(prev => ({
                ...prev,
                resending: false,
                error: msg
            }));
        }
    };

    // Open Forgot Password
    const handleOpenForgot = () => {
        setForgotStep(1);
        setForgotOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setForgotMsg({ type: "", text: "", devOtp: "" });
        // Auto-fill email if user already typed one in the login field
        if (auth.username && auth.username.includes("@")) {
            setForgotEmail(auth.username.trim());
        }
        setShowForgotModal(true);
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!forgotEmail || !forgotEmail.includes("@")) {
            setForgotMsg({ type: "error", text: "Please enter a valid email address.", devOtp: "" });
            return;
        }

        setForgotLoading(true);
        setForgotMsg({ type: "", text: "", devOtp: "" });

        try {
            const res = await sendForgotPasswordOtp(forgotEmail.trim().toLowerCase());
            if (res.status === "success") {
                setForgotMsg({
                    type: "success",
                    text: res.message || "OTP sent successfully to your email!",
                    devOtp: res.devOtp || ""
                });
                setForgotStep(2);
            } else {
                setForgotMsg({ type: "error", text: res.message || "Failed to send OTP.", devOtp: "" });
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || "Could not send OTP. Please check your email and try again.";
            setForgotMsg({ type: "error", text: errMsg, devOtp: "" });
        } finally {
            setForgotLoading(false);
        }
    };

    // Step 2: Verify & Reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!forgotOtp || forgotOtp.trim().length !== 6) {
            setForgotMsg({ type: "error", text: "Please enter the 6-digit OTP sent to your email." });
            return;
        }
        if (!newPassword || newPassword.length < 4) {
            setForgotMsg({ type: "error", text: "Password must be at least 4 characters long." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setForgotMsg({ type: "error", text: "Passwords do not match." });
            return;
        }

        setForgotLoading(true);
        try {
            const res = await verifyAndResetPassword(forgotEmail.trim().toLowerCase(), forgotOtp.trim(), newPassword);
            if (res.status === "success") {
                setForgotMsg({
                    type: "success",
                    text: res.message || "Password reset successfully! You can now log in."
                });
                // Pre-fill username and new password in main form
                setAuth({ username: forgotEmail, password: newPassword });
                setTimeout(() => {
                    setShowForgotModal(false);
                }, 1800);
            } else {
                setForgotMsg({ type: "error", text: res.message || "Password reset failed." });
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
            setForgotMsg({ type: "error", text: errMsg });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="signin-container">
            {/* TOP TRANSLATION ACTION BAR */}
            <div className="signin-top-bar">
                <button
                    type="button"
                    className={`signin-translate-btn ${isTamil ? "active-tamil" : ""}`}
                    onClick={() => setIsTamil((prev) => !prev)}
                    title={isTamil ? "Switch to English" : "தமிழ் மொழிக்கு மாற்றுக"}
                    id="signin-lang-translate-btn"
                >
                    🌐 {isTamil ? t.translateActiveText : t.translateBtnText}
                </button>
            </div>

            <section className="signIn-layout">
                <div className="signin-left">
                    <img src="/main_logo.png" alt="SKC Logo" />
                    <h1>{t.firmName}</h1>
                    <span className="signin-portal-badge">{t.portalBadge}</span>
                    <p>{t.welcomeMsg}</p>
                    <p>{t.consultantMsg}</p>
                </div>

                <form className="signin-right" onSubmit={handleSubmit}>
                    <div className="grid1 signin-header-row">
                        <h1 className="signin-title">{t.signInTitle}</h1>
                        <button
                            type="button"
                            className={`signin-inline-translate ${isTamil ? "active-tamil" : ""}`}
                            onClick={() => setIsTamil((prev) => !prev)}
                            title={isTamil ? "Switch to English" : "Translate to தமிழ்"}
                        >
                            🌐 {isTamil ? "EN" : "தமிழ்"}
                        </button>
                    </div>

                    {loginError && (
                        <div className="grid1 login-error-banner">
                            ⚠️ {loginError}
                        </div>
                    )}

                    <div className="sign-role-cont grid1">
                        <button
                            type="button"
                            onClick={() => handleRoleChange("client")}
                            className={currentRole === "client" ? "role-btn active" : "role-btn"}
                        >
                            {t.roles.client}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange("staff")}
                            className={currentRole === "staff" ? "role-btn active" : "role-btn"}
                        >
                            {t.roles.staff}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange("admin")}
                            className={currentRole === "admin" ? "role-btn active" : "role-btn"}
                        >
                            {t.roles.admin}
                        </button>
                    </div>

                    <label htmlFor="username">{t.usernameLabel}</label>
                    <input
                        type="text"
                        onChange={handleChange}
                        value={auth.username}
                        name="username"
                        id="username"
                        placeholder={t.usernamePlaceholder}
                        required
                    />

                    <label htmlFor="password">{t.passwordLabel}</label>
                    <div className="signin-pass-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            onChange={handleChange}
                            value={auth.password}
                            name="password"
                            id="password"
                            placeholder={t.passwordPlaceholder}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-pass-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "👁️" : "🙈"}
                        </button>
                    </div>

                    <div className="grid1 forgot-link-row">
                        <button
                            type="button"
                            onClick={handleOpenForgot}
                            className="forgot-pass-trigger"
                        >
                            {t.forgotBtn}
                        </button>
                    </div>

                    <p className="grid1 note-text">
                        <strong>{t.firstTimeNoteTitle} </strong>
                        {t.firstTimeNoteDesc}
                    </p>

                    <button type="submit" className="signin-submit-btn" disabled={loginLoading}>
                        {loginLoading ? t.authenticating : t.signInBtn}
                    </button>
                </form>
            </section>

            {/* FORGOT PASSWORD MODAL */}
            {showForgotModal && typeof document !== "undefined" && createPortal(
                <div className="modal-backdrop-forgot" onClick={() => setShowForgotModal(false)}>
                    <div className="forgot-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="forgot-modal-header">
                            <div>
                                <h3>{t.modalTitle}</h3>
                                <p className="forgot-subtitle">
                                    {forgotStep === 1
                                        ? t.step1Sub
                                        : t.step2Sub}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="forgot-close-btn"
                                onClick={() => setShowForgotModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {forgotMsg.text && (
                            <div className={`forgot-alert ${forgotMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                <span>{forgotMsg.type === "success" ? "✅" : "⚠️"} {forgotMsg.text}</span>
                            </div>
                        )}

                        {forgotStep === 1 ? (
                            <form onSubmit={handleSendOtp} className="forgot-form-body">
                                <label>{t.emailLabel}</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    required
                                    autoFocus
                                />
                                <div className="forgot-modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowForgotModal(false)}
                                    >
                                        {t.cancelBtn}
                                    </button>
                                    <button
                                        type="submit"
                                        className="yellow-btn"
                                        disabled={forgotLoading}
                                    >
                                        {forgotLoading ? t.sendingOtp : t.sendOtpBtn}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="forgot-form-body">
                                <div className="email-badge-row">
                                    <span>{t.sentTo} <strong>{forgotEmail}</strong></span>
                                    <button
                                        type="button"
                                        className="btn-change-email"
                                        onClick={() => setForgotStep(1)}
                                    >
                                        {t.changeEmail}
                                    </button>
                                </div>

                                <label>{t.otpLabel}</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={forgotOtp}
                                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder={t.otpPlaceholder}
                                    required
                                    autoFocus
                                    className="otp-code-input"
                                />

                                <label>{t.newPasswordLabel}</label>
                                <div className="signin-pass-wrapper" style={{ width: "100%" }}>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t.newPasswordPlaceholder}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pass-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        title={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? "👁️" : "🙈"}
                                    </button>
                                </div>

                                <label>{t.confirmPasswordLabel}</label>
                                <div className="signin-pass-wrapper" style={{ width: "100%" }}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t.confirmPasswordPlaceholder}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pass-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? "👁️" : "🙈"}
                                    </button>
                                </div>

                                <div className="forgot-modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={handleSendOtp}
                                        disabled={forgotLoading}
                                    >
                                        {t.resendCode}
                                    </button>
                                    <button
                                        type="submit"
                                        className="yellow-btn"
                                        disabled={forgotLoading}
                                    >
                                        {forgotLoading ? t.resetting : t.resetPasswordBtn}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* ─── STAFF LOGIN: ADMIN AUTHORIZATION OTP MODAL ─── */}
            {staffOtpModal.open && typeof document !== "undefined" && createPortal(
                <div className="staff-auth-modal-overlay" onClick={() => setStaffOtpModal(prev => ({ ...prev, open: false }))}>
                    <div className="staff-auth-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="forgot-modal-header" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.12)", paddingBottom: "14px", marginBottom: "18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.45)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)"
                                }}>
                                    🔐
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.2px" }}>
                                        Admin Authorization Required
                                    </h3>
                                    <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "700", letterSpacing: "0.4px" }}>
                                        Two-Tier Security Check • Staff Portal
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="forgot-close-btn"
                                onClick={() => setStaffOtpModal(prev => ({ ...prev, open: false }))}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleVerifyStaffOtp} className="forgot-form-body">
                            <div className="staff-auth-info-card">
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Staff Member:</span>
                                    <span style={{ color: "#93c5fd", background: "rgba(59, 130, 246, 0.22)", border: "1px solid rgba(59, 130, 246, 0.4)", padding: "2px 10px", borderRadius: "6px", fontWeight: "800" }}>
                                        {staffOtpModal.staffName}
                                    </span>
                                </div>
                                <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "#cbd5e1", lineHeight: "1.6" }}>
                                    Your password has been verified. To complete sign-in, an authorization code was dispatched to <strong>all Administrators</strong>:
                                </p>
                                <div style={{ margin: "10px 0" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {(staffOtpModal.adminEmailMasked || "").split(",").map((email, idx) => (
                                            <div key={idx} style={{
                                                background: "rgba(34, 197, 94, 0.15)",
                                                border: "1px solid rgba(34, 197, 94, 0.35)",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                color: "#86efac",
                                                fontSize: "12.5px",
                                                fontWeight: "700",
                                                fontFamily: "monospace",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}>
                                                <span>📬 Admin {idx + 1}:</span>
                                                <span style={{ color: "#ffffff" }}>{email.trim()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>👉</span> Please obtain the 6-digit OTP from your Administrator to authorize this session.
                                </p>
                            </div>

                            {staffOtpModal.successMsg && (
                                <div className="forgot-alert alert-success" style={{ marginBottom: "14px" }}>
                                    ✓ {staffOtpModal.successMsg}
                                </div>
                            )}

                            {staffOtpModal.error && (
                                <div className="forgot-alert alert-error" style={{ marginBottom: "14px" }}>
                                    ⚠️ {staffOtpModal.error}
                                </div>
                            )}

                            <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "8px", display: "block" }}>
                                Enter 6-Digit Admin Authorization Code:
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                autoFocus
                                value={staffOtpModal.otp}
                                onChange={(e) => setStaffOtpModal(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, "") }))}
                                placeholder="• • • • • •"
                                className="staff-auth-otp-input"
                                required
                            />

                            <div className="forgot-modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleResendStaffOtp}
                                    disabled={staffOtpModal.resending || staffOtpModal.loading}
                                    style={{
                                        fontSize: "12px",
                                        background: "rgba(255, 255, 255, 0.08)",
                                        border: "1px solid rgba(255, 255, 255, 0.16)",
                                        color: "#cbd5e1"
                                    }}
                                >
                                    {staffOtpModal.resending ? "Resending to All Admins..." : "Resend Code to All Admins"}
                                </button>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setStaffOtpModal(prev => ({ ...prev, open: false }))}
                                        disabled={staffOtpModal.loading}
                                        style={{
                                            background: "rgba(255, 255, 255, 0.08)",
                                            border: "1px solid rgba(255, 255, 255, 0.16)",
                                            color: "#cbd5e1"
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="yellow-btn"
                                        disabled={staffOtpModal.loading || staffOtpModal.otp.length !== 6}
                                        style={{
                                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                            color: "#ffffff",
                                            fontWeight: "800",
                                            padding: "10px 20px",
                                            borderRadius: "9px",
                                            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)"
                                        }}
                                    >
                                        {staffOtpModal.loading ? "Verifying..." : "Authorize & Sign In"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}