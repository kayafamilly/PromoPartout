# Configuration DNS pour promo-partout.com

## 🌐 Configuration requise chez votre registraire de domaine

Pour que votre domaine `promo-partout.com` pointe vers votre VPS Hostinger, vous devez configurer les enregistrements DNS suivants :

### 📋 Enregistrements DNS à créer

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | @ | 168.231.82.122 | 3600 |
| A | www | 168.231.82.122 | 3600 |
| CNAME | api | promo-partout.com | 3600 |

### 🔧 Explication des enregistrements

- **A @ 168.231.82.122** : Fait pointer `promo-partout.com` vers votre VPS
- **A www 168.231.82.122** : Fait pointer `www.promo-partout.com` vers votre VPS  
- **CNAME api promo-partout.com** : Optionnel, pour `api.promo-partout.com`

### ⏱️ Propagation DNS

- **Délai** : 24-48 heures maximum
- **Vérification** : Utilisez `nslookup promo-partout.com` ou `dig promo-partout.com`

### 🔒 Configuration SSL (Recommandée)

Une fois le DNS configuré, vous pouvez installer un certificat SSL gratuit avec Let's Encrypt :

```bash
# Se connecter au VPS
ssh root@168.231.82.122

# Installer Certbot
apt update
apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
certbot --nginx -d promo-partout.com -d www.promo-partout.com

# Le certificat se renouvelle automatiquement
```

### 🌐 URLs finales après configuration

- **Principal** : https://promo-partout.com
- **Avec www** : https://www.promo-partout.com
- **API** : https://promo-partout.com/api/
- **Admin** : https://promo-partout.com (cliquer sur Administration)

### 📱 Configuration mobile

Après activation du SSL, mettez à jour la configuration mobile :

```dart
// Dans mobile-app/promo_partout/lib/config_production.dart
static const String serverUrl = 'https://promo-partout.com';
```

### ✅ Test de fonctionnement

1. **Ping** : `ping promo-partout.com` doit retourner `168.231.82.122`
2. **Web** : `http://promo-partout.com` doit afficher l'application
3. **API** : `http://promo-partout.com/api/health` doit retourner le statut
4. **Mobile** : L'app mobile doit se connecter et synchroniser

### 🚨 Dépannage

Si le domaine ne fonctionne pas :

1. **Vérifiez les DNS** : `nslookup promo-partout.com`
2. **Testez l'IP directe** : `http://168.231.82.122`
3. **Vérifiez Nginx** : `sudo nginx -t && sudo systemctl status nginx`
4. **Vérifiez les logs** : `sudo tail -f /var/log/nginx/error.log`
