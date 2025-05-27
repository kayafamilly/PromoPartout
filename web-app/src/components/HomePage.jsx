import React from 'react'
import './HomePage.css'

const HomePage = ({ onNavigateToMerchant, onNavigateToAdmin, onNavigateToClients }) => {
  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">🛍️</span>
            <h1>PromoPartout</h1>
          </div>
          <nav className="nav-menu">
            <button
              className="nav-btn merchant-btn"
              onClick={onNavigateToMerchant}
            >
              Espace Commerçant
            </button>
            <button
              className="nav-btn admin-btn"
              onClick={onNavigateToAdmin}
            >
              Administration
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2 className="hero-title">
              Découvrez les meilleures promotions
              <span className="highlight"> près de chez vous</span>
            </h2>
            <p className="hero-description">
              PromoPartout connecte les commerçants locaux avec leurs clients grâce à
              des promotions géolocalisées. Recevez des notifications en temps réel
              quand vous êtes près d'une offre exceptionnelle !
            </p>
            <div className="hero-actions">
              <button
                className="cta-primary"
                onClick={onNavigateToMerchant}
              >
                Devenir Commerçant Partenaire
              </button>
              <div className="app-download">
                <span>Vous êtes un particulier ?</span>
                <div className="download-buttons">
                  <button
                    className="download-btn clients-btn"
                    onClick={onNavigateToClients}
                  >
                    📱 Découvrir l'App Mobile
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="notification-demo">
                    <span className="notification-icon">🔔</span>
                    <div className="notification-content">
                      <strong>Promotion à 200m !</strong>
                      <p>-30% chez Boulangerie Martin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h3 className="section-title">Comment ça marche ?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏪</div>
              <h4>Pour les Commerçants</h4>
              <p>Créez vos promotions en quelques clics et touchez vos clients au bon moment, au bon endroit.</p>
              <ul>
                <li>Interface simple et intuitive</li>
                <li>Géolocalisation automatique</li>
                <li>Statistiques en temps réel</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h4>Pour les Clients</h4>
              <p>Recevez des notifications automatiques quand vous passez près d'une promotion intéressante.</p>
              <ul>
                <li>Notifications intelligentes</li>
                <li>Économies garanties</li>
                <li>Découverte de nouveaux commerces</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h4>Ciblage Précis</h4>
              <p>Technologie de géofencing avancée pour un marketing de proximité ultra-efficace.</p>
              <ul>
                <li>Rayon de 1km personnalisable</li>
                <li>Notifications en temps réel</li>
                <li>Respect de la vie privée</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Commerçants Partenaires</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Utilisateurs Actifs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Promotions Créées</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Client</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h3>Prêt à booster votre commerce local ?</h3>
            <p>Rejoignez des centaines de commerçants qui font confiance à PromoPartout</p>
            <button
              className="cta-primary large"
              onClick={onNavigateToMerchant}
            >
              Commencer Gratuitement
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="logo">
                <span className="logo-icon">🛍️</span>
                <h4>PromoPartout</h4>
              </div>
              <p>La plateforme de promotions géolocalisées qui connecte commerçants et clients.</p>
            </div>
            <div className="footer-section">
              <h5>Liens Utiles</h5>
              <ul>
                <li><a href="#" onClick={onNavigateToMerchant}>Espace Commerçant</a></li>
                <li><a href="#" onClick={onNavigateToAdmin}>Administration</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>PromoPartout</h5>
              <p>L'application qui vous fait économiser</p>
              <p>Disponible bientôt sur mobile</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 PromoPartout. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
