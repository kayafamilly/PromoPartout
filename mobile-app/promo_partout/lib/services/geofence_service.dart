import 'dart:async';
import 'dart:developer' as developer;
import 'package:geolocator/geolocator.dart';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

// Fonction callback pour le service en arrière-plan
@pragma('vm:entry-point')
Future<bool> onStart(ServiceInstance service) async {
  developer.log("🚀 Service de géofencing démarré");

  // Démarrer immédiatement le service en foreground pour Android 14+
  if (service is AndroidServiceInstance) {
    await service.setAsForegroundService();
  }

  // Créer un timer pour vérifier périodiquement (30 secondes pour les tests)
  Timer.periodic(const Duration(seconds: 30), (timer) async {
    try {
      developer.log("🔄 Vérification périodique des promotions à proximité");

      // Vérifier les permissions de localisation
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        developer.log("❌ Permissions de localisation refusées");
        return;
      }

      // Obtenir la position actuelle
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      developer.log("📍 Position obtenue: ${position.latitude}, ${position.longitude}");

      // Récupérer les promotions depuis le serveur
      await _checkPromotionsFromServer(position);

    } catch (e) {
      developer.log("❌ Erreur dans la vérification périodique: $e");
    }
  });

  // Écouter les commandes d'arrêt
  service.on('stopService').listen((event) {
    developer.log("🛑 Arrêt du service de géofencing");
    service.stopSelf();
  });

  return true;
}

// Fonction pour vérifier les promotions depuis le serveur
Future<void> _checkPromotionsFromServer(Position position) async {
  try {
    developer.log("🌐 Récupération des promotions depuis le serveur...");

    final response = await http.get(
      Uri.parse('${AppConfig.serverUrl}/api/mobile/promotions'),
      headers: {'Content-Type': 'application/json'},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      developer.log("📊 ${data.length} promotions récupérées du serveur");

      for (var promo in data) {
        double distance = Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          promo['latitude'],
          promo['longitude'],
        );

        developer.log("📏 Distance à '${promo['title']}': ${distance.toStringAsFixed(0)}m");

        if (distance <= AppConfig.proximityRadius) {
          developer.log("🎯 Promotion '${promo['title']}' à proximité!");

          // Vérifier si cette promotion a déjà été notifiée récemment
          bool alreadyNotified = await _isPromotionRecentlyNotified(promo['id']);
          if (!alreadyNotified) {
            await _sendProximityNotification(promo);
            await _markPromotionAsNotified(promo['id']);
          } else {
            developer.log("ℹ️ Promotion '${promo['title']}' déjà notifiée récemment");
          }
        }
      }
    } else {
      developer.log("❌ Erreur serveur: ${response.statusCode}");
    }
  } catch (e) {
    developer.log("❌ Erreur lors de la vérification des promotions: $e");
  }
}

// Vérifier si une promotion a été notifiée récemment
Future<bool> _isPromotionRecentlyNotified(int promotionId) async {
  try {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? lastNotifiedStr = prefs.getString('last_notified_$promotionId');

    if (lastNotifiedStr == null) return false;

    DateTime lastNotified = DateTime.parse(lastNotifiedStr);
    Duration difference = DateTime.now().difference(lastNotified);

    // Considérer comme récent si notifié dans les 30 dernières minutes
    return difference.inMinutes < 30;
  } catch (e) {
    developer.log("❌ Erreur lors de la vérification de notification: $e");
    return false;
  }
}

// Marquer une promotion comme notifiée
Future<void> _markPromotionAsNotified(int promotionId) async {
  try {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_notified_$promotionId', DateTime.now().toIso8601String());
    developer.log("✅ Promotion $promotionId marquée comme notifiée");
  } catch (e) {
    developer.log("❌ Erreur lors du marquage de notification: $e");
  }
}

// Envoyer une notification de proximité
Future<void> _sendProximityNotification(Map<String, dynamic> promotion) async {
  try {
    developer.log("📱 Envoi de notification pour '${promotion['title']}'");

    // Initialiser le plugin de notifications locales
    FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

    // Configuration Android
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');

    // Configuration générale
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);

    // Créer la notification
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'proximity_channel',
      'Promotions à proximité',
      channelDescription: 'Notifications pour les promotions à proximité',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: false,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );

    await flutterLocalNotificationsPlugin.show(
      promotion['id'],
      '🎯 Promotion à proximité!',
      '${promotion['title']} - ${promotion['description']}',
      platformChannelSpecifics,
    );

    // Utilisation des notifications locales uniquement

    developer.log("✅ Notification envoyée avec succès pour '${promotion['title']}'");
  } catch (e) {
    developer.log("❌ Erreur lors de l'envoi de la notification: $e");
  }
}

class PromoGeofenceService {
  static final PromoGeofenceService _instance = PromoGeofenceService._internal();
  factory PromoGeofenceService() => _instance;
  PromoGeofenceService._internal();

  bool _isInitialized = false;

  // Créer le canal de notification pour Android 14+
  Future<void> _createNotificationChannel() async {
    try {
      final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

      if (androidImplementation != null) {
        const AndroidNotificationChannel channel = AndroidNotificationChannel(
          'promo_background_service',
          'Service PromoPartout',
          description: 'Service de surveillance des promotions en arrière-plan',
          importance: Importance.low,
          playSound: false,
          enableVibration: false,
          showBadge: false,
        );
        await androidImplementation.createNotificationChannel(channel);
        developer.log('✅ Canal de notification créé pour le service');
      }
    } catch (e) {
      developer.log("⚠️ Erreur lors de la création du canal de notification: $e");
    }
  }

  // Initialiser le service de géofencing
  Future<void> initialize() async {
    if (_isInitialized) {
      developer.log("🔄 Service de géofencing déjà initialisé");
      return;
    }

    try {
      developer.log("🚀 Initialisation du service de géofencing...");

      // Créer d'abord le canal de notification pour Android 14+
      await _createNotificationChannel();

      final service = FlutterBackgroundService();

      // Configuration spéciale pour Android 14+
      await service.configure(
        androidConfiguration: AndroidConfiguration(
          onStart: onStart,
          autoStart: false, // Changé à false pour éviter les problèmes de démarrage
          isForegroundMode: true,
          notificationChannelId: 'promo_background_service',
          initialNotificationTitle: 'PromoPartout',
          initialNotificationContent: 'Surveillance des promotions actives',
          foregroundServiceNotificationId: 999,
          foregroundServiceTypes: [AndroidForegroundType.location],
        ),
        iosConfiguration: IosConfiguration(
          autoStart: true,
          onForeground: onStart,
          onBackground: onStart,
        ),
      );

      // Essayer de démarrer le service, mais ne pas bloquer si ça échoue
      try {
        bool isServiceRunning = await service.isRunning();
        if (!isServiceRunning) {
          await service.startService();
          developer.log("🚀 Service démarré manuellement");
        } else {
          developer.log("ℹ️ Service déjà en cours d'exécution");
        }
      } catch (serviceError) {
        developer.log("⚠️ Impossible de démarrer le service en arrière-plan: $serviceError");
        developer.log("📱 L'application fonctionnera en mode premier plan uniquement");
      }

      _isInitialized = true;
      developer.log("✅ Service de géofencing initialisé (mode dégradé si nécessaire)");
    } catch (e) {
      developer.log("❌ Erreur lors de l'initialisation du géofencing: $e");
      developer.log("📱 L'application continuera sans le service en arrière-plan");
      _isInitialized = true; // Marquer comme initialisé même en cas d'erreur
    }
  }

  // Recharger les géofences (appelé quand de nouvelles promotions sont ajoutées)
  Future<void> reloadGeofences() async {
    try {
      developer.log("🔄 Rechargement des géofences...");
      // Avec le service en arrière-plan, pas besoin de recharger manuellement
      // La tâche périodique va automatiquement vérifier les nouvelles promotions
      developer.log("✅ Géofences rechargées (service gère automatiquement)");
    } catch (e) {
      developer.log("❌ Erreur lors du rechargement des géofences: $e");
    }
  }

  // Arrêter le service
  Future<void> stop() async {
    try {
      developer.log("🛑 Arrêt du service de géofencing...");

      // Arrêter le service en arrière-plan
      final service = FlutterBackgroundService();
      service.invoke('stopService');

      _isInitialized = false;

      developer.log("✅ Service de géofencing arrêté");
    } catch (e) {
      developer.log("❌ Erreur lors de l'arrêt du service: $e");
    }
  }

  // Vérifier si le service est en cours d'exécution
  bool get isRunning => _isInitialized;

  // Obtenir le nombre de géofences actives (toujours 0 avec cette approche)
  int get activeGeofencesCount => 0;
}
