#!/usr/bin/env node

/**
 * Explorateur Flare Testnet - Visualiser transactions et données
 * Usage: node explore-flare-testnet.js [transaction_hash|address|block_number]
 */

const { ethers } = require('ethers');

const FLARE_RPC = 'https://coston2-api.flare.network/ext/bc/C/rpc';
const EXPLORER_BASE = 'https://coston2-explorer.flare.network';

class FlareExplorer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(FLARE_RPC);
  }

  /**
   * Explore une transaction spécifique
   */
  async exploreTransaction(txHash) {
    console.log(`🔍 Exploration de la transaction: ${txHash}`);
    console.log(`🌐 Explorer: ${EXPLORER_BASE}/tx/${txHash}`);
    console.log('');

    try {
      // Récupérer les détails de la transaction
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        console.log('❌ Transaction non trouvée');
        return;
      }

      console.log('📋 DÉTAILS DE LA TRANSACTION:');
      console.log(`   Hash: ${tx.hash}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to || 'Contract Creation'}`);
      console.log(`   Value: ${ethers.formatEther(tx.value)} FLR`);
      console.log(`   Gas Limit: ${tx.gasLimit.toString()}`);
      console.log(`   Gas Price: ${ethers.formatUnits(tx.gasPrice || 0n, 'gwei')} gwei`);
      console.log(`   Nonce: ${tx.nonce}`);
      console.log(`   Block: ${tx.blockNumber}`);

      // Données de la transaction (input)
      if (tx.data && tx.data !== '0x') {
        console.log('\n📝 DONNÉES DE LA TRANSACTION:');
        console.log(`   Taille: ${(tx.data.length - 2) / 2} bytes`);
        console.log(`   Data: ${tx.data.substring(0, 100)}...`);
        
        // Tenter de décoder les données
        this.tryDecodeTransactionData(tx.data);
      }

      // Récupérer le reçu de transaction
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log('\n📄 REÇU DE TRANSACTION:');
        console.log(`   Status: ${receipt.status === 1 ? '✅ Succès' : '❌ Échec'}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()} (${((Number(receipt.gasUsed) / Number(tx.gasLimit)) * 100).toFixed(1)}%)`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Index: ${receipt.transactionIndex}`);

        // Logs/Events
        if (receipt.logs && receipt.logs.length > 0) {
          console.log(`\n📡 ÉVÉNEMENTS (${receipt.logs.length}):`);
          receipt.logs.forEach((log, index) => {
            console.log(`   Event ${index + 1}:`);
            console.log(`     Address: ${log.address}`);
            console.log(`     Topics: ${log.topics.length}`);
            console.log(`     Data: ${log.data.substring(0, 50)}...`);
            
            // Tenter de décoder l'événement
            this.tryDecodeEvent(log);
          });
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'exploration:', error.message);
    }
  }

  /**
   * Explore une adresse (compte ou contrat)
   */
  async exploreAddress(address) {
    console.log(`👤 Exploration de l'adresse: ${address}`);
    console.log(`🌐 Explorer: ${EXPLORER_BASE}/address/${address}`);
    console.log('');

    try {
      // Informations de base
      const balance = await this.provider.getBalance(address);
      const nonce = await this.provider.getTransactionCount(address);
      const code = await this.provider.getCode(address);

      console.log('💰 INFORMATIONS DE BASE:');
      console.log(`   Solde: ${ethers.formatEther(balance)} FLR`);
      console.log(`   Nonce: ${nonce} (transactions envoyées)`);
      console.log(`   Type: ${code !== '0x' ? '📄 Contrat Smart Contract' : '👤 Compte Externe (EOA)'}`);

      if (code !== '0x') {
        console.log(`   Taille du code: ${(code.length - 2) / 2} bytes`);
        console.log(`   Code: ${code.substring(0, 100)}...`);

        // Lire le storage du contrat
        console.log('\n🗃️ STORAGE DU CONTRAT:');
        for (let i = 0; i < 5; i++) {
          try {
            const storage = await this.provider.getStorage(address, i);
            if (storage !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
              console.log(`   Slot ${i}: ${storage}`);
            }
          } catch (e) {
            // Ignorer les erreurs de lecture
          }
        }
      }

      // Dernières transactions
      console.log('\n📋 RECHERCHE DES DERNIÈRES TRANSACTIONS...');
      await this.findRecentTransactions(address);

    } catch (error) {
      console.error('❌ Erreur lors de l\'exploration:', error.message);
    }
  }

  /**
   * Explore un bloc spécifique
   */
  async exploreBlock(blockNumber) {
    console.log(`📦 Exploration du bloc: ${blockNumber}`);
    console.log(`🌐 Explorer: ${EXPLORER_BASE}/block/${blockNumber}`);
    console.log('');

    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block) {
        console.log('❌ Bloc non trouvé');
        return;
      }

      console.log('📋 DÉTAILS DU BLOC:');
      console.log(`   Numéro: ${block.number}`);
      console.log(`   Hash: ${block.hash}`);
      console.log(`   Parent: ${block.parentHash}`);
      console.log(`   Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
      console.log(`   Transactions: ${block.transactions.length}`);
      console.log(`   Gas Used: ${block.gasUsed?.toString() || 'N/A'}`);
      console.log(`   Gas Limit: ${block.gasLimit?.toString() || 'N/A'}`);
      console.log(`   Miner: ${block.miner || 'N/A'}`);

      if (block.transactions.length > 0) {
        console.log('\n📄 TRANSACTIONS DANS CE BLOC:');
        block.transactions.slice(0, 10).forEach((tx, index) => {
          if (typeof tx === 'object') {
            console.log(`   ${index + 1}. ${tx.hash}`);
            console.log(`      From: ${tx.from} → To: ${tx.to || 'Contract'}`);
            console.log(`      Value: ${ethers.formatEther(tx.value)} FLR`);
          } else {
            console.log(`   ${index + 1}. ${tx}`);
          }
        });

        if (block.transactions.length > 10) {
          console.log(`   ... et ${block.transactions.length - 10} autres`);
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'exploration:', error.message);
    }
  }

  /**
   * Recherche les transactions récentes pour une adresse
   */
  async findRecentTransactions(address, maxBlocks = 1000) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - maxBlocks);
      
      console.log(`   Recherche dans les blocs ${startBlock} à ${currentBlock}...`);
      
      const transactions = [];
      let foundCount = 0;
      
      // Recherche dans les derniers blocs (méthode simple)
      for (let i = currentBlock; i >= startBlock && foundCount < 10; i -= 10) {
        try {
          const block = await this.provider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && (tx.from === address || tx.to === address)) {
                transactions.push({
                  hash: tx.hash,
                  block: tx.blockNumber,
                  from: tx.from,
                  to: tx.to,
                  value: ethers.formatEther(tx.value)
                });
                foundCount++;
                if (foundCount >= 10) break;
              }
            }
          }
        } catch (e) {
          // Ignorer les erreurs de blocs
        }
      }

      if (transactions.length > 0) {
        console.log(`\n✅ TRANSACTIONS TROUVÉES (${transactions.length}):`);
        transactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.hash}`);
          console.log(`      Block: ${tx.block}`);
          console.log(`      ${tx.from} → ${tx.to || 'Contract'}`);
          console.log(`      Value: ${tx.value} FLR`);
          console.log(`      Explorer: ${EXPLORER_BASE}/tx/${tx.hash}`);
          console.log('');
        });
      } else {
        console.log('   ℹ️ Aucune transaction récente trouvée');
      }

    } catch (error) {
      console.log('   ⚠️ Erreur lors de la recherche de transactions');
    }
  }

  /**
   * Tente de décoder les données d'une transaction
   */
  tryDecodeTransactionData(data) {
    try {
      // Vérifier si c'est un appel de fonction (4 premiers bytes = selector)
      if (data.length >= 10) {
        const selector = data.substring(0, 10);
        console.log(`   Function Selector: ${selector}`);
        
        // Signatures courantes
        const commonSelectors = {
          '0xa9059cbb': 'transfer(address,uint256)',
          '0x095ea7b3': 'approve(address,uint256)',
          '0x23b872dd': 'transferFrom(address,address,uint256)',
          '0x40c10f19': 'mint(address,uint256)',
          '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
          '0x6352211e': 'ownerOf(uint256)',
        };
        
        if (commonSelectors[selector]) {
          console.log(`   Fonction probable: ${commonSelectors[selector]}`);
        }
        
        // Tenter de décoder comme string (pour nos données JSON)
        if (data.length > 138) {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + data.substring(138));
            if (decoded[0] && decoded[0].length > 0) {
              console.log(`   🔍 Données décodées: ${decoded[0].substring(0, 100)}...`);
              
              // Vérifier si c'est du JSON
              try {
                const jsonData = JSON.parse(decoded[0]);
                console.log(`   📄 JSON détecté: ${Object.keys(jsonData).join(', ')}`);
              } catch (e) {
                // Pas du JSON
              }
            }
          } catch (e) {
            // Échec du décodage
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs de décodage
    }
  }

  /**
   * Tente de décoder un événement
   */
  tryDecodeEvent(log) {
    try {
      // Événements courants
      const commonEvents = {
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer(address,address,uint256)',
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval(address,address,uint256)',
        '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': 'ApprovalForAll(address,address,bool)',
      };
      
      if (log.topics.length > 0) {
        const eventSig = log.topics[0];
        if (commonEvents[eventSig]) {
          console.log(`     Type: ${commonEvents[eventSig]}`);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de décodage
    }
  }

  /**
   * Cherche des transactions contenant vos données JSON
   */
  async searchForYourData(searchString = 'suggestion') {
    console.log(`🔍 Recherche de données contenant: "${searchString}"`);
    console.log('');

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - 100); // Chercher dans les 100 derniers blocs
      
      console.log(`Recherche dans les blocs ${startBlock} à ${currentBlock}...`);
      
      for (let i = currentBlock; i >= startBlock; i--) {
        try {
          const block = await this.provider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && tx.data && tx.data.includes(searchString)) {
                console.log(`✅ DONNÉES TROUVÉES!`);
                console.log(`   Transaction: ${tx.hash}`);
                console.log(`   Block: ${tx.blockNumber}`);
                console.log(`   Explorer: ${EXPLORER_BASE}/tx/${tx.hash}`);
                await this.exploreTransaction(tx.hash);
                return;
              }
            }
          }
        } catch (e) {
          // Continuer la recherche
        }
      }
      
      console.log('❌ Aucune donnée trouvée dans les blocs récents');
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error.message);
    }
  }
}

// Interface en ligne de commande
async function main() {
  const explorer = new FlareExplorer();
  const arg = process.argv[2];
  
  console.log('🔍 EXPLORATEUR FLARE TESTNET COSTON2');
  console.log('===================================\n');
  
  if (!arg) {
    console.log('📋 USAGE:');
    console.log('   node explore-flare-testnet.js <transaction_hash>');
    console.log('   node explore-flare-testnet.js <address>');
    console.log('   node explore-flare-testnet.js <block_number>');
    console.log('   node explore-flare-testnet.js search');
    console.log('');
    console.log('📖 EXEMPLES:');
    console.log('   node explore-flare-testnet.js 0x1234...abcd');
    console.log('   node explore-flare-testnet.js 0x0x9E011480a57eD7E4d22B89aF8299C6b9a223633c');
    console.log('   node explore-flare-testnet.js 20939903');
    console.log('   node explore-flare-testnet.js search');
    console.log('');
    console.log('🌐 EXPLORER WEB: https://coston2-explorer.flare.network/');
    return;
  }
  
  if (arg === 'search') {
    await explorer.searchForYourData();
  } else if (arg.startsWith('0x') && arg.length === 66) {
    // Transaction hash
    await explorer.exploreTransaction(arg);
  } else if (arg.startsWith('0x') && arg.length === 42) {
    // Address
    await explorer.exploreAddress(arg);
  } else if (!isNaN(arg)) {
    // Block number
    await explorer.exploreBlock(parseInt(arg));
  } else {
    console.log('❌ Format non reconnu. Utilisez une transaction, adresse ou numéro de bloc.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FlareExplorer };
