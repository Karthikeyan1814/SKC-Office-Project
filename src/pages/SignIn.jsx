import { useState } from "react";
import "../styles/SignIn.css";
import { authLogin, sendForgotPasswordOtp, verifyAndResetPassword } from "../api/authlogin";
import { useNavigate } from "react-router-dom";

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

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp & new pass
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState({ type: "", text: "", devOtp: "" });

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
            <section className="signIn-layout">
                <div className="signin-left">
                    <img src="/main_logo.png" alt="SKC Logo" />
                    <h1>Sri Kathiravan &amp; Co.</h1>
                    <span className="signin-portal-badge">Chartered Tax &amp; Client Portal</span>
                    <p>Welcome to Sri Kathiravan &amp; Co. enterprise portal. If you are a new client, please schedule an initial appointment with our office desk.</p>
                    <p>Dashboard access is securely encrypted and managed by your designated tax consultant.</p>
                </div>

                <form className="signin-right" onSubmit={handleSubmit}>
                    <h1 className="grid1 signin-title">Sign In</h1>

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
                            Client
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange("staff")}
                            className={currentRole === "staff" ? "role-btn active" : "role-btn"}
                        >
                            Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange("admin")}
                            className={currentRole === "admin" ? "role-btn active" : "role-btn"}
                        >
                            Admin
                        </button>
                    </div>

                    <label htmlFor="username">Email or Mobile</label>
                    <input
                        type="text"
                        onChange={handleChange}
                        value={auth.username}
                        name="username"
                        id="username"
                        placeholder="Enter Registered Email or Mobile"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <div className="signin-pass-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            onChange={handleChange}
                            value={auth.password}
                            name="password"
                            id="password"
                            placeholder="Password"
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
                            Forgot Password? Reset via OTP
                        </button>
                    </div>

                    <p className="grid1 note-text">
                        <strong>First Time Sign-In:</strong> Enter your registered email/phone and your assigned temporary credentials. You will be prompted to set your personal security password upon first access.
                    </p>

                    <button type="submit" className="signin-submit-btn" disabled={loginLoading}>
                        {loginLoading ? "Authenticating..." : "Sign In to Portal"}
                    </button>
                </form>
            </section>

            {/* FORGOT PASSWORD MODAL */}
            {showForgotModal && (
                <div className="modal-backdrop-forgot">
                    <div className="forgot-modal-box">
                        <div className="forgot-modal-header">
                            <div>
                                <h3>Reset Password</h3>
                                <p className="forgot-subtitle">
                                    {forgotStep === 1
                                        ? "Step 1 of 2: Verify your registered email"
                                        : "Step 2 of 2: Enter 6-digit OTP & new password"}
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
                                <label>Registered Email Address</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="e.g. client@example.com"
                                    required
                                    autoFocus
                                />
                                <div className="forgot-modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowForgotModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="yellow-btn"
                                        disabled={forgotLoading}
                                    >
                                        {forgotLoading ? "Sending OTP..." : "Send 6-Digit OTP"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="forgot-form-body">
                                <div className="email-badge-row">
                                    <span>Sent to: <strong>{forgotEmail}</strong></span>
                                    <button
                                        type="button"
                                        className="btn-change-email"
                                        onClick={() => setForgotStep(1)}
                                    >
                                        Change Email
                                    </button>
                                </div>

                                <label>6-Digit Verification Code (OTP)</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={forgotOtp}
                                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    autoFocus
                                    className="otp-code-input"
                                />

                                <label>New Password</label>
                                <div className="signin-pass-wrapper" style={{ width: "100%" }}>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 4 characters"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pass-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? "👁️" : "🙈"}
                                    </button>
                                </div>

                                <label>Confirm New Password</label>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-type new password"
                                    required
                                />

                                <div className="forgot-modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={handleSendOtp}
                                        disabled={forgotLoading}
                                    >
                                        Resend Code
                                    </button>
                                    <button
                                        type="submit"
                                        className="yellow-btn"
                                        disabled={forgotLoading}
                                    >
                                        {forgotLoading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}