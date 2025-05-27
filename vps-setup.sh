#!/bin/bash

# Script d'installation automatisé pour PromoPartout sur VPS Hostinger
# Ce script sera exécuté directement sur le VPS

set -e

echo "🚀 Installation de PromoPartout sur VPS Hostinger"
echo "================================================"

# Mettre à jour le système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installer Node.js 18
echo "📦 Installation de Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Installer Nginx
echo "📦 Installation de Nginx..."
apt install -y nginx

# Installer Git pour récupérer le code
echo "📦 Installation de Git..."
apt install -y git

# Créer le répertoire de l'application
echo "📁 Création du répertoire de l'application..."
mkdir -p /var/www/promo-partout
cd /var/www/promo-partout

# Cloner le projet (nous utiliserons une approche différente)
# Pour l'instant, créons la structure manuellement

# Créer la structure des répertoires
mkdir -p server public

# Créer le fichier package.json pour le serveur
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

# Créer le fichier serveur principal
cat > server/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques de l'application web (en production)
app.use(express.static(path.join(__dirname, '../public')));

// Initialiser la base de données
const dbPath = path.join(__dirname, 'promotions.db');
const db = new Database(dbPath);

// Créer la table des promotions si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    store_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('Base de données initialisée');

// Routes API
app.get('/api/promotions', (req, res) => {
  try {
    const promotions = db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/promotions', (req, res) => {
  try {
    const { title, description, store_name, address, latitude, longitude } = req.body;

    if (!title || !description || !store_name || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const stmt = db.prepare(`
      INSERT INTO promotions (title, description, store_name, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, description, store_name, address, latitude, longitude);

    res.status(201).json({
      id: result.lastInsertRowid,
      title,
      description,
      store_name,
      address,
      latitude,
      longitude
    });
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/promotions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }

    const stmt = db.prepare('DELETE FROM promotions WHERE id = ?');
    stmt.run(id);

    console.log(`Promotion avec l'ID ${id} supprimée avec succès`);
    res.status(200).json({ message: 'Promotion supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/promotions/nearby', (req, res) => {
  try {
    const { latitude, longitude, radius = 1 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont requises' });
    }

    const promotions = db.prepare(`
      SELECT *,
      (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM promotions
      HAVING distance <= ?
      ORDER BY distance
    `).all(latitude, longitude, latitude, radius);

    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions à proximité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route catch-all pour servir l'application React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur PromoPartout démarré sur le port ${PORT}`);
  console.log(`Accessible à l'adresse http://168.231.82.122:${PORT}`);
});
EOF

# Installer les dépendances Node.js
echo "📦 Installation des dépendances Node.js..."
cd server
npm install --production
cd ..

# Créer le service systemd
echo "⚙️ Configuration du service systemd..."
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

# Activer et démarrer le service
systemctl daemon-reload
systemctl enable promo-partout
systemctl start promo-partout

# Configurer Nginx
echo "⚙️ Configuration de Nginx..."
cat > /etc/nginx/sites-available/promo-partout << 'EOF'
server {
    listen 80;
    server_name 168.231.82.122 promo-partout.srv813637.hstgr.cloud;

    # Servir les fichiers statiques de l'application web
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

# Tester et recharger Nginx
nginx -t && systemctl reload nginx

# Configurer le firewall
echo "🔒 Configuration du firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

echo "✅ Installation terminée!"
echo ""
echo "🌐 Votre application sera accessible à:"
echo "   http://168.231.82.122"
echo "   http://promo-partout.srv813637.hstgr.cloud"
echo ""
echo "📊 Statut des services:"
systemctl status promo-partout --no-pager
systemctl status nginx --no-pager
