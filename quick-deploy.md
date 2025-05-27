# 🚀 Déploiement Rapide de PromoPartout sur VPS Hostinger

## 📋 Informations du VPS
- **IP:** 168.231.82.122
- **Hostname:** srv813637.hstgr.cloud
- **OS:** Ubuntu 22.04 LTS

## 🔧 Étapes de déploiement

### 1. Connexion au VPS
```bash
ssh root@168.231.82.122
```

### 2. Installation des dépendances
```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Installer Nginx
apt install -y nginx

# Vérifier les installations
node --version
npm --version
nginx -v
```

### 3. Créer l'application
```bash
# Créer le répertoire
mkdir -p /var/www/promo-partout/server
cd /var/www/promo-partout
```

### 4. Créer le package.json
```bash
cat > server/package.json << 'EOF'
{
  "name": "promo-partout-server",
  "version": "1.0.0",
  "description": "Serveur PromoPartout",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.9.1",
    "cors": "^2.8.5",
    "express": "^5.1.0"
  }
}
EOF
```

### 5. Installer les dépendances
```bash
cd server
npm install
cd ..
```

### 6. Créer le serveur (voir fichier server.js séparé)

### 7. Créer le service systemd
```bash
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
```

### 8. Configurer Nginx
```bash
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

# Activer le site
ln -sf /etc/nginx/sites-available/promo-partout /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 9. Démarrer les services
```bash
systemctl daemon-reload
systemctl enable promo-partout
systemctl start promo-partout
systemctl status promo-partout
```

### 10. Configurer le firewall
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable
```

## 🌐 URLs d'accès
- http://168.231.82.122
- http://promo-partout.srv813637.hstgr.cloud

## 📱 Configuration mobile
Modifier le fichier `mobile-app/promo_partout/lib/config.dart`:
```dart
static const String serverUrl = 'http://168.231.82.122:3000';
```
