import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:3001/api/admin/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promotionId, title) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la promotion "${title}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setDeletingId(promotionId);
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:3001/api/admin/promotions/${promotionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharger la liste
      await fetchPromotions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la promotion');
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  };

  if (loading) {
    return <div className="loading">Chargement des promotions...</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Gestion des promotions</h2>
        <p>{promotions.length} promotion(s) active(s)</p>
      </div>

      {promotions.length === 0 ? (
        <div className="empty-state">
          <p>Aucune promotion créée pour le moment.</p>
        </div>
      ) : (
        <div className="promotions-list">
          {promotions.map(promotion => (
            <div key={promotion.id} className="promotion-card">
              <div className="promotion-header">
                <div className="promotion-title-section">
                  <h3>{promotion.title}</h3>
                  <span className="promotion-merchant">par {promotion.business_name}</span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(promotion.id, promotion.title)}
                  disabled={deletingId === promotion.id}
                >
                  {deletingId === promotion.id ? '⏳' : '🗑️'}
                </button>
              </div>

              <div className="promotion-content">
                <div className="promotion-description">
                  <p>{promotion.description}</p>
                </div>

                <div className="promotion-details">
                  <div className="detail-row">
                    <span className="detail-label">🏪 Magasin:</span>
                    <span className="detail-value">{promotion.store_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📧 Contact:</span>
                    <span className="detail-value">{promotion.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📍 Adresse:</span>
                    <span className="detail-value">{promotion.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🌍 Coordonnées:</span>
                    <span className="detail-value">
                      {promotion.latitude.toFixed(6)}, {promotion.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Créée le:</span>
                    <span className="detail-value">{formatDate(promotion.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
