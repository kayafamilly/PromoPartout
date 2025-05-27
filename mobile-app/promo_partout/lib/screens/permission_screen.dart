import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:app_settings/app_settings.dart';

class PermissionScreen extends StatefulWidget {
  final VoidCallback onPermissionsGranted;

  const PermissionScreen({Key? key, required this.onPermissionsGranted}) : super(key: key);

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue.shade50,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icône principale
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.blue.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.location_on,
                  size: 60,
                  color: Colors.blue.shade600,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Titre
              Text(
                '📍 Localisation Requise',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Description
              Text(
                'PromoPartout a besoin d\'accéder à votre localisation pour vous alerter automatiquement des promotions à proximité, même quand l\'application est fermée.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Avantages
              _buildFeatureItem(
                Icons.notifications_active,
                'Notifications automatiques',
                'Recevez des alertes quand vous passez près d\'une promotion',
              ),
              
              const SizedBox(height: 16),
              
              _buildFeatureItem(
                Icons.access_time,
                'Fonctionne en arrière-plan',
                'Détection même quand l\'app est fermée',
              ),
              
              const SizedBox(height: 16),
              
              _buildFeatureItem(
                Icons.security,
                'Données sécurisées',
                'Votre position n\'est jamais stockée ni partagée',
              ),
              
              const SizedBox(height: 48),
              
              // Boutons
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _requestPermissions,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade600,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              '✅ Autoriser la Localisation',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  TextButton(
                    onPressed: _isLoading ? null : _skipPermissions,
                    child: Text(
                      'Continuer sans notifications automatiques',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String description) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.green.shade100,
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: Colors.green.shade600,
            size: 24,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _requestPermissions() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Demander d'abord la permission de localisation de base
      PermissionStatus locationStatus = await Permission.location.request();
      
      if (locationStatus.isGranted) {
        // Ensuite demander la permission en arrière-plan
        PermissionStatus backgroundStatus = await Permission.locationAlways.request();
        
        if (backgroundStatus.isGranted) {
          // Demander la permission de notifications
          await Permission.notification.request();
          
          // Toutes les permissions accordées
          widget.onPermissionsGranted();
          return;
        } else if (backgroundStatus.isPermanentlyDenied) {
          _showSettingsDialog();
          return;
        }
      }
      
      if (locationStatus.isPermanentlyDenied) {
        _showSettingsDialog();
        return;
      }
      
      // Permissions partielles ou refusées
      _showPartialPermissionDialog();
      
    } catch (e) {
      print('Erreur lors de la demande de permissions: $e');
      _showErrorDialog();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🔧 Paramètres Requis'),
        content: const Text(
          'Pour activer les notifications automatiques, veuillez :\n\n'
          '1. Aller dans les Paramètres\n'
          '2. Choisir "Localisation"\n'
          '3. Sélectionner "Autoriser tout le temps"\n\n'
          'Cela permettra à PromoPartout de vous alerter même quand l\'app est fermée.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Plus tard'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              AppSettings.openAppSettings();
            },
            child: const Text('Ouvrir Paramètres'),
          ),
        ],
      ),
    );
  }

  void _showPartialPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('⚠️ Permissions Limitées'),
        content: const Text(
          'L\'application fonctionnera, mais les notifications automatiques ne seront disponibles que quand l\'app est ouverte.\n\n'
          'Vous pouvez modifier cela plus tard dans les paramètres.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onPermissionsGranted();
            },
            child: const Text('Continuer'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _requestPermissions();
            },
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('❌ Erreur'),
        content: const Text(
          'Une erreur s\'est produite lors de la demande de permissions. '
          'L\'application fonctionnera en mode limité.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onPermissionsGranted();
            },
            child: const Text('Continuer'),
          ),
        ],
      ),
    );
  }

  void _skipPermissions() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('📱 Mode Limité'),
        content: const Text(
          'Sans les permissions de localisation, vous ne recevrez pas de notifications automatiques.\n\n'
          'Vous pourrez toujours voir les promotions en ouvrant l\'application.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Retour'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onPermissionsGranted();
            },
            child: const Text('Continuer quand même'),
          ),
        ],
      ),
    );
  }
}
