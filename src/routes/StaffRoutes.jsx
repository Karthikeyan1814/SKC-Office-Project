import { useState } from "react";
import PortalTopBar from "../components/PortalTopBar";
import Footer from "../components/Footer";
import "../styles/AdminRoute.css";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function StaffRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-route-container">
      <PortalTopBar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="admin-body-layout">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="admin-child-route">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
