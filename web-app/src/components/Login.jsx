import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const Login = ({ onLogin, onSwitchToRegister, onSwitchToAdmin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);

      // Stocker le token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('merchant', JSON.stringify(response.data.merchant));

      // Configurer axios pour les futures requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      onLogin(response.data.merchant);
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏪 PromoPartout</h1>
          <h2>Connexion Commerçant</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
            >
              S'inscrire
            </button>
          </p>
          <p>
            <button
              type="button"
              className="link-button admin-link"
              onClick={onSwitchToAdmin}
            >
              🛡️ Administration
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
