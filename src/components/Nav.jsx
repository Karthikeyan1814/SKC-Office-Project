import "../styles/Nav.css";
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { HiOutlineSwatch } from "react-icons/hi2";
import { HashLink } from "react-router-hash-link";
import { useUniversalTheme } from "../context/ThemeContext";

export default function Nav() {
    const { setIsThemeModalOpen } = useUniversalTheme();
    const [open, setOpen] = useState(false);
    const [current ,setCurrent]=useState("admin");
    const role = typeof window !== "undefined" ? localStorage.getItem("skc-role") : null;
    const isAdmin = role === "ADMIN";

    return (
        <nav className="nav-container">

            <section className="nav-main-section">
                <img src="/skc-sub-logo.png" alt="Logo" />
                <h2>Sri Kathiravan & Co.,</h2>
            </section>

            {/* Mobile Burger */}
            <button
                className="menu-btn"
                onClick={() => setOpen(!open)}
            >
                {open ? <HiXMark /> : <HiBars3 />}
            </button>

        

             
            <ul className={`nav-section ${open ? "active" : ""}`}>

                <Link to="/" onClick={() => setOpen(false)}>
                    <li>Home</li>
                </Link>

                <HashLink smooth to="/#process">
                    <li>Process</li>
                </HashLink>

                <HashLink smooth to="/#service">
                    <li>Service</li>
                </HashLink>

                <HashLink smooth to="/#contact">
                    <li>Contacts</li>
                </HashLink>

                

                
                <NavLink to="actDetails"><li>Act File</li></NavLink>
                
                
                <NavLink to="/membership" onClick={() => setOpen(false)}>
                    <li>Membership</li>
                </NavLink>

                <li
                    style={{ cursor: "pointer", color: "goldenrod", fontWeight: "700" }}
                    onClick={() => {
                        setOpen(false);
                        window.dispatchEvent(new CustomEvent("open-public-booking"));
                    }}
                >
                    Book Call
                </li>

                {isAdmin && (
                    <li
                        style={{ cursor: "pointer", color: "var(--gold, #f59e0b)", fontWeight: "700" }}
                        onClick={() => {
                            setOpen(false);
                            setIsThemeModalOpen(true);
                        }}
                        className="mobile-btn"
                    >
                        🎨 Theme Colors (Admin)
                    </li>
                )}

                <NavLink to={"/SignIn"} onClick={() => setOpen(false)}>
                    <button className="yellow-btn mobile-btn">
                        Sign In
                    </button>
                </NavLink>

            </ul>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {isAdmin && (
                    <button
                        className="theme-nav-btn desktop-btn"
                        onClick={() => setIsThemeModalOpen(true)}
                        title="Universal Theme & Color Settings (Admin Only)"
                    >
                        <HiOutlineSwatch size={19} />
                    </button>
                )}

                <NavLink to={"/SignIn"}>
                    <button className="yellow-btn desktop-btn">
                        Sign In
                    </button>
                </NavLink>
            </div>

        </nav>
    );
}