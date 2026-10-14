import { useEffect, useState } from "react"
import "../styles/SignIn.css"

import { authLogin } from "../api/authlogin";
import { useNavigate } from "react-router-dom";
export default function SignIn() {

    const [currentRole, setCurrentRole] = useState("client");
    const [auth, setAuth] = useState({
        username: "",
        password: ""
    })

    const navigate = useNavigate();

    const [redirectUrl, setRedirectUrl] = useState("")

    const handleRoleChange = (e) => {
        console.log(e)
        setCurrentRole(e);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuth({ ...auth, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await authLogin(redirectUrl, auth);
            console.log(response);

            if (response.status === "success") {

                if (response.role === "ADMIN") {
                    navigate("/Admin");
                }

                else if (response.role === "CLIENT") {
                    navigate("/Client");
                }
            }
        } catch (error) {
            alert("Somthing went wrong ", error);
        }
    }
    return (
        <div className="signin-container">

            <section className="signIn-layout">
                <div className="signin-left">
                    <img src="/main_logo.png" alt="" />
                    <h1>Welcome To Sri Kathiravan & Co </h1>
                    <h2 style={{ color: "red" }}>Service Portal</h2>
                    <p>Note : If You New to this Platform , Pls Go to Book Call in Nav Bar at Top </p>
                    <p>The Dashboard is Only Open , When you have Authorize from Auditor </p>
                </div>
                <form className="signin-right">
                    <h1 className="grid1" style={{ color: "goldenrod" }}>Sign In</h1>
                    <div className="sign-role-cont grid1">
                        <div onClick={() => { handleRoleChange("client"); setRedirectUrl("/Client") }} style={{ display: "grid", placeContent: "center" }} className={currentRole === "client" ? "yellow-btn" : "blue-btn sign-role-btn"}>Client</div>
                        <div onClick={() => { handleRoleChange("staff"); setRedirectUrl("/Staff") }} style={{ display: "grid", placeContent: "center" }} className={currentRole === "staff" ? "yellow-btn" : "blue-btn sign-role-btn"}>Staff</div>
                        <div onClick={() => { handleRoleChange("admin"); setRedirectUrl("/Admin") }} style={{ display: "grid", placeContent: "center" }} className={currentRole === "admin" ? "yellow-btn" : "blue-btn sign-role-btn"}>Admin</div>
                    </div>
                    <label htmlFor="username">Email or Mobile</label>
                    <input type="text" onChange={handleChange} value={auth.username} name="username" id="username" placeholder="Enter Email or Mobile " />
                    <label htmlFor="password">Password</label>
                    <input type="text" onChange={handleChange} value={auth.password} name="password" id="password" placeholder="Password" />
                    <p className="grid1">Note : If This is your first time signin , Please Enter the Email or Phone , And the Password as Last Four Digit with BirthYear</p>
                    <p className="grid1">Eg : Phone :  +91 88565225454 , Birth Year :2000 and In Become 54542000 it is ur first  time password</p>
                    <span></span>  <button className="blue-btn" onClick={handleSubmit}>Sign In</button>
                </form>
            </section>

        </div>
    )
}