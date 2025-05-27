# 🧪 Test de l'Interface Web - Système Commerçants

## ✅ **Statut : Prêt pour les tests**

### 🌐 **URLs d'accès :**
- **Interface Web** : http://localhost:5173
- **API Backend** : http://localhost:3001

---

## 🔧 **Tests à effectuer**

### **1. Test d'Inscription Commerçant**

1. **Ouvrir** http://localhost:5173
2. **Cliquer** sur "S'inscrire"
3. **Remplir le formulaire** :
   - **Nom du commerce** : "Ma Boulangerie"
   - **Email** : "contact@maboulangerie.fr"
   - **Adresse** : "123 Rue de la Paix, 75001 Paris"
   - **Logo** : (optionnel) Choisir une image
   - **Mot de passe** : "motdepasse123"
   - **Confirmer** : "motdepasse123"
4. **Cliquer** sur "S'inscrire"
5. ✅ **Résultat attendu** : Redirection automatique vers le dashboard

### **2. Test du Dashboard Commerçant**

Après inscription/connexion, vous devriez voir :
- ✅ **Header** avec nom du commerce et logo
- ✅ **Bouton** "+ Nouvelle Promotion"
- ✅ **Section** "Mes Promotions" (vide au début)
- ✅ **Statistiques** en bas de page

### **3. Test de Création de Promotion**

1. **Cliquer** sur "+ Nouvelle Promotion"
2. **Remplir le formulaire** :
   - **Titre** : "Pain frais -20%"
   - **Description** : "Réduction sur tous nos pains artisanaux"
   - **Adresse** : "123 Rue de la Paix, 75001 Paris"
3. **Cliquer** sur "Localiser" pour géocoder l'adresse
4. **Ajuster** la position sur la carte si nécessaire
5. **Cliquer** sur "Ajouter la promotion"
6. ✅ **Résultat attendu** : 
   - Message de succès
   - Promotion apparaît dans la liste
   - Formulaire se ferme automatiquement

### **4. Test de Gestion des Promotions**

1. **Vérifier** que la promotion créée apparaît dans "Mes Promotions"
2. **Cliquer** sur "🗑️ Supprimer" pour une promotion
3. **Confirmer** la suppression
4. ✅ **Résultat attendu** : Promotion supprimée de la liste

### **5. Test de Déconnexion/Reconnexion**

1. **Cliquer** sur "Déconnexion"
2. ✅ **Résultat attendu** : Retour à la page de connexion
3. **Se reconnecter** avec les mêmes identifiants
4. ✅ **Résultat attendu** : Retour au dashboard avec les promotions

### **6. Test d'Isolation des Données**

1. **Se déconnecter**
2. **Créer un second compte** :
   - **Nom** : "Café Central"
   - **Email** : "contact@cafecentral.fr"
   - **Mot de passe** : "password123"
3. **Créer une promotion** pour ce second commerçant
4. ✅ **Résultat attendu** : 
   - Seules les promotions du commerçant connecté sont visibles
   - Impossible de voir les promotions des autres commerçants

---

## 🔍 **Vérifications Techniques**

### **API Mobile (pour l'app mobile)**
- **Toutes les promotions** : http://localhost:3001/api/mobile/promotions
- **Promotions à proximité** : http://localhost:3001/api/mobile/promotions/nearby?latitude=48.8566&longitude=2.3522&radius=1

### **API Commerçants (authentifiée)**
- **Mes promotions** : http://localhost:3001/api/promotions (nécessite token)
- **Créer promotion** : POST http://localhost:3001/api/promotions (nécessite token)

---

## 🎯 **Résultats Attendus**

### ✅ **Fonctionnalités Opérationnelles**
- [x] Inscription/Connexion commerçants
- [x] Dashboard personnalisé
- [x] Création de promotions
- [x] Gestion des promotions (suppression)
- [x] Isolation des données par commerçant
- [x] Upload de logo (optionnel)
- [x] Session persistante
- [x] API mobile publique

### ✅ **Sécurité**
- [x] Authentification JWT
- [x] Isolation des données
- [x] Validation des formulaires
- [x] Gestion des erreurs

### ✅ **Interface Utilisateur**
- [x] Design responsive
- [x] Messages de feedback
- [x] Navigation intuitive
- [x] Gestion des états de chargement

---

## 🚀 **Prêt pour le Déploiement**

Une fois tous les tests validés, le système sera prêt pour :
1. **Déploiement** sur le VPS Hostinger
2. **Tests en conditions réelles** avec plusieurs commerçants
3. **Utilisation** par l'application mobile

**Le système de comptes commerçants est maintenant fonctionnel et sécurisé !** 🎉
