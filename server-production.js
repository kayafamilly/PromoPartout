const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://168.231.82.122', 'http://168.231.82.122:3000', 'http://promo-partout.srv813637.hstgr.cloud'],
  credentials: true
}));
app.use(express.json());

// Servir les fichiers statiques de l'application web
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

console.log('✅ Base de données initialisée');

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PromoPartout API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes API
app.get('/api/promotions', (req, res) => {
  try {
    const promotions = db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
    console.log(`📊 ${promotions.length} promotions récupérées`);
    res.json(promotions);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/promotions', (req, res) => {
  try {
    const { title, description, store_name, address, latitude, longitude } = req.body;

    // Validation des données
    if (!title || !description || !store_name || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const stmt = db.prepare(`
      INSERT INTO promotions (title, description, store_name, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, description, store_name, address, latitude, longitude);

    const newPromotion = {
      id: result.lastInsertRowid,
      title,
      description,
      store_name,
      address,
      latitude,
      longitude
    };

    console.log(`✅ Nouvelle promotion créée: ${title} (ID: ${result.lastInsertRowid})`);
    res.status(201).json(newPromotion);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/promotions/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la promotion existe
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }

    // Supprimer la promotion
    const stmt = db.prepare('DELETE FROM promotions WHERE id = ?');
    stmt.run(id);

    console.log(`🗑️ Promotion avec l'ID ${id} supprimée avec succès`);
    res.status(200).json({ message: 'Promotion supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les promotions à proximité
app.get('/api/promotions/nearby', (req, res) => {
  try {
    const { latitude, longitude, radius = 1 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont requises' });
    }

    // Calcul de la distance en utilisant la formule de Haversine
    const promotions = db.prepare(`
      SELECT *,
      (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM promotions
      HAVING distance <= ?
      ORDER BY distance
    `).all(latitude, longitude, latitude, radius);

    console.log(`📍 ${promotions.length} promotions trouvées à proximité de ${latitude}, ${longitude}`);
    res.json(promotions);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des promotions à proximité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route catch-all pour servir l'application React (si les fichiers existent)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  
  // Vérifier si le fichier index.html existe
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Si pas de fichiers web, afficher une page simple
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PromoPartout API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 600px; margin: 0 auto; }
          .status { color: green; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 PromoPartout API</h1>
          <p class="status">✅ Serveur en cours d'exécution</p>
          
          <h2>📡 Endpoints disponibles:</h2>
          <div class="endpoint"><strong>GET</strong> /api/health - Statut du serveur</div>
          <div class="endpoint"><strong>GET</strong> /api/promotions - Liste des promotions</div>
          <div class="endpoint"><strong>POST</strong> /api/promotions - Créer une promotion</div>
          <div class="endpoint"><strong>DELETE</strong> /api/promotions/:id - Supprimer une promotion</div>
          <div class="endpoint"><strong>GET</strong> /api/promotions/nearby - Promotions à proximité</div>
          
          <h2>📱 Configuration mobile:</h2>
          <p>URL du serveur: <code>http://168.231.82.122:3000</code></p>
          
          <p><em>L'application web sera disponible une fois les fichiers déployés.</em></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 PromoPartout Server Started');
  console.log('================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URLs d'accès:`);
  console.log(`   - http://168.231.82.122:${PORT}`);
  console.log(`   - http://promo-partout.srv813637.hstgr.cloud`);
  console.log('================================');
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.close();
  process.exit(0);
});
