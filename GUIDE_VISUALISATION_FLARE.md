# 🔍 Guide de Visualisation des Données sur Flare Testnet

Ce guide vous montre comment **voir et vérifier vos données JSON** stockées on-chain sur le testnet Flare Coston2.

## 🌐 Explorer Web (Plus Simple)

### **Coston2 Block Explorer**
```
https://coston2-explorer.flare.network/
```

#### Comment utiliser l'explorer :

1. **📋 Pour une transaction :**
   ```
   https://coston2-explorer.flare.network/tx/VOTRE_TX_HASH
   ```

2. **👤 Pour votre adresse :**
   ```
   https://coston2-explorer.flare.network/address/VOTRE_ADRESSE
   ```

3. **📦 Pour un bloc :**
   ```
   https://coston2-explorer.flare.network/block/NUMERO_BLOC
   ```

4. **📄 Pour un contrat :**
   ```
   https://coston2-explorer.flare.network/address/ADRESSE_CONTRAT
   ```

## 🛠️ Explorer par Script (Plus Détaillé)

### **Script d'exploration personnalisé :**

```bash
# Rendre le script exécutable
chmod +x explore-flare-testnet.js

# Explorer une transaction
node explore-flare-testnet.js 0x1234...abcd

# Explorer votre adresse
node explore-flare-testnet.js 0x0x9E011480a57eD7E4d22B89aF8299C6b9a223633c

# Explorer un bloc
node explore-flare-testnet.js 20939903

# Chercher vos données JSON
node explore-flare-testnet.js search
```

## 📋 Workflow Complet : De la Création à la Visualisation

### **Étape 1 : Générer et Soumettre vos Données**

```bash
# Démarrer votre API
./start-with-python.sh

# Générer une recommandation
curl -X POST http://localhost:3000/flare/generate-and-submit
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x123abc...",
    "timestamp": 1705320600,
    "blockNumber": 20939905
  }
}
```

### **Étape 2 : Visualiser sur l'Explorer Web**

1. **Copiez le `transactionHash`** de la réponse
2. **Allez sur l'explorer :** `https://coston2-explorer.flare.network/tx/0x123abc...`
3. **Vous verrez :**
   - ✅ Statut de la transaction (Success/Failed)
   - 💰 Montant et frais
   - 📝 **Input Data** (contient votre JSON!)
   - 📡 Events/Logs émis

### **Étape 3 : Décoder vos Données JSON**

Dans l'explorer, section **"Input Data"** :

```
0x6f91b9b3000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001357b2273756767657374696f6e223a224141564522...
```

**Votre JSON est encodé dedans!** Utilisez le script pour décoder :

```bash
node explore-flare-testnet.js 0xVOTRE_TX_HASH
```

**Output :**
```
🔍 Exploration de la transaction: 0x123abc...
🌐 Explorer: https://coston2-explorer.flare.network/tx/0x123abc...

📝 DONNÉES DE LA TRANSACTION:
   Taille: 287 bytes
   🔍 Données décodées: {"suggestion":"AAVE","confidence":0.875...
   📄 JSON détecté: suggestion, confidence, scores, btc_dominance_pct
```

## 🔍 Comment Vérifier que vos Données sont Correctes

### **1. Vérification du Hash de Transaction**

```bash
# Dans votre API, après soumission
curl -X POST http://localhost:3000/flare/generate-and-submit
# → Récupérez le transactionHash

# Vérifiez sur l'explorer
echo "https://coston2-explorer.flare.network/tx/VOTRE_HASH"
```

### **2. Vérification du Contenu JSON**

```bash
# Utilisez le script d'exploration
node explore-flare-testnet.js VOTRE_TX_HASH

# Comparez avec votre recommandation originale
curl http://localhost:3000/api/aave-morpho-recommendation
```

### **3. Vérification via Smart Contract**

Si vous avez déployé un contrat :

```bash
# Vérifiez le contrat
node explore-flare-testnet.js ADRESSE_CONTRAT

# Récupérez les données depuis le contrat
curl http://localhost:3000/flare/contract/recommendation
```

## 📊 Exemple Concret

### **Scenario : Vous avez soumis une recommandation**

1. **Votre transaction :** `0x456def...`
2. **Votre données JSON :**
   ```json
   {
     "suggestion": "AAVE",
     "confidence": 0.875,
     "scores": { "aave": 0.72, "morpho": 0.48 },
     "btc_dominance_pct": 57.74,
     "timestamp": "2025-01-15T10:30:00.000Z"
   }
   ```

3. **Visualisation sur l'explorer :**
   ```
   https://coston2-explorer.flare.network/tx/0x456def...
   ```

4. **Ce que vous verrez :**
   - ✅ **Status:** Success
   - 📝 **Input Data:** `0x6f91b9b3000000...` (votre JSON encodé)
   - 💰 **Gas Used:** ~45,592
   - 📦 **Block:** 20939905
   - 🕐 **Timestamp:** 2025-01-15 10:30:15

5. **Décodage avec le script :**
   ```bash
   node explore-flare-testnet.js 0x456def...
   # → Affiche votre JSON décodé
   ```

## 🚨 Troubleshooting

### **Transaction Non Trouvée**
```bash
# Vérifiez le statut réseau
curl http://localhost:3000/flare/network-status

# Vérifiez votre adresse
node explore-flare-testnet.js VOTRE_ADRESSE
```

### **Données Non Décodées**
```bash
# Utilisez le script de recherche
node explore-flare-testnet.js search

# Recherchez dans les blocs récents
node explore-flare-testnet.js NUMERO_BLOC_RECENT
```

### **Transaction Failed**
- Vérifiez votre solde FLR
- Consultez les logs d'erreur dans l'explorer
- Vérifiez la limite de gas

## 🔧 Outils Supplémentaires

### **MetaMask - Ajouter Coston2**

1. **Réseau :** Flare Testnet Coston2
2. **RPC URL :** `https://coston2-api.flare.network/ext/bc/C/rpc`
3. **Chain ID :** `114`
4. **Symbol :** `C2FLR`
5. **Explorer :** `https://coston2-explorer.flare.network`

### **API Direct**

```javascript
// Lire directement depuis la blockchain
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/bc/C/rpc');

// Récupérer une transaction
const tx = await provider.getTransaction('0xVOTRE_HASH');
console.log(tx.data); // Vos données encodées
```

## 🎯 Points Clés à Retenir

1. **🌐 Explorer Web** : Plus simple pour la visualisation générale
2. **🛠️ Script personnalisé** : Plus détaillé pour le décodage
3. **📝 Input Data** : Contient toujours vos données JSON encodées
4. **✅ Status Success** : Confirme que vos données sont stockées
5. **🔍 Hash unique** : Chaque transaction a un identifiant permanent

## 🎉 Validation Finale

**Votre intégration fonctionne si :**
- ✅ Transaction avec status "Success"
- ✅ Input Data contient vos données JSON
- ✅ Données décodables avec le script
- ✅ Contenu correspond à votre recommandation
- ✅ Transaction visible sur l'explorer public

**Vos données JSON sont maintenant stockées de façon permanente et vérifiable sur la blockchain Flare!** 🎉

---

### 📞 Support

Si vous avez des questions :
1. Consultez les logs de l'explorer
2. Utilisez le script d'exploration
3. Vérifiez la documentation Flare
4. Testez avec de petites transactions d'abord
