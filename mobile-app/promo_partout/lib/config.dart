// Configuration de l'application
class AppConfig {

  // URL du serveur backend - DÉVELOPPEMENT LOCAL (appareil physique)
  static const String serverUrl = "http://192.168.1.57:3001";

  // URL du serveur local pour émulateur Android
  // static const String serverUrl = "http://10.0.2.2:3001";

  // URL du serveur de production avec votre domaine personnalisé
  // static const String serverUrl = "http://promo-partout.com";
  // static const String serverUrl = "http://168.231.82.122:3000";

  // Routes API pour l'application mobile
  static const String mobilePromotionsUrl = "$serverUrl/api/mobile/promotions";
  static const String mobileNearbyPromotionsUrl = "$serverUrl/api/mobile/promotions/nearby";

  // Rayon de proximité en mètres (1km)
  static const double proximityRadius = 1000.0;

  // Intervalle de synchronisation en minutes
  static const int syncIntervalMinutes = 5;

  // Intervalle de vérification de position en secondes
  static const int locationCheckIntervalSeconds = 30;
}
