import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Register from './components/Register'
import MerchantDashboard from './components/MerchantDashboard'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [merchant, setMerchant] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [authMode, setAuthMode] = useState('home') // 'home', 'login', 'register', ou 'admin'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté (commerçant)
    const token = localStorage.getItem('token')
    const savedMerchant = localStorage.getItem('merchant')

    // Vérifier si l'admin est déjà connecté
    const adminToken = localStorage.getItem('adminToken')
    const savedAdmin = localStorage.getItem('adminData')

    if (adminToken && savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin)
        axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
        setAdmin(adminData)
        setIsAdmin(true)

        // Vérifier que le token admin est toujours valide
        axios.get('http://localhost:3001/api/admin/me')
          .then(response => {
            setAdmin(response.data.admin)
          })
          .catch(() => {
            // Token invalide, déconnecter
            handleAdminLogout()
          })
      } catch (error) {
        console.error('Erreur lors de la restauration de la session admin:', error)
        handleAdminLogout()
      }
    } else if (token && savedMerchant) {
      try {
        const merchantData = JSON.parse(savedMerchant)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setMerchant(merchantData)
        setIsAuthenticated(true)

        // Vérifier que le token est toujours valide
        axios.get('http://localhost:3001/api/auth/me')
          .then(response => {
            setMerchant(response.data.merchant)
          })
          .catch(() => {
            // Token invalide, déconnecter
            handleLogout()
          })
      } catch (error) {
        console.error('Erreur lors de la restauration de la session:', error)
        handleLogout()
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (merchantData) => {
    setMerchant(merchantData)
    setIsAuthenticated(true)
  }

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData)
    setIsAdmin(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('merchant')
    delete axios.defaults.headers.common['Authorization']
    setMerchant(null)
    setIsAuthenticated(false)
    setAuthMode('login')
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    delete axios.defaults.headers.common['Authorization']
    setAdmin(null)
    setIsAdmin(false)
    setAuthMode('home')
  }

  const switchToHome = () => setAuthMode('home')
  const switchToRegister = () => setAuthMode('register')
  const switchToLogin = () => setAuthMode('login')
  const switchToAdmin = () => setAuthMode('admin')

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (isAdmin && admin) {
    return (
      <AdminDashboard
        admin={admin}
        onLogout={handleAdminLogout}
      />
    )
  }

  if (isAuthenticated && merchant) {
    return (
      <MerchantDashboard
        merchant={merchant}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app">
      {authMode === 'home' ? (
        <HomePage
          onNavigateToMerchant={switchToLogin}
          onNavigateToAdmin={switchToAdmin}
        />
      ) : authMode === 'login' ? (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={switchToRegister}
          onSwitchToAdmin={switchToAdmin}
          onBackToHome={switchToHome}
        />
      ) : authMode === 'register' ? (
        <Register
          onLogin={handleLogin}
          onSwitchToLogin={switchToLogin}
          onBackToHome={switchToHome}
        />
      ) : (
        <AdminLogin
          onLoginSuccess={handleAdminLogin}
          onSwitchToLogin={switchToLogin}
          onBackToHome={switchToHome}
        />
      )}
    </div>
  )
}

export default App
