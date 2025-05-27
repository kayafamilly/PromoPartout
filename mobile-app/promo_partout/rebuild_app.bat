@echo off
echo 🧹 Nettoyage et reconstruction de l'application mobile...
echo ================================================

echo 📱 Arrêt de l'application sur l'appareil...
flutter run --stop

echo 🧹 Nettoyage du cache Flutter...
flutter clean

echo 📦 Récupération des dépendances...
flutter pub get

echo 🔨 Reconstruction de l'application...
flutter build apk --debug

echo 🚀 Lancement de l'application...
flutter run

echo ✅ Reconstruction terminée!
