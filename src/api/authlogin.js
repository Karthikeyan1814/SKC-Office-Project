import api from "./axiosInstance";

export const authLogin = async (url, data) => {

    try {

        console.log("API received data:", url, data);

        const response = await api.post(`/SignIn${url}`, data);

        const { token, role, name, id, isTempPass, isDeactivated, reconsultationRequested } = response.data;

        localStorage.setItem("skc-token", token);
        localStorage.setItem("skc-role", role);
        localStorage.setItem("skc-name", name || "");
        localStorage.setItem("skc-id", id || "");
        localStorage.setItem("skc-temppass", isTempPass ? "true" : "false");
        localStorage.setItem("skc-deactivated", isDeactivated ? "true" : "false");
        localStorage.setItem("skc-reconsultation-requested", reconsultationRequested ? "true" : "false");

        return response.data;

    } catch (error) {

        console.error("Login error:", error);

        throw error;
    }
};

export const sendForgotPasswordOtp = async (email) => {
    const response = await api.post("/SignIn/ForgotPassword/SendOtp", { email });
    return response.data;
};

export const verifyAndResetPassword = async (email, otp, newPassword) => {
    const response = await api.post("/SignIn/ForgotPassword/VerifyAndReset", { email, otp, newPassword });
    return response.data;
};