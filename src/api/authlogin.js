import api from "./axiosInstance";

export const authLogin = async (url, data) => {
    try {
        console.log("API received data:", url, data);
        const response = await api.post(`/SignIn${url}`, data);

        // If staff requires Admin OTP verification
        if (response.data?.status === "OTP_REQUIRED") {
            return response.data;
        }

        const { token, role, name, id, mobile, email, gstin, pan, address, isTempPass, isDeactivated, reconsultationRequested } = response.data;

        if (token) localStorage.setItem("skc-token", token);
        if (role) localStorage.setItem("skc-role", role);
        if (name) localStorage.setItem("skc-name", name || "");
        if (id) localStorage.setItem("skc-id", id || "");
        if (mobile) localStorage.setItem("skc-mobile", mobile);
        if (email) localStorage.setItem("skc-email", email);
        if (gstin) localStorage.setItem("skc-gstin", gstin);
        if (pan) localStorage.setItem("skc-pan", pan);
        if (address) localStorage.setItem("skc-address", address);
        localStorage.setItem("skc-temppass", isTempPass ? "true" : "false");
        localStorage.setItem("skc-deactivated", isDeactivated ? "true" : "false");
        localStorage.setItem("skc-reconsultation-requested", reconsultationRequested ? "true" : "false");

        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const verifyStaffLoginOtp = async (sessionId, otp) => {
    const response = await api.post("/SignIn/Staff/VerifyOtp", { sessionId, otp });
    const { token, role, name, id } = response.data;
    if (token) localStorage.setItem("skc-token", token);
    if (role) localStorage.setItem("skc-role", role);
    if (name) localStorage.setItem("skc-name", name || "");
    if (id) localStorage.setItem("skc-id", id || "");
    return response.data;
};

export const resendStaffLoginOtp = async (sessionId) => {
    const response = await api.post("/SignIn/Staff/ResendOtp", { sessionId });
    return response.data;
};

export const sendForgotPasswordOtp = async (email) => {
    const response = await api.post("/SignIn/ForgotPassword/SendOtp", { email });
    return response.data;
};

export const verifyAndResetPassword = async (email, otp, newPassword) => {
    const response = await api.post("/SignIn/ForgotPassword/VerifyAndReset", { email, otp, newPassword });
    return response.data;
};