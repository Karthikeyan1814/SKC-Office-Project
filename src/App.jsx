
import { Router, Routes ,Route} from 'react-router-dom'
import './App.css'
import Nav from './components/Nav'
import HomeRoute from './routes/HomeRoute'
import Home from './pages/Home'
import Membership from './pages/Membership'
import ActDetails from './pages/Actdetails'
function App() {
 return(

    <Routes>
    
        <Route path="/" element={<HomeRoute />}>
            <Route index element={<Home />} />
            <Route path="membership" element={<Membership />} />
            <Route path='actDetails' element={<ActDetails />}></Route>
        </Route>
    </Routes>

 )
}

export default App
