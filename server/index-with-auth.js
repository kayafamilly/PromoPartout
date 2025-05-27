const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'promo-partout-secret-key-2024';

// Configuration multer pour l'upload des logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Configuration CORS optimisée pour la production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'http://168.231.82.122',
        'http://168.231.82.122:3000',
        'http://promo-partout.com',
        'https://promo-partout.com',
        'http://www.promo-partout.com',
        'https://www.promo-partout.com',
        'http://promo-partout.srv813637.hstgr.cloud',
        'https://promo-partout.srv813637.hstgr.cloud'
      ]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}

// Initialiser la base de données
const dbPath = path.join(__dirname, 'promotions.db');
const db = new Database(dbPath);

// Créer les tables
db.exec(`
  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    address TEXT NOT NULL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    store_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
  )
`);

// Table des administrateurs
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Table des utilisateurs mobiles (pour tracking des installations actives)
db.exec(`
  CREATE TABLE IF NOT EXISTS mobile_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    device_info TEXT,
    app_version TEXT,
    platform TEXT,
    first_install_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  )
`);

console.log('✅ Base de données initialisée avec authentification');

// Créer le compte admin par défaut s'il n'existe pas
(async () => {
  try {
    const adminEmail = 'chrislo.kaya@outlook.com';
    const adminPassword = 'Chrisloickaya-12';
    const adminName = 'Chris Admin';

    const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);

    if (!existingAdmin) {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(adminPassword, saltRounds);

      const stmt = db.prepare(`
        INSERT INTO admins (email, password_hash, name)
        VALUES (?, ?, ?)
      `);

      stmt.run(adminEmail, password_hash, adminName);
      console.log('👑 Compte administrateur créé:', adminEmail);
    } else {
      console.log('👑 Compte administrateur existant:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  }
})();

// Middleware d'authentification pour les commerçants
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware d'authentification pour les administrateurs
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès admin requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token admin invalide' });
    }

    // Vérifier que c'est bien un admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }

    req.admin = user;
    next();
  });
};

// Routes d'authentification

// Inscription commerçant (avec ou sans logo)
app.post('/api/auth/register', (req, res, next) => {
  // Vérifier si c'est une requête multipart (avec fichier)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('logo')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { business_name, email, password, address } = req.body;

    if (!business_name || !email || !password || !address) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existingMerchant = db.prepare('SELECT id FROM merchants WHERE email = ?').get(email);
    if (existingMerchant) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // URL du logo si uploadé
    const logo_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Insérer le nouveau commerçant
    const stmt = db.prepare(`
      INSERT INTO merchants (business_name, email, password_hash, address, logo_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(business_name, email, password_hash, address, logo_url);

    // Générer le token JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, email, business_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      merchant: {
        id: result.lastInsertRowid,
        business_name,
        email,
        address,
        logo_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion commerçant
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver le commerçant
    const merchant = db.prepare('SELECT * FROM merchants WHERE email = ?').get(email);
    if (!merchant) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, merchant.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: merchant.id, email: merchant.email, business_name: merchant.business_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        email: merchant.email,
        address: merchant.address,
        logo_url: merchant.logo_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le token
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const merchant = db.prepare('SELECT id, business_name, email, address, logo_url FROM merchants WHERE id = ?').get(req.user.id);

  if (!merchant) {
    return res.status(404).json({ error: 'Commerçant non trouvé' });
  }

  res.json({ merchant });
});

// Routes d'authentification admin

// Connexion administrateur
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver l'administrateur
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT avec flag admin
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion admin réussie',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le token admin
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
  const admin = db.prepare('SELECT id, name, email FROM admins WHERE id = ?').get(req.admin.id);

  if (!admin) {
    return res.status(404).json({ error: 'Administrateur non trouvé' });
  }

  res.json({ admin });
});

// Routes des promotions (protégées)

// Récupérer les promotions du commerçant connecté
app.get('/api/promotions', authenticateToken, (req, res) => {
  try {
    const promotions = db.prepare(`
      SELECT p.*, m.business_name
      FROM promotions p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.merchant_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une promotion (commerçant connecté)
app.post('/api/promotions', authenticateToken, (req, res) => {
  try {
    const { title, description, address, latitude, longitude } = req.body;

    if (!title || !description || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Récupérer le nom du commerce
    const merchant = db.prepare('SELECT business_name FROM merchants WHERE id = ?').get(req.user.id);

    const stmt = db.prepare(`
      INSERT INTO promotions (merchant_id, title, description, store_name, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(req.user.id, title, description, merchant.business_name, address, latitude, longitude);

    res.status(201).json({
      id: result.lastInsertRowid,
      merchant_id: req.user.id,
      title,
      description,
      store_name: merchant.business_name,
      address,
      latitude,
      longitude
    });
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une promotion (seulement si elle appartient au commerçant)
app.delete('/api/promotions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la promotion appartient au commerçant
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ? AND merchant_id = ?').get(id, req.user.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée ou non autorisée' });
    }

    // Supprimer la promotion
    const stmt = db.prepare('DELETE FROM promotions WHERE id = ? AND merchant_id = ?');
    stmt.run(id, req.user.id);

    res.json({ message: 'Promotion supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes d'administration (protégées par authenticateAdmin)

// Dashboard - Statistiques générales
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  try {
    const merchantsCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
    const promotionsCount = db.prepare('SELECT COUNT(*) as count FROM promotions').get().count;

    // Statistiques des utilisateurs mobiles
    const totalMobileUsers = db.prepare('SELECT COUNT(*) as count FROM mobile_users').get().count;
    const activeMobileUsers = db.prepare('SELECT COUNT(*) as count FROM mobile_users WHERE is_active = 1').get().count;

    // Utilisateurs actifs dans les dernières 24h
    const activeUsersLast24h = db.prepare(`
      SELECT COUNT(*) as count FROM mobile_users
      WHERE is_active = 1 AND last_seen_at >= datetime('now', '-24 hours')
    `).get().count;

    // Utilisateurs actifs dans les 7 derniers jours
    const activeUsersLast7days = db.prepare(`
      SELECT COUNT(*) as count FROM mobile_users
      WHERE is_active = 1 AND last_seen_at >= datetime('now', '-7 days')
    `).get().count;

    const recentMerchants = db.prepare(`
      SELECT id, business_name, email, created_at
      FROM merchants
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    const recentPromotions = db.prepare(`
      SELECT p.id, p.title, p.store_name, p.created_at, m.business_name
      FROM promotions p
      JOIN merchants m ON p.merchant_id = m.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all();

    // Nouvelles installations récentes
    const recentInstalls = db.prepare(`
      SELECT device_id, platform, app_version, first_install_at
      FROM mobile_users
      ORDER BY first_install_at DESC
      LIMIT 5
    `).all();

    res.json({
      stats: {
        merchants: merchantsCount,
        promotions: promotionsCount,
        totalMobileUsers: totalMobileUsers,
        activeMobileUsers: activeMobileUsers,
        activeUsersLast24h: activeUsersLast24h,
        activeUsersLast7days: activeUsersLast7days
      },
      recentMerchants,
      recentPromotions,
      recentInstalls
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des commerçants
app.get('/api/admin/merchants', authenticateAdmin, (req, res) => {
  try {
    const merchants = db.prepare(`
      SELECT m.*,
             COUNT(p.id) as promotions_count
      FROM merchants m
      LEFT JOIN promotions p ON m.id = p.merchant_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `).all();

    res.json(merchants);
  } catch (error) {
    console.error('Erreur lors de la récupération des commerçants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un commerçant (et ses promotions)
app.delete('/api/admin/merchants/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;

    // Supprimer d'abord les promotions du commerçant
    db.prepare('DELETE FROM promotions WHERE merchant_id = ?').run(id);

    // Supprimer le commerçant
    const result = db.prepare('DELETE FROM merchants WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commerçant non trouvé' });
    }

    res.json({ message: 'Commerçant et ses promotions supprimés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du commerçant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des promotions
app.get('/api/admin/promotions', authenticateAdmin, (req, res) => {
  try {
    const promotions = db.prepare(`
      SELECT p.*, m.business_name, m.email
      FROM promotions p
      JOIN merchants m ON p.merchant_id = m.id
      ORDER BY p.created_at DESC
    `).all();

    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une promotion (admin)
app.delete('/api/admin/promotions/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM promotions WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }

    res.json({ message: 'Promotion supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes publiques pour l'application mobile (sans authentification)

// Récupérer TOUTES les promotions pour l'app mobile
app.get('/api/mobile/promotions', (req, res) => {
  try {
    const promotions = db.prepare(`
      SELECT p.*, m.business_name, m.logo_url
      FROM promotions p
      JOIN merchants m ON p.merchant_id = m.id
      ORDER BY p.created_at DESC
    `).all();

    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions mobiles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les promotions à proximité pour l'app mobile
app.get('/api/mobile/promotions/nearby', (req, res) => {
  try {
    const { latitude, longitude, radius = 1 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont requises' });
    }

    const promotions = db.prepare(`
      SELECT p.*, m.business_name, m.logo_url,
      (6371 * acos(cos(radians(?)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(?)) + sin(radians(?)) * sin(radians(p.latitude)))) AS distance
      FROM promotions p
      JOIN merchants m ON p.merchant_id = m.id
      HAVING distance <= ?
      ORDER BY distance
    `).all(latitude, longitude, latitude, radius);

    res.json(promotions);
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions à proximité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes de tracking des utilisateurs mobiles (sans authentification)

// Enregistrement d'une nouvelle installation mobile
app.post('/api/mobile/register', (req, res) => {
  try {
    const { device_id, device_info, app_version, platform } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id requis' });
    }

    // Vérifier si l'appareil existe déjà
    const existingUser = db.prepare('SELECT id FROM mobile_users WHERE device_id = ?').get(device_id);

    if (existingUser) {
      // Mettre à jour les informations et marquer comme actif
      const stmt = db.prepare(`
        UPDATE mobile_users
        SET device_info = ?, app_version = ?, platform = ?, last_seen_at = CURRENT_TIMESTAMP, is_active = 1
        WHERE device_id = ?
      `);
      stmt.run(device_info || null, app_version || null, platform || null, device_id);

      res.json({ message: 'Utilisateur mobile mis à jour', user_id: existingUser.id });
    } else {
      // Créer un nouvel utilisateur mobile
      const stmt = db.prepare(`
        INSERT INTO mobile_users (device_id, device_info, app_version, platform)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(device_id, device_info || null, app_version || null, platform || null);

      res.json({ message: 'Utilisateur mobile enregistré', user_id: result.lastInsertRowid });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement mobile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Heartbeat pour maintenir l'utilisateur actif
app.post('/api/mobile/heartbeat', (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id requis' });
    }

    // Mettre à jour la dernière activité
    const stmt = db.prepare(`
      UPDATE mobile_users
      SET last_seen_at = CURRENT_TIMESTAMP, is_active = 1
      WHERE device_id = ?
    `);
    const result = stmt.run(device_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Utilisateur mobile non trouvé' });
    }

    res.json({ message: 'Heartbeat enregistré' });
  } catch (error) {
    console.error('Erreur lors du heartbeat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PromoPartout API avec authentification commerçants',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Route catch-all pour servir l'application React (en production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../public/index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PromoPartout - Commerçants</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .status { color: green; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏪 PromoPartout - Espace Commerçants</h1>
            <p class="status">✅ Serveur en cours d'exécution</p>

            <h2>🔐 Authentification:</h2>
            <div class="endpoint"><strong>POST</strong> /api/auth/register - Inscription commerçant</div>
            <div class="endpoint"><strong>POST</strong> /api/auth/login - Connexion commerçant</div>
            <div class="endpoint"><strong>GET</strong> /api/auth/me - Profil commerçant</div>

            <h2>🏪 Gestion des promotions (authentifié):</h2>
            <div class="endpoint"><strong>GET</strong> /api/promotions - Mes promotions</div>
            <div class="endpoint"><strong>POST</strong> /api/promotions - Créer une promotion</div>
            <div class="endpoint"><strong>DELETE</strong> /api/promotions/:id - Supprimer ma promotion</div>

            <h2>📱 API Mobile (publique):</h2>
            <div class="endpoint"><strong>GET</strong> /api/mobile/promotions - Toutes les promotions</div>
            <div class="endpoint"><strong>GET</strong> /api/mobile/promotions/nearby - Promotions à proximité</div>

            <p><em>Interface web disponible une fois les fichiers déployés.</em></p>
          </div>
        </body>
      </html>
      `);
    }
  });
}

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur serveur interne'
      : err.message
  });
});

// Démarrer le serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 PromoPartout Server avec Authentification');
  console.log('==========================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret configuré: ${JWT_SECRET.substring(0, 10)}...`);
  console.log(`🌐 URLs d'accès:`);

  if (process.env.NODE_ENV === 'production') {
    console.log(`   - 🌐 http://promo-partout.com (domaine principal)`);
    console.log(`   - 🌐 https://promo-partout.com (SSL)`);
    console.log(`   - 📡 http://168.231.82.122:${PORT} (IP directe)`);
    console.log(`   - 🔧 http://promo-partout.srv813637.hstgr.cloud (Hostinger)`);
  } else {
    console.log(`   - http://localhost:${PORT} (développement)`);
    console.log(`   - http://168.231.82.122:${PORT} (production)`);
  }
  console.log('==========================================');
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

console.log('🔐 Serveur avec authentification commerçants configuré');
