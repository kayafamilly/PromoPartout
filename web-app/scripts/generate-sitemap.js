#!/usr/bin/env node

/**
 * Script pour générer automatiquement le sitemap.xml
 * Exécuter avec: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du site
const SITE_URL = 'https://promo-partout.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Pages du site avec leurs priorités et fréquences de mise à jour
const pages = [
  {
    url: '/',
    priority: '1.0',
    changefreq: 'weekly',
    description: 'Page d\'accueil - Priorité maximale'
  },
  {
    url: '/clients',
    priority: '0.9',
    changefreq: 'weekly',
    description: 'Page clients - Landing page marketing prioritaire'
  },
  {
    url: '/register',
    priority: '0.8',
    changefreq: 'monthly',
    description: 'Page inscription commerçant'
  },
  {
    url: '/login',
    priority: '0.7',
    changefreq: 'monthly',
    description: 'Page connexion commerçant'
  },
  {
    url: '/admin',
    priority: '0.3',
    changefreq: 'monthly',
    description: 'Page administration'
  }
];

// Générer la date actuelle au format ISO
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Générer le contenu XML du sitemap
const generateSitemap = () => {
  const currentDate = getCurrentDate();

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  // Ajouter chaque page
  pages.forEach(page => {
    sitemap += `  <!-- ${page.description} -->
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>

`;
  });

  sitemap += `</urlset>`;

  return sitemap;
};

// Écrire le sitemap
const writeSitemap = () => {
  try {
    const sitemapContent = generateSitemap();

    // Créer le dossier public s'il n'existe pas
    const publicDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Écrire le fichier
    fs.writeFileSync(OUTPUT_PATH, sitemapContent, 'utf8');

    console.log('✅ Sitemap généré avec succès !');
    console.log(`📍 Emplacement: ${OUTPUT_PATH}`);
    console.log(`🌐 URL: ${SITE_URL}/sitemap.xml`);
    console.log(`📅 Date de mise à jour: ${getCurrentDate()}`);
    console.log(`📄 Pages incluses: ${pages.length}`);

    // Afficher les pages
    console.log('\n📋 Pages dans le sitemap:');
    pages.forEach(page => {
      console.log(`   ${SITE_URL}${page.url} (priorité: ${page.priority})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
    process.exit(1);
  }
};

// Exécuter le script
writeSitemap();

export { generateSitemap, writeSitemap };
