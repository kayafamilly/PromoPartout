import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PromotionList.css';

export default function PromotionList() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/promotions');
      setPromotions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des promotions:', err);
      setError('Impossible de charger les promotions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDeleteClick = (promotion) => {
    setPromotionToDelete(promotion);
    setShowConfirmation(true);
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setPromotionToDelete(null);
  };

  const confirmDelete = async () => {
    if (!promotionToDelete) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`http://localhost:3001/api/promotions/${promotionToDelete.id}`);

      // Mettre à jour la liste des promotions
      setPromotions(promotions.filter(p => p.id !== promotionToDelete.id));

      setShowConfirmation(false);
      setPromotionToDelete(null);
      setDeleteLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression de la promotion:', err);
      setError('Impossible de supprimer la promotion');
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement des promotions...</div>;
  if (error) return <div className="error">{error}</div>;
  if (promotions.length === 0) return <div className="no-promotions">Aucune promotion disponible</div>;

  return (
    <div className="promotion-list">
      <h2>Promotions disponibles</h2>

      {promotions.length > 0 && (
        <div className="map-container">
          <MapContainer
            center={[promotions[0].latitude, promotions[0].longitude]}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {promotions.map((promo) => (
              <Marker key={promo.id} position={[promo.latitude, promo.longitude]}>
                <Popup>
                  <div>
                    <h3>{promo.title}</h3>
                    <p><strong>{promo.store_name}</strong></p>
                    <p>{promo.description}</p>
                    <p><small>{promo.address}</small></p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="promotions-grid">
        {promotions.map((promo) => (
          <div key={promo.id} className="promotion-card">
            <h3>{promo.title}</h3>
            <p className="store-name">{promo.store_name}</p>
            <p className="description">{promo.description}</p>
            <p className="address">{promo.address}</p>
            <p className="coordinates">
              Lat: {promo.latitude.toFixed(6)}, Lng: {promo.longitude.toFixed(6)}
            </p>
            <button
              className="delete-button"
              onClick={() => handleDeleteClick(promo)}
              disabled={deleteLoading}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {/* Boîte de dialogue de confirmation de suppression */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer la promotion "{promotionToDelete?.title}" ?</p>
            <p>Cette action est irréversible.</p>
            <div className="confirmation-actions">
              <button className="cancel-button" onClick={cancelDelete} disabled={deleteLoading}>
                Annuler
              </button>
              <button className="confirm-button" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
