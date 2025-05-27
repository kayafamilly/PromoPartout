import React, { useState } from 'react';
import axios from 'axios';
import './MerchantPromotionList.css';

const MerchantPromotionList = ({ promotions, onPromotionDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la promotion "${title}" ?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`/api/promotions/${id}`);
      onPromotionDeleted(id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la promotion');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Date non disponible';
    }

    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date non disponible';
    }
  };

  return (
    <div className="merchant-promotion-list">
      {promotions.map((promotion) => (
        <div key={promotion.id} className="promotion-card">
          <div className="promotion-header">
            <h3 className="promotion-title">{promotion.title}</h3>
            <div className="promotion-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(promotion.id, promotion.title)}
                disabled={deletingId === promotion.id}
              >
                {deletingId === promotion.id ? (
                  <>
                    <span className="spinner-sm"></span>
                    Suppression...
                  </>
                ) : (
                  <>
                    🗑️ Supprimer
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="promotion-content">
            <div className="promotion-description">
              <p>{promotion.description}</p>
            </div>

            <div className="promotion-details">
              <div className="detail-item">
                <span className="detail-icon">🏪</span>
                <span className="detail-text">{promotion.store_name}</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <span className="detail-text">{promotion.address}</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <span className="detail-text">
                  Créée le {formatDate(promotion.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="promotion-footer">
            <div className="promotion-status">
              <span className="status-badge status-active">
                ✅ Active
              </span>
              <span className="mobile-indicator">
                📱 Visible sur mobile
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MerchantPromotionList;
