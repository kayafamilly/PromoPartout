import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

// Composant pour contrôler la carte
function MapController({ position, center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);

  return null;
}

// Fonction pour géocoder une adresse
async function geocodeAddress(address) {
  try {
    // Utiliser l'API Nominatim d'OpenStreetMap pour le géocodage
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lat), parseFloat(lon)];
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du géocodage de l\'adresse:', error);
    return null;
  }
}

export default function PromotionForm({ onPromotionCreated, onCancel, merchantName }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    store_name: '',
    address: '',
  });
  const [position, setPosition] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris par défaut
  const mapRef = useRef(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Effet pour fermer les suggestions lorsque l'utilisateur clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Si le champ modifié est l'adresse, rechercher des suggestions
    if (name === 'address' && value.length > 3) {
      // Annuler la recherche précédente si elle existe
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Définir un délai avant de lancer la recherche pour éviter trop de requêtes
      const timeoutId = setTimeout(() => {
        searchAddressSuggestions(value);
      }, 500);

      setSearchTimeout(timeoutId);
    } else if (name === 'address' && value.length <= 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Fonction pour rechercher des suggestions d'adresses
  const searchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) return;

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );

      if (response.data && response.data.length > 0) {
        // Formater les suggestions pour afficher des adresses complètes
        const suggestions = response.data.map(item => {
          return {
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          };
        });

        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de suggestions d\'adresses:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Fonction pour sélectionner une suggestion d'adresse
  const handleSelectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, address: suggestion.display_name }));
    setPosition([suggestion.lat, suggestion.lon]);
    setMapCenter([suggestion.lat, suggestion.lon]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setMessage({ text: 'Adresse localisée avec succès!', type: 'success' });
  };

  // Fonction pour géocoder l'adresse saisie
  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      setMessage({ text: 'Veuillez saisir une adresse', type: 'error' });
      return;
    }

    try {
      setGeocodingLoading(true);
      setMessage({ text: 'Recherche de l\'adresse...', type: 'info' });

      const coordinates = await geocodeAddress(formData.address);

      if (coordinates) {
        setPosition(coordinates);
        setMapCenter(coordinates);
        setMessage({ text: 'Adresse localisée avec succès!', type: 'success' });
      } else {
        setMessage({ text: 'Impossible de localiser cette adresse. Veuillez vérifier ou cliquer manuellement sur la carte.', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la géolocalisation:', error);
      setMessage({ text: 'Erreur lors de la géolocalisation de l\'adresse', type: 'error' });
    } finally {
      setGeocodingLoading(false);
    }
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
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: position[0],
        longitude: position[1],
      };

      const response = await axios.post('/api/promotions', promotionData);

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        store_name: '',
        address: '',
      });
      setPosition(null);
      setMapCenter([46.603354, 1.888334]);

      setMessage({ text: 'Promotion ajoutée avec succès!', type: 'success' });

      // Appeler la fonction de callback si fournie
      if (onPromotionCreated) {
        onPromotionCreated(response.data);
      }

      // Fermer le formulaire après un délai
      if (onCancel) {
        setTimeout(() => onCancel(), 1500);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la promotion:', error);
      setMessage({
        text: error.response?.data?.error || 'Erreur lors de l\'ajout de la promotion',
        type: 'error'
      });
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
          <label htmlFor="address">Adresse</label>
          <div className="address-input-container">
            <div className="address-input-group">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                ref={addressInputRef}
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="geocode-button"
                onClick={handleGeocodeAddress}
                disabled={geocodingLoading || !formData.address}
              >
                {geocodingLoading ? 'Recherche...' : 'Localiser'}
              </button>
            </div>

            {showSuggestions && addressSuggestions.length > 0 && (
              <ul className="address-suggestions" ref={suggestionsRef}>
                {addressSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <small className="help-text">
            Commencez à saisir l'adresse pour voir des suggestions, ou saisissez l'adresse complète et cliquez sur "Localiser"
          </small>
        </div>

        <div className="form-group">
          <label>Emplacement (cliquez sur la carte pour ajuster si nécessaire)</label>
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '400px', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapController position={position} center={mapCenter} />
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
