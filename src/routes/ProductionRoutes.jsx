import { Navigate ,Outlet } from "react-router-dom"

const ProductionRoute =({allowedRole})=>{
    const token = localStorage.getItem("skc-token");
    const role =localStorage.getItem("skc-role");

    if(!token){
        return <Navigate to={"/SignIn"} replace />
    }
    if(role !== allowedRole){
        return <Navigate to={"/Unauthorized"} replace />
    }
    
    return <Outlet />
}

export default ProductionRoute;