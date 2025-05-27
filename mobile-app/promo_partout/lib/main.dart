import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as path_lib;
import 'dart:developer' as developer;
import 'package:permission_handler/permission_handler.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:io' show Platform;
import 'config.dart';
import 'services/geofence_service.dart';
import 'screens/permission_screen.dart';

// Initialisation des notifications
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// Handler pour les messages Firebase en arrière-plan
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialiser Firebase si nécessaire
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  developer.log("🔔 Message FCM reçu en arrière-plan: ${message.notification?.title}");

  // Afficher une notification locale
  if (message.notification != null) {
    await _showNotification(
      message.hashCode,
      message.notification!.title ?? 'Notification',
      message.notification!.body ?? '',
    );
  }
}

// Afficher une notification
Future<void> _showNotification(int id, String title, String body) async {
  try {
    developer.log("⚠️ TENTATIVE D'AFFICHAGE DE NOTIFICATION: ID=$id, Titre=$title, Corps=$body");

    // Vérifier explicitement les permissions de notification sur Android
    if (defaultTargetPlatform == TargetPlatform.android) {
      final status = await Permission.notification.status;
      developer.log("📱 Statut actuel des permissions de notification: $status");

      if (status != PermissionStatus.granted) {
        developer.log("❌ Permissions de notification non accordées, demande de permission...");
        final newStatus = await Permission.notification.request();
        developer.log("📱 Nouveau statut des permissions de notification: $newStatus");

        if (newStatus != PermissionStatus.granted) {
          developer.log("❌ Impossible d'obtenir les permissions de notification");
          return;
        }
      }
    }

    // Utiliser le canal de notification créé dans main()
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'promo_channel',
      'Promotions',
      channelDescription: 'Notifications pour les promotions à proximité',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      visibility: NotificationVisibility.public,
      icon: '@mipmap/ic_launcher',
      // Ajouter des options supplémentaires pour s'assurer que la notification est affichée
      fullScreenIntent: true,
      ticker: 'Nouvelle promotion à proximité',
      // Ajouter ces options pour s'assurer que la notification est bien visible
      channelShowBadge: true,
      autoCancel: true,
    );

    const DarwinNotificationDetails darwinPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: darwinPlatformChannelSpecifics,
      macOS: darwinPlatformChannelSpecifics,
    );

    // Afficher la notification avec un titre et un corps plus visibles
    await flutterLocalNotificationsPlugin.show(
      id,
      '🔔 Promotion à proximité!',
      '📍 $title - $body',
      platformChannelSpecifics,
      payload: 'promotion_$id',
    );

    // Afficher un message dans la console pour confirmer
    developer.log("✅ NOTIFICATION AFFICHÉE AVEC SUCCÈS pour la promotion: $title");

    // La gestion des promotions notifiées est maintenant faite dans checkNearbyPromotions
    developer.log("✅ Notification affichée avec succès pour la promotion $id");
  } catch (e) {
    developer.log("❌ ERREUR LORS DE L'AFFICHAGE DE LA NOTIFICATION: $e");
    // Afficher la stack trace pour un meilleur débogage
    developer.log(StackTrace.current.toString());
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Création d'un canal de notification Android avec une priorité élevée
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'promo_channel',
    'Promotions',
    description: 'Notifications pour les promotions à proximité',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    showBadge: true,
  );

  // Créer le canal de notification
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
      flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

  if (androidImplementation != null) {
    await androidImplementation.createNotificationChannel(channel);
    developer.log('Canal de notification créé: ${channel.id}');

    // Demander les permissions de notification
    final bool? granted = await androidImplementation.requestNotificationsPermission();
    developer.log('Permissions de notification accordées: $granted');
  }

  // Initialisation des notifications
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');

  const DarwinInitializationSettings initializationSettingsDarwin =
      DarwinInitializationSettings(
    requestSoundPermission: true,
    requestBadgePermission: true,
    requestAlertPermission: true,
  );

  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
    iOS: initializationSettingsDarwin,
    macOS: initializationSettingsDarwin,
  );

  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      // Gérer la réponse à la notification si nécessaire
      developer.log('Notification cliquée: ${response.payload}');
    },
  );

  // Nous utilisons un Timer pour les vérifications périodiques
  // au lieu d'un système de tâches en arrière-plan

  // Initialiser Firebase
  developer.log("🔧 Initialisation de Firebase");

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    developer.log("✅ Firebase initialisé avec succès");
  } catch (e) {
    developer.log("❌ Erreur lors de l'initialisation de Firebase: $e");
  }

  // Initialiser Firebase Cloud Messaging
  try {
    developer.log("🔔 Initialisation de Firebase Cloud Messaging");

    // Enregistrer le handler pour les messages en arrière-plan
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Demander l'autorisation pour les notifications push
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    developer.log("✅ Permissions FCM: ${settings.authorizationStatus}");

    // Obtenir le token FCM
    String? token = await messaging.getToken();
    developer.log("🔑 Token FCM: $token");

    // Écouter les messages en premier plan
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      developer.log("🔔 Message FCM reçu en premier plan: ${message.notification?.title}");

      if (message.notification != null) {
        _showNotification(
          message.hashCode,
          message.notification!.title ?? 'Notification',
          message.notification!.body ?? '',
        );
      }
    });

    // Écouter les clics sur les notifications
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      developer.log("🔔 Notification FCM cliquée: ${message.notification?.title}");
    });

    developer.log("✅ Firebase Cloud Messaging configuré avec succès");
  } catch (e) {
    developer.log("❌ Erreur lors de la configuration de FCM: $e");
  }

  // Initialisation de la base de données
  await DatabaseHelper.instance.database;

  // Initialiser le service de géofencing
  try {
    await PromoGeofenceService().initialize();
    developer.log("✅ Service de géofencing initialisé dans main()");
  } catch (e) {
    developer.log("❌ Erreur lors de l'initialisation du géofencing dans main(): $e");
  }

  runApp(const MyApp());
}

// Vérifier les promotions à proximité
Future<void> checkNearbyPromotions(Position position, {bool forceNotify = false, bool onlyNewPromotions = true}) async {
  try {
    developer.log("🔍 Vérification des promotions à proximité pour la position: ${position.latitude}, ${position.longitude}");
    developer.log("🔔 Force notification: $forceNotify, Seulement nouvelles promotions: $onlyNewPromotions");

    // Récupérer les promotions depuis la base de données locale
    List<Map<String, dynamic>> promotions =
        await DatabaseHelper.instance.getPromotions();

    developer.log("📊 Nombre total de promotions à vérifier: ${promotions.length}");

    if (promotions.isEmpty) {
      developer.log("ℹ️ Aucune promotion à vérifier");
      return;
    }

    // Récupérer la liste des promotions déjà notifiées (persistante entre les sessions)
    SharedPreferences prefs = await SharedPreferences.getInstance();
    List<String> notifiedPromos = prefs.getStringList('notified_promos') ?? [];
    developer.log("📝 Promotions déjà notifiées (persistantes): $notifiedPromos");

    // Récupérer la liste des promotions notifiées dans cette session
    List<String> sessionNotifiedPromos = prefs.getStringList('session_notified_promos') ?? [];
    developer.log("📝 Promotions notifiées dans cette session: $sessionNotifiedPromos");

    // Si forceNotify est true, réinitialiser les deux listes
    if (forceNotify) {
      developer.log("🔄 Réinitialisation forcée des promotions notifiées");
      notifiedPromos = [];
      sessionNotifiedPromos = [];
      await prefs.setStringList('notified_promos', notifiedPromos);
      await prefs.setStringList('session_notified_promos', sessionNotifiedPromos);
    }

    // Liste pour stocker les promotions à proximité nouvellement détectées
    List<Map<String, dynamic>> nearbyPromotions = [];

    // Vérifier si des promotions sont à proximité (rayon de 1km)
    for (var promo in promotions) {
      developer.log("🔍 Vérification de la promotion: ${promo['title']} à ${promo['address']}");

      double distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        promo['latitude'],
        promo['longitude'],
      );

      developer.log("📏 Distance calculée: $distance mètres");

      // Si la promotion est à proximité (moins de 1 km)
      if (distance <= 1000) {
        developer.log("✅ Promotion à proximité détectée: ${promo['title']} à ${(distance / 1000).toStringAsFixed(2)} km");

        // Ajouter la distance à la promotion
        Map<String, dynamic> promoWithDistance = Map.from(promo);
        promoWithDistance['distance'] = distance;

        // Ajouter à la liste des promotions à proximité
        nearbyPromotions.add(promoWithDistance);
      } else {
        developer.log("❌ Promotion trop éloignée pour notification: ${promo['title']} à ${(distance / 1000).toStringAsFixed(2)} km");
      }
    }

    // Trier les promotions par distance
    nearbyPromotions.sort((a, b) =>
        (a['distance'] as double).compareTo(b['distance'] as double));

    // Si des promotions sont à proximité, envoyer des notifications
    if (nearbyPromotions.isNotEmpty) {
      developer.log("🔔 ${nearbyPromotions.length} promotions à proximité détectées");

      // Vérifier si l'application est en premier plan
      bool isInForeground = WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed;
      developer.log("📱 Application en premier plan: $isInForeground");

      // Envoyer des notifications pour les promotions à proximité qui n'ont pas encore été notifiées
      for (int i = 0; i < nearbyPromotions.length; i++) {
        var promo = nearbyPromotions[i];
        String promoId = promo['id'].toString();

        // Déterminer si nous devons envoyer une notification pour cette promotion
        bool shouldNotify = false;

        // Cas 1: Première notification (jamais notifiée auparavant)
        if (!notifiedPromos.contains(promoId)) {
          shouldNotify = true;
          developer.log("✅ Promotion jamais notifiée auparavant: ${promo['title']} (ID: $promoId)");
        }
        // Cas 2: Force notification (réinitialisation des notifications)
        else if (forceNotify) {
          shouldNotify = true;
          developer.log("✅ Force notification pour promotion: ${promo['title']} (ID: $promoId)");
        }
        // Cas 3: Notification déjà envoyée dans cette session
        else if (sessionNotifiedPromos.contains(promoId)) {
          shouldNotify = false;
          developer.log("ℹ️ Promotion déjà notifiée dans cette session, pas de nouvelle notification: ${promo['title']} (ID: $promoId)");
        }
        // Cas 4: Notification déjà envoyée dans une session précédente
        else if (notifiedPromos.contains(promoId)) {
          // Si onlyNewPromotions est false, on envoie quand même une notification
          shouldNotify = !onlyNewPromotions;
          if (shouldNotify) {
            developer.log("✅ Notification pour promotion déjà notifiée car onlyNewPromotions est false: ${promo['title']} (ID: $promoId)");
          } else {
            developer.log("ℹ️ Promotion déjà notifiée dans une session précédente, pas de nouvelle notification: ${promo['title']} (ID: $promoId)");
          }
        }

        // Envoyer la notification si nécessaire
        if (shouldNotify) {
          developer.log("🔔 Envoi d'une notification pour la promotion: ${promo['title']} (ID: $promoId)");

          // Ajouter un délai entre les notifications pour éviter de les envoyer toutes en même temps
          if (i > 0) {
            await Future.delayed(const Duration(seconds: 1));
          }

          // Envoyer la notification
          await _showNotification(
            promo['id'],
            promo['title'],
            'À ${(promo['distance'] / 1000).toStringAsFixed(2)} km: ${promo['store_name']}',
          );

          // Ajouter la promotion à la liste des promotions notifiées (globale)
          if (!notifiedPromos.contains(promoId)) {
            notifiedPromos.add(promoId);
            await prefs.setStringList('notified_promos', notifiedPromos);
            developer.log("📝 Promotion $promoId ajoutée à la liste des promotions notifiées globale");
          }

          // Ajouter la promotion à la liste des promotions notifiées dans cette session
          if (!sessionNotifiedPromos.contains(promoId)) {
            sessionNotifiedPromos.add(promoId);
            await prefs.setStringList('session_notified_promos', sessionNotifiedPromos);
            developer.log("📝 Promotion $promoId ajoutée à la liste des promotions notifiées de cette session");
          }
        } else {
          developer.log("ℹ️ Pas de notification pour la promotion: ${promo['title']} (ID: $promoId)");
        }
      }
    } else {
      developer.log("ℹ️ Aucune promotion à proximité détectée");
    }
  } catch (e) {
    developer.log("❌ Erreur lors de la vérification des promotions: $e");
    developer.log(StackTrace.current.toString());
  }
}



class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PromoPartout',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  bool _isLoading = true;
  bool _permissionsGranted = false;
  List<Map<String, dynamic>> _promotions = [];
  Timer? _locationTimer;
  Timer? _syncTimer;
  Timer? _heartbeatTimer;
  Position? _currentPosition;
  DateTime _lastSyncTime = DateTime(2000); // Date dans le passé pour forcer la première synchronisation
  String? _deviceId;

  @override
  void initState() {
    super.initState();

    // Enregistrer l'observateur pour détecter les changements d'état de l'application
    WidgetsBinding.instance.addObserver(this);

    // Initialiser l'application de manière optimisée
    _initializeApp();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    developer.log("Changement d'état de l'application: $state");

    // Lorsque l'application revient au premier plan
    if (state == AppLifecycleState.resumed) {
      developer.log("🔄 Application revenue au premier plan, synchronisation des promotions");

      // Vérifier si la dernière synchronisation date de plus de 30 secondes
      final now = DateTime.now();
      final difference = now.difference(_lastSyncTime).inSeconds;

      if (difference >= 30) {
        developer.log("⏰ Dernière synchronisation il y a $difference secondes, synchronisation automatique");
        _syncPromotions();
      } else {
        developer.log("⏰ Dernière synchronisation il y a $difference secondes, pas besoin de synchroniser");
      }
    }
  }

  // Initialiser les données de session
  Future<void> _initializeSessionData() async {
    try {
      developer.log("🔄 Initialisation des données de session");
      SharedPreferences prefs = await SharedPreferences.getInstance();

      // Vérifier si c'est la première exécution de l'application
      bool isFirstRun = prefs.getBool('is_first_run') ?? true;

      if (isFirstRun) {
        // Si c'est la première exécution, initialiser les listes
        await prefs.setStringList('notified_promos', []);
        await prefs.setBool('is_first_run', false);
        developer.log("✅ Première exécution de l'application, listes de notifications initialisées");
      } else {
        developer.log("ℹ️ Ce n'est pas la première exécution de l'application");
      }

      // Créer une liste de session pour cette exécution
      await prefs.setStringList('session_notified_promos', []);
      developer.log("✅ Liste des promotions notifiées dans cette session réinitialisée");

      // Afficher les promotions déjà notifiées
      List<String> notifiedPromos = prefs.getStringList('notified_promos') ?? [];
      developer.log("📝 Promotions déjà notifiées (persistantes): $notifiedPromos");
    } catch (e) {
      developer.log("❌ Erreur lors de l'initialisation des données de session: $e");
    }
  }

  // Générer un ID unique pour l'appareil
  Future<String> _generateDeviceId() async {
    try {
      final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      String deviceId = '';

      if (Platform.isAndroid) {
        AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
        deviceId = 'android_${androidInfo.id}';
      } else if (Platform.isIOS) {
        IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
        deviceId = 'ios_${iosInfo.identifierForVendor}';
      } else {
        // Fallback pour autres plateformes
        deviceId = 'unknown_${DateTime.now().millisecondsSinceEpoch}';
      }

      developer.log("📱 Device ID généré: $deviceId");
      return deviceId;
    } catch (e) {
      developer.log("❌ Erreur lors de la génération du device ID: $e");
      // Fallback avec timestamp
      return 'fallback_${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  // Enregistrer l'appareil auprès du serveur
  Future<void> _registerDevice() async {
    try {
      if (_deviceId == null) {
        _deviceId = await _generateDeviceId();
      }

      final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      final PackageInfo packageInfo = await PackageInfo.fromPlatform();

      String platform = '';
      String deviceInfoStr = '';

      if (Platform.isAndroid) {
        AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
        platform = 'Android';
        deviceInfoStr = '${androidInfo.brand} ${androidInfo.model}';
      } else if (Platform.isIOS) {
        IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
        platform = 'iOS';
        deviceInfoStr = '${iosInfo.name} ${iosInfo.model}';
      }

      final response = await http.post(
        Uri.parse('${AppConfig.serverUrl}/api/mobile/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'device_id': _deviceId,
          'platform': platform,
          'app_version': packageInfo.version,
          'device_info': deviceInfoStr,
        }),
      );

      if (response.statusCode == 200) {
        developer.log("✅ Appareil enregistré avec succès");
      } else {
        developer.log("❌ Erreur lors de l'enregistrement: ${response.statusCode}");
      }
    } catch (e) {
      developer.log("❌ Erreur lors de l'enregistrement de l'appareil: $e");
    }
  }

  // Envoyer un heartbeat au serveur
  Future<void> _sendHeartbeat() async {
    try {
      if (_deviceId == null) {
        _deviceId = await _generateDeviceId();
      }

      final response = await http.post(
        Uri.parse('${AppConfig.serverUrl}/api/mobile/heartbeat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'device_id': _deviceId,
        }),
      );

      if (response.statusCode == 200) {
        developer.log("💓 Heartbeat envoyé avec succès");
      } else {
        developer.log("❌ Erreur lors de l'envoi du heartbeat: ${response.statusCode}");
      }
    } catch (e) {
      developer.log("❌ Erreur lors de l'envoi du heartbeat: $e");
    }
  }

  // Démarrer le heartbeat périodique
  void _startHeartbeat() {
    // Envoyer un heartbeat toutes les 5 minutes
    _heartbeatTimer = Timer.periodic(const Duration(minutes: 5), (timer) {
      _sendHeartbeat();
    });
    developer.log("💓 Heartbeat périodique démarré (toutes les 5 minutes)");
  }

  // Initialiser l'application de manière simple et fiable
  Future<void> _initializeApp() async {
    // Indiquer que le chargement est en cours
    setState(() {
      _isLoading = true;
    });

    developer.log("🚀 Initialisation de l'application");

    // Initialiser les données de session
    await _initializeSessionData();

    // Enregistrer l'appareil auprès du serveur
    await _registerDevice();

    // Démarrer le heartbeat périodique
    _startHeartbeat();

    // Vérifier si nous devons afficher l'écran de permissions
    bool needsPermissionScreen = await _needsPermissionScreen();

    if (needsPermissionScreen) {
      // Afficher l'écran de demande de permissions
      _showPermissionScreen();
      return;
    }

    // Vérifier les permissions
    await _checkPermissions();

    // Si les permissions sont accordées, démarrer les mises à jour de localisation
    if (_permissionsGranted) {
      developer.log("✅ Permissions accordées, initialisation des fonctionnalités");

      // Obtenir la position actuelle immédiatement
      try {
        developer.log("📍 Obtention de la position initiale");
        Position position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );

        developer.log("📍 Position initiale obtenue: ${position.latitude}, ${position.longitude}");

        // Mettre à jour la position actuelle
        setState(() {
          _currentPosition = position;
        });

        // Synchroniser les promotions avec le serveur
        await _syncPromotions();

        // Vérifier explicitement les promotions à proximité
        // Ne pas forcer l'envoi de notifications pour les promotions déjà notifiées
        developer.log("🔔 Vérification initiale des promotions à proximité");
        await checkNearbyPromotions(position, forceNotify: false, onlyNewPromotions: true);

        // Démarrer les mises à jour périodiques de localisation
        _startLocationUpdates();
      } catch (e) {
        developer.log("❌ Erreur lors de l'obtention de la position initiale: $e");
        developer.log(StackTrace.current.toString());

        // Même en cas d'erreur, essayer de synchroniser les promotions
        _syncPromotions();

        // Et démarrer les mises à jour de localisation
        _startLocationUpdates();
      }
    } else {
      developer.log("⚠️ Permissions non accordées, fonctionnalités limitées");
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Traiter une position nouvellement obtenue
  void _processPosition(Position position) async {
    if (!mounted) return;

    developer.log("📍 Traitement d'une nouvelle position: ${position.latitude}, ${position.longitude}");

    try {
      // Sauvegarder la position
      await _saveLastPosition(position);

      // Mettre à jour l'état
      setState(() {
        _currentPosition = position;
        _isLoading = false;
      });

      // Vérifier les promotions à proximité et envoyer des notifications seulement pour les nouvelles promotions
      developer.log("🔍 Vérification des promotions à proximité depuis _processPosition");
      await checkNearbyPromotions(position, forceNotify: false, onlyNewPromotions: true);

      // Charger les promotions pour l'affichage
      developer.log("📋 Chargement des promotions pour l'affichage");
      await _loadPromotions();

      developer.log("✅ Traitement de la position terminé avec succès");
    } catch (e) {
      developer.log("❌ Erreur lors du traitement de la position: $e");
      developer.log(StackTrace.current.toString());

      // Même en cas d'erreur, essayer de mettre à jour l'interface
      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        // Essayer de charger les promotions malgré l'erreur
        try {
          await _loadPromotions();
        } catch (loadError) {
          developer.log("❌ Erreur lors du chargement des promotions: $loadError");
        }
      }
    }
  }

  // Sauvegarder l'état des permissions dans les préférences
  Future<void> _savePermissionState(bool granted) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setBool('permissions_granted', granted);
      developer.log("État des permissions sauvegardé: $granted");
    } catch (e) {
      developer.log("Erreur lors de la sauvegarde de l'état des permissions: $e");
    }
  }

  // Sauvegarder la dernière position connue
  Future<void> _saveLastPosition(Position position) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('last_position_lat', position.latitude);
      await prefs.setDouble('last_position_lng', position.longitude);
      developer.log("Dernière position sauvegardée: ${position.latitude}, ${position.longitude}");
    } catch (e) {
      developer.log("Erreur lors de la sauvegarde de la position: $e");
    }
  }

  // Vérifier si nous devons afficher l'écran de permissions
  Future<bool> _needsPermissionScreen() async {
    try {
      // Vérifier si l'utilisateur a déjà vu l'écran de permissions
      SharedPreferences prefs = await SharedPreferences.getInstance();
      bool hasSeenPermissionScreen = prefs.getBool('has_seen_permission_screen') ?? false;

      if (hasSeenPermissionScreen) {
        return false; // L'utilisateur a déjà vu l'écran
      }

      // Vérifier les permissions actuelles
      LocationPermission permission = await Geolocator.checkPermission();

      // Si toutes les permissions sont accordées, pas besoin de l'écran
      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        // Marquer comme vu pour éviter de le montrer à nouveau
        await prefs.setBool('has_seen_permission_screen', true);
        return false;
      }

      // Afficher l'écran si les permissions ne sont pas accordées
      return true;
    } catch (e) {
      developer.log("Erreur lors de la vérification du besoin d'écran de permissions: $e");
      return false;
    }
  }

  // Afficher l'écran de demande de permissions
  void _showPermissionScreen() {
    setState(() {
      _isLoading = false;
    });

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => PermissionScreen(
          onPermissionsGranted: () async {
            // Marquer que l'utilisateur a vu l'écran de permissions
            SharedPreferences prefs = await SharedPreferences.getInstance();
            await prefs.setBool('has_seen_permission_screen', true);

            // Vérifier que le widget est toujours monté avant d'utiliser le contexte
            if (mounted) {
              // Retourner à l'écran principal et relancer l'initialisation
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const HomePage()),
              );
            }
          },
        ),
      ),
    );
  }





  @override
  void dispose() {
    // Annuler les timers s'ils existent encore
    _locationTimer?.cancel();
    _syncTimer?.cancel();
    _heartbeatTimer?.cancel();

    // Supprimer l'observateur
    WidgetsBinding.instance.removeObserver(this);

    // Annuler les tâches en arrière-plan si nécessaire
    // Workmanager().cancelAll();
    super.dispose();
  }

  // Vérifier les permissions
  Future<void> _checkPermissions() async {
    try {
      // Vérifier si le service de localisation est activé
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Essayer d'activer le service de localisation
        await Geolocator.openLocationSettings();

        // Attendre que l'utilisateur revienne à l'application
        await Future.delayed(const Duration(seconds: 2));

        // Vérifier à nouveau si le service est activé
        serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          // Sauvegarder l'état des permissions
          await _savePermissionState(false);

          setState(() {
            _isLoading = false;
            _permissionsGranted = false;
          });
          return;
        }
      }

      // Utiliser directement Geolocator pour les permissions de localisation
      // car il gère mieux les spécificités de chaque plateforme
      LocationPermission permission = await Geolocator.checkPermission();

      developer.log("Permission initiale: $permission");

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        developer.log("Permission après demande: $permission");

        if (permission == LocationPermission.denied) {
          // L'utilisateur a refusé la permission
          // Sauvegarder l'état des permissions
          await _savePermissionState(false);

          setState(() {
            _isLoading = false;
            _permissionsGranted = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        // L'utilisateur a refusé définitivement, ouvrir les paramètres
        // Vérifier si le widget est toujours monté avant d'utiliser le contexte
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Veuillez activer les permissions de localisation dans les paramètres'),
              duration: Duration(seconds: 5),
            ),
          );
        }

        await Future.delayed(const Duration(seconds: 1));
        await Geolocator.openAppSettings();

        // Sauvegarder l'état des permissions
        await _savePermissionState(false);

        // Vérifier à nouveau si le widget est monté
        if (mounted) {
          setState(() {
            _isLoading = false;
            _permissionsGranted = false;
          });
        }
        return;
      }

      // Demander les permissions de notification sur Android
      if (defaultTargetPlatform == TargetPlatform.android) {
        final status = await Permission.notification.request();
        developer.log("Permission de notification: $status");

        // Demander explicitement la permission pour les notifications via le plugin
        final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
            FlutterLocalNotificationsPlugin();
        final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
            flutterLocalNotificationsPlugin
                .resolvePlatformSpecificImplementation<
                    AndroidFlutterLocalNotificationsPlugin>();

        if (androidImplementation != null) {
          final bool? granted = await androidImplementation.requestNotificationsPermission();
          developer.log("Permission de notification via plugin: $granted");
        }
      }

      // Tester si on peut réellement obtenir la position
      try {
        Position position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );

        developer.log("📍 Position obtenue lors de la vérification des permissions: ${position.latitude}, ${position.longitude}");

        // Sauvegarder l'état des permissions
        await _savePermissionState(true);

        // Mettre à jour l'état
        setState(() {
          _currentPosition = position;
          _permissionsGranted = true;
          _isLoading = false;
        });

        // Vérifier si des promotions sont déjà en base de données locale
        List<Map<String, dynamic>> existingPromotions = await DatabaseHelper.instance.getPromotions();

        if (existingPromotions.isNotEmpty) {
          developer.log("🔔 Vérification des promotions à proximité après obtention des permissions");
          // Vérifier les promotions à proximité et envoyer des notifications seulement pour les nouvelles promotions
          await checkNearbyPromotions(position, forceNotify: false, onlyNewPromotions: true);
        } else {
          developer.log("ℹ️ Aucune promotion en base de données, pas de vérification de proximité");
        }
      } catch (posError) {
        developer.log("❌ Erreur lors de l'obtention de la position: $posError");

        // Sauvegarder l'état des permissions
        await _savePermissionState(false);

        setState(() {
          _isLoading = false;
          _permissionsGranted = false;
        });
      }
    } catch (e) {
      // Gérer les erreurs lors de la vérification des permissions
      developer.log("Erreur lors de la vérification des permissions: $e");

      // Sauvegarder l'état des permissions
      await _savePermissionState(false);

      setState(() {
        _isLoading = false;
        _permissionsGranted = false;
      });
    }
  }



  // Démarrer les mises à jour de localisation et la synchronisation périodique
  void _startLocationUpdates() {
    // Annuler les anciens timers s'ils existent
    _locationTimer?.cancel();
    _syncTimer?.cancel();

    // Créer un nouveau timer pour vérifier périodiquement la position
    _locationTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      developer.log("Vérification périodique de la position");

      try {
        Position position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );

        developer.log("Position mise à jour: ${position.latitude}, ${position.longitude}");
        _processPosition(position);
      } catch (e) {
        developer.log("Erreur lors de la mise à jour périodique de la position: $e");
      }
    });

    // Créer un nouveau timer pour synchroniser périodiquement les promotions (plus fréquent)
    _syncTimer = Timer.periodic(const Duration(minutes: 1), (timer) async {
      developer.log("Synchronisation périodique des promotions");

      try {
        await _syncPromotions();
        developer.log("✅ Synchronisation périodique réussie");
      } catch (e) {
        developer.log("❌ Erreur lors de la synchronisation périodique: $e");
      }
    });
  }

  // Synchroniser les promotions avec le serveur
  Future<void> _syncPromotions({bool forceReload = false}) async {
    try {
      // Indiquer que le chargement est en cours
      setState(() {
        _isLoading = true;
      });

      // Si forceReload est true, afficher un message
      if (forceReload) {
        developer.log("🔄 Synchronisation forcée des promotions");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Synchronisation forcée des promotions...'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      }

      // Utiliser l'URL configurée dans AppConfig pour l'API mobile
      String serverUrl = '${AppConfig.serverUrl}/api/mobile/promotions';

      developer.log("Tentative de connexion au serveur: $serverUrl");

      final response = await http.get(
        Uri.parse(serverUrl),
      );

      developer.log("Réponse du serveur: ${response.statusCode}");

      if (response.statusCode == 200) {
        developer.log("Contenu de la réponse: ${response.body}");
        List<dynamic> data = json.decode(response.body);
        developer.log("Nombre de promotions reçues: ${data.length}");

        // Collecter les IDs des promotions reçues pour gérer les suppressions
        List<int> receivedIds = [];

        // Enregistrer les promotions dans la base de données locale
        for (var promo in data) {
          developer.log("Traitement de la promotion: ${promo['title']} à ${promo['address']}");
          developer.log("Coordonnées: ${promo['latitude']}, ${promo['longitude']}");

          // Ajouter l'ID à la liste des IDs reçus
          receivedIds.add(promo['id']);

          await DatabaseHelper.instance.insertPromotion({
            'id': promo['id'],
            'title': promo['title'],
            'description': promo['description'],
            'store_name': promo['store_name'],
            'address': promo['address'],
            'latitude': promo['latitude'],
            'longitude': promo['longitude'],
            'created_at': promo['created_at'] ?? DateTime.now().toIso8601String(),
          });
        }

        // Supprimer les promotions qui n'existent plus sur le serveur
        int deletedCount = await DatabaseHelper.instance.deletePromotionsNotIn(receivedIds);
        if (deletedCount > 0) {
          developer.log("🗑️ $deletedCount promotions supprimées car elles n'existent plus sur le serveur");

          // Afficher un message à l'utilisateur si des promotions ont été supprimées
          if (mounted && forceReload) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$deletedCount promotion(s) supprimée(s)'),
                duration: const Duration(seconds: 3),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }

        // Mettre à jour le moment de la dernière synchronisation
        _lastSyncTime = DateTime.now();
        developer.log("⏰ Dernière synchronisation mise à jour: $_lastSyncTime");

        // Vérifier si nous avons une position actuelle
        if (_currentPosition == null) {
          developer.log("📍 Position non disponible, tentative d'obtention de la position...");

          try {
            // Essayer d'obtenir la position actuelle
            Position position = await Geolocator.getCurrentPosition(
              locationSettings: const LocationSettings(
                accuracy: LocationAccuracy.high,
                timeLimit: Duration(seconds: 5),
              ),
            );

            if (mounted) {
              setState(() {
                _currentPosition = position;
              });
            }

            developer.log("📍 Position obtenue: ${position.latitude}, ${position.longitude}");

            // Vérifier les promotions à proximité avec la nouvelle position
            developer.log("🔔 Vérification des promotions à proximité après synchronisation (nouvelle position)");
            await checkNearbyPromotions(position, forceNotify: false, onlyNewPromotions: true);
          } catch (e) {
            developer.log("❌ Impossible d'obtenir la position: $e");
          }
        } else {
          // Si nous avons déjà une position, vérifier les promotions à proximité
          developer.log("🔔 Vérification des promotions à proximité après synchronisation (position existante)");
          await checkNearbyPromotions(_currentPosition!, forceNotify: false, onlyNewPromotions: true);
        }

        // Charger les promotions (cette méthode gère maintenant correctement le cas où la position n'est pas disponible)
        await _loadPromotions();

        // Recharger les géofences avec les nouvelles promotions
        try {
          await PromoGeofenceService().reloadGeofences();
          developer.log("✅ Géofences rechargées après synchronisation");
        } catch (e) {
          developer.log("❌ Erreur lors du rechargement des géofences: $e");
        }
      } else {
        developer.log("Erreur de réponse du serveur: ${response.statusCode} - ${response.body}");

        // Charger quand même les promotions locales
        await _loadPromotions();
      }
    } catch (e) {
      developer.log("Erreur lors de la synchronisation des promotions: $e");

      // Afficher un message d'erreur à l'utilisateur
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Impossible de se connecter au serveur. Vérifiez que le serveur est en cours d\'exécution.'),
            duration: Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Réessayer',
              onPressed: () {
                setState(() {
                  _isLoading = true;
                });
                _syncPromotions();
              },
            ),
          ),
        );
      }

      // Charger les promotions depuis la base de données locale en cas d'erreur
      await _loadPromotions();
    }
  }

  // Charger les promotions depuis la base de données locale
  Future<void> _loadPromotions() async {
    try {
      developer.log("Chargement des promotions depuis la base de données locale");
      List<Map<String, dynamic>> promotions =
          await DatabaseHelper.instance.getPromotions();

      developer.log("Nombre de promotions trouvées dans la base de données: ${promotions.length}");

      if (promotions.isEmpty) {
        developer.log("Aucune promotion trouvée dans la base de données");

        // Même si aucune promotion n'est trouvée, mettre à jour l'état pour arrêter le chargement
        setState(() {
          _promotions = [];
          _isLoading = false;
        });
        return;
      } else {
        for (var promo in promotions) {
          developer.log("Promotion en base: ${promo['title']} à ${promo['address']}");
          developer.log("Coordonnées en base: ${promo['latitude']}, ${promo['longitude']}");
        }
      }

      // Vérifier si la position est disponible
      if (_currentPosition == null) {
        developer.log("Position actuelle non disponible, attente de la position...");

        // Ne pas mettre à jour l'interface tant que la position n'est pas disponible
        // Cela évite d'afficher toutes les promotions temporairement
        setState(() {
          _isLoading = true;  // Garder l'indicateur de chargement
        });

        // Essayer d'obtenir la position
        try {
          Position position = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
              timeLimit: Duration(seconds: 5),
            ),
          );

          if (mounted) {
            setState(() {
              _currentPosition = position;
            });
          }

          developer.log("Position obtenue: ${position.latitude}, ${position.longitude}");
        } catch (e) {
          developer.log("Impossible d'obtenir la position: $e");

          // Si on ne peut pas obtenir la position, ne pas afficher de promotions
          setState(() {
            _promotions = [];
            _isLoading = false;
          });
          return;
        }
      }

      // À ce stade, nous avons soit la position existante, soit une nouvelle position
      developer.log("Position actuelle: ${_currentPosition!.latitude}, ${_currentPosition!.longitude}");

      // Liste temporaire pour stocker les promotions avec leur distance
      List<Map<String, dynamic>> promotionsWithDistance = [];

      for (var i = 0; i < promotions.length; i++) {
        double distance = Geolocator.distanceBetween(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          promotions[i]['latitude'],
          promotions[i]['longitude'],
        );

        // Ajouter la distance à la promotion
        Map<String, dynamic> promoWithDistance = Map.from(promotions[i]);
        promoWithDistance['distance'] = distance;

        // Filtrer pour n'afficher que les promotions à proximité (moins de 1 km)
        if (distance <= 1000) {
          promotionsWithDistance.add(promoWithDistance);
          developer.log("Promotion à proximité ajoutée à la liste: ${promotions[i]['title']} (distance: $distance m)");
        } else {
          developer.log("Promotion ignorée car trop éloignée: ${promotions[i]['title']} (distance: $distance m)");
        }

        developer.log("Distance calculée pour ${promotions[i]['title']}: $distance mètres");
      }

      // Trier les promotions par distance
      promotionsWithDistance.sort((a, b) =>
          (a['distance'] as double).compareTo(b['distance'] as double));

      // Sauvegarder la position actuelle
      if (_currentPosition != null) {
        await _saveLastPosition(_currentPosition!);
      }

      // Mettre à jour l'interface avec les promotions filtrées et triées
      setState(() {
        _promotions = promotionsWithDistance;
        _isLoading = false;
      });

      developer.log("Interface mise à jour avec ${promotionsWithDistance.length} promotions à proximité");
    } catch (e) {
      developer.log("Erreur lors du chargement des promotions: $e");
      setState(() {
        _promotions = [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        title: const Text(
          'PromoPartout',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'clear_history') {
                _showClearDataDialog();
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'clear_history',
                child: Text('Supprimer l\'historique'),
              ),
            ],
          ),
        ],
      ),
      body: Stack(
        children: [
          // Contenu principal
          !_permissionsGranted
              ? _buildPermissionDeniedView()
              : _buildPromotionsList(),

          // Indicateur de chargement superposé
          if (_isLoading)
            Container(
              color: Colors.black.withAlpha(76), // Équivalent à 0.3 d'opacité (0.3 * 255 = 76.5)
              child: const Center(
                child: Card(
                  elevation: 8,
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Synchronisation en cours...'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // Fonction pour tester l'envoi d'une notification
  Future<void> _testNotification() async {
    try {
      developer.log("🧪 Test d'envoi de notification");

      // Réinitialiser la liste des promotions notifiées dans cette session pour le test
      SharedPreferences prefs = await SharedPreferences.getInstance();
      List<String> sessionNotifiedPromos = prefs.getStringList('session_notified_promos') ?? [];

      // Supprimer l'ID de test s'il existe déjà
      if (sessionNotifiedPromos.contains('9999')) {
        sessionNotifiedPromos.remove('9999');
        await prefs.setStringList('session_notified_promos', sessionNotifiedPromos);
        developer.log("🔄 ID de test 9999 supprimé de la liste des promotions notifiées de cette session");
      }

      // Envoyer la notification de test
      await _showNotification(
        9999, // ID spécial pour le test
        'Test de notification',
        'Ceci est un test de notification',
      );

      // Ajouter l'ID de test à la liste des promotions notifiées dans cette session
      sessionNotifiedPromos.add('9999');
      await prefs.setStringList('session_notified_promos', sessionNotifiedPromos);
      developer.log("📝 ID de test 9999 ajouté à la liste des promotions notifiées de cette session");

      // Afficher un message de confirmation
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification de test envoyée. Vérifiez si elle apparaît sur votre appareil.'),
            duration: Duration(seconds: 3),
            backgroundColor: Colors.blue,
          ),
        );
      }
    } catch (e) {
      developer.log("❌ Erreur lors du test de notification: $e");

      // Afficher un message d'erreur
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de l\'envoi de la notification de test: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildPermissionDeniedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            const Text(
              'Permissions de localisation requises',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            const Text(
              'Pour recevoir des notifications sur les promotions à proximité, veuillez autoriser l\'accès à votre position.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 10),
            const Text(
              'Assurez-vous que la localisation est activée dans les paramètres de votre appareil et que vous avez accordé les permissions nécessaires à l\'application.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () {
                    _checkPermissions();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Autoriser la localisation'),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: () async {
                    await Geolocator.openAppSettings();
                  },
                  child: const Text('Ouvrir les paramètres'),
                ),
              ],
            ),

          ],
        ),
      ),
    );
  }

  // Afficher une boîte de dialogue pour confirmer l'effacement des données
  void _showClearDataDialog() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('Effacer les données'),
          content: const Text('Voulez-vous vraiment effacer toutes les données de notification ? Cette action est irréversible.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(); // Fermer la boîte de dialogue
              },
              child: const Text('Annuler'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(); // Fermer la boîte de dialogue

                // Effacer les données
                _clearAllNotificationData().then((_) {
                  // Afficher un message de confirmation
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Toutes les données de notification ont été effacées. Redémarrez l\'application pour appliquer les changements.'),
                        duration: Duration(seconds: 5),
                        backgroundColor: Colors.orange,
                      ),
                    );
                  }
                });
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Effacer'),
            ),
          ],
        );
      },
    );
  }

  // Effacer complètement les données de notification
  Future<void> _clearAllNotificationData() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();

      // Effacer toutes les données liées aux notifications
      await prefs.remove('notified_promos');
      await prefs.remove('session_notified_promos');
      await prefs.remove('is_first_run');

      // Réinitialiser comme si c'était la première exécution
      await prefs.setBool('is_first_run', true);

      developer.log("🧹 Toutes les données de notification ont été effacées");
    } catch (e) {
      developer.log("❌ Erreur lors de l'effacement des données de notification: $e");
    }
  }

  // Réinitialiser les notifications
  Future<void> _resetNotifications() async {
    try {
      // Afficher un indicateur de chargement
      setState(() {
        _isLoading = true;
      });

      // Effacer complètement les données de notification
      await _clearAllNotificationData();

      // Réinitialiser les listes des promotions notifiées
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('notified_promos', []);
      await prefs.setStringList('session_notified_promos', []);
      developer.log("🔄 Notifications réinitialisées avec succès (globales et session)");

      // Afficher un message à l'utilisateur
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notifications réinitialisées. Vous recevrez à nouveau des notifications pour toutes les promotions à proximité.'),
            duration: Duration(seconds: 3),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Vérifier à nouveau les promotions à proximité
      if (_currentPosition != null) {
        developer.log("🔄 Vérification des promotions après réinitialisation des notifications");

        // Forcer une nouvelle vérification des promotions à proximité
        // Désactiver onlyNewPromotions pour recevoir des notifications pour toutes les promotions
        await checkNearbyPromotions(_currentPosition!, forceNotify: true, onlyNewPromotions: false);

        // Recharger la liste des promotions dans l'interface
        await _loadPromotions();
      } else {
        developer.log("⚠️ Position non disponible, impossible de vérifier les promotions");

        // Essayer d'obtenir la position actuelle
        try {
          Position position = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
              timeLimit: Duration(seconds: 5),
            ),
          );

          if (mounted) {
            setState(() {
              _currentPosition = position;
            });

            // Vérifier les promotions avec la nouvelle position
            // Désactiver onlyNewPromotions pour recevoir des notifications pour toutes les promotions
            await checkNearbyPromotions(position, forceNotify: true, onlyNewPromotions: false);
            await _loadPromotions();
          }
        } catch (posError) {
          developer.log("❌ Impossible d'obtenir la position: $posError");

          // Arrêter le chargement même en cas d'erreur
          if (mounted) {
            setState(() {
              _isLoading = false;
            });
          }
        }
      }

      // Arrêter l'indicateur de chargement
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      developer.log("❌ Erreur lors de la réinitialisation des notifications: $e");
      developer.log(StackTrace.current.toString());

      // Arrêter l'indicateur de chargement en cas d'erreur
      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        // Afficher un message d'erreur
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la réinitialisation des notifications: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildPromotionsList() {
    if (_promotions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            const Text(
              'Aucune promotion à proximité',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Déplacez-vous pour découvrir des promotions dans un rayon de 1 km autour de vous !',
                style: TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
            ),

          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _promotions.length,
      itemBuilder: (context, index) {
        final promo = _promotions[index];
        final hasDistance = promo.containsKey('distance');

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          elevation: 2,
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(
              promo['title'],
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text(
                  promo['store_name'],
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 16,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  promo['description'],
                  style: const TextStyle(
                    fontSize: 15,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (hasDistance) ...[
                  const SizedBox(height: 8),
                  Text(
                    '${(promo['distance'] / 1000).toStringAsFixed(2)} km',
                    style: TextStyle(
                      color: promo['distance'] <= 1000
                          ? Colors.green
                          : Colors.orange,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ],
            ),
            onTap: () {
              _showPromotionDetails(promo);
            },
          ),
        );
      },
    );
  }

  void _showPromotionDetails(Map<String, dynamic> promo) {
    // Utiliser le BuildContext de Flutter pour showModalBottomSheet
    final BuildContext buildContext = context;
    showModalBottomSheet(
      context: buildContext,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                promo['title'],
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                promo['store_name'],
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(height: 15),
              const Text(
                'Description:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                promo['description'],
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 15),
              const Text(
                'Adresse:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                promo['address'],
                style: const TextStyle(fontSize: 16),
              ),
              if (promo.containsKey('distance')) ...[
                const SizedBox(height: 15),
                Text(
                  'Distance: ${(promo['distance'] / 1000).toStringAsFixed(2)} km',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: promo['distance'] <= 1000 ? Colors.green : Colors.black,
                  ),
                ),
              ],
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text('Fermer'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

}

// Classe pour gérer la base de données SQLite
class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('promotions.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final dbFilePath = path_lib.join(dbPath, filePath);

    return await openDatabase(
      dbFilePath,
      version: 3, // Augmenter la version pour ajouter created_at
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE promotions(
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        store_name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at TEXT,
        last_notification_time TEXT
      )
    ''');
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Ajouter la colonne last_notification_time
      await db.execute('''
        ALTER TABLE promotions ADD COLUMN last_notification_time TEXT
      ''');
    }
    if (oldVersion < 3) {
      // Ajouter la colonne created_at
      await db.execute('''
        ALTER TABLE promotions ADD COLUMN created_at TEXT
      ''');
    }
  }

  Future<int> insertPromotion(Map<String, dynamic> promotion) async {
    final db = await database;

    // Vérifier si la promotion existe déjà
    final existingPromo = await db.query(
      'promotions',
      where: 'id = ?',
      whereArgs: [promotion['id']],
    );

    if (existingPromo.isNotEmpty) {
      // Mettre à jour la promotion existante
      return await db.update(
        'promotions',
        promotion,
        where: 'id = ?',
        whereArgs: [promotion['id']],
      );
    } else {
      // Insérer une nouvelle promotion
      return await db.insert('promotions', promotion);
    }
  }

  Future<List<Map<String, dynamic>>> getPromotions() async {
    final db = await database;
    return await db.query('promotions');
  }

  // Supprimer une promotion par son ID
  Future<int> deletePromotion(int id) async {
    final db = await database;
    return await db.delete(
      'promotions',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Supprimer toutes les promotions qui ne sont pas dans la liste des IDs fournis
  Future<int> deletePromotionsNotIn(List<int> ids) async {
    final db = await database;
    if (ids.isEmpty) {
      // Si la liste est vide, supprimer toutes les promotions
      return await db.delete('promotions');
    } else {
      // Récupérer toutes les promotions actuelles
      final allPromotions = await db.query('promotions');

      // Identifier les promotions à supprimer
      final List<int> idsToDelete = [];
      for (var promo in allPromotions) {
        int promoId = promo['id'] as int;
        if (!ids.contains(promoId)) {
          idsToDelete.add(promoId);
        }
      }

      // Journaliser les IDs à supprimer pour le débogage
      developer.log("🗑️ IDs à supprimer: $idsToDelete");
      developer.log("✅ IDs à conserver: $ids");

      // Si aucune promotion à supprimer, retourner 0
      if (idsToDelete.isEmpty) {
        return 0;
      }

      // Supprimer chaque promotion individuellement
      int deletedCount = 0;
      for (var id in idsToDelete) {
        final count = await db.delete(
          'promotions',
          where: 'id = ?',
          whereArgs: [id],
        );
        deletedCount += count;
      }

      return deletedCount;
    }
  }

  // Récupérer une promotion par son ID
  Future<Map<String, dynamic>?> getPromotionById(int id) async {
    final db = await database;
    final results = await db.query(
      'promotions',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (results.isNotEmpty) {
      return results.first;
    }
    return null;
  }

  // Récupérer le timestamp de la dernière notification pour une promotion
  Future<DateTime?> getLastNotificationTime(int promotionId) async {
    final db = await database;
    final results = await db.query(
      'promotions',
      columns: ['last_notification_time'],
      where: 'id = ?',
      whereArgs: [promotionId],
    );

    if (results.isNotEmpty && results.first['last_notification_time'] != null) {
      return DateTime.parse(results.first['last_notification_time'] as String);
    }
    return null;
  }

  // Mettre à jour le timestamp de la dernière notification
  Future<void> updateLastNotificationTime(int promotionId, DateTime timestamp) async {
    final db = await database;
    await db.update(
      'promotions',
      {'last_notification_time': timestamp.toIso8601String()},
      where: 'id = ?',
      whereArgs: [promotionId],
    );
  }
}
