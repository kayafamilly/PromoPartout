#!/bin/bash

echo "🚀 Déploiement Manuel de PromoPartout"
echo "====================================="
echo ""
echo "📋 Instructions de déploiement sur VPS Hostinger"
echo "IP: 168.231.82.122"
echo ""

# Construire l'application web
echo "🔨 Construction de l'application web..."
cd web-app
npm run build
cd ..

# Créer l'archive des fichiers web
echo "📦 Création de l'archive web..."
tar -czf promo-partout-web.tar.gz -C web-app/dist .

echo "✅ Fichiers préparés!"
echo ""
echo "🔑 Commandes à exécuter sur votre VPS:"
echo ""
echo "1️⃣ Connexion au VPS:"
echo "ssh root@168.231.82.122"
echo ""
echo "2️⃣ Installation des dépendances (à exécuter une seule fois):"
cat << 'EOF'
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Installer Nginx
apt install -y nginx

# Créer le répertoire de l'application
mkdir -p /var/www/promo-partout/server
mkdir -p /var/www/promo-partout/public
cd /var/www/promo-partout
EOF

echo ""
echo "3️⃣ Créer le package.json:"
cat << 'EOF'
cat > server/package.json << 'PACKAGE_EOF'
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
PACKAGE_EOF
EOF

echo ""
echo "4️⃣ Installer les dépendances Node.js:"
echo "cd server && npm install && cd .."
echo ""

echo "5️⃣ Créer le fichier serveur:"
echo "Copiez le contenu de 'server-production.js' dans '/var/www/promo-partout/server/index.js'"
echo ""

echo "6️⃣ Configurer le service systemd:"
cat << 'EOF'
cat > /etc/systemd/system/promo-partout.service << 'SERVICE_EOF'
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
SERVICE_EOF

systemctl daemon-reload
systemctl enable promo-partout
systemctl start promo-partout
EOF

echo ""
echo "7️⃣ Configurer Nginx:"
cat << 'EOF'
cat > /etc/nginx/sites-available/promo-partout << 'NGINX_EOF'
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
NGINX_EOF

ln -sf /etc/nginx/sites-available/promo-partout /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
EOF

echo ""
echo "8️⃣ Configurer le firewall:"
cat << 'EOF'
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable
EOF

echo ""
echo "9️⃣ Vérifier le statut:"
echo "systemctl status promo-partout"
echo "systemctl status nginx"
echo ""

echo "🔟 Pour déployer l'application web (optionnel):"
echo "Transférez 'promo-partout-web.tar.gz' vers le VPS et exécutez:"
echo "tar -xzf promo-partout-web.tar.gz -C /var/www/promo-partout/public"
echo "systemctl restart promo-partout"
echo ""

echo "🌐 URLs d'accès après déploiement:"
echo "- http://168.231.82.122"
echo "- http://promo-partout.srv813637.hstgr.cloud"
echo ""

echo "📱 Configuration mobile:"
echo "Modifiez mobile-app/promo_partout/lib/config.dart:"
echo "static const String serverUrl = 'http://168.231.82.122:3000';"
