#!/bin/bash

# Script de déploiement pour PromoPartout sur VPS Hostinger
# Usage: ./deploy.sh

set -e  # Arrêter le script en cas d'erreur

echo "🚀 Déploiement de PromoPartout sur VPS Hostinger"
echo "================================================"

# Configuration
VPS_IP="168.231.82.122"
VPS_USER="root"
APP_DIR="/var/www/promo-partout"
DOMAIN="promo-partout.com"

echo "📋 Configuration:"
echo "  - VPS IP: $VPS_IP"
echo "  - Utilisateur: $VPS_USER"
echo "  - Répertoire app: $APP_DIR"
echo "  - Domaine: $DOMAIN"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "server/package.json" ] || [ ! -f "web-app/package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet PromoPartout"
    exit 1
fi

echo "✅ Vérification du projet: OK"

# Créer le package de déploiement
echo "📦 Création du package de déploiement..."

# Créer un répertoire temporaire pour le déploiement
DEPLOY_DIR="deploy-package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copier les fichiers du serveur
echo "  📁 Copie des fichiers serveur..."
cp -r server/ $DEPLOY_DIR/
rm -f $DEPLOY_DIR/server/promotions.db  # Supprimer la base de données locale

# Construire l'application web
echo "  🔨 Construction de l'application web..."
cd web-app
npm run build
cd ..

# Copier les fichiers construits de l'application web
echo "  📁 Copie des fichiers web construits..."
cp -r web-app/dist/ $DEPLOY_DIR/public/

# Créer les fichiers de configuration pour la production
echo "  ⚙️ Création des fichiers de configuration..."

# Fichier de configuration du serveur pour la production
cat > $DEPLOY_DIR/server/config.js << 'EOF'
// Configuration pour la production
const config = {
  port: process.env.PORT || 3000,
  host: '0.0.0.0',
  cors: {
    origin: ['http://promo-partout.com', 'https://promo-partout.com', 'http://www.promo-partout.com', 'https://www.promo-partout.com', 'http://168.231.82.122:3000', 'http://promo-partout.srv813637.hstgr.cloud', 'https://promo-partout.srv813637.hstgr.cloud'],
    credentials: true
  },
  database: {
    path: './promotions.db'
  }
};

module.exports = config;
EOF

# Script de démarrage
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
cd /var/www/promo-partout/server
npm install --production
node index.js
EOF

chmod +x $DEPLOY_DIR/start.sh

# Service systemd
cat > $DEPLOY_DIR/promo-partout.service << 'EOF'
[Unit]
Description=PromoPartout Application
After=network.target

[Service]
Type=simple
User=www-data
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
cat > $DEPLOY_DIR/nginx-promo-partout.conf << 'EOF'
server {
    listen 80;
    server_name promo-partout.srv813637.hstgr.cloud 168.231.82.122;

    # Servir les fichiers statiques de l'application web
    location / {
        root /var/www/promo-partout/public;
        try_files $uri $uri/ /index.html;

        # Headers pour les fichiers statiques
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy pour l'API
    location /api/ {
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

# Script d'installation sur le serveur
cat > $DEPLOY_DIR/install.sh << 'EOF'
#!/bin/bash

echo "🔧 Installation de PromoPartout sur le serveur..."

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Installer Nginx
apt install -y nginx

# Créer l'utilisateur et le répertoire
useradd -r -s /bin/false www-data 2>/dev/null || true
mkdir -p /var/www/promo-partout
chown -R www-data:www-data /var/www/promo-partout

# Installer les dépendances Node.js
cd /var/www/promo-partout/server
npm install --production

# Configurer le service systemd
cp /var/www/promo-partout/promo-partout.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable promo-partout
systemctl start promo-partout

# Configurer Nginx
cp /var/www/promo-partout/nginx-promo-partout.conf /etc/nginx/sites-available/promo-partout
ln -sf /etc/nginx/sites-available/promo-partout /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configurer le firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ Installation terminée!"
echo "🌐 Votre application est accessible à:"
echo "   🌟 http://promo-partout.com (domaine principal)"
echo "   🌟 https://promo-partout.com (SSL - recommandé)"
echo "   📡 http://168.231.82.122 (IP directe)"
echo "   🔧 http://promo-partout.srv813637.hstgr.cloud (Hostinger)"
EOF

chmod +x $DEPLOY_DIR/install.sh

echo "✅ Package de déploiement créé dans: $DEPLOY_DIR"
echo ""
echo "📤 Prochaines étapes:"
echo "1. Transférer les fichiers sur le VPS"
echo "2. Exécuter le script d'installation"
echo "3. Configurer l'application mobile pour pointer vers le serveur de production"
echo ""
echo "🔑 Commandes à exécuter:"
echo "  scp -r $DEPLOY_DIR/* root@$VPS_IP:/var/www/promo-partout/"
echo "  ssh root@$VPS_IP 'cd /var/www/promo-partout && ./install.sh'"
