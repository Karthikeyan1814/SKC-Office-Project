import api from "./axiosInstance";

export const authLogin = async (url, data) => {

    try {

        console.log("API received data:", url, data);

        const response = await api.post(`/SignIn${url}`, data);

        const { token, role } = response.data;

        localStorage.setItem("skc-token", token);
        localStorage.setItem("skc-role", role);

        return response.data;

    } catch (error) {

        console.error("Login error:", error);

        throw error;
    }
};