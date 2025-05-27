import { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Composant pour gérer les événements de la carte
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function PromotionForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    store_name: '',
    address: '',
  });
  const [position, setPosition] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!position) {
      setMessage({ text: 'Veuillez sélectionner un emplacement sur la carte', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      
      const promotionData = {
        ...formData,
        latitude: position[0],
        longitude: position[1],
      };
      
      await axios.post('http://localhost:3001/api/promotions', promotionData);
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        store_name: '',
        address: '',
      });
      setPosition(null);
      
      setMessage({ text: 'Promotion ajoutée avec succès!', type: 'success' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la promotion:', error);
      setMessage({ text: 'Erreur lors de l\'ajout de la promotion', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promotion-form">
      <h2>Ajouter une nouvelle promotion</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre de la promotion</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="store_name">Nom du commerce</label>
          <input
            type="text"
            id="store_name"
            name="store_name"
            value={formData.store_name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Adresse</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Emplacement (cliquez sur la carte)</label>
          <div className="map-container">
            <MapContainer
              center={[48.8566, 2.3522]} // Paris par défaut
              zoom={13}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          {position && (
            <p className="coordinates">
              Latitude: {position[0].toFixed(6)}, Longitude: {position[1].toFixed(6)}
            </p>
          )}
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Ajout en cours...' : 'Ajouter la promotion'}
        </button>
      </form>
    </div>
  );
}
