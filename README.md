# PromoPartout

PromoPartout est une solution complète permettant aux commerçants de créer des promotions géolocalisées et aux utilisateurs de recevoir des notifications lorsqu'ils se trouvent à proximité de ces promotions.

## Structure du projet

Le projet est divisé en deux parties principales :

1. **Application Web** (dossier `web-app`) : Interface pour les commerçants permettant de créer et gérer des promotions.
2. **Application Mobile** (dossier `mobile-app`) : Application Flutter pour les utilisateurs qui reçoivent des notifications de promotions à proximité.

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- Flutter (dernière version stable)
- Android Studio ou Xcode (pour le développement mobile)

## Installation et démarrage

### Application Web (pour les commerçants)

1. Accédez au dossier de l'application web :
   ```
   cd web-app
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Démarrez l'application web et le serveur backend :
   ```
   node ../start-web-app.js
   ```

4. L'application web sera accessible à l'adresse : `http://localhost:5173`
   Le serveur backend sera accessible à l'adresse : `http://localhost:3001`

### Application Mobile (pour les utilisateurs)

1. Accédez au dossier de l'application mobile :
   ```
   cd mobile-app/promo_partout
   ```

2. Installez les dépendances Flutter :
   ```
   flutter pub get
   ```

3. Lancez l'application sur un émulateur ou un appareil connecté :
   ```
   flutter run
   ```

## Fonctionnalités

### Application Web (Commerçants)

- Création de promotions avec titre, description et nom du commerce
- Géolocalisation précise du commerce sur une carte interactive
- Visualisation de toutes les promotions créées

### Application Mobile (Utilisateurs)

- Demande d'autorisation pour la géolocalisation et les notifications
- Synchronisation des promotions depuis le serveur
- Stockage local des promotions dans une base de données SQLite
- Vérification périodique de la position de l'utilisateur
- Envoi de notifications lorsque l'utilisateur est à moins de 1km d'une promotion
- Affichage des promotions triées par distance

## Configuration technique

### Serveur Backend

Le serveur backend utilise Express.js avec une base de données SQLite pour stocker les promotions. Il expose les API suivantes :

- `GET /api/promotions` : Récupérer toutes les promotions
- `POST /api/promotions` : Créer une nouvelle promotion
- `GET /api/promotions/nearby` : Récupérer les promotions à proximité d'une position donnée

### Application Mobile

L'application mobile utilise plusieurs plugins Flutter importants :

- `geolocator` : Pour la géolocalisation
- `flutter_local_notifications` : Pour les notifications
- `background_fetch` : Pour les vérifications en arrière-plan
- `sqflite` : Pour la base de données locale
- `http` : Pour les requêtes API

## Notes importantes

- Pour l'application mobile, l'adresse du serveur est configurée sur `http://10.0.2.2:3001` qui correspond à l'adresse localhost de l'émulateur Android. Si vous utilisez un appareil physique ou iOS, vous devrez modifier cette adresse.
- L'application mobile vérifie la position toutes les minutes et envoie des notifications pour les promotions à moins de 1km.
- Les permissions de localisation en arrière-plan sont nécessaires pour que l'application fonctionne correctement même lorsqu'elle n'est pas active.

## Licence

Ce projet est sous licence MIT.
