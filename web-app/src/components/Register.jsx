import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const Register = ({ onLogin, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Le logo ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Seules les images sont autorisées pour le logo');
        return;
      }
      setLogo(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      let response;

      if (logo) {
        // Avec logo - utiliser FormData
        const submitData = new FormData();
        submitData.append('business_name', formData.business_name);
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        submitData.append('address', formData.address);
        submitData.append('logo', logo);

        response = await axios.post('/api/auth/register', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Sans logo - utiliser JSON
        response = await axios.post('/api/auth/register', {
          business_name: formData.business_name,
          email: formData.email,
          password: formData.password,
          address: formData.address
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Stocker le token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('merchant', JSON.stringify(response.data.merchant));

      // Configurer axios pour les futures requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      onLogin(response.data.merchant);
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏪 PromoPartout</h1>
          <h2>Inscription Commerçant</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="business_name">Nom du commerce *</label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              placeholder="Ex: Boulangerie Martin"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse du commerce *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="123 Rue de la Paix, 75001 Paris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo du commerce (optionnel)</label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
            />
            <small>Maximum 5MB - Formats acceptés: JPG, PNG, GIF</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Répétez votre mot de passe"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Déjà un compte ?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
