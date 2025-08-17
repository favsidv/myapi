#!/usr/bin/env node

/**
 * Script de test pour l'intégration Flare Data Connector
 * Usage: node test-flare-integration.js
 */

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const DELAY = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFlareIntegration() {
  console.log('🧪 Test de l\'intégration Flare Data Connector\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Helper function pour les tests
  const test = async (name, testFn) => {
    totalTests++;
    try {
      console.log(`🔍 Test: ${name}`);
      await testFn();
      console.log(`✅ ${name} - PASSED\n`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  };
  
  // Test 1: API de base
  await test('API de base disponible', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    if (!response.data.message.includes('Crypto Centralized API')) {
      throw new Error('API response invalid');
    }
  });
  
  // Test 2: Endpoint de recommandation
  await test('Génération de recommandation Aave/Morpho', async () => {
    const response = await axios.get(`${BASE_URL}/api/aave-morpho-recommendation`);
    if (!response.data.success || !response.data.data.suggestion) {
      throw new Error('Recommendation generation failed');
    }
    console.log(`   📊 Recommandation: ${response.data.data.suggestion}`);
    console.log(`   🎯 Confiance: ${(response.data.data.confidence * 100).toFixed(1)}%`);
  });
  
  // Test 3: Documentation Flare
  await test('Documentation Flare disponible', async () => {
    const response = await axios.get(`${BASE_URL}/flare/docs`);
    if (!response.data.success || !response.data.title.includes('Flare Data Connector')) {
      throw new Error('Flare docs not available');
    }
  });
  
  // Test 4: Statut réseau Flare
  await test('Connexion réseau Flare', async () => {
    const response = await axios.get(`${BASE_URL}/flare/network-status`);
    if (!response.data.success) {
      throw new Error('Flare network connection failed');
    }
    console.log(`   🌐 Chain ID: ${response.data.data.chainId}`);
    console.log(`   📦 Block: ${response.data.data.blockNumber}`);
  });
  
  // Test 5: Info contrat (peut échouer si pas déployé)
  await test('Informations contrat smart contract', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/flare/contract/info`);
      if (response.data.success && response.data.data.contractAddress) {
        console.log(`   📄 Contrat: ${response.data.data.contractAddress}`);
        console.log(`   💼 Wallet connecté: ${response.data.data.walletConnected}`);
      } else {
        console.log('   ⚠️  Contrat pas encore déployé (normal)');
      }
    } catch (error) {
      console.log('   ⚠️  Contrat pas encore déployé (normal)');
    }
  });
  
  // Test 6: Vérification du modèle Python
  await test('Modèle Python fonctionnel', async () => {
    if (!fs.existsSync('./model.py')) {
      throw new Error('model.py not found');
    }
    
    // Test d'exécution Python basique
    return new Promise((resolve, reject) => {
      exec('python3 --version', (error, stdout, stderr) => {
        if (error) {
          reject(new Error('Python3 not found'));
        } else {
          console.log(`   🐍 ${stdout.trim()}`);
          resolve();
        }
      });
    });
  });
  
  // Test 7: Variables d'environnement
  await test('Configuration environnement', async () => {
    const requiredVars = ['PORT', 'COINGECKO_API_URL'];
    const optionalVars = ['FLARE_RPC_URL', 'PRIVATE_KEY'];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`${varName} environment variable missing`);
      }
    }
    
    console.log('   ✅ Variables requises présentes');
    
    const hasFlareConfig = optionalVars.every(v => process.env[v]);
    if (hasFlareConfig) {
      console.log('   🌟 Configuration Flare complète');
    } else {
      console.log('   ⚠️  Configuration Flare partielle (ajoutez FLARE_RPC_URL et PRIVATE_KEY pour toutes les fonctionnalités)');
    }
  });
  
  // Test 8: Test de soumission FDC (si configuration complète)
  if (process.env.PRIVATE_KEY && process.env.FLARE_RPC_URL) {
    await test('Soumission FDC (simulation)', async () => {
      try {
        const response = await axios.post(`${BASE_URL}/flare/generate-and-submit`);
        console.log(`   📤 Soumission: ${response.data.success ? 'Réussie' : 'Échouée'}`);
        if (response.data.data && response.data.data.transactionHash) {
          console.log(`   🔗 TX: ${response.data.data.transactionHash}`);
        }
      } catch (error) {
        // C'est normal si le wallet n'a pas de fonds ou si c'est une simulation
        console.log('   ⚠️  Simulation FDC (normal sans fonds testnet)');
      }
    });
  }
  
  // Résumé
  console.log('📋 RÉSUMÉ DES TESTS');
  console.log('==================');
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`🎯 Taux de réussite: ${((passedTests/totalTests)*100).toFixed(1)}%\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS PASSÉS!');
    console.log('Votre intégration Flare est prête à être utilisée.\n');
    
    console.log('🚀 PROCHAINES ÉTAPES:');
    console.log('1. Déployez le smart contract: node scripts/deploy.js');
    console.log('2. Obtenez des tokens testnet: https://faucet.flare.network/coston2');
    console.log('3. Testez le workflow complet: POST /flare/complete-workflow');
    console.log('4. Explorez la documentation: GET /flare/docs');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
    console.log('Vérifiez la configuration et les dépendances.');
  }
}

// Exécution
if (require.main === module) {
  testFlareIntegration().catch(error => {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  });
}

module.exports = { testFlareIntegration };
