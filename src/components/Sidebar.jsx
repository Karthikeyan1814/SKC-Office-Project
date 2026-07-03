import { useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    "Overview",
    "Access Management",
    "Edit Clients",
    "Manage Membership",
    "File Management",
    "My Space",
    "Edit Web",
    "Sign Out",
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`sidebar-container ${open ? "open" : ""}`}>

        {/* Header */}
        <div className="sidebar-header">

          <div
            className={`burger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="header-title">
            <h3>Dashboard</h3>
            <p>Administration</p>
          </div>

        </div>

        {/* Menu */}

        <ul className="sidebar-menu">

          {menuItems.map((item, index) => (
            <li key={index}>
              {item}
            </li>
          ))}

        </ul>

      </div>
    </>
  );
}