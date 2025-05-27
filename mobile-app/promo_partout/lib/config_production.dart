// Configuration pour la production
class AppConfig {
  // URL du serveur de production avec votre domaine personnalisé
  static const String serverUrl = 'http://promo-partout.com';

  // Alternative avec SSL (recommandé pour la production)
  // static const String serverUrl = 'https://promo-partout.com';

  // Alternatives de fallback
  // static const String serverUrl = 'http://168.231.82.122:3000';
  // static const String serverUrl = 'http://promo-partout.srv813637.hstgr.cloud';

  // Configuration pour les notifications
  static const bool enableNotifications = true;

  // Configuration pour le géofencing
  static const double proximityRadius = 1000.0; // 1 km en mètres

  // Intervalle de vérification de la position (en secondes)
  static const int locationCheckInterval = 30;

  // Intervalle de synchronisation avec le serveur (en minutes)
  static const int syncInterval = 5;
}
