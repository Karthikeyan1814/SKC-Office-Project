import Nav from "../components/Nav"
import Footer from "../components/Footer"
import "../styles/AdminRoute.css"
import Sidebar from "../components/Sidebar"
import { Outlet } from "react-router-dom"
export default function AdminRoutes(){
    return(
        <div className="admin-route-container">
            <Nav></Nav>
            <Sidebar />
        
            <div className="admin-child-route">
                <Outlet />
                 <Footer />
            </div>
               
        </div>
    )
}