import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import HomePage from './components/HomePage'
import ClientsPage from './components/ClientsPage'
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
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'clients', 'login', 'register', 'admin'
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
    setCurrentPage('home')
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    delete axios.defaults.headers.common['Authorization']
    setAdmin(null)
    setIsAdmin(false)
    setCurrentPage('home')
  }

  // Navigation functions
  const goToHome = () => setCurrentPage('home')
  const goToClients = () => setCurrentPage('clients')
  const goToLogin = () => setCurrentPage('login')
  const goToRegister = () => setCurrentPage('register')
  const goToAdmin = () => setCurrentPage('admin')

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

  // Routage simple basé sur l'URL
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/clients') {
      setCurrentPage('clients')
    } else if (path === '/login') {
      setCurrentPage('login')
    } else if (path === '/register') {
      setCurrentPage('register')
    } else if (path === '/admin') {
      setCurrentPage('admin')
    } else {
      setCurrentPage('home')
    }
  }, [])

  const navigateToPage = (page) => {
    setCurrentPage(page)
    window.history.pushState({}, '', page === 'home' ? '/' : `/${page}`)
  }

  return (
    <div className="app">
      {currentPage === 'home' ? (
        <HomePage
          onNavigateToMerchant={() => navigateToPage('login')}
          onNavigateToAdmin={() => navigateToPage('admin')}
          onNavigateToClients={() => navigateToPage('clients')}
        />
      ) : currentPage === 'clients' ? (
        <ClientsPage
          onBackToHome={() => navigateToPage('home')}
        />
      ) : currentPage === 'login' ? (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => navigateToPage('register')}
          onSwitchToAdmin={() => navigateToPage('admin')}
          onBackToHome={() => navigateToPage('home')}
        />
      ) : currentPage === 'register' ? (
        <Register
          onLogin={handleLogin}
          onSwitchToLogin={() => navigateToPage('login')}
          onBackToHome={() => navigateToPage('home')}
        />
      ) : (
        <AdminLogin
          onLoginSuccess={handleAdminLogin}
          onSwitchToLogin={() => navigateToPage('login')}
          onBackToHome={() => navigateToPage('home')}
        />
      )}
    </div>
  )
}

export default App
