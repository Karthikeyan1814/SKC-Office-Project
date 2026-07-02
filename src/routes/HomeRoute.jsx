import Nav from "../components/Nav"
import Home from "../pages/Home"
import Footer from "../components/Footer"
import { Outlet } from "react-router-dom"
export default function HomeRoute(){
    return(
        <div>
            <Nav />
           <Outlet />
            <Footer></Footer>
        </div>
    )
}