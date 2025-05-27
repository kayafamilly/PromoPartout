// Script de test pour l'authentification
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthentication() {
  console.log('🧪 Test du système d\'authentification');
  console.log('=====================================');

  try {
    // Test 1: Inscription
    console.log('\n1️⃣ Test d\'inscription...');
    const timestamp = Date.now();
    const registerData = {
      business_name: 'Test Boulangerie',
      email: `test.boulangerie.${timestamp}@example.com`,
      password: 'motdepasse123',
      address: '123 Rue du Test, 75001 Paris'
    };

    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log('✅ Inscription réussie:', registerResponse.data.merchant.business_name);

    const token = registerResponse.data.token;

    // Test 2: Vérification du profil
    console.log('\n2️⃣ Test de vérification du profil...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profil récupéré:', profileResponse.data.merchant.business_name);

    // Test 3: Création d'une promotion
    console.log('\n3️⃣ Test de création de promotion...');
    const promotionData = {
      title: 'Pain frais -20%',
      description: 'Réduction sur tous nos pains artisanaux',
      address: '123 Rue du Test, 75001 Paris',
      latitude: 48.8566,
      longitude: 2.3522
    };

    const promotionResponse = await axios.post(`${BASE_URL}/api/promotions`, promotionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Promotion créée:', promotionResponse.data.title);

    // Test 4: Récupération des promotions du commerçant
    console.log('\n4️⃣ Test de récupération des promotions...');
    const myPromotionsResponse = await axios.get(`${BASE_URL}/api/promotions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Promotions récupérées:', myPromotionsResponse.data.length, 'promotion(s)');

    // Test 5: API mobile (toutes les promotions)
    console.log('\n5️⃣ Test de l\'API mobile...');
    const mobilePromotionsResponse = await axios.get(`${BASE_URL}/api/mobile/promotions`);
    console.log('✅ Promotions mobiles récupérées:', mobilePromotionsResponse.data.length, 'promotion(s)');

    // Test 6: Connexion
    console.log('\n6️⃣ Test de connexion...');
    const loginData = {
      email: `test.boulangerie.${timestamp}@example.com`,
      password: 'motdepasse123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Connexion réussie:', loginResponse.data.merchant.business_name);

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('=====================================');
    console.log('✅ Inscription/Connexion: OK');
    console.log('✅ Gestion des promotions: OK');
    console.log('✅ API mobile: OK');
    console.log('✅ Authentification JWT: OK');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testAuthentication();
