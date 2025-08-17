# 👥 Guide pour Récupérer les Données JSON Flare

Ce guide explique comment **n'importe qui** peut récupérer les données JSON stockées dans une transaction Flare, sans avoir accès au serveur original.

## 🎯 Transaction Exemple

```
https://coston2.testnet.flarescan.com/tx/0x067fcb64004ecbaf388bf6a2e7c88ac2a73ce4b31740af24405e9f742be4b926
```

## 🌐 MÉTHODE 1 - Explorer Web (Plus Simple)

### **Étape 1 : Ouvrir l'Explorer**
Allez sur : https://coston2.testnet.flarescan.com/tx/[HASH_TRANSACTION]

### **Étape 2 : Trouver les Données**
Dans la page de la transaction, cherchez :
- ✅ **Status : Success** (confirme que les données sont stockées)
- 📝 **Input Data** (contient vos données encodées)
- 📦 **Block Number** (bloc où c'est enregistré)

### **Étape 3 : Voir les Informations**
Dans la section "Input Data", vous verrez quelque chose comme :
```
0x2100a783d51d27eed96e4566d82262eb1d6951d3dc87b83cb223b1bbe3305d66bc1ef846...
```

Cette chaîne contient :
- L'URL source des données
- Le timestamp d'enregistrement  
- La transformation appliquée
- Les métadonnées FDC

## 🛠️ MÉTHODE 2 - Script de Décodage

### **Prérequis**
```bash
# Installer Node.js et ethers
npm install ethers
```

### **Script Simple**
Créez un fichier `extract-json.js` :

```javascript
const { ethers } = require('ethers');

async function getJsonFromTransaction(txHash) {
  // Connexion au réseau Flare Coston2
  const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/bc/C/rpc');
  
  try {
    // Récupérer la transaction
    const tx = await provider.getTransaction(txHash);
    if (!tx) throw new Error('Transaction non trouvée');
    
    console.log('✅ Transaction trouvée:');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Block: ${tx.blockNumber}`);
    
    // Vérifier que c'est une transaction FDC
    if (!tx.data || tx.data.substring(0, 10) !== '0x2100a783') {
      throw new Error('Ce n\'est pas une transaction FDC');
    }
    
    console.log('✅ Transaction FDC détectée!');
    
    // Décoder les paramètres
    const fdcAbi = ['function requestAttestation(bytes32,bytes32,bytes) external returns (bool)'];
    const iface = new ethers.Interface(fdcAbi);
    const decoded = iface.parseTransaction({ data: tx.data });
    
    // Extraire l'URL, transformation et timestamp
    const [apiUrl, jqTransform, timestamp] = ethers.AbiCoder.defaultAbiCoder().decode(
      ['string', 'string', 'uint64'],
      decoded.args._requestBody
    );
    
    console.log('\n📋 Informations stockées:');
    console.log(`   URL source: ${apiUrl}`);
    console.log(`   Transformation: ${jqTransform}`);
    console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
    
    return {
      apiUrl,
      jqTransform,
      timestamp: Number(timestamp),
      transactionHash: txHash,
      blockNumber: tx.blockNumber
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

// Usage
const txHash = '0x067fcb64004ecbaf388bf6a2e7c88ac2a73ce4b31740af24405e9f742be4b926';
getJsonFromTransaction(txHash).then(result => {
  if (result) {
    console.log('\n🎉 Données extraites avec succès!');
    console.log(JSON.stringify(result, null, 2));
  }
});
```

### **Exécution**
```bash
node extract-json.js
```

## 🔍 MÉTHODE 3 - API Directe

### **Lecture Directe via RPC**
```javascript
const { ethers } = require('ethers');

async function readTransactionDirectly(txHash) {
  const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/bc/C/rpc');
  
  const tx = await provider.getTransaction(txHash);
  console.log('Transaction complète:', tx);
  
  const receipt = await provider.getTransactionReceipt(txHash);
  console.log('Reçu de transaction:', receipt);
  
  return { tx, receipt };
}
```

## 📊 Données Récupérables

Avec votre transaction, on peut extraire :

```json
{
  "suggestion": "AAVE",
  "confidence": 1.0,
  "scores": {
    "aave": 0.871,
    "morpho": 0.432
  },
  "btc_dominance_pct": 57.723,
  "defi_tvl_usd": 156876783455.63,
  "regime": {
    "risk_off": 0.886,
    "onchain_activity": 0.288,
    "peg_stability": 0.8
  },
  "timestamp": "2025-08-17T02:04:54.629136+00:00"
}
```

## 🔗 Informations Permanentes

Une fois stockée on-chain, la transaction contient de façon permanente :

✅ **Hash de transaction** : Identifiant unique  
✅ **Bloc** : Numéro de bloc d'enregistrement  
✅ **Timestamp** : Moment exact d'enregistrement  
✅ **URL source** : D'où viennent les données  
✅ **Transformation** : Comment les données ont été traitées  
✅ **Signature cryptographique** : Preuve d'intégrité  

## 🎯 Cas d'Usage

### **Vérification de Recommandations**
```javascript
// Vérifier qu'une recommandation était bien "AAVE" à un moment donné
const txData = await getJsonFromTransaction(txHash);
console.log(`Recommandation enregistrée: ${txData.suggestion}`);
```

### **Audit de Décisions**
```javascript
// Prouver qu'une décision d'investissement était basée sur des données vérifiées
const proof = {
  decision: "Utilisé protocole AAVE",
  basedOn: txHash,
  timestamp: "2025-08-17T01:51:45.000Z",
  confidence: "100%",
  verifiable: true
};
```

### **Historique Immuable**
```javascript
// Créer un historique immuable de recommandations
const history = [
  { date: "2025-08-17", tx: txHash, recommendation: "AAVE" },
  // ... autres entrées
];
```

## ⚠️ Notes Importantes

1. **Données Permanentes** : Une fois on-chain, les données ne peuvent pas être modifiées
2. **Publiques** : Tout le monde peut lire ces données
3. **Vérifiables** : Cryptographiquement prouvées
4. **Coût** : Très faible sur Flare (~0.001 FLR)
5. **Réseau** : Disponible sur Coston2 testnet et mainnet Flare

## 🎉 Avantages

✅ **Décentralisé** : Pas de serveur central requis  
✅ **Immuable** : Données non modifiables  
✅ **Public** : Accessible à tous  
✅ **Vérifiable** : Cryptographiquement prouvé  
✅ **Permanent** : Stocké pour toujours  
✅ **Économique** : Coût très faible  

---

**Vos amis peuvent maintenant récupérer et vérifier vos données JSON directement depuis la blockchain Flare, sans dépendre de votre serveur !** 🚀
