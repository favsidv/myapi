const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ContractService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = null;
    
    // ABI du contrat AaveMorphoOracle
    this.contractAbi = [
      "function updateRecommendation(bytes32 _merkleRoot, bytes32[] calldata _merkleProof, bytes calldata _attestationData, uint256 _timestamp) external",
      "function getLatestRecommendation() external view returns (tuple(string suggestion, uint256 confidence, uint256 aaveScore, uint256 morphoScore, uint256 timestamp, bool isValid, bytes32 attestationHash))",
      "function getRecommendation(uint256 _timestamp) external view returns (tuple(string suggestion, uint256 confidence, uint256 aaveScore, uint256 morphoScore, uint256 timestamp, bool isValid, bytes32 attestationHash))",
      "function shouldFollowRecommendation(uint256 _minConfidence) external view returns (bool shouldFollow, string memory suggestion)",
      "function getRecommendationAge() external view returns (uint256)",
      "function isRecommendationFresh(uint256 _maxAge) external view returns (bool)",
      "event RecommendationUpdated(uint256 indexed timestamp, string suggestion, uint256 confidence, bytes32 attestationHash)"
    ];
    
    this.initialize();
  }

  async initialize() {
    try {
      // Configuration réseau
      const rpcUrl = process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/bc/C/rpc';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Wallet (optionnel pour les opérations de lecture)
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }
      
      // Charger l'adresse du contrat depuis le fichier de déploiement
      await this.loadContractAddress();
      
      if (this.contractAddress) {
        // Créer l'instance du contrat
        const signer = this.wallet || this.provider;
        this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, signer);
        console.log(`📄 Contrat AaveMorphoOracle connecté: ${this.contractAddress}`);
      }
      
    } catch (error) {
      console.error('Error initializing contract service:', error);
    }
  }

  async loadContractAddress() {
    try {
      const deploymentPath = path.join(__dirname, '../../deployment.json');
      
      if (fs.existsSync(deploymentPath)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        this.contractAddress = deploymentInfo.contractAddress;
        console.log(`📍 Adresse du contrat chargée: ${this.contractAddress}`);
      } else {
        console.log('ℹ️  Fichier de déploiement non trouvé. Le contrat n\'est pas encore déployé.');
      }
    } catch (error) {
      console.error('Error loading contract address:', error);
    }
  }

  /**
   * Met à jour la recommandation dans le contrat avec des données attestées
   */
  async updateContractRecommendation(merkleRoot, merkleProof, attestationData, timestamp) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract not initialized or no wallet available');
      }

      console.log('📤 Mise à jour de la recommandation dans le contrat...');
      
      // Encoder les données d'attestation
      const encodedData = ethers.toUtf8Bytes(JSON.stringify(attestationData));
      
      const tx = await this.contract.updateRecommendation(
        merkleRoot,
        merkleProof,
        encodedData,
        timestamp
      );
      
      console.log(`📝 Transaction envoyée: ${tx.hash}`);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('Error updating contract recommendation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère la dernière recommandation du contrat
   */
  async getLatestRecommendation() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const recommendation = await this.contract.getLatestRecommendation();
      
      return {
        success: true,
        data: {
          suggestion: recommendation.suggestion,
          confidence: Number(recommendation.confidence),
          aaveScore: Number(recommendation.aaveScore),
          morphoScore: Number(recommendation.morphoScore),
          timestamp: Number(recommendation.timestamp),
          isValid: recommendation.isValid,
          attestationHash: recommendation.attestationHash
        }
      };
      
    } catch (error) {
      console.error('Error getting latest recommendation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère une recommandation spécifique par timestamp
   */
  async getRecommendationByTimestamp(timestamp) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const recommendation = await this.contract.getRecommendation(timestamp);
      
      return {
        success: true,
        data: {
          suggestion: recommendation.suggestion,
          confidence: Number(recommendation.confidence),
          aaveScore: Number(recommendation.aaveScore),
          morphoScore: Number(recommendation.morphoScore),
          timestamp: Number(recommendation.timestamp),
          isValid: recommendation.isValid,
          attestationHash: recommendation.attestationHash
        }
      };
      
    } catch (error) {
      console.error('Error getting recommendation by timestamp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifie si une recommandation doit être suivie selon un seuil de confiance
   */
  async shouldFollowRecommendation(minConfidence = 500) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [shouldFollow, suggestion] = await this.contract.shouldFollowRecommendation(minConfidence);
      
      return {
        success: true,
        shouldFollow: shouldFollow,
        suggestion: suggestion,
        minConfidenceThreshold: minConfidence
      };
      
    } catch (error) {
      console.error('Error checking if should follow recommendation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère l'âge de la dernière recommandation en secondes
   */
  async getRecommendationAge() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const age = await this.contract.getRecommendationAge();
      
      return {
        success: true,
        ageInSeconds: Number(age),
        ageInMinutes: Math.floor(Number(age) / 60),
        ageInHours: Math.floor(Number(age) / 3600)
      };
      
    } catch (error) {
      console.error('Error getting recommendation age:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifie si la recommandation est fraîche (moins de X secondes)
   */
  async isRecommendationFresh(maxAgeSeconds = 3600) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const isFresh = await this.contract.isRecommendationFresh(maxAgeSeconds);
      
      return {
        success: true,
        isFresh: isFresh,
        maxAgeSeconds: maxAgeSeconds
      };
      
    } catch (error) {
      console.error('Error checking if recommendation is fresh:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Écoute les événements de mise à jour des recommandations
   */
  async startListeningToEvents(callback) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log('👂 Écoute des événements RecommendationUpdated...');
      
      this.contract.on('RecommendationUpdated', (timestamp, suggestion, confidence, attestationHash, event) => {
        const eventData = {
          timestamp: Number(timestamp),
          suggestion: suggestion,
          confidence: Number(confidence),
          attestationHash: attestationHash,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        
        console.log('📡 Nouveau événement RecommendationUpdated:', eventData);
        
        if (callback) {
          callback(eventData);
        }
      });
      
      return {
        success: true,
        message: 'Event listener started'
      };
      
    } catch (error) {
      console.error('Error starting event listener:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Arrête l'écoute des événements
   */
  stopListeningToEvents() {
    try {
      if (this.contract) {
        this.contract.removeAllListeners('RecommendationUpdated');
        console.log('🛑 Arrêt de l\'écoute des événements');
      }
    } catch (error) {
      console.error('Error stopping event listener:', error);
    }
  }

  /**
   * Récupère l'historique des événements RecommendationUpdated
   */
  async getRecommendationHistory(fromBlock = 0, toBlock = 'latest') {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const filter = this.contract.filters.RecommendationUpdated();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      
      const history = events.map(event => ({
        timestamp: Number(event.args.timestamp),
        suggestion: event.args.suggestion,
        confidence: Number(event.args.confidence),
        attestationHash: event.args.attestationHash,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      }));
      
      return {
        success: true,
        data: history,
        count: history.length
      };
      
    } catch (error) {
      console.error('Error getting recommendation history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Informations sur le contrat et la connexion
   */
  async getContractInfo() {
    try {
      const networkInfo = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        success: true,
        contractAddress: this.contractAddress,
        network: {
          chainId: Number(networkInfo.chainId),
          name: networkInfo.name,
          blockNumber: blockNumber
        },
        walletConnected: !!this.wallet,
        walletAddress: this.wallet ? this.wallet.address : null
      };
      
    } catch (error) {
      console.error('Error getting contract info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ContractService();
