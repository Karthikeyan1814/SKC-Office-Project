import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Public Pages
import Home from './pages/Home'
import Membership from './pages/Membership'
import ActDetails from './pages/Actdetails'
import SignIn from './pages/SignIn'

// Layouts & Route Guards
import HomeRoute from './routes/HomeRoute'
import AdminRoutes from './routes/AdminRoutes'
import StaffRoutes from './routes/StaffRoutes'
import ClientRoutes from './routes/ClientRoutes'
import ProductionRoute from './routes/ProductionRoutes'

// Admin Pages
import Overview from './pages/Overview'
import ClientDetails from './pages/ClientDetails'
import CustomizableClientForm from './pages/Settings/CustomizableClientForm'
import HomePageMasterSettings from './pages/admin/HomePageMasterSettings'
import FileManagementPage from './pages/admin/FileManagementPage'
import MembershipManagePage from './pages/admin/MembershipManagePage'
import AccessManagementPage from './pages/admin/AccessManagementPage'
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage'
import AdminProfilePage from './pages/admin/AdminProfilePage'

// Staff Pages
import StaffOverview from './pages/staff/StaffOverview'
import StaffClientDetails from './pages/staff/StaffClientDetails'
import StaffFileManagement from './pages/staff/StaffFileManagement'
import StaffAppointments from './pages/staff/StaffAppointments'
import StaffNotifications from './pages/staff/StaffNotifications'
import StaffProfile from './pages/staff/StaffProfile'

// Client Pages
import ClientOverview from './pages/client/ClientOverview'
import ClientFilesPage from './pages/client/ClientFilesPage'
import ClientAppointments from './pages/client/ClientAppointments'
import ClientNotifications from './pages/client/ClientNotifications'
import ClientProfile from './pages/client/ClientProfile'
import ClientMembership from './pages/client/ClientMembership'
import ClientMembershipRequest from './pages/client/ClientMembershipRequest'

// Utils
import LoadingAnimation from './components/LoadingAnimation'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

// Global notification provider
import { Toaster } from 'react-hot-toast'
import ThemeCustomizerModal from './components/ThemeCustomizerModal'

function App() {
  return (
    <>
      <ThemeCustomizerModal />
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 9999999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--primary, #1e1b4b)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            fontFamily: 'var(--font2, sans-serif)',
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />

      <Routes>
        {/* ─── PUBLIC ROUTES ──────────────────────────────────── */}
        <Route path="/" element={<HomeRoute />}>
          <Route index element={<Home />} />
          <Route path="membership" element={<Membership />} />
          <Route path="actDetails" element={<ActDetails />} />
          <Route path="SignIn" element={<SignIn />} />
        </Route>

        {/* ─── ADMIN ROUTES ───────────────────────────────────── */}
        <Route element={<ProductionRoute allowedRole="ADMIN" />}>
          <Route path="/Admin" element={<AdminRoutes />}>
            <Route index element={<Overview />} />
            <Route path="Overview" element={<Overview />} />
            <Route path="ClientDetails" element={<ClientDetails />} />
            <Route path="EditClientForm" element={<CustomizableClientForm />} />
            <Route path="HomePageCMS" element={<HomePageMasterSettings />} />
            <Route path="HomeContent" element={<HomePageMasterSettings />} />
            <Route path="FileManagement" element={<FileManagementPage />} />
            <Route path="Membership" element={<MembershipManagePage />} />
            <Route path="AccessManagement" element={<AccessManagementPage />} />
            <Route path="Appointments" element={<AdminAppointmentsPage />} />
            <Route path="Notifications" element={<AdminNotificationsPage />} />
            <Route path="Profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        {/* ─── STAFF ROUTES ───────────────────────────────────── */}
        <Route element={<ProductionRoute allowedRole="STAFF" />}>
          <Route path="/Staff" element={<StaffRoutes />}>
            <Route index element={<StaffOverview />} />
            <Route path="ClientDetails" element={<StaffClientDetails />} />
            <Route path="FileManagement" element={<StaffFileManagement />} />
            <Route path="Appointments" element={<StaffAppointments />} />
            <Route path="Notifications" element={<StaffNotifications />} />
            <Route path="Profile" element={<StaffProfile />} />
          </Route>
        </Route>

        {/* ─── CLIENT ROUTES ───────────────────────────────────── */}
        <Route element={<ProductionRoute allowedRole="CLIENT" />}>
          <Route path="/Client" element={<ClientRoutes />}>
            <Route index element={<ClientOverview />} />
            <Route path="Files" element={<ClientFilesPage />} />
            <Route path="Appointments" element={<ClientAppointments />} />
            <Route path="Notifications" element={<ClientNotifications />} />
            <Route path="Profile" element={<ClientProfile />} />
            <Route path="Membership" element={<ClientMembership />} />
            <Route path="Membership-Request" element={<ClientMembershipRequest />} />
          </Route>
        </Route>

        {/* ─── UTILITY ROUTES ─────────────────────────────────── */}
        <Route path="/Unauthorized" element={<UnauthorizedPage />} />
        <Route path="/Loading" element={<LoadingAnimation />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
