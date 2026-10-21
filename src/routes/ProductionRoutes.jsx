import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired, clearUserSession } from "../utils/tokenHelper";

const ProductionRoute = ({ allowedRole }) => {
    const token = localStorage.getItem("skc-token");
    const role = localStorage.getItem("skc-role");

    if (!token) {
        return <Navigate to="/SignIn" replace />;
    }

    // Check if 60-day token has expired
    if (isTokenExpired(token)) {
        clearUserSession(true, "Your 60-day session has expired. You have been automatically logged out.");
        return <Navigate to="/SignIn" replace />;
    }

    if (role !== allowedRole) {
        return <Navigate to="/Unauthorized" replace />;
    }
    
    return <Outlet />;
};

export default ProductionRoute;