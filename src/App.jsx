
import { Router, Routes ,Route} from 'react-router-dom'
import './App.css'
import Nav from './components/Nav'
import HomeRoute from './routes/HomeRoute'
import Home from './pages/Home'
import Membership from './pages/Membership'
import ActDetails from './pages/Actdetails'
import SignIn from './pages/SignIn'
import AdminRoutes from './routes/AdminRoutes'
import Overview from './pages/Overview'
function App() {
 return(

    <Routes>
    
        <Route path="/" element={<HomeRoute />}>
            <Route index element={<Home />} />
            <Route path="membership" element={<Membership />} />
            <Route path='actDetails' element={<ActDetails />}></Route>
            <Route path='SignIn' element={<SignIn />}></Route>
        </Route>

        <Route path='/Admin' element={<AdminRoutes></AdminRoutes>}>
            <Route index element={<Overview />}></Route>
        </Route>
    </Routes>

 )
}

export default App
