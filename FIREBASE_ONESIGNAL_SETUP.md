# Configuration Firebase et OneSignal pour PromoPartout

## Étapes à suivre manuellement

### 1. Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Ajouter un projet" ou "Create a project"
4. Nom du projet : `PromoPartout`
5. Désactivez Google Analytics (pas nécessaire)
6. Cliquez sur "Créer le projet"

### 2. Configurer Firebase pour Android

1. Dans la console Firebase, cliquez sur l'icône Android
2. **Package name Android** : `com.example.promo_partout`
3. **App nickname** : `PromoPartout Android`
4. Cliquez sur "Enregistrer l'application"
5. **IMPORTANT** : Téléchargez le fichier `google-services.json`
6. **IMPORTANT** : Placez ce fichier dans `android/app/` de votre projet Flutter

### 3. Obtenir la clé du serveur Firebase

1. Dans la console Firebase, cliquez sur ⚙️ (paramètres) > "Paramètres du projet"
2. Allez dans l'onglet "Cloud Messaging"
3. **COPIEZ la "Clé du serveur"** - vous en aurez besoin pour OneSignal

### 4. Créer un compte OneSignal

1. Allez sur [onesignal.com](https://onesignal.com/)
2. Créez un compte gratuit
3. Cliquez sur "Add App"
4. **App Name** : `PromoPartout`
5. Sélectionnez "Google Android (FCM)"
6. **Firebase Server Key** : Collez la clé copiée à l'étape 3
7. **Firebase Sender ID** : Trouvez-le dans Firebase > Paramètres > Général
8. Cliquez sur "Save & Continue"
9. **COPIEZ votre OneSignal App ID** - vous en aurez besoin

### 5. Configurer votre projet Flutter

#### 5.1 Modifier android/build.gradle
Ajoutez dans la section `dependencies` :
```gradle
buildscript {
    dependencies {
        // ... autres dépendances
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

#### 5.2 Modifier android/app/build.gradle
Ajoutez à la fin du fichier :
```gradle
apply plugin: 'com.google.gms.google-services'
```

#### 5.3 Mettre à jour votre App ID OneSignal
1. Ouvrez le fichier `lib/config.dart`
2. Remplacez `"VOTRE_ONESIGNAL_APP_ID"` par votre vrai App ID OneSignal

### 6. Tester la configuration

1. Exécutez `flutter clean && flutter pub get`
2. Lancez l'application : `flutter run`
3. Acceptez les permissions de notification
4. Testez en envoyant une notification depuis la console OneSignal

## Fichiers modifiés automatiquement

- ✅ `pubspec.yaml` - Dépendance OneSignal ajoutée
- ✅ `lib/main.dart` - Initialisation OneSignal ajoutée
- ✅ `lib/config.dart` - Configuration centralisée créée

## Fichiers à modifier manuellement

- ❌ `android/app/google-services.json` - À télécharger depuis Firebase
- ❌ `android/build.gradle` - Ajouter le plugin Google Services
- ❌ `android/app/build.gradle` - Appliquer le plugin
- ❌ `lib/config.dart` - Remplacer l'App ID OneSignal

## Dépannage

### Erreur "google-services.json not found"
- Vérifiez que le fichier est dans `android/app/`
- Relancez `flutter clean && flutter pub get`

### Notifications ne s'affichent pas
- Vérifiez les permissions dans les paramètres de l'appareil
- Testez avec une notification depuis la console OneSignal
- Vérifiez les logs avec `flutter logs`

### Erreur de compilation Android
- Vérifiez que le plugin Google Services est bien ajouté
- Assurez-vous que les versions sont compatibles
