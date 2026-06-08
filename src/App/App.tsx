import { Routes, Route } from 'react-router-dom'
import './index.scss'
import AuroraBackground from '../components/aurora-background/aurora-background'
import Header from '../components/header/header'
import Hero from '../components/hero/hero'
import HowItWorks from '../components/HowItWorks/HowItWorks'
import FeaturesSection from '../components/FeaturesSection/FeaturesSection'
import BeforeAfter from '../components/BeforeAfter/BeforeAfter'
import Footer from '../components/Footer/Footer'
import AuthPage from '../pages/AuthPage/AuthPage'
import DashboardPage from '../pages/DashboardPage/DashboardPage'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import ResetPasswordPage from '../pages/ResetPasswordPage/ResetPasswordPage'
import EditorPage from '../pages/EditorPage/EditorPage'

function HomePage() {
  return (
    <>
      <AuroraBackground />
      <Header />
      <Hero />
      <HowItWorks />
      <FeaturesSection />
      <BeforeAfter />
      <Footer />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
