import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PromotionForm from './PromotionForm';
import MerchantPromotionList from './MerchantPromotionList';
import './MerchantDashboard.css';

const MerchantDashboard = ({ merchant, onLogout }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/promotions');
      setPromotions(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des promotions');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionCreated = (newPromotion) => {
    setPromotions([newPromotion, ...promotions]);
    setShowForm(false);
  };

  const handlePromotionDeleted = (deletedId) => {
    setPromotions(promotions.filter(p => p.id !== deletedId));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('merchant');
    delete axios.defaults.headers.common['Authorization'];
    onLogout();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="merchant-info">
            {merchant.logo_url && (
              <img 
                src={merchant.logo_url} 
                alt={`Logo ${merchant.business_name}`}
                className="merchant-logo"
              />
            )}
            <div>
              <h1>🏪 {merchant.business_name}</h1>
              <p>{merchant.email}</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Annuler' : '+ Nouvelle Promotion'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Formulaire de création */}
          {showForm && (
            <div className="form-section">
              <h2>Créer une nouvelle promotion</h2>
              <PromotionForm 
                onPromotionCreated={handlePromotionCreated}
                onCancel={() => setShowForm(false)}
                merchantName={merchant.business_name}
              />
            </div>
          )}

          {/* Liste des promotions */}
          <div className="promotions-section">
            <div className="section-header">
              <h2>Mes Promotions</h2>
              <span className="promotion-count">
                {promotions.length} promotion{promotions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Chargement des promotions...</p>
              </div>
            ) : promotions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📢</div>
                <h3>Aucune promotion</h3>
                <p>Créez votre première promotion pour attirer des clients !</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Créer ma première promotion
                </button>
              </div>
            ) : (
              <MerchantPromotionList 
                promotions={promotions}
                onPromotionDeleted={handlePromotionDeleted}
              />
            )}
          </div>
        </div>
      </main>

      {/* Stats Footer */}
      <footer className="dashboard-footer">
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{promotions.length}</span>
            <span className="stat-label">Promotions actives</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{merchant.business_name}</span>
            <span className="stat-label">Commerce</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">📱</span>
            <span className="stat-label">Visible sur mobile</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MerchantDashboard;
