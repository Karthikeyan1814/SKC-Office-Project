import "../styles/Nav.css";
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { HashLink } from "react-router-hash-link";
export default function Nav() {

    const [open, setOpen] = useState(false);

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
                    <li>About Us</li>
                </HashLink>

                <HashLink smooth to="/#service">
                    <li>Services</li>
                </HashLink>

                <HashLink smooth to="/#contact">
                    <li>Contact</li>
                </HashLink>

                <NavLink to="/membership" onClick={() => setOpen(false)}>
                    <li>Membership</li>
                </NavLink>


                <li>Book Call</li>
                <NavLink to="actDetails"><li>Act Details</li></NavLink>
                

                <button className="yellow-btn mobile-btn">
                    Sign In
                </button>

            </ul>

            <NavLink to={"/SignIn"}>
                <button className="yellow-btn desktop-btn">
                Sign In
            </button>
            </NavLink>

        </nav>
    );
}