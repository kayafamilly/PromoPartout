# 🏪 Guide du Système de Comptes Commerçants - PromoPartout

## 🎯 **Nouvelles Fonctionnalités Ajoutées**

### ✅ **Authentification Commerçants**
- **Inscription** avec nom du commerce, email, mot de passe, adresse et logo
- **Connexion** sécurisée avec JWT
- **Session persistante** avec reconnexion automatique

### ✅ **Gestion des Promotions par Commerçant**
- Chaque commerçant ne voit que **ses propres promotions**
- **Isolation complète** des données entre commerçants
- **Suppression** uniquement de ses propres promotions

### ✅ **Interface Dédiée**
- **Dashboard commerçant** avec statistiques
- **Formulaire de création** de promotions simplifié
- **Liste des promotions** avec actions de gestion

### ✅ **API Mobile Séparée**
- Routes `/api/mobile/*` pour l'application mobile
- **Accès public** à toutes les promotions pour les utilisateurs
- **Données enrichies** avec logo et nom du commerce

---

## 🧪 **Guide de Test**

### **1. Test de l'Interface Web**

#### **A. Inscription d'un Commerçant**
1. Ouvrez http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire :
   - **Nom du commerce** : "Boulangerie Martin"
   - **Email** : "martin@boulangerie.fr"
   - **Adresse** : "123 Rue de la Paix, 75001 Paris"
   - **Logo** : (optionnel) Uploadez une image
   - **Mot de passe** : "motdepasse123"
4. Cliquez sur "S'inscrire"
5. ✅ **Résultat attendu** : Connexion automatique et redirection vers le dashboard

#### **B. Création de Promotions**
1. Dans le dashboard, cliquez sur "+ Nouvelle Promotion"
2. Remplissez :
   - **Titre** : "Pain frais -20%"
   - **Description** : "Réduction sur tous nos pains artisanaux"
   - **Adresse** : "123 Rue de la Paix, 75001 Paris"
3. Cliquez sur "Localiser" pour géocoder
4. Ajustez la position sur la carte si nécessaire
5. Cliquez sur "Ajouter la promotion"
6. ✅ **Résultat attendu** : Promotion créée et visible dans la liste

#### **C. Test d'Isolation des Données**
1. Déconnectez-vous
2. Créez un **second compte commerçant** :
   - **Nom** : "Café Central"
   - **Email** : "contact@cafecentral.fr"
3. Créez une promotion pour ce second commerçant
4. ✅ **Résultat attendu** : Chaque commerçant ne voit que ses propres promotions

### **2. Test de l'API Mobile**

#### **A. Vérification des Routes API**
1. **Toutes les promotions** : http://localhost:3001/api/mobile/promotions
2. **Promotions à proximité** : http://localhost:3001/api/mobile/promotions/nearby?latitude=48.8566&longitude=2.3522&radius=1
3. ✅ **Résultat attendu** : Les deux commerçants et leurs promotions sont visibles

#### **B. Test de l'Application Mobile**
1. **Redémarrez l'application mobile** (elle utilise maintenant les nouvelles routes)
2. L'app devrait afficher **toutes les promotions** de tous les commerçants
3. Les **notifications de proximité** devraient inclure le nom du commerce et le logo

---

## 🔧 **Architecture Technique**

### **Base de Données**
```sql
-- Table des commerçants
merchants (
  id, business_name, email, password_hash, 
  address, logo_url, created_at
)

-- Table des promotions (avec merchant_id)
promotions (
  id, merchant_id, title, description, 
  store_name, address, latitude, longitude, created_at
)
```

### **Routes API**

#### **Authentification**
- `POST /api/auth/register` - Inscription commerçant
- `POST /api/auth/login` - Connexion commerçant
- `GET /api/auth/me` - Profil commerçant

#### **Gestion Promotions (Authentifié)**
- `GET /api/promotions` - Mes promotions
- `POST /api/promotions` - Créer une promotion
- `DELETE /api/promotions/:id` - Supprimer ma promotion

#### **API Mobile (Public)**
- `GET /api/mobile/promotions` - Toutes les promotions
- `GET /api/mobile/promotions/nearby` - Promotions à proximité

---

## 🚀 **Déploiement**

### **Fichiers Modifiés pour la Production**
1. **Serveur** : `server/index-with-auth.js` (nouveau serveur avec auth)
2. **Web App** : Interface complètement refaite avec authentification
3. **Mobile App** : Routes API mises à jour vers `/api/mobile/*`

### **Nouvelles Dépendances**
```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1"
}
```

---

## 🎯 **Avantages du Nouveau Système**

### **Pour les Commerçants**
- ✅ **Sécurité** : Chaque commerçant gère uniquement ses promotions
- ✅ **Simplicité** : Interface dédiée et intuitive
- ✅ **Branding** : Logo et nom du commerce mis en avant
- ✅ **Autonomie** : Création/suppression en toute indépendance

### **Pour les Utilisateurs Mobile**
- ✅ **Richesse** : Informations complètes avec logos des commerces
- ✅ **Fiabilité** : Données vérifiées par les commerçants eux-mêmes
- ✅ **Diversité** : Accès à toutes les promotions de tous les commerçants

### **Pour le Déploiement**
- ✅ **Évolutivité** : Architecture prête pour des milliers de commerçants
- ✅ **Sécurité** : Authentification JWT robuste
- ✅ **Maintenance** : Séparation claire entre API web et mobile

---

## 🔄 **Prochaines Étapes Suggérées**

1. **Test complet** du système d'authentification
2. **Déploiement** sur le VPS avec la nouvelle architecture
3. **Test en conditions réelles** avec plusieurs commerçants
4. **Optimisations** basées sur les retours d'usage

Le système est maintenant **prêt pour un usage professionnel** avec une vraie séparation des données par commerçant ! 🎉
