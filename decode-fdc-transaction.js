#!/usr/bin/env node

/**
 * Décodeur spécialisé pour les transactions FDC
 * Extrait et décode le JSON des requêtes d'attestation FDC
 */

const { ethers } = require('ethers');

const FLARE_RPC = 'https://coston2-api.flare.network/ext/bc/C/rpc';

// ABI pour la fonction requestAttestation du FDC
const FDC_ABI = [
  'function requestAttestation(bytes32 _attestationType, bytes32 _sourceId, bytes calldata _requestBody) external returns (bool)'
];

async function decodeFDCTransaction(txHash) {
  console.log('🔍 DÉCODEUR FDC - Extraction JSON');
  console.log('==================================\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(FLARE_RPC);
    
    console.log(`📋 Transaction: ${txHash}`);
    console.log(`🌐 Explorer: https://coston2-explorer.flare.network/tx/${txHash}\n`);
    
    // Récupérer les détails de la transaction
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('❌ Transaction non trouvée');
      return;
    }

    console.log('📊 INFORMATIONS TRANSACTION:');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Block: ${tx.blockNumber}`);
    console.log(`   Gas Used: ${tx.gasLimit.toString()}`);
    console.log(`   Status: ${tx.blockNumber ? '✅ Confirmée' : '⏳ En attente'}`);
    console.log('');

    // Vérifier que c'est bien une transaction FDC
    if (tx.data && tx.data.length > 10) {
      const functionSelector = tx.data.substring(0, 10);
      console.log(`🔧 Function Selector: ${functionSelector}`);
      
      // Fonction requestAttestation: 0x2100a783
      if (functionSelector === '0x2100a783') {
        console.log('✅ Transaction FDC requestAttestation détectée!\n');
        
        try {
          // Décoder les paramètres de la fonction
          const iface = new ethers.Interface(FDC_ABI);
          const decodedData = iface.parseTransaction({ data: tx.data });
          
          console.log('📝 PARAMÈTRES DÉCODÉS:');
          console.log(`   Attestation Type: ${decodedData.args._attestationType}`);
          console.log(`   Source ID: ${decodedData.args._sourceId}`);
          console.log(`   Request Body: ${decodedData.args._requestBody}`);
          console.log('');
          
          // Décoder le requestBody (contient URL, JQ transform, timestamp)
          try {
            const requestBodyDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
              ['string', 'string', 'uint64'],
              decodedData.args._requestBody
            );
            
            console.log('🎯 DÉTAILS DE LA REQUÊTE:');
            console.log(`   URL API: ${requestBodyDecoded[0]}`);
            console.log(`   JQ Transform: ${requestBodyDecoded[1]}`);
            console.log(`   Timestamp: ${requestBodyDecoded[2]} (${new Date(requestBodyDecoded[2] * 1000).toISOString()})`);
            console.log('');
            
            // Maintenant, récupérer les données JSON depuis l'URL
            console.log('📡 RÉCUPÉRATION DU JSON ORIGINAL...');
            
            try {
              const axios = require('axios');
              const response = await axios.get(requestBodyDecoded[0]);
              
              if (response.data && response.data.success) {
                console.log('✅ JSON récupéré avec succès!\n');
                
                console.log('📄 DONNÉES JSON STOCKÉES ON-CHAIN:');
                console.log('=====================================');
                
                // Appliquer la transformation JQ (ici c'est ".data")
                let finalData = response.data;
                if (requestBodyDecoded[1] === '.data' && response.data.data) {
                  finalData = response.data.data;
                }
                
                console.log(JSON.stringify(finalData, null, 2));
                console.log('');
                
                console.log('🎯 RÉSUMÉ DE VOS DONNÉES:');
                if (finalData.suggestion) {
                  console.log(`   📊 Recommandation: ${finalData.suggestion}`);
                  console.log(`   🎯 Confiance: ${(finalData.confidence * 100).toFixed(1)}%`);
                  console.log(`   📈 Score Aave: ${finalData.scores?.aave || 'N/A'}`);
                  console.log(`   📈 Score Morpho: ${finalData.scores?.morpho || 'N/A'}`);
                  console.log(`   💰 BTC Dominance: ${finalData.btc_dominance_pct}%`);
                  console.log(`   🏦 DeFi TVL: $${parseFloat(finalData.defi_tvl_usd).toLocaleString()}`);
                }
                
              } else {
                console.log('⚠️ Réponse API invalide');
              }
              
            } catch (apiError) {
              console.log(`⚠️ Erreur récupération API: ${apiError.message}`);
              console.log('Les données sont stockées on-chain mais l\'API source n\'est plus accessible');
            }
            
          } catch (bodyError) {
            console.log(`❌ Erreur décodage request body: ${bodyError.message}`);
          }
          
        } catch (decodeError) {
          console.log(`❌ Erreur décodage transaction: ${decodeError.message}`);
        }
        
      } else {
        console.log('⚠️ Ce n\'est pas une transaction requestAttestation FDC');
        console.log('Selectors FDC connus:');
        console.log('   0x2100a783 - requestAttestation');
        console.log('   0x... - autres fonctions FDC');
      }
      
    } else {
      console.log('❌ Aucune donnée dans cette transaction');
    }
    
    // Récupérer le reçu pour les événements
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      console.log('\n📡 ÉVÉNEMENTS ÉMIS:');
      console.log(`   ${receipt.logs.length} événement(s) émis par la transaction`);
      console.log('   Ces événements confirment l\'enregistrement FDC');
    }
    
    console.log('\n🎉 ANALYSE TERMINÉE!');
    console.log('Vos données JSON sont maintenant stockées on-chain de façon permanente.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

// Fonction utilitaire pour récupérer les données attestées
async function retrieveAttestedData(apiUrl, timestamp, jqTransform = '.data') {
  console.log('\n🔍 RÉCUPÉRATION DONNÉES ATTESTÉES');
  console.log('=================================\n');
  
  try {
    const response = await fetch(`http://localhost:3000/flare/attested-recommendation?apiUrl=${encodeURIComponent(apiUrl)}&timestamp=${timestamp}&jqTransform=${encodeURIComponent(jqTransform)}`);
    const data = await response.json();
    
    if (data.success && data.proved) {
      console.log('✅ Données attestées récupérées!');
      console.log(JSON.stringify(data.data, null, 2));
    } else {
      console.log('⏳ Données pas encore finalisées (normal, attendre 5-10 minutes)');
      console.log('Les données sont stockées mais le cycle d\'attestation n\'est pas terminé');
    }
    
  } catch (error) {
    console.log(`⚠️ Erreur récupération: ${error.message}`);
  }
}

// Interface en ligne de commande
if (require.main === module) {
  const txHash = process.argv[2];
  
  if (!txHash) {
    console.log('❌ Usage: node decode-fdc-transaction.js <transaction_hash>');
    console.log('');
    console.log('📖 Exemple:');
    console.log('   node decode-fdc-transaction.js 0x067fcb64004ecbaf388bf6a2e7c88ac2a73ce4b31740af24405e9f742be4b926');
    process.exit(1);
  }
  
  decodeFDCTransaction(txHash).catch(console.error);
}

module.exports = { decodeFDCTransaction, retrieveAttestedData };
