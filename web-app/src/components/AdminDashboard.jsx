import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminMerchants from './AdminMerchants';
import AdminPromotions from './AdminPromotions';
import './AdminDashboard.css';

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:3001/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    onLogout();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return <div className="loading">Chargement du dashboard...</div>;
    }

    if (!dashboardData) {
      return <div className="error">Erreur lors du chargement des données</div>;
    }

    return (
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-info">
              <h3>{dashboardData.stats.merchants}</h3>
              <p>Commerçants</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <h3>{dashboardData.stats.promotions}</h3>
              <p>Promotions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <h3>{dashboardData.stats.activeMobileUsers}</h3>
              <p>Apps Actives</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{dashboardData.stats.activeUsersLast24h}</h3>
              <p>Actifs 24h</p>
            </div>
          </div>
        </div>

        <div className="recent-section">
          <div className="recent-card">
            <h3>Derniers commerçants inscrits</h3>
            <div className="recent-list">
              {dashboardData.recentMerchants.map(merchant => (
                <div key={merchant.id} className="recent-item">
                  <div className="recent-info">
                    <strong>{merchant.business_name}</strong>
                    <span>{merchant.email}</span>
                  </div>
                  <div className="recent-date">
                    {formatDate(merchant.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-card">
            <h3>Dernières promotions créées</h3>
            <div className="recent-list">
              {dashboardData.recentPromotions.map(promotion => (
                <div key={promotion.id} className="recent-item">
                  <div className="recent-info">
                    <strong>{promotion.title}</strong>
                    <span>{promotion.business_name}</span>
                  </div>
                  <div className="recent-date">
                    {formatDate(promotion.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-card">
            <h3>Nouvelles installations mobiles</h3>
            <div className="recent-list">
              {dashboardData.recentInstalls && dashboardData.recentInstalls.map((install, index) => (
                <div key={index} className="recent-item">
                  <div className="recent-info">
                    <strong>📱 {install.platform || 'Inconnu'}</strong>
                    <span>v{install.app_version || 'N/A'} • {install.device_id.substring(0, 8)}...</span>
                  </div>
                  <div className="recent-date">
                    {formatDate(install.first_install_at)}
                  </div>
                </div>
              ))}
              {(!dashboardData.recentInstalls || dashboardData.recentInstalls.length === 0) && (
                <div className="recent-item">
                  <div className="recent-info">
                    <span>Aucune installation récente</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🛡️ Administration PromoPartout</h1>
          <span>Bienvenue, {admin.name}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
      </header>

      <nav className="admin-nav">
        <button
          className={activeTab === 'dashboard' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'merchants' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('merchants')}
        >
          🏪 Commerçants
        </button>
        <button
          className={activeTab === 'promotions' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('promotions')}
        >
          🎯 Promotions
        </button>
      </nav>

      <main className="admin-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'merchants' && <AdminMerchants />}
        {activeTab === 'promotions' && <AdminPromotions />}
      </main>
    </div>
  );
}
