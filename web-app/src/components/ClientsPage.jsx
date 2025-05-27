import './ClientsPage.css'

const ClientsPage = ({ onBackToHome }) => {
  const handleDownloadApp = () => {
    // Redirection vers Google Play Store (à remplacer par le vrai lien)
    window.open('https://play.google.com/store/apps', '_blank')
  }

  return (
    <div className="clients-page">
      {/* Header simplifié */}
      <header className="clients-header">
        <div className="container">
          <div className="logo" onClick={onBackToHome}>
            <span className="logo-icon">🛍️</span>
            <h1>PromoPartout</h1>
          </div>
          <button className="download-header-btn" onClick={handleDownloadApp}>
            📱 Télécharger l'App
          </button>
        </div>
      </header>

      {/* Hero Section - Focus Client */}
      <section className="hero-clients">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Ne ratez plus jamais une
              <span className="highlight"> promotion près de chez vous</span>
            </h1>
            <p className="hero-subtitle">
              Économisez jusqu'à <strong>30% sur vos achats</strong> grâce aux notifications
              automatiques quand vous passez près d'une promotion !
            </p>

            <div className="value-props">
              <div className="value-prop">
                <span className="icon">💰</span>
                <span>Économies garanties</span>
              </div>
              <div className="value-prop">
                <span className="icon">📍</span>
                <span>Promotions à proximité</span>
              </div>
              <div className="value-prop">
                <span className="icon">🔔</span>
                <span>Notifications automatiques</span>
              </div>
            </div>

            <button className="cta-download-main" onClick={handleDownloadApp}>
              <span className="download-icon">📱</span>
              Télécharger Gratuitement
              <small>Disponible sur Google Play</small>
            </button>

            <p className="trust-indicators">
              Application gratuite • Disponible sur Android
            </p>
          </div>

          <div className="hero-visual">
            <div className="phone-demo">
              <div className="phone-frame">
                <div className="phone-screen">
                  <div className="app-interface">
                    <div className="notification-popup">
                      <div className="notif-header">
                        <span className="notif-icon">🔔</span>
                        <span className="notif-title">Promotion détectée !</span>
                      </div>
                      <div className="notif-content">
                        <strong>-25% chez Carrefour</strong>
                        <p>À seulement 150m de vous</p>
                        <span className="notif-time">Il y a 2 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problème/Solution */}
      <section className="problem-solution">
        <div className="container">
          <div className="problem">
            <h2>😤 Vous en avez marre de...</h2>
            <ul className="problem-list">
              <li>Rater les bonnes promotions par manque d'information</li>
              <li>Payer le prix fort alors qu'une promo était disponible</li>
              <li>Perdre du temps à chercher les bons plans</li>
              <li>Découvrir les promotions trop tard</li>
            </ul>
          </div>

          <div className="solution">
            <h2>✨ PromoPartout résout tout ça !</h2>
            <ul className="solution-list">
              <li>Notifications automatiques quand vous êtes près d'une promo</li>
              <li>Économies immédiates sans effort de votre part</li>
              <li>Découverte de nouveaux commerces avec des offres</li>
              <li>Alertes en temps réel, jamais en retard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Comment économiser avec PromoPartout ?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">📱</div>
              <h3>Téléchargez l'app</h3>
              <p>Installation gratuite en 30 secondes sur Google Play</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">📍</div>
              <h3>Activez la géolocalisation</h3>
              <p>L'app détecte automatiquement votre position</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">🔔</div>
              <h3>Recevez les notifications</h3>
              <p>Alertes automatiques quand vous passez près d'une promo</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-icon">💰</div>
              <h3>Économisez !</h3>
              <p>Profitez des promotions et réduisez vos dépenses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Ils économisent déjà avec PromoPartout</h2>
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p>"J'ai économisé 150€ le mois dernier grâce aux notifications ! L'app me prévient dès qu'il y a une promo près de chez moi."</p>
              <div className="author">
                <strong>Marie L.</strong>
                <span>Mère de famille, Lyon</span>
              </div>
            </div>
            <div className="testimonial">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p>"Parfait pour les étudiants ! Je découvre plein de bons plans que je n'aurais jamais vus sinon. Très pratique."</p>
              <div className="author">
                <strong>Thomas M.</strong>
                <span>Étudiant, Paris</span>
              </div>
            </div>
            <div className="testimonial">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p>"L'app fonctionne même quand elle est fermée ! J'ai eu une notification pour -40% chez Leclerc en passant devant."</p>
              <div className="author">
                <strong>Pierre D.</strong>
                <span>Retraité, Marseille</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats d'économies */}
      <section className="savings-stats">
        <div className="container">
          <h2>Les économies réalisées par nos utilisateurs</h2>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">127€</div>
              <div className="stat-label">Économie moyenne par mois</div>
            </div>
            <div className="stat">
              <div className="stat-number">25%</div>
              <div className="stat-label">Réduction moyenne obtenue</div>
            </div>
            <div className="stat">
              <div className="stat-number">3.2</div>
              <div className="stat-label">Promotions trouvées par semaine</div>
            </div>
            <div className="stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Utilisateurs satisfaits</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à économiser dès aujourd'hui ?</h2>
            <p>Rejoignez les milliers d'utilisateurs qui économisent chaque mois</p>
            <button className="cta-download-final" onClick={handleDownloadApp}>
              <span className="download-icon">📱</span>
              Télécharger PromoPartout
              <small>Gratuit sur Google Play</small>
            </button>
            <p className="guarantee">✅ 100% Gratuit • ✅ Respect de la vie privée</p>
          </div>
        </div>
      </section>

      {/* Footer simplifié */}
      <footer className="clients-footer">
        <div className="container">
          <p>&copy; 2024 PromoPartout - L'app qui vous fait économiser</p>
          <p>
            <button className="link-btn" onClick={onBackToHome}>Accueil</button>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ClientsPage
