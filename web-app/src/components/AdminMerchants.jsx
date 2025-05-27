import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:3001/api/admin/merchants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMerchants(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des commerçants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (merchantId, businessName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le commerçant "${businessName}" et toutes ses promotions ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setDeletingId(merchantId);
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:3001/api/admin/merchants/${merchantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharger la liste
      await fetchMerchants();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du commerçant');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  };

  if (loading) {
    return <div className="loading">Chargement des commerçants...</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestion des commerçants</h2>
        <p>{merchants.length} commerçant(s) inscrit(s)</p>
      </div>

      {merchants.length === 0 ? (
        <div className="empty-state">
          <p>Aucun commerçant inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="merchants-grid">
          {merchants.map(merchant => (
            <div key={merchant.id} className="merchant-card">
              <div className="merchant-header">
                <div className="merchant-info">
                  {merchant.logo_url && (
                    <img 
                      src={`http://localhost:3001${merchant.logo_url}`} 
                      alt="Logo" 
                      className="merchant-logo"
                    />
                  )}
                  <div>
                    <h3>{merchant.business_name}</h3>
                    <p className="merchant-email">{merchant.email}</p>
                  </div>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(merchant.id, merchant.business_name)}
                  disabled={deletingId === merchant.id}
                >
                  {deletingId === merchant.id ? '⏳' : '🗑️'}
                </button>
              </div>

              <div className="merchant-details">
                <div className="detail-row">
                  <span className="detail-label">📍 Adresse:</span>
                  <span className="detail-value">{merchant.address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🎯 Promotions:</span>
                  <span className="detail-value">{merchant.promotions_count}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Inscrit le:</span>
                  <span className="detail-value">{formatDate(merchant.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
