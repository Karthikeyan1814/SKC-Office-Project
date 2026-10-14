
import { Router, Routes ,Route} from 'react-router-dom'
import './App.css'
import Nav from './components/Nav'
import HomeRoute from './routes/HomeRoute'
import Home from './pages/Home'
import Membership from './pages/Membership'
import ActDetails from './pages/Actdetails'
import SignIn from './pages/SignIn'
import ClientForm from './pages/Settings/ClientForm'
import AdminRoutes from './routes/AdminRoutes'
import Overview from './pages/Overview'
import ProductionRoute from './routes/ProductionRoutes'
import ClientDetails from './pages/ClientDetails'
import LoadingAnimation from './components/LoadingAnimation'
import LoadingAnimation2 from './components/LoadingAnimation2'
import CustomizableClientForm from './pages/Settings/CustomizableClientForm'

function App() {
 return(

    <Routes>
    
        <Route path="/" element={<HomeRoute />}>
            <Route index element={<Home />} />
            <Route path="/membership" element={<Membership />} />
            <Route path='actDetails' element={<ActDetails />}></Route>
            <Route path='SignIn' element={<SignIn />}></Route>
        </Route>

        //Protection Layer for Dashboard
        <Route element={<ProductionRoute allowedRole={"ADMIN"}/>}>
            <Route path='/Admin' element={<AdminRoutes />}>
                <Route index element={<Overview />}></Route>
                <Route path='ClientDetails' element={<ClientDetails />}></Route>
                <Route path='EditClientForm' element={<CustomizableClientForm />}></Route>
            </Route>
        </Route>

        <Route element={<LoadingAnimation /> } path='/Loading'></Route>
        <Route element={<LoadingAnimation2 /> } path='/Loading2'></Route>
        
    </Routes>

 )
}

export default App
