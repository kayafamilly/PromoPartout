# 🚀 Guide de Déploiement PromoPartout

## 📋 Résumé
Ce guide vous permet de déployer PromoPartout sur votre VPS Hostinger et de tester l'application en conditions réelles.

## 🖥️ Informations du VPS
- **IP:** 168.231.82.122
- **Hostname:** srv813637.hstgr.cloud
- **OS:** Ubuntu 22.04 LTS

## 📱 Configuration Mobile
✅ **DÉJÀ FAIT:** L'application mobile est configurée pour pointer vers le serveur de production.

## 🔧 Étapes de Déploiement

### 1. Connexion au VPS
```bash
ssh root@168.231.82.122
```

### 2. Installation Automatique
Copiez et collez ce script complet sur votre VPS :

```bash
#!/bin/bash
set -e

echo "🚀 Installation PromoPartout..."

# Mise à jour système
apt update && apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs nginx

# Création répertoires
mkdir -p /var/www/promo-partout/server /var/www/promo-partout/public
cd /var/www/promo-partout

# Package.json
cat > server/package.json << 'EOF'
{
  "name": "promo-partout-server",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "better-sqlite3": "^11.9.1",
    "cors": "^2.8.5",
    "express": "^5.1.0"
  }
}
EOF

# Installation dépendances
cd server && npm install && cd ..

echo "✅ Dépendances installées. Créez maintenant le fichier serveur."
```

### 3. Créer le Fichier Serveur
Créez le fichier `/var/www/promo-partout/server/index.js` avec le contenu du fichier `server-production.js` fourni.

### 4. Configuration des Services
```bash
# Service systemd
cat > /etc/systemd/system/promo-partout.service << 'EOF'
[Unit]
Description=PromoPartout Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/promo-partout/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Configuration Nginx
cat > /etc/nginx/sites-available/promo-partout << 'EOF'
server {
    listen 80;
    server_name 168.231.82.122 promo-partout.srv813637.hstgr.cloud;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activation services
systemctl daemon-reload
systemctl enable promo-partout
systemctl start promo-partout

ln -sf /etc/nginx/sites-available/promo-partout /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw allow 3000
ufw --force enable

echo "✅ Installation terminée!"
```

## 🌐 URLs d'Accès
Après déploiement, votre application sera accessible à :
- **http://168.231.82.122**
- **http://promo-partout.srv813637.hstgr.cloud**

## 📱 Test en Conditions Réelles

### 1. Vérification du Serveur
1. Ouvrez http://168.231.82.122 dans votre navigateur
2. Vous devriez voir la page d'accueil de l'API PromoPartout

### 2. Test de l'Application Mobile
1. **Redémarrez l'application mobile** (elle pointe maintenant vers le serveur de production)
2. L'app va maintenant se connecter au serveur sur votre VPS

### 3. Création de Promotions de Test
1. Ouvrez http://168.231.82.122 dans votre navigateur
2. Créez plusieurs promotions dans différents endroits de votre ville
3. Utilisez des adresses réelles où vous pourrez vous rendre

### 4. Test de Proximité
1. **Marchez dans votre ville** avec votre smartphone
2. L'application devrait **automatiquement détecter** quand vous êtes à moins de 1km d'une promotion
3. Vous devriez recevoir des **notifications push** automatiquement

## 🔧 Commandes de Maintenance

### Vérifier le Statut
```bash
systemctl status promo-partout
systemctl status nginx
```

### Voir les Logs
```bash
journalctl -u promo-partout -f
```

### Redémarrer les Services
```bash
systemctl restart promo-partout
systemctl restart nginx
```

## 🎯 Objectif du Test
- ✅ Créer des promotions via l'interface web
- ✅ Recevoir des notifications automatiques en marchant dans la ville
- ✅ Vérifier que la détection de proximité fonctionne en conditions réelles
- ✅ Tester la synchronisation entre l'app mobile et le serveur

## 📞 Support
Si vous rencontrez des problèmes, vérifiez :
1. Les logs du serveur : `journalctl -u promo-partout -f`
2. Le statut des services : `systemctl status promo-partout nginx`
3. La connectivité : `curl http://localhost:3000/api/health`
