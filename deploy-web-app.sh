#!/bin/bash

# Script pour déployer l'application web construite sur le VPS

echo "🌐 Déploiement de l'application web sur le VPS..."

# Copier les fichiers construits vers le répertoire public du VPS
# Cette commande sera exécutée après l'installation du serveur

VPS_IP="168.231.82.122"

# Créer un package avec les fichiers web construits
echo "📦 Création du package web..."
cd web-app
npm run build
cd ..

# Créer un script pour transférer les fichiers
cat > transfer-web-files.sh << 'EOF'
#!/bin/bash
echo "📤 Transfert des fichiers web vers le VPS..."

# Créer une archive des fichiers construits
tar -czf web-app-dist.tar.gz -C web-app/dist .

# Instructions pour l'utilisateur
echo "🔑 Exécutez ces commandes pour transférer les fichiers:"
echo "1. scp web-app-dist.tar.gz root@168.231.82.122:/var/www/promo-partout/"
echo "2. ssh root@168.231.82.122 'cd /var/www/promo-partout && tar -xzf web-app-dist.tar.gz -C public && rm web-app-dist.tar.gz'"
echo "3. ssh root@168.231.82.122 'systemctl restart promo-partout'"
EOF

chmod +x transfer-web-files.sh

echo "✅ Script de transfert créé: transfer-web-files.sh"
