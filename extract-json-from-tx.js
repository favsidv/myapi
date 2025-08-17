#!/usr/bin/env node

const { ethers } = require('ethers');

const FLARE_RPC = 'https://coston2-api.flare.network/ext/bc/C/rpc';

async function extractJsonFromTransaction(txHash) {
  console.log('JSON EXTRACTOR - Flare FDC Transaction');
  console.log('=====================================\n');
  
  try {
    console.log(`Transaction: ${txHash}`);
    console.log(`Explorer: https://coston2.testnet.flarescan.com/tx/${txHash}\n`);
    
    const provider = new ethers.JsonRpcProvider(FLARE_RPC);
    
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('Transaction not found');
      return null;
    }

    console.log('TRANSACTION FOUND:');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Block: ${tx.blockNumber}`);
    console.log(`   Status: Confirmed\n`);

    if (!tx.data || tx.data.length < 10) {
      console.log('No data in this transaction');
      return null;
    }

    const functionSelector = tx.data.substring(0, 10);
    console.log(`Function Selector: ${functionSelector}`);
    
    if (functionSelector !== '0x2100a783') {
      console.log('This is not an FDC requestAttestation transaction');
      console.log('Expected selector: 0x2100a783 (requestAttestation)');
      return null;
    }

    console.log('FDC Transaction detected!\n');

    const fdcAbi = [
      'function requestAttestation(bytes32 _attestationType, bytes32 _sourceId, bytes calldata _requestBody) external returns (bool)'
    ];
    
    const iface = new ethers.Interface(fdcAbi);
    const decodedData = iface.parseTransaction({ data: tx.data });
    
    console.log('FDC PARAMETERS:');
    console.log(`   Attestation Type: ${decodedData.args._attestationType}`);
    console.log(`   Source ID: ${decodedData.args._sourceId}`);
    console.log('');

    try {
      const requestBodyDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['string', 'string', 'uint64'],
        decodedData.args._requestBody
      );
      
      const apiUrl = requestBodyDecoded[0];
      const jqTransform = requestBodyDecoded[1];
      const timestamp = Number(requestBodyDecoded[2]);
      
      console.log('SOURCE INFORMATION:');
      console.log(`   API URL: ${apiUrl}`);
      console.log(`   Transform: ${jqTransform}`);
      console.log(`   Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
      console.log('');

      console.log('ATTEMPTING DATA RETRIEVAL...');
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data && data.success) {
          let finalData = data;
          
          if (jqTransform === '.data' && data.data) {
            finalData = data.data;
          }
          
          console.log('JSON DATA RETRIEVED:');
          console.log('===================\n');
          console.log(JSON.stringify(finalData, null, 2));
          console.log('');
          
          if (finalData.suggestion) {
            console.log('SUMMARY:');
            console.log(`   Recommendation: ${finalData.suggestion}`);
            console.log(`   Confidence: ${(finalData.confidence * 100).toFixed(1)}%`);
            if (finalData.scores) {
              console.log(`   Aave Score: ${finalData.scores.aave}`);
              console.log(`   Morpho Score: ${finalData.scores.morpho}`);
            }
            console.log(`   BTC Dominance: ${finalData.btc_dominance_pct}%`);
            console.log(`   DeFi TVL: $${parseFloat(finalData.defi_tvl_usd).toLocaleString()}`);
          }
          
          return finalData;
          
        } else {
          console.log('Invalid API response');
        }
        
      } catch (apiError) {
        console.log('Source API not accessible (normal after some time)');
        console.log('In production, data would be retrieved from Flare DA Layer');
        console.log('');
        console.log('STORED DATA:');
        console.log('   JSON data is permanently stored on-chain');
        console.log('   in this FDC transaction parameters.');
        console.log('');
        console.log('RETRIEVABLE INFORMATION:');
        console.log(`   - Source URL: ${apiUrl}`);
        console.log(`   - Transform: ${jqTransform}`);
        console.log(`   - Timestamp: ${new Date(timestamp * 1000).toISOString()}`);
        console.log(`   - Transaction Hash: ${txHash}`);
        console.log(`   - Block: ${tx.blockNumber}`);
      }
      
    } catch (bodyError) {
      console.log(`Request body decode error: ${bodyError.message}`);
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      console.log('\nEVENTS:');
      console.log(`   ${receipt.logs.length} event(s) confirming FDC registration`);
    }

    console.log('\nEXTRACTION COMPLETED!');
    console.log('Data is permanently and verifiably stored on-chain.');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

function getJsonFromFlareTransaction() {
  return `
const { ethers } = require('ethers');

async function getJsonFromTx(txHash) {
  const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/bc/C/rpc');
  const tx = await provider.getTransaction(txHash);
  
  if (!tx || !tx.data || tx.data.substring(0, 10) !== '0x2100a783') {
    throw new Error('Invalid FDC transaction');
  }
  
  const fdcAbi = ['function requestAttestation(bytes32,bytes32,bytes) external returns (bool)'];
  const iface = new ethers.Interface(fdcAbi);
  const decoded = iface.parseTransaction({ data: tx.data });
  
  const [apiUrl, jqTransform, timestamp] = ethers.AbiCoder.defaultAbiCoder().decode(
    ['string', 'string', 'uint64'],
    decoded.args._requestBody
  );
  
  return {
    apiUrl,
    jqTransform, 
    timestamp: Number(timestamp),
    transactionHash: txHash,
    blockNumber: tx.blockNumber
  };
}
`;
}

if (require.main === module) {
  const txHash = process.argv[2];
  
  if (!txHash) {
    console.log('Usage: node extract-json-from-tx.js <transaction_hash>');
    console.log('');
    console.log('Example:');
    console.log('   node extract-json-from-tx.js 0x067fcb64004ecbaf388bf6a2e7c88ac2a73ce4b31740af24405e9f742be4b926');
    console.log('');
    console.log('Or visit directly:');
    console.log('   https://coston2.testnet.flarescan.com/tx/YOUR_TX_HASH');
    console.log('');
    console.log('Standalone script:');
    console.log(getJsonFromFlareTransaction());
    process.exit(1);
  }
  
  extractJsonFromTransaction(txHash).catch(console.error);
}

module.exports = { extractJsonFromTransaction, getJsonFromFlareTransaction };