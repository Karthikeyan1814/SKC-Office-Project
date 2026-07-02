import Nav from "../components/Nav"
import Home from "../pages/Home"
import Footer from "../components/Footer"
import { Outlet } from "react-router-dom"
import ThemeCustomizer from "../hook/ThemeCustomizer"
export default function HomeRoute(){
    return(
        <div>
            <Nav />
             <ThemeCustomizer />
           <Outlet />
            <Footer></Footer>
        </div>
    )
}